import { withIronSessionApiRoute } from "iron-session/next";
import { NextApiRequest, NextApiResponse } from "next";
import * as Sentry from "@sentry/nextjs";
import neo4j from "neo4j-driver";
import { IRON_OPTIONS } from "src/utils/constants";
import capitalizeFirstLetter from "src/utils/capitalizeFirstLetter";
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
        // TODO: A user can't view this DummyNode unless canEdit?

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
          ...readResult.records[0].get('BaseNode'),
          ...unpackDraftAsBaseNodeAttrs(
            JSON.parse(readResult.records[0].get('d').properties.content)
          )
        });
        break;

      case "DELETE":
        break;

      default:
        res.setHeader("Allow", ["GET", "DELETE"]);
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
