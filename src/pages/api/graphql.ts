import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { gql, ApolloServer } from "apollo-server-micro";
import { Neo4jGraphQL } from "@neo4j/graphql";
import neo4j from "neo4j-driver";

const driver = neo4j.driver(
  process.env.NEO4J_URI || "",
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || "",
    process.env.NEO4J_PASSWORD || ""
  )
);

const typeDefs = gql`
  type BaseNode {
    tokenId: String!
    fee: String!
    labels: [String!]
      @cypher(statement: "MATCH (this) RETURN distinct labels(this)")

    burnt: Boolean!
      @cypher(
        statement: "MATCH (this)<-[:_OWNS]-(a:Account) RETURN a.address = '0x0000000000000000000000000000000000000000'"
      )

    currentRevision: Revision!
      @cypher(
        statement: "MATCH (this)<-[r:_REVISES]-(rev:Revision) RETURN rev ORDER BY r.block DESC LIMIT 1"
      )
    revisions: [Revision!]! @relationship(type: "_REVISES", direction: IN)

    owner: Account!
      @cypher(statement: "MATCH (this)<-[:_OWNS]-(a:Account) RETURN a")
    admins: [Account!]!
      @cypher(
        statement: "MATCH (this)<-[:_CAN {role: '0'}]-(a:Account) RETURN a"
      )
    editors: [Account!]!
      @cypher(
        statement: "MATCH (this)<-[:_CAN {role: '1'}]-(a:Account) RETURN a"
      )

    related: [BaseNode!]!
      @cypher(statement: "MATCH (this)-[]-(n:BaseNode) RETURN n")
    incoming: [Edge!]!
      @cypher(
        statement: "MATCH (this)<-[r]-(n:BaseNode) RETURN { name: TYPE(r), tokenId: n.tokenId, active: r.active, pivotTokenId: r.pivotTokenId }"
      )
    outgoing: [Edge!]!
      @cypher(
        statement: "MATCH (this)-[r]->(n:BaseNode) RETURN { name: TYPE(r), tokenId: n.tokenId, active: r.active, pivotTokenId: r.pivotTokenId }"
      )
  }

  type Edge {
    name: String!
    tokenId: String!
    active: Boolean!
    pivotTokenId: String!
  }

  type Account {
    address: String!
    roles: [Role!]!
      @cypher(
        statement: "MATCH (this)-[r:_CAN|_OWNS]->(n:BaseNode) RETURN { role: r.role, tokenId: n.tokenId }"
      )
    related: [BaseNode!]!
      @cypher(statement: "MATCH (this)-[]-(n:BaseNode) RETURN n")
  }

  type Role {
    role: String
    tokenId: String!
  }

  type Revision {
    hash: String!
    block: Int!
    content: String
    contentType: String
    baseNodes: [BaseNode!]! @relationship(type: "_REVISES", direction: OUT)
  }
`;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const schema = await new Neo4jGraphQL({ typeDefs, driver }).getSchema();
  const server = new ApolloServer({
    schema,
    introspection: true,
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
  });
  await server.start();
  await server.createHandler({ path: "/api/graphql" })(req, res);
}
