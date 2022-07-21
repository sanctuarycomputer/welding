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
import Link from "next/link";
import { bg, bgHover } from "src/utils/theme";

import { WagmiConfig, chain, createClient, configureChains } from "wagmi";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import { CoinbaseWalletConnector } from "wagmi/connectors/coinbaseWallet";

const Wallet = dynamic(() => import("src/components/Wallet"), {
  ssr: false,
});

NProgress.configure({ showSpinner: false });
Router.events.on("routeChangeStart", () => {
  NProgress.start();
});
Router.events.on("routeChangeComplete", () => NProgress.done());
Router.events.on("routeChangeError", () => NProgress.done());

Modal.setAppElement("#__next");

const targetChain =
  Object.values(chain).find(
    (c) => c.network === process.env.NEXT_PUBLIC_NETWORK
  ) || chain.polygon;
const { chains, provider, webSocketProvider } = configureChains(
  [targetChain, chain.mainnet],
  [
    alchemyProvider({
      alchemyId: process.env.NEXT_PUBLIC_ALCHEMY_PROJECT_ID,
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
        qrcode: true,
      },
    }),
  ],
  provider,
  webSocketProvider,
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig client={client}>
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

                  <div className="fixed bottom-0 right-0 bg-yellow-400 flex rounded-full pl-2 pr-1 py-1 mb-4 mr-12">
                    <p className="text-stone-800 mr-1 font-medium">
                      10x beta subgraphs remaining.
                    </p>
                    <Link href="/mint">
                      <a>
                        <p className="rounded-full bg-stone-800 px-2 font-medium">
                          Join Beta
                        </p>
                      </a>
                    </Link>
                  </div>

                  <Link href="/">
                    <a
                      className={`${bg} ${bgHover} z-10 fixed bottom-0 right-0 aspect-square border rounded-full mr-2 mb-2 sm:mr-4 sm:mb-4 w-6 h-6 flex items-center justify-center`}
                    >
                      <p className="font-semibold">?</p>
                    </a>
                  </Link>
                </ErrorBoundary>
              </NavProvider>
            </ModalProvider>
          </DndProvider>
        </GraphProvider>
      </ExchangeRateProvider>
    </WagmiConfig>
  );
}

export default MyApp;
