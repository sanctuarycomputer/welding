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

import { emojiIndex, BaseEmoji } from 'emoji-mart';

const DEFAULT_EMOJI: BaseEmoji =
  (Object.values(emojiIndex.emojis)[0] as BaseEmoji);

const ERROR_METADATA: Metadata = {
  name: "IPFS downtime",
  description: "This metadata couldn't be loaded, likely due to IPFS downtime.",
  image: "",
  properties: {
    emoji: DEFAULT_EMOJI // TODO: Warning Emoji
  }
};

const client = new ApolloClient({
  uri: "http://localhost:3000/api/graphql",
  cache: new InMemoryCache(),
});

const Client = {
  searchNodes: async function(term: string, label: string | null): Promise<BaseNode[]> {
    const latestQ =
      `CALL db.index.fulltext.queryNodes("content", $term)
       YIELD node, score
       RETURN node, score`
    const readResult =
      await session.readTransaction(tx => tx.run(latestQ));
    console.log(readResult);
  },

  processRevision: async function(revision: Revision): Promise<void> {
    if (!revision.content)
      revision.metadata = await Client.fetchMetadataForHash(revision.hash);
    if (revision.contentType === 'application/json')
      revision.metadata = JSON.parse(revision.content);
    // Should never happen
    revision.metdata = revision.content;
  },

  fetchMetadataForHash: async function(hash: string): Promise<Metadata> {
    const response = await fetch(`http://localhost:3000/api/metadata/${hash}`);
    if (!response.ok) return Promise.resolve(ERROR_METADATA);
    return await response.json();
  },

  fastForward: async function(blockNumber: number): Promise<void> {
    const response = await fetch(`http://localhost:3000/api/sync?ensure=${blockNumber}`);
    if (!response.ok) throw new Error("could_not_fastforward");
  },

  fetchAccount: async function(accountAddress: string): Promise<Account | null> {
    const { data: { accounts }} = await client.query({
      variables: { accountAddress },
      query: gql`
        query Account($accountAddress: String) {
          accounts(where: { address: $accountAddress }) {
            address
            ownerOf {
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
            }
            adminOf {
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
            }
            editorOf {
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
            }
          }}`,
    });

    let account: Account = accounts[0];
    if (!account) return null;
    account = JSON.parse(JSON.stringify(account));
    if (!account) return null;

    for (const node of account.ownerOf) {
      await Client.processRevision(node.currentRevision);
      for (const connection of node.connections)
        await Client.processRevision(connection.currentRevision);
      for (const backlink of node.backlinks)
        await Client.processRevision(backlink.currentRevision);
    }

    for (const node of account.adminOf) {
      await Client.processRevision(node.currentRevision);
      for (const connection of node.connections)
        await Client.processRevision(connection.currentRevision);
      for (const backlink of node.backlinks)
        await Client.processRevision(backlink.currentRevision);
    }

    for (const node of account.editorOf) {
      await Client.processRevision(node.currentRevision);
      for (const connection of node.connections)
        await Client.processRevision(connection.currentRevision);
      for (const backlink of node.backlinks)
        await Client.processRevision(backlink.currentRevision);
    }

    return account;
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
            admins {
              address
            }
            editors {
              address
            }
            owner {
              address
            }
          }}`,
    });

    let baseNode: BaseNode = baseNodes[0];
    if (!baseNode) return null;
    baseNode = JSON.parse(JSON.stringify(baseNode));
    if (!baseNode) return null;

    await Client.processRevision(baseNode.currentRevision);
    for (const connection of baseNode.connections)
      await Client.processRevision(connection.currentRevision);
    for (const backlink of baseNode.backlinks)
      await Client.processRevision(backlink.currentRevision);

    return baseNode;
  },
};

export default Client;
