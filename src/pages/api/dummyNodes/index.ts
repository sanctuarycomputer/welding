import { withIronSessionApiRoute } from "iron-session/next";
import { NextApiRequest, NextApiResponse } from "next";
import * as Sentry from "@sentry/nextjs";
import neo4j from "neo4j-driver";
import { IRON_OPTIONS } from "src/utils/constants";
import capitalizeFirstLetter from "src/utils/capitalizeFirstLetter";
import makeHash from 'object-hash';
import unpackDraftAsBaseNodeAttrs from "src/utils/unpackDraftAsBaseNodeAttrs";

const driver = neo4j.driver(
  process.env.NEO4J_URI || "",
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || "",
    process.env.NEO4J_PASSWORD || ""
  )
);

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    if (!req.session.siwe?.address)
      throw new Error("no_session");

    const session = driver.session();
    await session.writeTransaction((tx) =>
      tx.run(
        `CREATE CONSTRAINT tokenId IF NOT EXISTS FOR (d:DummyNode) REQUIRE d.tokenId IS UNIQUE`
      )
    );

    const { method } = req;
    switch (method) {
      case "GET":
        const readQ = `MATCH (n:DummyNode)<-[:_OWNS]-(a:Account { address: $sender })
        CALL {
          WITH n
          MATCH (n)<-[r:_REVISES]-(d:Draft)
          WITH d, r ORDER BY datetime(r.submittedAt) DESC LIMIT 1
          RETURN d as d
        }
        RETURN n {
          tokenId: n.tokenId,
          fee: '-1',
          burnt: false,
          labels: labels(n),
          related: [],
          owner: { address: $sender },
          admins: [{ address: $sender }],
          editors: []
        }, d { .content }
        `;

        const baseNodes = (await session.readTransaction((tx) =>
          tx.run(readQ, { sender: req.session.siwe?.address })
        )).records.map(r => {
          return {
            ...r.get('n'),
            ...unpackDraftAsBaseNodeAttrs(
              JSON.parse(r.get('d').content)
            )
          }
        });
        res.send({ baseNodes })
        break;

      case "POST":
        const node = req.body.draft.__node__;
        const nodeType = node.labels.filter((l) => l !== "BaseNode")[0];
        const content = { ... req.body.draft };
        delete content.__node__;
        delete content.related;

        const q = `MERGE (n:DummyNode {tokenId: randomUUID()})
            ON CREATE
              SET n :${capitalizeFirstLetter(nodeType)}
            MERGE (d:Draft {hash: $hash})
            ON CREATE
              SET d.content = $content
            MERGE (a:Account {address: $sender})
            MERGE (a)-[:_OWNS]->(n)
            MERGE (a)-[:_CAN {role: "0"}]->(n)
            MERGE (a)-[:_DRAFTS]->(d)-[:_REVISES {submittedAt: $submittedAt}]->(n)
            RETURN n.tokenId
            `;
        const result = await session.writeTransaction((tx) =>
          tx.run(q, {
            hash: makeHash(content),
            content: JSON.stringify(content),
            sender: req.session.siwe?.address,
            submittedAt: req.body.submittedAt
          })
        );
        res.send({ tokenId: result.records[0]?.get('n.tokenId') })
        break;

      default:
        res.setHeader("Allow", ["GET", "POST"]);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch(e) {
    console.log(e);
    Sentry.captureException(e);
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message || "unexpected" });
    }
    res.status(500).json({ error: "unexpected" });
  }
};

export default withIronSessionApiRoute(handler, IRON_OPTIONS);
