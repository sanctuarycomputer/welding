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

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const merge = async (e, session) => {
  const { blockNumber, event, args } = e;
  switch (event) {
    case 'NodeLabeled': {
      const q =
        `MERGE (n:BaseNode {tokenId: $tokenId})
         SET n :${capitalizeFirstLetter(args.label)}`;
      await session.writeTransaction(tx => tx.run(q, {
        tokenId: args.tokenId.toString()
      }));
      break;
    }

    case 'Transfer': {
      const q =
         `MERGE (n:BaseNode {tokenId: $tokenId})
          MERGE (from:Account {address: $fromAddress})
          MERGE (to:Account {address: $toAddress})
          MERGE (from)-[:TRANSFERS_OWNERSHIP { tokenId: $tokenId }]->(to)
          MERGE (to)-[:OWNS]->(n)
          WITH from, n MATCH (from)-[r:OWNS]->(n) DELETE r`;
      await session.writeTransaction(tx => {
        tx.run(q, {
          tokenId: args.tokenId.toString(),
          fromAddress: args.from,
          toAddress: args.to
        });
      });
      break;
    }

    case 'RevisionMade': {
      const q =
        `MERGE (n:BaseNode {tokenId: $tokenId})
         MERGE (rev:Revision {hash: $hash})
         SET rev.timestamp = $timestamp
         MERGE (sender:Account {address: $senderAddress})
         MERGE (sender)-[:PUBLISHES]->(rev)-[:REVISES]->(n)`;
      await session.writeTransaction(tx => {
        tx.run(q, {
          tokenId: args.tokenId.toString(),
          timestamp: parseInt(args.timestamp.toString()),
          hash: args.hash,
          senderAddress: args.sender
        });
      });
      break;
    }

    case 'NodesConnected': {
      const q =
        `MERGE (n1:BaseNode {tokenId: $fromTokenId})
         MERGE (n2:BaseNode {tokenId: $toTokenId})
         MERGE (sender:Account {address: $senderAddress})
         MERGE (sender)-[:CONNECTS]->(n1)-[:TO]->(n2)`;
      await session.writeTransaction(tx => {
        tx.run(q, {
          fromTokenId: args.from.toString(),
          toTokenId: args.to.toString(),
          senderAddress: args.sender
        });
      });
      break;
    }

    case 'RoleGranted': {
      const q =
        `MERGE (n:BaseNode {tokenId: $tokenId})
         MERGE (recipient:Account {address: $toAddress})
         MERGE (sender:Account {address: $senderAddress})
         MERGE (recipient)-[:CAN {role: $role}]->(n)`;
      await session.writeTransaction(tx => {
        tx.run(q, {
          tokenId: args.tokenId.toString(),
          role: args.role.toString(),
          toAddress: args.account,
          senderAddress: args.sender
        });
      });
      break;
    }

    case 'RoleRevoked': {
      const q =
        `MERGE (n:BaseNode {tokenId: $tokenId})
         MERGE (recipient:Account {address: $toAddress})
         MERGE (sender:Account {address: $senderAddress})
         WITH recipient, n MATCH (recipient)-[r:CAN {role: $role}]->(n) DELETE r`;
      await session.writeTransaction(tx => {
        tx.run(q, {
          tokenId: args.tokenId.toString(),
          role: args.role.toString(),
          toAddress: args.account,
          senderAddress: args.sender
        });
      });
      break;
    }


    case 'Approval':
    case 'ApprovalForAll':
    case 'PermissionsDelegated':
    case 'DelegatePermissionsRenounced':
    case 'PermissionsBypassSet':
    case 'NodesDisconnected':
    case 'ConnectionFeeSet':
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
      const flushQ1 = `MATCH (a)-[r]->() DELETE a, r`
      const flushQ2 = `MATCH (a) DELETE a`;
      await session.writeTransaction(tx => tx.run(flushQ1));
      await session.writeTransaction(tx => tx.run(flushQ2));
      try {
        await session.readTransaction(tx =>
          tx.run(`CREATE FULLTEXT INDEX revisionContent FOR (n:Revision) ON EACH [n.content]`)
        );
      } catch(e) {}
    }

    // Load our cursor
    const latestQ =
      `MATCH (b:Block {id: '__singleton__'})
       RETURN b.number
       LIMIT 1`;
    const readResult =
      await session.readTransaction(tx => tx.run(latestQ));

    let cursor =
      parseInt(process.env.NEXT_PUBLIC_NODE_DEPLOY_BLOCK || '0');
    if (readResult.records.length) {
      cursor = readResult.records[0].get('b.number');
    }

    // Load the latest block
    const latestBlock = await Welding.getBlockNumber();

    // If we're ensuring that our cursor is up to a point
    let { ensure } = req.query;
    if (ensure) {
      ensure = parseInt(ensure);
      if (ensure > latestBlock)
        throw new Error("invalid_ensure_block_given");
      if (cursor >= ensure)
        return res.status(200).json({ status: "already_processed", cursor });
    }

    const { endAt, events } =
      await Welding.queryEvents(null, cursor + 1, ensure);
    for (const event of events) await merge(event, session);

    // Store our cursor
    const q =
      `MERGE (b:Block {id: '__singleton__'})
       SET b.number = $blockNumber`;
    await session.writeTransaction(tx => tx.run(q, {
      blockNumber: endAt
    }));

    res.status(200).json({ status: "synced", cursor: endAt });
  } catch(e) {
    console.log(e);
    if (e instanceof Error) {
      return res.status(500).json({ error: e.message || "unexpected" })
    }
    res.status(500).json({ error: "unexpected" })
  }
}
