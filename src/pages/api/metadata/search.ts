import type { NextApiRequest, NextApiResponse } from 'next';
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
  res: NextApiResponse
) {
  try {
    const session = driver.session();
    const { term } = req.query;
    const results =
      await session.readTransaction(tx =>
        tx.run(`
          CALL db.index.fulltext.queryNodes("revisionContent", $term)
          YIELD node, score
          RETURN node, score
        `, { term })
      );
    res.status(200).json({ term: term, results: results.records });
  } catch(e) {
    console.log(e);
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message || "unexpected" })
    }
    res.status(500).json({ error: "unexpected" })
  }
}
