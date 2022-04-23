import type { NextApiRequest, NextApiResponse } from 'next';
import { NFTStorage, File } from 'nft.storage';
import download from 'download';

type Data = {
  hash: string
};

const nftstorage = new NFTStorage({
  token: process.env.NFT_STORAGE_API_KEY
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    const { name, description, emoji, content } = req.body;

    const apple64 =
      `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@14.0.0/img/apple/64/${emoji.unified}.png`;
    const imageFile = new File(
      [await download(apple64)],
      `${emoji.unified}.png`,
      { type: 'image/png'}
    );

    const properties = { emoji };
    if (content) properties.content = content;

    const data = await nftstorage.store({
      image: imageFile,
      name,
      description,
      properties,
    });

    res.status(200).json({ hash: data.ipnft });
  } catch(e) {
    res.status(500).json({ error: ((e && e.message) || "Unexpected Error") })
  }
}
