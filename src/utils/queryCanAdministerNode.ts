import neo4j from "neo4j-driver";

const queryCanAdministerNode = async (tokenId, address) => {
  const session = neo4j
    .driver(
      process.env.NEO4J_URI || "",
      neo4j.auth.basic(
        process.env.NEO4J_USERNAME || "",
        process.env.NEO4J_PASSWORD || ""
      )
    )
    .session();

  const directQ = `MATCH (n { tokenId: $tokenId })<-[e:_CAN]-(Account { address: $address })
    WHERE n:BaseNode OR n:DummyNode
    WITH e
    WHERE e.role IN ["0"]
    RETURN e.role`;
  const directPermissionsResult = await session.readTransaction((tx) =>
    tx.run(directQ, { tokenId, address })
  );
  if (directPermissionsResult.records.length > 0) return true;

  const delegatedQ = `MATCH (Account { address: $address })-[e:_CAN]->()<-[:_DELEGATES_PERMISSIONS_TO]-(n { tokenId: $tokenId })
     WHERE n:BaseNode OR n:DummyNode
     WITH e
     WHERE e.role IN ["0"]
     RETURN e.role`;
  const delegatedPermissionResult = await session.readTransaction((tx) =>
    tx.run(delegatedQ, { tokenId, address })
  );

  return delegatedPermissionResult.records.length > 0;
};

export default queryCanAdministerNode;