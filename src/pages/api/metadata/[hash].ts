import type { NextApiRequest, NextApiResponse } from 'next';
import Welding from 'src/lib/Welding';
import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  process.env.NEO4J_URI || '',
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || '',
    process.env.NEO4J_PASSWORD || '',
  )
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string | { error: string }>
) {
  try {
    const { hash } = req.query;
    const session = driver.session();

    const readQ =
      `MATCH (rev:Revision { hash: $hash })
       WHERE rev.content IS NOT NULL AND rev.contentType IS NOT NULL
       RETURN rev`;
    const readResult = await session.readTransaction(tx =>
      tx.run(readQ, { hash })
    );
    if (readResult.records.length) {
      const rev = readResult.records[0].get('rev');
      const { content, contentType } = rev.properties;
      if (content && contentType) {
        return res
          .status(200)
          .setHeader('Content-Type', contentType || '')
          .send(content);
      }
    }

    const response =
      await fetch(`${Welding.ipfsGateways[0]}/ipfs/${hash}/metadata.json`);
    if (!response.ok) throw new Error("failed_to_fetch");
    const contentType = response.headers.get('content-type');
    const content = await response.text();

    const writeQ =
      `MERGE (rev:Revision {hash: $hash})
       SET rev.content = $content
       SET rev.contentType = $contentType`;
    await session.writeTransaction(tx =>
      tx.run(writeQ, { hash, content, contentType })
    );

    res
      .status(200)
      .setHeader('Content-Type', contentType || '')
      .send(content || '');
  } catch(e) {
    console.log(e);
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message || "unexpected" })
    }
    res.status(500).json({ error: "unexpected" })
  }
}
