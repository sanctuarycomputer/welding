// https://lyonwj.com/blog/graphql-server-next-js-neo4j-aura-vercel

import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { gql, ApolloServer } from 'apollo-server-micro';
import { Neo4jGraphQL } from '@neo4j/graphql';
import neo4j from 'neo4j-driver';

const driver = neo4j.driver(
  process.env.NEO4J_URI || '',
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME || '',
    process.env.NEO4J_PASSWORD || '',
  )
);

const typeDefs = gql`
  type BaseNode {
    tokenId: String!
    labels: [String!] @cypher(statement:"MATCH (this) RETURN distinct labels(this)")
    currentRevision: Revision! @cypher(statement:"MATCH (this)<-[:REVISES]-(rev:Revision) RETURN rev ORDER BY rev.timestamp DESC LIMIT 1")
    revisions: [Revision!]! @relationship(type: "REVISES", direction: IN)
    connections: [BaseNode!]! @relationship(type: "TO", direction: OUT)
    backlinks: [BaseNode!]! @relationship(type: "TO", direction: IN)
  }

  type Account {
    address: String!
  }
  type Subgraph {
    tokenId: String!
    revisions: [Revision!]! @relationship(type: "REVISES", direction: IN)
  }
  type Topic {
    tokenId: String!
    currentRevision: Revision! @cypher(statement:"MATCH (this)<-[:REVISES]-(rev:Revision) RETURN rev ORDER BY rev.timestamp DESC LIMIT 1")
    revisions: [Revision!]! @relationship(type: "REVISES", direction: IN)
  }
  type Document {
    tokenId: String!
    revisions: [Revision!]! @relationship(type: "REVISES", direction: IN)
  }
  type Revision {
    hash: String!
    timestamp: Int
    content: String
    contentType: String
  }
`;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const schema = await (new Neo4jGraphQL({ typeDefs, driver })).getSchema();
  const server = new ApolloServer({
    schema,
    //playground: true,
    introspection: true,
    plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
  });
  await server.start();
  await server.createHandler({ path: "/api/graphql" })(req, res);
};
