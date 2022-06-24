import type { NextApiRequest, NextApiResponse } from "next";
import Welding from "src/lib/Welding";
import neo4j from "neo4j-driver";
import * as Sentry from "@sentry/nextjs";

const driver = neo4j.driver(
  process.env.NEO4J_URI || "",
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || "",
    process.env.NEO4J_PASSWORD || ""
  )
);

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const merge = async (e, session) => {
  const { blockNumber, event, args } = e;
  switch (event) {
    case "Mint": {
      let q = `MERGE (n:BaseNode {tokenId: $tokenId})
          ON CREATE
            SET n.fee = '0'
          SET n :${capitalizeFirstLetter(args.label)}
          MERGE (rev:Revision {hash: $hash})
          ON CREATE
            SET rev.block = $block
          MERGE (sender:Account {address: $sender})
          MERGE (sender)-[:_PUBLISHES]->(rev)-[:_REVISES {block: $block}]->(n)
          `;

      q = args.incomingEdges.reduce((acc, edge) => {
        const index = args.incomingEdges.indexOf(edge);
        acc += `MERGE (i${index}:BaseNode {tokenId: '${edge.tokenId.toString()}'})
           ON CREATE
             SET i${index}.fee = '0'
           MERGE (i${index})-[ri${index}:${
          edge.name
        } {pivotTokenId: $tokenId}]->(n)
             SET ri${index}.active = true
           `;
        return acc;
      }, q);

      q = args.outgoingEdges.reduce((acc, edge) => {
        const index = args.outgoingEdges.indexOf(edge);
        acc += `MERGE (o${index}:BaseNode {tokenId: '${edge.tokenId.toString()}'})
           ON CREATE
             SET o${index}.fee = '0'
           MERGE (n)-[ro${index}:${
          edge.name
        } {pivotTokenId: $tokenId}]->(o${index})
             SET ro${index}.active = true
           `;
        return acc;
      }, q);

      await session.writeTransaction((tx) =>
        tx.run(q, {
          tokenId: args.tokenId.toString(),
          hash: args.hash,
          block: e.blockNumber,
          sender: args.sender,
        })
      );

      break;
    }

    case "Revise": {
      let q = `MERGE (n:BaseNode {tokenId: $tokenId})
          ON CREATE
            SET n.fee = '0'
          MERGE (rev:Revision {hash: $hash})
          ON CREATE
            SET rev.block = $block
          MERGE (sender:Account {address: $sender})
          MERGE (sender)-[:_PUBLISHES]->(rev)-[:_REVISES {block: $block}]->(n)
          `;

      await session.writeTransaction((tx) =>
        tx.run(q, {
          tokenId: args.tokenId.toString(),
          hash: args.hash,
          block: e.blockNumber,
          sender: args.sender,
        })
      );

      break;
    }

    case "Merge": {
      let q = `MERGE (n:BaseNode {tokenId: $tokenId})
          ON CREATE
            SET n.fee = '0'
          MERGE (rev:Revision {hash: $hash})
          ON CREATE
            SET rev.block = $block
          MERGE (sender:Account {address: $sender})
          MERGE (sender)-[:_PUBLISHES]->(rev)-[:_REVISES {block: $block}]->(n)
          WITH n
          OPTIONAL MATCH (n)-[r {pivotTokenId: $tokenId}]-(:BaseNode)
            WHERE NOT type(r) STARTS WITH '_'
            SET r.active = false
          `;

      q = args.incomingEdges.reduce((acc, edge) => {
        const index = args.incomingEdges.indexOf(edge);
        acc += `MERGE (i${index}:BaseNode {tokenId: '${edge.tokenId.toString()}'})
           MERGE (i${index})-[ri${index}:${
          edge.name
        } {pivotTokenId: $tokenId}]->(n)
             SET ri${index}.active = true
           `;
        return acc;
      }, q);

      q = args.outgoingEdges.reduce((acc, edge) => {
        const index = args.outgoingEdges.indexOf(edge);
        acc += `MERGE (o${index}:BaseNode {tokenId: '${edge.tokenId.toString()}'})
           ON CREATE
             SET o${index}.fee = '0'
           MERGE (n)-[ro${index}:${
          edge.name
        } {pivotTokenId: $tokenId}]->(o${index})
             SET ro${index}.active = true
           `;
        return acc;
      }, q);

      await session.writeTransaction((tx) =>
        tx.run(q, {
          tokenId: args.tokenId.toString(),
          hash: args.hash,
          block: e.blockNumber,
          sender: args.sender,
        })
      );

      break;
    }

    case "Transfer": {
      const q = `MERGE (n:BaseNode {tokenId: $tokenId})
          ON CREATE
            SET n.fee = '0'
          MERGE (from:Account {address: $fromAddress})
          MERGE (to:Account {address: $toAddress})
          MERGE (from)-[:TRANSFERS_OWNERSHIP { tokenId: $tokenId }]->(to)
          MERGE (to)-[:_OWNS]->(n)
          WITH from, n OPTIONAL MATCH (from)-[r:_OWNS]->(n) DELETE r
          MERGE (z:Account {address: '0x0000000000000000000000000000000000000000'})
          WITH z
          OPTIONAL MATCH (z)-[:_OWNS]->(:BaseNode)-[r]-(:BaseNode)
            WHERE NOT type(r) STARTS WITH '_'
            DELETE r
          WITH z
          OPTIONAL MATCH (z)-[:_OWNS]->(:BaseNode)<-[r:_CAN]-(:Account)
            DELETE r`;
      await session.writeTransaction((tx) => {
        tx.run(q, {
          tokenId: args.tokenId.toString(),
          fromAddress: args.from,
          toAddress: args.to,
        });
      });
      break;
    }

    case "RoleGranted": {
      const q = `MERGE (n:BaseNode {tokenId: $tokenId})
         MERGE (recipient:Account {address: $toAddress})
         MERGE (sender:Account {address: $senderAddress})
         MERGE (recipient)-[:_CAN {role: $role}]->(n)
         `;
      await session.writeTransaction((tx) => {
        tx.run(q, {
          tokenId: args.tokenId.toString(),
          role: args.role.toString(),
          toAddress: args.account,
          senderAddress: args.sender,
        });
      });
      break;
    }

    case "RoleRevoked": {
      const q = `MERGE (n:BaseNode {tokenId: $tokenId})
         MERGE (recipient:Account {address: $toAddress})
         MERGE (sender:Account {address: $senderAddress})
         WITH recipient, n OPTIONAL MATCH (recipient)-[r:_CAN {role: $role}]->(n) DELETE r
         `;
      await session.writeTransaction((tx) => {
        tx.run(q, {
          tokenId: args.tokenId.toString(),
          role: args.role.toString(),
          toAddress: args.account,
          senderAddress: args.sender,
        });
      });
      break;
    }

    case "ConnectionFeeSet": {
      const q = `MERGE (n:BaseNode {tokenId: $tokenId})
         SET n.fee = $fee
         `;
      await session.writeTransaction((tx) => {
        tx.run(q, {
          tokenId: args.tokenId.toString(),
          fee: args.connectionFee.toString(),
        });
      });
      break;
    }

    case "PermissionsDelegated": {
      const q = `MERGE (n:BaseNode {tokenId: $forTokenId})
         MERGE (o:BaseNode {tokenId: $toTokenId})
         MERGE (n)-[r:_DELEGATES_PERMISSIONS_TO { pivotTokenId: $forTokenId }]->(o)
           SET r.active = true
        `;
      await session.writeTransaction((tx) => {
        tx.run(q, {
          forTokenId: args.forTokenId.toString(),
          toTokenId: args.toTokenId.toString(),
        });
      });
      break;
    }

    case "DelegatePermissionsRenounced": {
      const q = `MERGE (n:BaseNode {tokenId: $forTokenId})
         MERGE (o:BaseNode {tokenId: $toTokenId})
         WITH n, o
         OPTIONAL MATCH (n)-[r:_DELEGATES_PERMISSIONS_TO { pivotTokenId: $forTokenId }]->(o)
           SET r.active = false
        `;
      await session.writeTransaction((tx) => {
        tx.run(q, {
          forTokenId: args.forTokenId.toString(),
          toTokenId: args.toTokenId.toString(),
        });
      });
      break;
    }

    case "Approval":
    case "ApprovalForAll":
    case "PermissionsBypassSet":
    default:
      console.log(`Implement Me: ${event}`);
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = driver.session();

    if (false) {
      const flushQ1 = `OPTIONAL MATCH (a)-[r]->() DELETE a, r`;
      const flushQ2 = `OPTIONAL MATCH (a) DELETE a`;
      await session.writeTransaction((tx) => tx.run(flushQ1));
      await session.writeTransaction((tx) => tx.run(flushQ2));

      await session.writeTransaction((tx) =>
        tx.run(
          `CREATE FULLTEXT INDEX revisionContent IF NOT EXISTS FOR (n:Revision) ON EACH [n.content]`
        )
      );
      await session.writeTransaction((tx) =>
        tx.run(
          `CREATE CONSTRAINT tokenId IF NOT EXISTS FOR (n:BaseNode) REQUIRE n.tokenId IS UNIQUE`
        )
      );
      await session.writeTransaction((tx) =>
        tx.run(
          `CREATE CONSTRAINT hash IF NOT EXISTS FOR (r:Revision) REQUIRE r.hash IS UNIQUE`
        )
      );
    }

    // Load our cursor
    const latestQ = `MATCH (b:Block {id: '__singleton__'})
       RETURN b.number
       LIMIT 1`;
    const readResult = await session.readTransaction((tx) => tx.run(latestQ));

    let cursor = parseInt(process.env.NEXT_PUBLIC_NODE_DEPLOY_BLOCK || "0");
    if (readResult.records.length) {
      cursor = readResult.records[0].get("b.number");
    }

    // Load the latest block
    const latestBlock = await Welding.getBlockNumber();

    // If we're ensuring that our cursor is up to a point
    let { ensure } = req.query;
    if (ensure) {
      ensure = parseInt(ensure);
      if (ensure > latestBlock) throw new Error("invalid_ensure_block_given");
      if (cursor >= ensure)
        return res.status(200).json({ status: "already_processed", cursor });
    }

    const { endAt, events } = await Welding.queryEvents(
      null,
      cursor + 1,
      ensure
    );
    events.sort(function (a, b) {
      return a.blockNumber - b.blockNumber;
    });
    for (const event of events) await merge(event, session);

    // Store our cursor
    const q = `MERGE (b:Block {id: '__singleton__'})
       SET b.number = $blockNumber`;
    await session.writeTransaction((tx) =>
      tx.run(q, {
        blockNumber: endAt,
      })
    );

    res.status(200).json({ status: "synced", cursor: endAt });
  } catch (e) {
    console.log(e);
    Sentry.captureException(e);
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message || "unexpected" });
    }
    res.status(500).json({ error: "unexpected" });
  }
}
