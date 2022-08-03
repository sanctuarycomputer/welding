import { useState, useEffect, createContext } from "react";
import { useNetwork } from "wagmi";

interface IExchangeRateContext {
  exchangeRate: number | null;
  exchangeRateLoading: boolean;
  loadExchangeRate: () => void;
}

const ExchangeRateContext = createContext<IExchangeRateContext>({
  exchangeRate: null,
  exchangeRateLoading: true,
  loadExchangeRate: () => undefined,
});
const { Provider } = ExchangeRateContext;

function ExchangeRateProvider({ children }) {
  const { chain } = useNetwork();

  const [exchangeRateLoading, setExchangeRateLoading] =
    useState<boolean>(false);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  const loadExchangeRate = async () => {
    if (!chain?.nativeCurrency?.symbol) return;
    const { symbol } = chain.nativeCurrency;
    setExchangeRateLoading(true);
    try {
      const response = await fetch(
        `https://api.coinbase.com/v2/exchange-rates?currency=${symbol}`
      );
      const json = await response.json();
      setExchangeRate(parseFloat(json.data.rates["USD"]));
    } finally {
      setExchangeRateLoading(false);
    }
  };

  useEffect(() => {
    loadExchangeRate();
  }, [chain]);

  return (
    <Provider
      value={{
        exchangeRateLoading,
        exchangeRate,
        loadExchangeRate,
      }}
    >
      {children}
    </Provider>
  );
}

export { ExchangeRateContext, ExchangeRateProvider };
