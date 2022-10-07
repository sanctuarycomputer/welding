import { useState, useEffect, useRef, createContext } from "react";
import type { Session, Account, BaseNode, Revision, Role } from "src/types";
import Client from "src/lib/Client";
import { useAccount, useDisconnect } from "wagmi";
import { didDisconnect } from "src/utils/event";
import { ObservableQuery } from "@apollo/client";
import { notEmpty } from "src/utils/predicates";
import * as Sentry from "@sentry/nextjs";

type RevisionLoadingData = {
  [tokenId: string]: {
    status: string;
    revisions: Revision[];
  };
};

interface IGraphData {
  dummyNodes: BaseNode[];
  dummyNodesLoading: boolean;
  sessionData: Session | null;
  sessionDataLoading: boolean;
  loadCurrentSession: () => Promise<Session | undefined>;
  flushSessionAndDisconnect: () => void;
  accountData: Account | null;
  accountDataLoading: boolean;
  accountNodesByCollectionType: {
    [nodeLabel: string]: {
      [tokenId: string]: {
        node: BaseNode;
      };
    };
  };
  loadAccountData: (address: string) => void;
  shallowNodes: BaseNode[];
  shallowNodesLoading: boolean;
  loadShallowNodes: () => void;
  purgeCache: () => void;
  loadRevisionsForBaseNode: (tokenId: string) => void;
  revisionData: RevisionLoadingData;
  doesOwnNode: (n: BaseNode) => boolean;
  canAdministerNode: (n: BaseNode) => boolean;
}

const GraphContext = createContext<IGraphData>({
  dummyNodes: [],
  dummyNodesLoading: false,
  sessionData: null,
  sessionDataLoading: false,
  loadCurrentSession: async () => undefined,
  flushSessionAndDisconnect: () => undefined,
  accountData: null,
  accountNodesByCollectionType: {},
  accountDataLoading: true,
  loadAccountData: () => undefined,
  shallowNodes: [],
  shallowNodesLoading: true,
  loadShallowNodes: () => null,
  purgeCache: () => null,
  revisionData: {},
  loadRevisionsForBaseNode: () => undefined,
  canAdministerNode: () => false,
  doesOwnNode: () => false,
});
const { Provider } = GraphContext;

function GraphProvider({ children }) {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const shallowNodesSubscription = useRef<ObservableQuery<{
    baseNodes: BaseNode[];
  }> | null>(null);

  const [dummyNodes, setDummyNodes] = useState<BaseNode[]>([]);
  const [dummyNodesLoading, setDummyNodesLoading] = useState<boolean>(true);

  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [sessionDataLoading, setSessionDataLoading] = useState<boolean>(true);

  const [accountDataLoading, setAccountDataLoading] = useState<boolean>(false);
  const [accountData, setAccountData] = useState<Account | null>(null);
  const [shallowNodesLoading, setShallowNodesLoading] = useState(false);
  const [shallowNodes, setShallowNodes] = useState<BaseNode[]>([]);
  const [revisionData, setRevisionData] = useState<RevisionLoadingData>({});

  const loadShallowNodes = async () => {
    if (shallowNodesLoading === true) return;
    if (shallowNodesSubscription.current === null) {
      const subscription = await Client.makeShallowNodesSubscription();
      subscription.subscribe(async ({ data, loading }) => {
        setShallowNodesLoading(loading);
        const withRevisions = data.baseNodes.map(async (node: BaseNode) => {
          if (!node) return null;
          node = JSON.parse(JSON.stringify(node));
          await Client.processRevision(node.currentRevision);
          return node;
        });
        setShallowNodes((await Promise.all(withRevisions)).filter(notEmpty));
      });
      shallowNodesSubscription.current = subscription;
    } else {
      shallowNodesSubscription.current.refetch();
    }
  };

  const purgeCache = async () => {
    await Client.resetStore();
  };

  const loadDummyNodes = async () => {
    try {
      setDummyNodesLoading(true);
      setDummyNodes(await Client.Drafts.fetchDummyNodes());
    } catch (e) {
      // TODO Sentry
      setDummyNodes([]);
    } finally {
      setDummyNodesLoading(false);
    }
  };

  const loadCurrentSession = async () => {
    try {
      setSessionDataLoading(true);
      const res = await fetch("/api/me");
      const json = await res.json();
      if (json.address) {
        loadDummyNodes();
        const sessionData = { address: json.address } as Session;
        setSessionData(sessionData);
        return sessionData;
      } else {
        setSessionData(null);
      }
    } catch (e) {
      Sentry.captureException(e);
      setSessionData(null);
    } finally {
      setSessionDataLoading(false);
    }
  };

  const flushSessionAndDisconnect = async () => {
    try {
      // TODO: If local draft isPersisting: true, open confirm modal
      setSessionDataLoading(true);
      await fetch("/api/logout");
    } catch (e) {
      Sentry.captureException(e);
    } finally {
      // Do this anyway, for security
      setSessionData(null);
      setSessionDataLoading(false);
      setDummyNodes([]);
      disconnect();
      didDisconnect();
    }
  };

  const loadAccountData = async (address) => {
    if (!address) {
      await flushSessionAndDisconnect();
      setAccountDataLoading(false);
      setAccountData(null);
      return;
    }

    if (accountDataLoading) return;
    setAccountDataLoading(true);
    setAccountData(await Client.fetchAccount(address));
    setAccountDataLoading(false);
  };

  const loadRevisionsForBaseNode = async (tokenId) => {
    setRevisionData({
      ...revisionData,
      [tokenId]: {
        status: "LOADING",
        revisions: [],
      },
    });
    const revisions = await Client.fetchRevisionsForBaseNode(tokenId);

    setRevisionData({
      ...revisionData,
      [tokenId]: {
        status: "FULFILLED",
        revisions,
      },
    });
  };

  useEffect(() => {
    loadCurrentSession();
    loadShallowNodes();
  }, []);

  useEffect(() => {
    loadAccountData(address);
  }, [address]);

  let accountNodesByCollectionType = {};
  if (accountData) {
    accountNodesByCollectionType = accountData.roles.reduce(
      (acc: object, role: Role) => {
        const n = accountData.related.find((node: BaseNode) => {
          return node.tokenId === role.tokenId;
        });
        if (!n) return acc;
        const collectionType = n.labels.filter((l) => l !== "BaseNode")[0];
        acc[collectionType] = acc[collectionType] || {};
        acc[collectionType][n.tokenId] = acc[collectionType][n.tokenId] || {
          node: n,
        };
        return acc;
      },
      accountNodesByCollectionType
    );
  }

  const canAdministerNode = (baseNode) => {
    if (baseNode.burnt) return false;

    const directPermissions = !!accountData?.roles.find((r) => {
      return r.tokenId === baseNode.tokenId && r.role === "0";
    });
    if (directPermissions) return true;

    return baseNode.outgoing.some((e) => {
      if (e.name !== "_DELEGATES_PERMISSIONS_TO") return false;
      return !!accountData?.roles.find((r) => {
        return r.tokenId === e.tokenId && r.role === "0";
      });
    });
  };

  const doesOwnNode = (baseNode) => {
    if (baseNode.burnt) return false;
    return !!accountData?.roles.find((r) => {
      return r.tokenId === baseNode.tokenId && !r.role;
    });
  };

  return (
    <Provider
      value={{
        dummyNodes,
        dummyNodesLoading,
        loadDummyNodes,
        sessionData,
        sessionDataLoading,
        loadCurrentSession,
        flushSessionAndDisconnect,
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
        canAdministerNode,
        doesOwnNode,
      }}
    >
      {children}
    </Provider>
  );
}

export { GraphContext, GraphProvider };
