import { useState, useEffect, createContext } from 'react';
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [accountData, setAccountData] = useState<Account | null>(null);

  const loadUserData = async (address) => {
    if (!address) {
      setIsLoading(false);
      return setAccountData(null);
    }

    setIsLoading(true);
    setAccountData(await Client.fetchAccount(address));
    setIsLoading(false);
  };

  useEffect(() => {
    loadUserData(account?.address);
  }, [account]);

  return (
    <Provider value={{ accountData, isLoading }}>
      {children}
    </Provider>
  );
};

export { GraphContext, GraphProvider };

