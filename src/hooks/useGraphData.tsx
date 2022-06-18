import { useState, useEffect, useRef, createContext } from 'react';
import type { Account } from 'src/types';
import Client from 'src/lib/Client';
import { useAccount } from 'wagmi';

interface IAccountContext {
  account: Account | null;
  isLoading: boolean;
};

const GraphContext = createContext<IAccountContext>();
const { Provider } = GraphContext;

function GraphProvider({ children }) {
  const { data: account } = useAccount();

  const [accountDataLoading, setAccountDataLoading] =
    useState<boolean>(false);
  const [accountData, setAccountData] =
    useState<Account | null>(null);

  const [shallowNodesLoading, setShallowNodesLoading] =
    useState(null);
  const [shallowNodes, setShallowNodes] =
    useState(null);
  const shallowNodesSubscription =
    useRef(null);

  const [revisionData, setRevisionData] =
    useState<{
      [tokenId: string]: {
        status: string,
        revisions: Revision[]
      }
    }>({});

  const loadShallowNodes = async () => {
    if (shallowNodesLoading === true) return;
    if (shallowNodesSubscription.current === null) {
      const subscription = await Client
        .makeShallowNodesSubscription()
      subscription.subscribe(async ({ data, loading }) => {
        console.log("STARTED LOADING SHALLOW NODES");
        setShallowNodesLoading(loading);
        const withRevisions = data.baseNodes.map(async (node: BaseNode) => {
          if (!node) return null;
          node = JSON.parse(JSON.stringify(node));
          await Client.processRevision(node.currentRevision);
          return node;
        });
        setShallowNodes(await Promise.all(withRevisions));
      });
      shallowNodesSubscription.current = subscription;
    } else {
      shallowNodesSubscription.current.refetch();
    }
  };

  const purgeCache = async () => {
    await Client.resetStore();
  };

  const loadAccountData = async (address) => {
    if (!address) {
      setAccountDataLoading(false);
      return setAccountData(null);
    }

    setAccountDataLoading(true);
    setAccountData(await Client.fetchAccount(address));
    setAccountDataLoading(false);
  };

  const loadRevisionsForBaseNode = async (tokenId) => {
    setRevisionData({
      ...revisionData,
      [tokenId]: {
        status: "LOADING",
        revisions: []
      }
    });
    const revisions =
      await Client.fetchRevisionsForBaseNode(tokenId);

    setRevisionData({
      ...revisionData,
      [tokenId]: {
        status: "FULFILLED",
        revisions
      }
    });
  };

  useEffect(() => {
    loadShallowNodes();
  }, []);

  useEffect(() => {
    loadAccountData(account?.address);
  }, [account]);

  let accountNodesByCollectionType = {
    Subgraph: {},
    Document: {},
    Topic: {},
  };

  let accountNodesByTokenId = {};

  if (accountData) {
    accountNodesByCollectionType =
      accountData.roles.reduce((acc: object, role: Role) => {
        const n = accountData.related.find((node: BaseNode) => {
          return node.tokenId === role.tokenId;
        });
        if (!n) return acc;
        const collectionType =
          n.labels.filter(l => l !== "BaseNode")[0];
        acc[collectionType][n.tokenId] =
          acc[collectionType][n.tokenId] || { node: n };
        return acc;
      }, accountNodesByCollectionType);
  }

  const canEditNode = baseNode => {
    const directPermissions =
      !!accountData?.roles.find(r => {
        return r.tokenId === baseNode.tokenId && r.role !== null;
      });
    if (directPermissions) return true;

    return baseNode.outgoing.some(e => {
      if (e.name !== '_DELEGATES_PERMISSIONS_TO') return false;
      return !!accountData?.roles.find(r => {
        return r.tokenId === e.tokenId && r.role !== null;
      });
    });
  };

  const canAdministerNode = baseNode => {
    const directPermissions =
      !!accountData?.roles.find(r => {
        return r.tokenId === baseNode.tokenId && r.role === '0';
      });
    if (directPermissions) return true;

    return baseNode.outgoing.some(e => {
      if (e.name !== '_DELEGATES_PERMISSIONS_TO') return false;
      return !!accountData?.roles.find(r => {
        return r.tokenId === e.tokenId && r.role === '0';
      });
    });
  };

  return (
    <Provider value={{
      accountData,
      accountNodesByCollectionType,
      accountDataLoading,
      loadAccountData,
      shallowNodes,
      shallowNodesLoading,
      loadShallowNodes,
      purgeCache,
      revisionData,
      loadRevisionsForBaseNode,
      canEditNode,
      canAdministerNode
    }}>
      {children}
    </Provider>
  );
};

export { GraphContext, GraphProvider };

