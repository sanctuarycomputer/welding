import type { NextApiRequest, NextApiResponse } from 'next';
import og from 'open-graph';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // TODO Cors
  try {
    const url = decodeURIComponent(req.query?.url);
    og(url, function(e, meta) {
      if (meta) {
        res.status(200).json({ success: 1, meta });
      } else {
        res.status(500).json({
          error: ((e && e.message) || "Unexpected Error")
        });
      }
    });
  } catch(e) {
    res.status(500).json({
      error: ((e && e.message) || "Unexpected Error")
    });
  }
}
