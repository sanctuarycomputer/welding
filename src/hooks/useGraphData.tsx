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
  const [accountDataLoading, setAccountDataLoading] = useState<boolean>(false);
  const [accountData, setAccountData] = useState<Account | null>(null);

  const [shallowNodesLoading, setShallowNodesLoading] = useState(null);
  const [shallowNodes, setShallowNodes] = useState(null);
  const shallowNodesSubscription = useRef(null);

  const loadShallowNodes = async () => {
    if (shallowNodesLoading === true) return;
    if (shallowNodesSubscription.current === null) {
      const subscription = await Client
        .makeShallowNodesSubscription()
      subscription.subscribe(async ({ data, loading }) => {
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

  const loadAccountData = async (address) => {
    if (!address) {
      setAccountDataLoading(false);
      return setAccountData(null);
    }

    setAccountDataLoading(true);
    setAccountData(await Client.fetchAccount(address));
    setAccountDataLoading(false);
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

  return (
    <Provider value={{
      accountData,
      accountNodesByCollectionType,
      accountDataLoading,
      loadAccountData,
      shallowNodes,
      shallowNodesLoading,
      loadShallowNodes
    }}>
      {children}
    </Provider>
  );
};

export { GraphContext, GraphProvider };

