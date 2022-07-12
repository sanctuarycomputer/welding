import type { NextApiRequest, NextApiResponse } from "next";
import { NFTStorage, File } from "nft.storage";
import formidable from "formidable";
import * as Sentry from "@sentry/nextjs";
import fs from "fs";

export const config = {
  api: {
    responseLimit: false,
    bodyParser: false,
  },
};

const nftstorage = new NFTStorage({
  token: process.env.NFT_STORAGE_API_KEY || "",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const form = new formidable.IncomingForm();
    form.uploadDir = "./";
    form.keepExtensions = true;
    form.parse(req, async (err, fields, files) => {
      if (!!err) throw err;

      if (fields.url) {
        return res.status(200).json({
          success: 1,
          file: { url: fields.url },
        });
      }

      if (files.image) {
        const buffer = fs.readFileSync(files.image.filepath);
        const file = new File([buffer], files.image.originalFilename, {
          type: files.image.mimetype,
        });

        const cid = await nftstorage.storeBlob(file);
        const url = `https://welding.infura-ipfs.io/ipfs/${cid}`;
        return res.status(200).json({
          success: 1,
          file: { url },
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