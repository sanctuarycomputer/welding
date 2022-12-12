import neo4j from "neo4j-driver";
import sendgridClient from '@sendgrid/client';

sendgridClient.setApiKey(process.env.SENDGRID_API_KEY || "");

const driver = neo4j.driver(
  process.env.NEO4J_URI || "",
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || "",
    process.env.NEO4J_PASSWORD || ""
  )
);

const findOrCreateListForNodeId = async (tokenId: string) => {
  const session = driver.session();
  const q = `MATCH (n:BaseNode {tokenId: $tokenId}) RETURN n.sendgridListId`;
  const result = await session.readTransaction((tx) =>
    tx.run(q, { tokenId })
  );
  if (!result.records.length) throw new Error("node_nonexistent");
  if (!!result.records[0].get('n.sendgridListId')) 
    return result.records[0].get('n.sendgridListId');

  const [, list] = await sendgridClient.request({
    url: `/v3/marketing/lists`,
    method: 'POST',
    body: { name: `A node with ID ${tokenId}` }
  });

  const writeQ = `MATCH (n:BaseNode {tokenId: $tokenId}) SET n.sendgridListId = $sendgridListId`;
  await session.writeTransaction((tx) =>
    tx.run(writeQ, { tokenId, sendgridListId: list.id })
  );
  return list.id;
}

export default findOrCreateListForNodeId;