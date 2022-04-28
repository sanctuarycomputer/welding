import type { NextApiRequest, NextApiResponse } from 'next';
import { createCanvas, loadImage } from 'canvas';
import { NFTStorage, File } from 'nft.storage';
import { MetadataProperties } from 'src/types';

type Data = {
  hash: string
};
type ApiError = {
  error: string
};

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
    `${emoji.unified}.jpg`,
    { type: 'image/jpeg'}
  );
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | ApiError>
) {
  try {
    const { name, description, emoji, content } = req.body;

    const image = await makeImageFileForEmoji(emoji);
    const properties: MetadataProperties = { emoji };
    if (content) properties.content = content;

    const data = await nftstorage.store({
      image,
      name,
      description,
      properties,
    });

    // TODO: Warm the metadata cache?

    res.status(200).json({ hash: data.ipnft });
  } catch(e) {
    console.log(e);
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message || "unexpected" })
    }
    res.status(500).json({ error: "unexpected" })
  }
}
