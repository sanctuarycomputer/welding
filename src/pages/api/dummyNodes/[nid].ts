import { withIronSessionApiRoute } from "iron-session/next";
import { NextApiRequest, NextApiResponse } from "next";
import * as Sentry from "@sentry/nextjs";
import neo4j from "neo4j-driver";
import { IRON_OPTIONS } from "src/utils/constants";
import unpackDraftAsBaseNodeAttrs from "src/utils/unpackDraftAsBaseNodeAttrs";
import queryCanEditNode from "src/utils/queryCanEditNode";

const driver = neo4j.driver(
  process.env.NEO4J_URI || "",
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || "",
    process.env.NEO4J_PASSWORD || ""
  )
);

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    if (!req.session.siwe?.address) throw new Error("no_session");
    const session = driver.session();

    const { method } = req;
    switch (method) {
      case "GET":
        if (
          !(await queryCanEditNode(req.query?.nid, req.session.siwe?.address))
        ) {
          throw new Error("insufficient_permissions");
        }

        const readQ = `MATCH (n:DummyNode {tokenId: $tokenId})
          MATCH (n)<-[:_OWNS]-(owner:Account)
          MATCH (n)<-[:_CAN { role: "0" }]-(admins:Account)

          WITH {
            tokenId: n.tokenId,
            fee: '-1',
            burnt: false,
            labels: labels(n),
            owner: { address: owner.address },
            related: [],
            admins: [{ address: admins.address }],
            editors: []
          } AS BaseNode, n

          MATCH (n)<-[r:_REVISES]-(d:Draft)
          WITH BaseNode, d, r ORDER BY datetime(r.submittedAt) DESC LIMIT 1
          RETURN BaseNode, d, r`;

        const readResult = await session.readTransaction((tx) =>
          tx.run(readQ, { tokenId: req.query?.nid })
        );

        if (readResult.records.length === 0) return res.status(404).end();
        if (readResult.records.length > 1)
          throw new Error("unexpected_multi_record");
        res.send({
          ...readResult.records[0].get("BaseNode"),
          ...unpackDraftAsBaseNodeAttrs(
            JSON.parse(readResult.records[0].get("d").properties.content)
          ),
        });
        break;

      case "PUT":
        if (
          !(await queryCanEditNode(req.query?.nid, req.session.siwe?.address))
        ) {
          throw new Error("insufficient_permissions");
        }

        const putQ = `MATCH (d:DummyNode {tokenId: $tokenId}), (n:BaseNode {tokenId: $onChainTokenId})
          MERGE (d)-[e:_PRECEDES]->(n)
          RETURN e`;
        const putResult = await session.writeTransaction((tx) =>
          tx.run(putQ, { tokenId: req.query?.nid, onChainTokenId: req.body.onChainTokenId })
        );

        if (putResult.records.length === 0) return res.status(404).end();
        if (putResult.records.length > 1)
          throw new Error("unexpected_multi_record");

        res.status(204).end();
        break;

      case "DELETE":
        if (
          !(await queryCanEditNode(req.query?.nid, req.session.siwe?.address))
        ) {
          throw new Error("insufficient_permissions");
        }
        const deleteQ = `MATCH (n:DummyNode { tokenId: $tokenId })<-[:_REVISES]-(d:Draft)
          DETACH DELETE d, n`;
        await session.writeTransaction((tx) =>
          tx.run(deleteQ, { tokenId: req.query?.nid })
        );
        res.status(204).end();
        break;

      default:
        res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (e) {
    console.log(e);
    Sentry.captureException(e);
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message || "unexpected" });
    }
    res.status(500).json({ error: "unexpected" });
  }
};

export default withIronSessionApiRoute(handler, IRON_OPTIONS);
