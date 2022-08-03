import "emoji-mart/css/emoji-mart.css";
import "src/styles/globals.css";
import "src/styles/emojimart.css";
import "src/styles/editor.css";
import "src/styles/react-tags.css";
import "src/styles/nprogress.css";
import "src/styles/react-modal.css";

import type { AppProps } from "next/app";
import Modal from "react-modal";
import dynamic from "next/dynamic";
import NProgress from "nprogress";
import Router from "next/router";
import { ExchangeRateProvider } from "src/hooks/useExchangeRates";
import { GraphProvider } from "src/hooks/useGraphData";
import { ModalProvider } from "src/hooks/useModal";
import { NavProvider } from "src/hooks/useNav";
import { Toaster } from "react-hot-toast";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import ErrorBoundary from "src/components/ErrorBoundary";
import event from "src/utils/event";
import { ConnectKitProvider } from "connectkit";
import { Buffer } from "buffer";

import { WagmiConfig, chain, createClient, configureChains } from "wagmi";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import { CoinbaseWalletConnector } from "wagmi/connectors/coinbaseWallet";

const Wallet = dynamic(() => import("src/components/Wallet"), {
  ssr: false,
});
const Info = dynamic(() => import("src/components/Info"), {
  ssr: false,
});

if (typeof window !== "undefined") {
  if (!window.Buffer) window.Buffer = Buffer;
  event("Page View", { pathname: window.location.pathname });
}
NProgress.configure({ showSpinner: false });
Router.events.on("routeChangeStart", () => {
  NProgress.start();
});
Router.events.on("routeChangeComplete", (pathname) => {
  event("Page View", { pathname });
  NProgress.done();
});
Router.events.on("routeChangeError", () => NProgress.done());

Modal.setAppElement("#__next");

export const targetChain =
  Object.values(chain).find(
    (c) => c.network === process.env.NEXT_PUBLIC_NETWORK
  ) || chain.polygon;

const { chains, provider, webSocketProvider } = configureChains(
  [targetChain, chain.mainnet],
  [
    alchemyProvider({
      apiKey: process.env.NEXT_PUBLIC_ALCHEMY_PROJECT_ID,
    }),
    publicProvider(),
  ]
);

const client = createClient({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: "welding.app",
      },
    }),
    new WalletConnectConnector({
      chains,
      options: {
        qrcode: false,
      },
    }),
  ],
  provider,
  webSocketProvider,
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig client={client}>
      <ConnectKitProvider customTheme={{
        "--ck-border-radius": "4px",
      }}>
        <ExchangeRateProvider>
          <GraphProvider>
            <DndProvider backend={HTML5Backend}>
              <ModalProvider>
                <NavProvider>
                  <ErrorBoundary>
                    <div className="absolute right-0 top-0 pr-2 md:pr-4 py-3 md:py-4 flex">
                      <Wallet />
                    </div>
                    <Component {...pageProps} />
                    <Toaster />
                    <Info />
                  </ErrorBoundary>
                </NavProvider>
              </ModalProvider>
            </DndProvider>
          </GraphProvider>
        </ExchangeRateProvider>
      </ConnectKitProvider>
    </WagmiConfig>
  );
}

export default MyApp;
