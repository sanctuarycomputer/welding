import {
  ApolloClient,
  InMemoryCache,
  gql,
  NormalizedCacheObject,
  ObservableQuery,
} from "@apollo/client";
import { Account, BaseNode, Metadata, Revision } from "src/types";
import { persistCache, LocalStorageWrapper } from "apollo3-cache-persist";
import { fetchEnsName } from "@wagmi/core";
import { emojiIndex, BaseEmoji } from "emoji-mart";
import * as Sentry from "@sentry/nextjs";
import retry from "async-retry";

let baseHostWithProtocol = process.env.NEXT_PUBLIC_BASE_HOST;
if (baseHostWithProtocol === "localhost:3000") {
  baseHostWithProtocol = `http://${baseHostWithProtocol}`;
} else {
  baseHostWithProtocol = `https://${baseHostWithProtocol}`;
}

const DEFAULT_EMOJI: BaseEmoji = Object.values(
  emojiIndex.emojis
)[0] as BaseEmoji;

const ERROR_METADATA: Metadata = {
  name: "IPFS downtime",
  description: "This metadata couldn't be loaded, likely due to IPFS downtime.",
  image: "",
  properties: {
    emoji: DEFAULT_EMOJI, // TODO: Warning Emoji
  },
};

const miniRevisionShape = `
name,
nativeEmoji,
description,
image,
`;

const revisionShape = `
${miniRevisionShape}
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

const coreNodeShape = `
tokenId
labels
burnt
fee
admins { address }
editors { address }
owner { address }
`;

const relatedNodeShape = `
${coreNodeShape}
currentRevision { ${miniRevisionShape} }
`;

const accountNodeShape = `
${coreNodeShape}
currentRevision { ${miniRevisionShape} }
related { ${relatedNodeShape} }
incoming { ${edgeShape} }
outgoing { ${edgeShape} }
`;

const baseNodeShape = `
${coreNodeShape}
currentRevision { ${revisionShape} }
related { ${relatedNodeShape} }
incoming { ${edgeShape} }
outgoing { ${edgeShape} }
`;

const Client = {
  async getClient(): Promise<ApolloClient<NormalizedCacheObject>> {
    const cache = new InMemoryCache();
    if (typeof window !== "undefined") {
      await persistCache({
        cache,
        storage: new LocalStorageWrapper(window.localStorage),
        debug: true,
        trigger: "write",
      });
    }
    return new ApolloClient({
      cache,
      uri: `${baseHostWithProtocol}/api/graphql`,
    });
  },

  resetStore: async function (): Promise<void> {
    const client = await Client.getClient();
    await client.resetStore();
    return;
  },

  processRevision: async function (revision): Promise<void> {
    if (!revision.content && revision.hash) {
      revision.metadata = await Client.fetchMetadataForHash(revision.hash);
      return;
    }
    if (revision.content && revision.contentType === "application/json") {
      revision.metadata = JSON.parse(revision.content || "");
    }
  },

  fetchMetadataForHash: async function (hash: string): Promise<Metadata> {
    const response = await retry(
      async () => {
        return await fetch(`${baseHostWithProtocol}/api/metadata/${hash}`);
      },
      { retries: 3 }
    );
    if (!response.ok) return Promise.resolve(ERROR_METADATA);
    return await response.json();
  },

  fastForward: async function (
    blockNumber: number,
    path: string
  ): Promise<void> {
    const response = await retry(
      async () => {
        return await fetch(
          `${baseHostWithProtocol}/api/sync?ensure=${blockNumber}&path=${path}`
        );
      },
      { retries: 3 }
    );
    if (!response.ok) throw new Error("could_not_fastforward");
  },

  makeShallowNodesSubscription: async function (): Promise<
    ObservableQuery<{ baseNodes: BaseNode[] }>
  > {
    const client = await Client.getClient();
    return client.watchQuery<{ baseNodes: BaseNode[] }>({
      fetchPolicy: "cache-and-network",
      query: gql`
        query BaseNodes {
          baseNodes {
            ${relatedNodeShape}
          }
        }
      `,
    });
  },

  fetchAccount: async function (
    accountAddress: string
  ): Promise<Account | null> {
    const tx = Sentry.startTransaction({ name: "Client.fetchAccount()" });
    Sentry.getCurrentHub().configureScope((scope) => scope.setSpan(tx));

    let span = tx.startChild({ op: "Client.getClient()" });
    const client = await Client.getClient();
    span.finish();

    span = tx.startChild({ op: "client.query()" });
    const {
      data: { accounts },
    } = await client.query({
      variables: { accountAddress },
      fetchPolicy: "network-only",
      query: gql`
        query Account($accountAddress: String) {
          accounts(where: { address: $accountAddress }) {
            address
            roles {
              role
              tokenId
            }
            related {
              ${accountNodeShape}
            }
          }}`,
    });
    span.finish();

    span = tx.startChild({ op: "JSON.stringify" });
    let account: Account = accounts[0];
    if (!account) return null;
    account = JSON.parse(JSON.stringify(account));
    span.finish();

    span = tx.startChild({ op: "fetchEnsName" });
    account.ensName = await fetchEnsName({
      address: account.address,
      chainId: 1,
    });
    span.finish();

    tx.finish();
    return account;
  },

  fetchBaseNodeByTokenId: async function (
    tokenId: string
  ): Promise<BaseNode | null> {
    const tx = Sentry.startTransaction({
      name: "Client.fetchBaseNodeByTokenId()",
    });
    Sentry.getCurrentHub().configureScope((scope) => scope.setSpan(tx));

    let span = tx.startChild({ op: "Client.getClient()" });
    const client = await Client.getClient();
    span.finish();

    span = tx.startChild({ op: "client.query()" });
    const {
      data: { baseNodes },
    } = await client.query({
      fetchPolicy: "network-only",
      variables: { tokenId },
      query: gql`
        query BaseNode($tokenId: String) {
          baseNodes(where: { tokenId: $tokenId }) {
            ${baseNodeShape}
          }}`,
    });
    span.finish();

    span = tx.startChild({ op: "JSON.stringify" });
    let baseNode: BaseNode = baseNodes[0];
    if (!baseNode) return null;
    baseNode = JSON.parse(JSON.stringify(baseNode));
    span.finish();

    span = tx.startChild({ op: "Client.processRevision()" });
    await Client.processRevision(baseNode.currentRevision);
    for (const connection of baseNode.related)
      await Client.processRevision(connection.currentRevision);

    span.finish();
    tx.finish();
    return baseNode;
  },

  fetchSimpleBaseNodesByTokenIds: async function (
    tokenIds: Array<string>
  ): Promise<Array<BaseNode> | null> {
    const tx = Sentry.startTransaction({
      name: "Client.fetchSimpleBaseNodesByTokenIds()",
    });
    Sentry.getCurrentHub().configureScope((scope) => scope.setSpan(tx));

    let span = tx.startChild({ op: "Client.getClient()" });
    const client = await Client.getClient();
    span.finish();

    span = tx.startChild({ op: "client.query()" });
    let {
      data: { baseNodes },
    } = await client.query({
      fetchPolicy: "network-only",
      variables: { tokenIds },
      query: gql`
        query BaseNode($tokenIds: [String!]) {
          baseNodes(where: { tokenId_IN: $tokenIds }) {
            tokenId
            labels
            currentRevision { name }
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
            related {
              tokenId
              labels
              currentRevision { name }
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
              related {
                tokenId
                labels
                currentRevision { name }
                admins {
                  address
                }
                editors {
                  address
                }
                owner {
                  address
                }
              }
            }
          }}`,
    });
    span.finish();

    span = tx.startChild({ op: "JSON.stringify" });
    baseNodes = JSON.parse(JSON.stringify(baseNodes));
    span.finish();
    tx.finish();
    return baseNodes;
  },

  fetchRevisionByHash: async function (hash: string): Promise<Revision | null> {
    const client = await Client.getClient();
    const {
      data: { revisions },
    } = await client.query({
      fetchPolicy: "network-only",
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

  fetchRevisionsForBaseNode: async function (
    tokenId: string
  ): Promise<Revision[]> {
    const client = await Client.getClient();
    let {
      data: { revisions },
    } = await client.query({
      fetchPolicy: "network-only",
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
    for (const revision of revisions) await Client.processRevision(revision);
    return revisions;
  },

  Drafts: {
    fetchDummyNodes: async function (): Promise<BaseNode[]> {
      const response = await fetch(`${baseHostWithProtocol}/api/dummyNodes`, {
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) return (await response.json()).baseNodes;
      return [];
    },

    forTokenId: async function (
      tokenId: string
    ): Promise<{ draft: Draft; submittedAt: string }[]> {
      return (
        await (
          await fetch(`${baseHostWithProtocol}/api/drafts?tokenId=${tokenId}`)
        ).json()
      ).drafts;
    },

    persist: async function (draft: Draft): Promise<boolean> {
      const response = await fetch(`${baseHostWithProtocol}/api/drafts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft,
          submittedAt: new Date().toISOString(),
        }),
      });
      return response.ok;
    },

    fetchDummyNode: async function (
      tokenId: string,
      headers: any
    ): Promise<BaseNode | null> {
      const response = await fetch(
        `${baseHostWithProtocol}/api/dummyNodes/${tokenId}`,
        {
          headers: { ...headers, "Content-Type": "application/json" },
        }
      );
      if (response.ok) return await response.json();
      return null;
    },

    makeDummyNode: async function (
      draft: Draft,
      headers: any
    ): Promise<BaseNode> {
      return await (
        await fetch(`${baseHostWithProtocol}/api/dummyNodes`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({
            draft,
            submittedAt: new Date().toISOString(),
          }),
        })
      ).json();
    },
  },
};

export default Client;
