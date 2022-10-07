import neo4j from "neo4j-driver";

// TODO: This method doesn't respect
// _DELEGATES_PERMISSION_TO.

export default async (tokenId, address) => {
  const driver = neo4j.driver(
    process.env.NEO4J_URI || "",
    neo4j.auth.basic(
      process.env.NEO4J_USERNAME || "",
      process.env.NEO4J_PASSWORD || ""
    )
  );
  const session = driver.session();
  const q = `MATCH (n { tokenId: $tokenId })<-[e:_CAN]-(Account { address: $address })
    WHERE n:BaseNode OR n:DummyNode
    WITH e
    WHERE e.role IN ["0", "1"]
    RETURN e.role`;
  const readResult = await session.readTransaction((tx) =>
    tx.run(q, { tokenId, address })
  );
  return readResult.records.length > 0;
};
