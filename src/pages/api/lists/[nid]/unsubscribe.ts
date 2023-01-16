import { NextApiRequest, NextApiResponse } from "next";
import validateEmail from "src/utils/validateEmail";
import rateLimit from 'src/utils/rateLimit';
import findOrCreateListForNodeId from "src/utils/findOrCreateListForNodeId";
import sendgridClient from '@sendgrid/client';
import * as Sentry from "@sentry/nextjs";

sendgridClient.setApiKey(process.env.SENDGRID_API_KEY || "");

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 users per second
});

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
        const email = req.body.email || "";
        if (!validateEmail(email))
          return res.status(422).json({ error: "invalid_email" });
        
        let nid = req.query?.nid;
        nid = ((Array.isArray(nid) ? nid[0] : nid) || "").split("-")[0];
        const listId = await findOrCreateListForNodeId(nid);

        const [, { result }] = await sendgridClient.request({
          url: `/v3/marketing/contacts/search/emails`,
          method: 'POST',
          body: { emails: [email] }
        });

        if (!result[email]) return res.send({ status: "ok" });

        await sendgridClient.request({
          url: `/v3/marketing/lists/${listId}/contacts`,
          method: 'DELETE',
          qs: {
            contact_ids: result[email].contact.id
          }
        });
        return res.send({ status: "ok" });
      default:
        res.setHeader("Allow", ["POST"]);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch(e) {
    if (e.code === 404) return res.send({ status: "ok" });

    Sentry.captureException(e);
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message || "unexpected" });
    }
    res.status(500).json({ error: "unexpected" });
  }
};

export default handler;
