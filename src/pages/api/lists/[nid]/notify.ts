import { NextApiRequest, NextApiResponse } from "next";
import rateLimit from 'src/utils/rateLimit';
import sendgridClient from '@sendgrid/client';
import * as Sentry from "@sentry/nextjs";
import Welding from "src/lib/Welding";
import neo4j from "neo4j-driver";
import { fetchEnsName } from "@wagmi/core";
import truncate from "src/utils/truncate";

sendgridClient.setApiKey(process.env.SENDGRID_API_KEY || "");

const driver = neo4j.driver(
  process.env.NEO4J_URI || "",
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || "",
    process.env.NEO4J_PASSWORD || ""
  )
);

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 users per second
});

const makeNotificationHTML = (
  targetAction: string, // "published" or "revised"
  targetLink: string, // Canonical URL for the node that was updated
  targetType: string, // Document
  targetImageSrc: string | null, // If the node that was updated has an image, this is  src
  targetTitle: string,
  targetDescription: string,
  unsubscribeLink: string,
  sender: string,
) => {
  return `
    <html>
    <head>
      <title></title>
    </head>
    <body>
      <div data-role="module-unsubscribe" class="module" role="module" data-type="unsubscribe" style="color:#262626; font-size:12px; line-height:20px; padding:16px 16px 16px 16px; text-align:Center; max-width:600px; margin: auto; font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Fira Sans,Droid Sans,Helvetica Neue,sans-serif;" data-muid="4e838cf3-9892-4a6d-94d6-170e474d21e5">
        <p>${sender} ${targetAction} a <a style="color:#262626;" href="${targetLink}" target="_blank">${targetType}</a>.</p>
        
        <a href="${targetLink}" style="text-decoration: none; color: #262626;">
          ${targetImageSrc ? `<img style="width: 100%" src="${targetImageSrc}" />` : ""}
          <h1 style="font-size: 54px; font-style: normal; font-variant-caps: normal; font-weight: 700;">${targetTitle}</h1>
          <h2 style="font-size: 18px; font-style: normal; font-variant-caps: normal; font-weight: 400;">${targetDescription}</h2>
          <a href="${targetLink}" style="margin-top:10px;display: inline-block; mso-hide:all; background-color: transparent; color: #262626; border:1px solid #262626; border-radius: 999px; padding:4.5px 9px; text-align:center; text-decoration:none; -webkit-text-size-adjust:none; font-size: 13.5px;font-style: normal;font-variant-caps:normal;font-weight: 500;" target="_blank">View on welding.app</a>
        </a>

        <p style="font-size:12px;line-height:20px;color:#404040;padding-top:40px;">
          <a class="Unsubscribe--weldingLink" href="https://www.welding.app" target="_blank" style="font-family:sans-serif;text-decoration:none;color:#404040;">
            welding.app
          </a>
          -
          <a class="Unsubscribe--unsubscribeLink" href="${unsubscribeLink}" target="_blank" style="font-family:sans-serif;text-decoration:none;color:#404040;">
            Unsubscribe
          </a>
        </p>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    await limiter.check(res, 10, req.url || "MISC") // 10 requests per minute
  } catch(e) {
    Sentry.captureException(e);
    return res.status(429).json({ error: "rate_limited" });
  }

  try {
    const { method } = req;
    switch (method) {
      case "POST":
        // TODO: Auth user against subgraphId

        const block = req.body.blockNumber;
        const events = await Welding.queryEventsByBlockRange(block, block);
        const e = events.filter(e => ['Mint', 'Revise'].includes(e.event))[0];
        if (!e) 
          return res.send({ status: "no_send" });

        // Auth user against e.args.tokenId.toString()

        const session = driver.session();
        const readQ = `MATCH (r:Revision)-[:_REVISES {block: $block}]->(n:BaseNode {tokenId: $tokenId})-[:BELONGS_TO]->(p:BaseNode {tokenId: $parentTokenId})
          RETURN p.sendgridListId, labels(n), r.nativeEmoji, r.image, r.name, r.description
        `;

        const readResult = await session.readTransaction((tx) =>
          tx.run(readQ, { 
            tokenId: e.args.tokenId.toString(),
            parentTokenId: req.query.nid, 
            block
          })
        );

        if (!readResult.records[0]) 
          return res.send({ status: "no_send" });
        
        const record = readResult.records[0];
        const sendgridListId = record.get('p.sendgridListId')
        if (!sendgridListId) 
          return res.send({ status: "no_send" });

        const label = record.get('labels(n)').filter(l => l !== "BaseNode")[0];
        const nativeEmoji = record.get('r.nativeEmoji');
        const image = record.get('r.image');
        const name = record.get('r.name');
        const description = record.get('r.description');
        const unsubscribeLink = `https://www.welding.app/${req.query.nid}/unsubscribe`;

        const ensName = await fetchEnsName({
          address: e.args.sender,
          chainId: 1,
        });

        // TODO: Return early if no sendgridListId

        const imageSrc = `https://www.welding.app${image.replace(
          "ipfs://",
          "/api/ipfs/"
        )}`;

        const sender = ensName ? ensName : truncate(e.args.sender || "null", 6);
        const action = e.event === "Mint" ? "published" : "revised";

        const html = makeNotificationHTML(
          action,
          `https://www.welding.app/${req.query.nid}/${e.args.tokenId.toString()}`,
          label,
          imageSrc,
          `${nativeEmoji} ${name}`,
          description,
          unsubscribeLink,
          sender
        );

        const [,singleSend] = await sendgridClient.request({
          url: `/v3/marketing/singlesends`,
          method: 'POST',
          body: {
            name: "Notification Relating to Block Number: 1234",
            send_at: (new Date()).toISOString(),
            send_to: {
              list_ids: [sendgridListId]
            },
            email_config: {
              subject: `${sender} ${action} a ${label} called ${nativeEmoji} ${name}`,
              html_content: html,
              sender_id: 4694974,
              custom_unsubscribe_url: unsubscribeLink
            }
          }
        })

        await sendgridClient.request({
          url: `/v3/marketing/singlesends/${singleSend.id}/schedule`,
          method: 'PUT',
          body: { send_at: "now"}
        })

        return res.send({ status: "ok" });
        
      default:
        res.setHeader("Allow", ["POST"]);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch(e) {
    console.log(e);
    Sentry.captureException(e);
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message || "unexpected" });
    }
    res.status(500).json({ error: "unexpected" });
  }
};

export default handler;