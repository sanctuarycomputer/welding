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

import {
  persistCache,
  LocalStorageWrapper
} from 'apollo3-cache-persist';

import { fetchEnsName } from '@wagmi/core';
import { emojiIndex, BaseEmoji } from 'emoji-mart';

const DEFAULT_EMOJI: BaseEmoji =
  (Object.values(emojiIndex.emojis)[0] as BaseEmoji);

const ERROR_METADATA: Metadata = {
  name: "IPFS downtime",
  description:
    "This metadata couldn't be loaded, likely due to IPFS downtime.",
  image: "",
  properties: {
    emoji: DEFAULT_EMOJI // TODO: Warning Emoji
  }
};

const revisionShape = `
hash,
block,
content,
contentType
`;

const edgeShape = `
name
tokenId
active
pivotTokenId
`;

const baseNodeShape = `
tokenId
labels
fee
currentRevision {
  ${revisionShape}
}
related {
  tokenId
  labels
  fee
  currentRevision {
    ${revisionShape}
  }
  admins {
    address
  }
  editors {
    address
  }
}
incoming {
  ${edgeShape}
}
outgoing {
  ${edgeShape}
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
`;

const Client = {
  _client: null,

  getClient: async function() {
    if (Client._client) return Client._client;
    const cache = new InMemoryCache();
    if (typeof window !== 'undefined') {
      await persistCache({
        cache,
        storage: new LocalStorageWrapper(window.localStorage),
        debug: true,
        trigger: 'write'
      });
    }
    Client._client = new ApolloClient({
      cache,
      uri: "http://localhost:3000/api/graphql",
    });
    return Client._client;
  },

  resetStore: async function(): Promise<void> {
    const client = await Client.getClient();
    await client.resetStore();
    return;
  },

  processRevision: async function(
    revision: Revision
  ): Promise<void> {
    if (!revision.content) {
      revision.metadata =
        await Client.fetchMetadataForHash(revision.hash);
    }
    if (revision.contentType === 'application/json') {
      revision.metadata = JSON.parse(revision.content);
    }
  },

  fetchMetadataForHash: async function(
    hash: string
  ): Promise<Metadata> {
    const response =
      await fetch(`http://localhost:3000/api/metadata/${hash}`);
    if (!response.ok) return Promise.resolve(ERROR_METADATA);
    return await response.json();
  },

  fastForward: async function(
    blockNumber: number
  ): Promise<void> {
    const response =
      await fetch(
        `http://localhost:3000/api/sync?ensure=${blockNumber}`
      );
    if (!response.ok)
      throw new Error("could_not_fastforward");
  },

  makeShallowNodesSubscription: async function() {
    const client = await Client.getClient();
    return client.watchQuery({
      fetchPolicy: 'cache-and-network',
      query: gql`
        query BaseNodes {
          baseNodes {
            tokenId
            labels
            fee
            currentRevision {
              ${revisionShape}
            }
          }
        }
      `
    });
  },

  fetchAccount: async function(
    accountAddress: string
  ): Promise<Account | null> {
    const client = await Client.getClient();
    const { data: { accounts }} = await client.query({
      fetchPolicy: 'network-only',
      variables: { accountAddress },
      query: gql`
        query Account($accountAddress: String) {
          accounts(where: { address: $accountAddress }) {
            address
            roles {
              role
              tokenId
            }
            related {
              ${baseNodeShape}
            }
          }}`,
    });

    let account: Account = accounts[0];
    if (!account) return null;
    account = JSON.parse(JSON.stringify(account));

    account.ensName =
      await fetchEnsName({ address: account.address, chainId: 1 });

    for (const node of account.related) {
      await Client.processRevision(node.currentRevision);
      for (const related of node.related) {
        await Client.processRevision(related.currentRevision);
      }
    }

    return account;
  },

  fetchBaseNodeByTokenId: async function(
    tokenId: string
  ): Promise<BaseNode | null> {
    const client = await Client.getClient();
    const { data: { baseNodes }} = await client.query({
      fetchPolicy: 'network-only',
      variables: { tokenId },
      query: gql`
        query BaseNode($tokenId: String) {
          baseNodes(where: { tokenId: $tokenId }) {
            ${baseNodeShape}
          }}`,
    });

    let baseNode: BaseNode = baseNodes[0];
    if (!baseNode) return null;
    baseNode = JSON.parse(JSON.stringify(baseNode));

    await Client.processRevision(baseNode.currentRevision);
    for (const connection of baseNode.related)
      await Client.processRevision(connection.currentRevision);

    return baseNode;
  },

  fetchRevisionByHash: async function(
    hash: string
  ): Promise<Revision | null> {
    const client = await Client.getClient();
    const { data: { revisions }} = await client.query({
      fetchPolicy: 'network-only',
      variables: { hash },
      query: gql`
        query Revision($hash: String) {
          revisions(
            where: { hash: $hash }
          ) {
            ${revisionShape}
          }}`,
    });

    let revision: Revision = revisions[0];
    if (!revision) return null;
    revision = JSON.parse(JSON.stringify(revision));
    await Client.processRevision(revision);
    return revision;
  },

  fetchRevisionsForBaseNode: async function(
    tokenId: string
  ): Promise<Revision[]> {
    const client = await Client.getClient();
    let { data: { revisions }} = await client.query({
      fetchPolicy: 'network-only',
      variables: { tokenId },
      query: gql`
        query Revisions($tokenId: String) {
          revisions(
            where: {baseNodes_SOME: {tokenId: $tokenId}}
          ) {
            ${revisionShape}
          }}`,
    });
    revisions = JSON.parse(JSON.stringify(revisions));
    for (const revision of revisions)
      await Client.processRevision(revision);
    return revisions;
  },
};

export default Client;
