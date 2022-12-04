import type { NextApiRequest, NextApiResponse } from "next";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { NFTStorage, File } from "nft.storage";
import { MetadataProperties } from "src/types";
import { fileTypeFromBuffer } from "file-type";
import * as Sentry from "@sentry/nextjs";
import neo4j from "neo4j-driver";

const driver = neo4j.driver(
  process.env.NEO4J_URI || "",
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || "",
    process.env.NEO4J_PASSWORD || ""
  )
);

type Data = {
  hash: string;
};
type ApiError = {
  error: string;
};

export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

const prewarmMetadataCache = async function(hash, content) {
  const writeQ = `MERGE (rev:Revision {hash: $hash})
    ON CREATE
      SET rev.block = 0
    SET rev.name = $name
    SET rev.description = $description
    SET rev.image = $image
    SET rev.nativeEmoji = $nativeEmoji
    SET rev.content = $content
    SET rev.contentType = $contentType`;
  const session = driver.session();
  await session.writeTransaction((tx) =>
    tx.run(writeQ, {
      hash,
      content: JSON.stringify(content),
      contentType: "application/json",
      name: content.name,
      description: content.description,
      image: content.image,
      nativeEmoji: content.properties.emoji.native,
    })
  );
};

const nftstorage = new NFTStorage({
  token: process.env.NFT_STORAGE_API_KEY || "",
});

const makeImageFileForEmoji = async (emoji) => {
  const apple64 = `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@14.0.0/img/apple/64/${emoji.unified}.png`;

  const img = await loadImage(apple64);
  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, "#f5f5f5");
  gradient.addColorStop(0.6, "#404040");
  gradient.addColorStop(1, "#262626");
  ctx.fillStyle = gradient;

  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const xOffset = -30;
  const yOffset = -70;
  Array.from({ length: 12 }, (x, xi) => {
    Array.from({ length: 12 }, (x, yi) => {
      ctx.drawImage(img, xi * 120 + xOffset, yi * 120 + (yOffset * xi) / 2);
    });
  });

  return new File(
    [canvas.toBuffer("image/jpeg", 92)],
    `welding-emoji-v1-${emoji.unified}.jpg`,
    { type: "image/jpeg" }
  );
};

const base64ImageToFile = async (base64: string) => {
  const buffer = Buffer.from(base64, "base64");
  const fileType = await fileTypeFromBuffer(buffer);
  if (!fileType) throw new Error("unknown_filetype");
  return new File([buffer], `image.${fileType.ext}`, { type: fileType.mime });
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | ApiError>
) {
  try {
    const { name, description, emoji, ui, content, image } = req.body;

    // Process cover image
    let coverImage = image;
    if (coverImage) {
      if (image.startsWith("ipfs://")) {
        const splat = image.split("/");
        const filename = splat[splat.length - 1];

        if (filename === "emoji.jpg") {
          // This is our old style of emoji. Let's remake it
          // so it conforms to the new naming style, which
          // will result in it being passed forward and reused
          // in consequtive saves.
          coverImage = await makeImageFileForEmoji(emoji);
        }

        if (
          filename.startsWith("welding-emoji-v1") && 
          filename !== `welding-emoji-v1-${emoji.unified}.jpg`
        ) {
          // This is our new style of emoji, but the emoji
          // has changed. Let's remake it.
          coverImage = await makeImageFileForEmoji(emoji);
        }

        // If we got here, this image is the correct
        // emoji, OR it is a custom image previously
        // uploaded by a user. Leave it as a string.
      } else {
        coverImage = await base64ImageToFile(image);
      }
    } else {
      // This is the first publish call, so let's generate
      // the emoji for the first time.
      coverImage = await makeImageFileForEmoji(emoji);
    }

    if (typeof coverImage !== "string") {
      // We're generating an emoji share card or
      // processing a user upload. Let's store it
      // on IPFS seperately.
      const coverImageHash = await nftstorage.storeDirectory([coverImage]);
      coverImage = `ipfs://${coverImageHash}/${coverImage.name || 'emoji.jpg'}`;
    }

    const properties: MetadataProperties = { emoji };
    if (content) properties.content = content;
    if (ui) properties.ui = ui;

    const metadata = {
      image: coverImage,
      name,
      description,
      properties,
    };
    
    const metadataFile = new File(
      [JSON.stringify(metadata)],
      "metadata.json",
      { type: "application/json" }
    );
    const hash = await nftstorage.storeDirectory([metadataFile]);
    await prewarmMetadataCache(hash, metadata);
    return res.status(200).json({ hash });
  } catch (e) {
    console.log(e);
    Sentry.captureException(e);
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message || "unexpected" });
    }
    res.status(500).json({ error: "unexpected" });
  }
}
