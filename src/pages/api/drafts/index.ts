import { withIronSessionApiRoute } from "iron-session/next";
import { NextApiRequest, NextApiResponse } from "next";
import * as Sentry from "@sentry/nextjs";
import neo4j from "neo4j-driver";
import { IRON_OPTIONS } from "src/utils/constants";
import makeHash from "object-hash";

const driver = neo4j.driver(
  process.env.NEO4J_URI || "",
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || "",
    process.env.NEO4J_PASSWORD || ""
  )
);

const canEditNode = (node: BaseNode, address: string | undefined) => {
  if (!address) return false;
  if (node.admins.some((a) => a.address === address)) return true;
  if (node.editors.some((a) => a.address === address)) return true;

  return node.outgoing.some((e) => {
    if (e.name !== "_DELEGATES_PERMISSIONS_TO") return false;
    const related = node.related.find((n) => n.tokenId === e.tokenId);
    if (!related) return false;
    if (related.admins.some((a) => a.address === address)) return true;
    if (related.editors.some((a) => a.address === address)) return true;
    return false;
  });
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    if (!req.session.siwe?.address) throw new Error("no_session");

    const session = driver.session();
    await session.writeTransaction((tx) =>
      tx.run(
        `CREATE CONSTRAINT hash IF NOT EXISTS FOR (d:Draft) REQUIRE d.hash IS UNIQUE`
      )
    );

    const { method } = req;
    switch (method) {
      case "GET":
        // TODO: Can only view these drafts if canEdit n
        // TODO: Do we need drafts on the FE today?
        // TODO: Should we be sending them all? Doubt it

        const readQ = `MATCH (n { tokenId: $tokenId })<-[e:_REVISES]-(d:Draft)
          WHERE n:BaseNode OR n:DummyNode
          RETURN d.content, e.submittedAt`;
        const readResult = await session.readTransaction((tx) =>
          tx.run(readQ, { tokenId: req.query?.tokenId })
        );
        const drafts = readResult.records.map((r) => {
          return {
            submittedAt: r.get("e.submittedAt"),
            draft: JSON.parse(r.get("d.content")),
          };
        });
        res.send({ drafts });
        break;

      case "POST":
        const node = req.body.draft.__node__;
        const content = { ...req.body.draft };
        delete content.__node__;
        delete content.related;

        const q = `MATCH (n {tokenId: $tokenId})
            WHERE n:BaseNode OR n:DummyNode
            MERGE (d:Draft {hash: $hash})
            ON CREATE
              SET d.content = $content
            MERGE (a:Account {address: $sender})
            MERGE (a)-[:_DRAFTS]->(d)-[:_REVISES {submittedAt: $submittedAt}]->(n)
            RETURN n.tokenId
            `;
        const result = await session.writeTransaction((tx) =>
          tx.run(q, {
            tokenId: node.tokenId,
            hash: makeHash(content),
            content: JSON.stringify(content),
            sender: req.session.siwe?.address,
            submittedAt: req.body.submittedAt,
          })
        );
        if (result.records.length === 0) return res.status(404).end();
        if (result.records.length > 1)
          throw new Error("unexpected_multi_record");
        res.status(201).end();
        break;

      case "DELETE":
        const deleteQ = `MATCH (d:Draft)-[]-(n:BaseNode {tokenId: $tokenId}) DETACH DELETE d`;
        await session.writeTransaction((tx) =>
          tx.run(q, {
            tokenId: req.query?.tokenId,
          })
        );
        res.send({ drafts: [] });

      default:
        res.setHeader("Allow", ["GET", "POST"]);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (e) {}
};

export default withIronSessionApiRoute(handler, IRON_OPTIONS);
