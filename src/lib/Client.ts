import {
  ApolloClient,
  InMemoryCache,
  gql
} from '@apollo/client';

import {
  BaseNode,
  Metadata,
  Revision
} from 'src/types';

const client = new ApolloClient({
  uri: "http://localhost:3000/api/graphql",
  cache: new InMemoryCache(),
});

const Client = {
  processRevision: async function(revision: Revision): Promise<Metadata | string> {
    if (!revision.content)
      return await Client.fetchMetadataForHash(revision.hash);
    if (revision.contentType === 'application/json')
      return JSON.parse(revision.content);
    return revision.content;
  },

  fetchMetadataForHash: async function(hash: string): Promise<Metadata> {
    return await (await fetch(`http://localhost:3000/api/metadata/${hash}`)).json();
  },

  fetchNode: async function(): Promise<BaseNode[]> {
    const { data: { baseNodes }} = await client.query({
      query: gql`
        query BaseNodes {
          baseNodes {
            tokenId
            currentRevision {
              hash, content
            }
          }}`,
    });

    return baseNodes;
  },

  fetchBaseNodeByTokenId: async function(tokenId: string): Promise<BaseNode | null> {
    const { data: { baseNodes }} = await client.query({
      variables: { tokenId },
      query: gql`
        query BaseNode($tokenId: String) {
          baseNodes(where: { tokenId: $tokenId }) {
            tokenId
            labels
            currentRevision {
              hash, timestamp, content, contentType
            }
            connections {
              tokenId
              labels
              currentRevision {
                hash, timestamp, content, contentType
              }
            }
            backlinks {
              tokenId
              labels
              currentRevision {
                hash, timestamp, content, contentType
              }
            }
          }}`,
    });

    let baseNode: BaseNode = baseNodes[0];
    baseNode = JSON.parse(JSON.stringify(baseNode));
    if (!baseNode) return null;

    baseNode.currentRevision.metadata =
      await Client.processRevision(baseNode.currentRevision);

    for (const connection of (baseNode?.connections || [])) {
      connection.currentRevision.metadata =
        await Client.processRevision(connection.currentRevision);
    }
    for (const backlink of (baseNode?.backlinks || [])) {
      backlink.currentRevision.metadata =
        await Client.processRevision(backlink.currentRevision);
    }

    return baseNode;
  },
};

export default Client;
