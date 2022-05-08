import type { NextApiRequest, NextApiResponse } from 'next';
import { createCanvas, loadImage } from 'canvas';
import { NFTStorage, File, Blob } from 'nft.storage';
import { MetadataProperties } from 'src/types';
import { fileTypeFromBuffer } from 'file-type';

type Data = {
  hash: string
};
type ApiError = {
  error: string
};

export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '10mb'
    }
  },
}

const nftstorage = new NFTStorage({
  token: process.env.NFT_STORAGE_API_KEY || ''
});

const makeImageFileForEmoji = async (emoji) => {
  const apple64 =
    `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@14.0.0/img/apple/64/${emoji.unified}.png`;

  const img = await loadImage(apple64);
  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const xOffset = -30;
  const yOffset = -70;
  Array.from({ length: 12 }, (x, xi) => {
    Array.from({ length: 12 }, (x, yi) => {
      ctx.drawImage(
        img,
        (xi*120) + (xOffset),
        (yi*120) + (yOffset * xi/2)
      );
    })
  });

  return new File(
    [canvas.toBuffer('image/jpeg', { quality: 1 })],
    'emoji.jpg',
    { type: 'image/jpeg'}
  );
};

const base64ImageToFile = async (base64: string) => {
  const buffer = Buffer.from(base64, 'base64');
  const fileType = await fileTypeFromBuffer(buffer);
  if (!fileType) throw new Error("unknown_filetype");
  return new File(
    [buffer],
    `image.${fileType.ext}`,
    { type: fileType.mime }
  );
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | ApiError>
) {
  try {
    const { name, description, emoji, content, image } = req.body;

    let coverImage = image;
    if (coverImage) {
      if (!image.startsWith("ipfs://")) {
        coverImage = await base64ImageToFile(image)
      }
    } else {
      coverImage = await makeImageFileForEmoji(emoji);
    };

    const properties: MetadataProperties = { emoji };
    if (content) properties.content = content;

    if (typeof coverImage === "string") {
      const metadataFile = new File(
        [JSON.stringify({
          image: coverImage,
          name,
          description,
          properties,
        })],
        'metadata.json',
        { type: 'application/json' }
      );
      const hash = await nftstorage.storeDirectory([metadataFile]);
      return res.status(200).json({ hash });
    }

    const data = await nftstorage.store({
      image: coverImage,
      name,
      description,
      properties,
    });

    // TODO: Warm the metadata cache?
    return res.status(200).json({ hash: data.ipnft });
  } catch(e) {
    console.log(e);
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message || "unexpected" })
    }
    res.status(500).json({ error: "unexpected" })
  }
}
