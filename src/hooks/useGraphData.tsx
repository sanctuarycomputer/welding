import { useState, useEffect, useRef, createContext } from "react";
import type { Account, BaseNode, Revision, Role } from "src/types";
import Client from "src/lib/Client";
import { useAccount } from "wagmi";
import { ObservableQuery } from "@apollo/client";
import { notEmpty } from "src/utils/predicates";
import toast from "react-hot-toast";

type RevisionLoadingData = {
  [tokenId: string]: {
    status: string;
    revisions: Revision[];
  };
};

interface IGraphData {
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
  canEditNode: (n: BaseNode) => boolean;
}

const GraphContext = createContext<IGraphData>({
  accountData: null,
  accountNodesByCollectionType: {},
  accountDataLoading: true,
  loadAccountData: (address: string) => undefined,
  shallowNodes: [],
  shallowNodesLoading: true,
  loadShallowNodes: () => null,
  purgeCache: () => null,
  revisionData: {},
  loadRevisionsForBaseNode: (tokenId: string) => undefined,
  canEditNode: (n: BaseNode) => false,
  canAdministerNode: (n: BaseNode) => false,
  doesOwnNode: (n: BaseNode) => false,
});
const { Provider } = GraphContext;

function GraphProvider({ children }) {
  const { data: account } = useAccount();
  const shallowNodesSubscription = useRef<ObservableQuery<{
    baseNodes: BaseNode[];
  }> | null>(null);

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

  const loadAccountData = async (address) => {
    if (!address) {
      setAccountDataLoading(false);
      setAccountData(null);
      return;
    }

    if (accountDataLoading) return;
    setAccountDataLoading(true);

    let id = toast.loading("Loading account data...", {
      className: "toast",
    });
    try {
      setAccountData(await Client.fetchAccount(address));
      toast.success("Account data loaded.", { id });
    } catch(e) {
      console.log(e);
      toast.error("An error occured.", { id });
    }
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
    loadShallowNodes();
  }, []);

  useEffect(() => {
    loadAccountData(account?.address);
  }, [account]);

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

  const canEditNode = (baseNode) => {
    if (baseNode.burnt) return false;

    const directPermissions = !!accountData?.roles.find((r) => {
      return r.tokenId === baseNode.tokenId && r.role !== null;
    });
    if (directPermissions) return true;

    return baseNode.outgoing.some((e) => {
      if (e.name !== "_DELEGATES_PERMISSIONS_TO") return false;
      return !!accountData?.roles.find((r) => {
        return r.tokenId === e.tokenId && r.role !== null;
      });
    });
  };

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
        canAdministerNode,
        doesOwnNode,
      }}
    >
      {children}
    </Provider>
  );
}

export { GraphContext, GraphProvider };
