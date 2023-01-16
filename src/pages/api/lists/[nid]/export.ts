import { NextApiRequest, NextApiResponse } from "next";
import { withIronSessionApiRoute } from "iron-session/next";
import findOrCreateListForNodeId from "src/utils/findOrCreateListForNodeId";
import sendgridClient from '@sendgrid/client';
import * as Sentry from "@sentry/nextjs";
import retry from "async-retry";
import { IRON_OPTIONS } from "src/utils/constants";
import queryCanAdministerNode from "src/utils/queryCanAdministerNode";

sendgridClient.setApiKey(process.env.SENDGRID_API_KEY || "");

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    if (!req.session.siwe?.address) throw new Error("no_session");

    const { method } = req;
    switch (method) {
      case "POST":
        let nid = req.query?.nid;
        nid = ((Array.isArray(nid) ? nid[0] : nid) || "").split("-")[0];

        if (
          !(await queryCanAdministerNode(nid, req.session.siwe?.address))
        ) {
          throw new Error("insufficient_permissions");
        }

        const listId = await findOrCreateListForNodeId(nid);
        const [,triggeredJob] = await sendgridClient.request({
          url: `/v3/marketing/contacts/exports`,
          method: 'POST',
          body: {
            list_ids: [listId],
          }
        });

        const result = await retry(
          async (bail) => {
            const [,job] = await sendgridClient.request({
              url: `/v3/marketing/contacts/exports/${triggeredJob.id || ""}`,
              method: 'GET',
            });
            if (job.status === "pending") throw new Error("not_ready");
            if (job.status === "failure") {
              bail(job);
              return;
            }
            return job;
          },
          {
            retries: 10,
            minTimeout: 1000,
            maxTimeout: 10000
          }
        );

        return res.send({ urls: result.urls });
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

export default withIronSessionApiRoute(handler, IRON_OPTIONS);

