import type { NextApiRequest, NextApiResponse } from "next";
import og from "open-graph";
import * as Sentry from "@sentry/nextjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // TODO Cors
  try {
    if (!req.query?.url) {
      return res.status(500).json({
        error: "No url param given",
      });
    }
    const url = decodeURIComponent(
      Array.isArray(req.query?.url) ? req.query?.url[0] : req.query.url
    );
    og(url, function (e, meta) {
      if (meta) {
        res.status(200).json({ success: 1, meta });
      } else {
        res.status(500).json({
          error: (e && e.message) || "Unexpected Error",
        });
      }
    });
  } catch (e) {
    console.log(e);
    Sentry.captureException(e);
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message || "unexpected" });
    }
    res.status(500).json({ error: "unexpected" });
  }
}
