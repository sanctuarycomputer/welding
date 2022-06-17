import { useState, useEffect, createContext } from 'react';
import { useNetwork } from 'wagmi';

interface IExchangeRateContext {
  exchangeRate: number | null;
  exchangeRateLoading: boolean;
  loadExchangeRate: Function;
};

const ExchangeRateContext = createContext<IExchangeRateContext>();
const { Provider } = ExchangeRateContext;

function ExchangeRateProvider({ children }) {
  const { activeChain } = useNetwork();

  const [
    exchangeRateLoading,
    setExchangeRateLoading
  ] = useState<boolean>(false);
  const [
    exchangeRate,
    setExchangeRate
  ] = useState<number | null>(null);

  const loadExchangeRate = async () => {
    if (!activeChain?.nativeCurrency?.symbol) return;
    const { symbol } = activeChain.nativeCurrency;
    setExchangeRateLoading(true);
    try {
      const response = await fetch(
        `https://api.coinbase.com/v2/exchange-rates?currency=${symbol}`
      );
      const json = await response.json();
      setExchangeRate(parseFloat(json.data.rates['USD']));
    } finally {
      setExchangeRateLoading(false);
    }
  };

  useEffect(() => {
    loadExchangeRate();
  }, [activeChain]);

  return (
    <Provider value={{
      exchangeRateLoading,
      exchangeRate,
      loadExchangeRate
    }}>
      {children}
    </Provider>
  );
};

export { ExchangeRateContext, ExchangeRateProvider };
