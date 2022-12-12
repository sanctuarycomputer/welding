import type { NextApiRequest, NextApiResponse } from "next";
import * as Sentry from "@sentry/nextjs";
import neo4j from "neo4j-driver";
import Welding from "src/lib/Welding";
import capitalizeFirstLetter from "src/utils/capitalizeFirstLetter";
import sendgridClient from '@sendgrid/client';

sendgridClient.setApiKey(process.env.SENDGRID_API_KEY || "");

const driver = neo4j.driver(
  process.env.NEO4J_URI || "",
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || "",
    process.env.NEO4J_PASSWORD || ""
  )
);

const merge = async (e, session) => {
  const { event, args } = e;
  switch (event) {
    case "Mint": {
      let q = `MERGE (n:BaseNode {tokenId: $tokenId})
          ON CREATE
            SET n.fee = '0'
          SET n.needsInvalidation = true
          SET n :${capitalizeFirstLetter(args.label)}
          MERGE (rev:Revision {hash: $hash})
          ON CREATE
            SET rev.block = $block
          SET rev.block = CASE WHEN rev.block = 0 THEN $block ELSE rev.block END
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
      const q = `MERGE (n:BaseNode {tokenId: $tokenId})
          ON CREATE
            SET n.fee = '0'
          SET n.needsInvalidation = true
          MERGE (rev:Revision {hash: $hash})
          ON CREATE
            SET rev.block = $block
          SET rev.block = CASE WHEN rev.block = 0 THEN $block ELSE rev.block END
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
          SET n.needsInvalidation = true
          MERGE (rev:Revision {hash: $hash})
          ON CREATE
            SET rev.block = $block
          SET rev.block = CASE WHEN rev.block = 0 THEN $block ELSE rev.block END
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
          SET n.needsInvalidation = true
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
         SET n.needsInvalidation = true
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
         SET n.needsInvalidation = true
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
         SET n.needsInvalidation = true
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
         SET n.needsInvalidation = true
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
         SET n.needsInvalidation = true
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

const attemptNotifySubgraphParent = async (block: number, tokenId: string, session) => {
  const q = `MATCH (sender)-[:_PUBLISHES]-(rev:Revision)-[:_REVISES {block: $block}]->(n:BaseNode {tokenId: $tokenId})-[:BELONGS_TO]->(s:Subgraph)
    RETURN sender, rev, n, s.sendgridListId`;
  const results = await session.readTransaction((tx) =>
    tx.run(q, { block, tokenId })
  );

  if (results.records[0]) {
    const sendgridListId = results.records[0].get('s.sendgridListId');
    if (!sendgridListId || sendgridListId.length === 0) return;

    try {
      
      // Needs:
      // {{Subject}}
      // {{AddressOrENS}}
      // {{Action}}
      // {{ImageURL}}
      // {{Title}}
      // {{Description}}
      
      const res = await sendgridClient.request({
        url: `/v3/marketing/singlesends`,
        method: 'POST',
        body: {
          name: "Some Singlesend Name",
          send_at: (new Date()).toISOString(),
          send_to: {
            list_ids: [sendgridListId]
          },
          email_config: {
            design_id: "20a46fa2-9c33-4960-9b33-be9892cf1d4e",
            sender_id: 4694974,
          }
        }
      })
      console.log(res);
    } catch(e) {
      console.log(e.response.body);
    }
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    let { path } = req.query;
    path = (Array.isArray(path) ? path[0] : path) || "";
    const session = driver.session();

    // TODO: unique index on sendgridListId

    //if (false) {
    //  const flushQ1 = `OPTIONAL MATCH (a)-[r]->() DELETE a, r`;
    //  const flushQ2 = `OPTIONAL MATCH (a) DELETE a`;
    //  await session.writeTransaction((tx) => tx.run(flushQ1));
    //  await session.writeTransaction((tx) => tx.run(flushQ2));

    //  await session.writeTransaction((tx) =>
    //    tx.run(
    //      `CREATE FULLTEXT INDEX revisionContent IF NOT EXISTS FOR (n:Revision) ON EACH [n.content]`
    //    )
    //  );
    //  await session.writeTransaction((tx) =>
    //    tx.run(
    //      `CREATE CONSTRAINT tokenId IF NOT EXISTS FOR (n:BaseNode) REQUIRE n.tokenId IS UNIQUE`
    //    )
    //  );
    //  await session.writeTransaction((tx) =>
    //    tx.run(
    //      `CREATE CONSTRAINT hash IF NOT EXISTS FOR (r:Revision) REQUIRE r.hash IS UNIQUE`
    //    )
    //  );
    //}

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
    const latestBlock = await Welding.getBlockNumber(null);

    // If we're ensuring that our cursor is up to a point
    const { ensure, notify } = req.query;
    let ensureInt = latestBlock;
    if (ensure) {
      ensureInt = parseInt(Array.isArray(ensure) ? ensure[0] : ensure);
      if (ensureInt > latestBlock)
        throw new Error("invalid_ensure_block_given");
      if (cursor >= ensureInt) {
        try {
          if (path) await res.revalidate(path);
          if (notify && notify !== "false") {
            await attemptNotifySubgraphParent(
              parseInt(Array.isArray(ensure) ? ensure[0] : ensure),
              Array.isArray(notify) ? notify[0] : notify,
              session
            );
          }
        } catch (e) {
          console.log(e);
          Sentry.captureException(e);
        }
        return res.status(200).json({ status: "already_processed", cursor });
      }
    }
    
    const { endAt, events } = await Welding.queryEvents(
      null,
      cursor + 1,
      ensureInt
    );
    events.sort(function (a, b) {
      // @ts-ignore
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

    try {
      if (path) await res.revalidate(path);

      // TODO: Better notify d
      if (ensure && notify !== "false") {
        //await attemptNotifySubgraphParent(parseInt(Array.isArray(ensure) ? ensure[0] : ensure));
      }
    } catch (e) {
      console.log(e);
      Sentry.captureException(e);
    }
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
