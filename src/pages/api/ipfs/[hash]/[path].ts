import type { NextApiRequest, NextApiResponse } from "next";
import Welding from "src/lib/Welding";
import * as Sentry from "@sentry/nextjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string | { error: string }>
) {
  try {
    const { hash, path } = req.query;
    const response = await Promise.race(Welding.ipfsGateways.map(gateway =>
      fetch(`${gateway}/ipfs/${hash}/${path}`, { redirect: "follow" })
    ));
    if (!response.ok) throw new Error("failed_to_fetch");
    const readableStream = response.body as unknown as NodeJS.ReadableStream;
    readableStream.pipe(res);
  } catch (e) {
    console.log(e);
    Sentry.captureException(e);
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message || "unexpected" });
    }
    res.status(500).json({ error: "unexpected" });
  }
}