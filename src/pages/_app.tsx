import 'scripts/wdyr';
import 'emoji-mart/css/emoji-mart.css'
import 'src/styles/globals.css';
import 'src/styles/emojimart.css';
import 'src/styles/editor.css';
import 'src/styles/react-tags.css';
import 'src/styles/nprogress.css';
import 'src/styles/react-modal.css';

import type { AppProps } from 'next/app';
import Modal from 'react-modal';
import dynamic from 'next/dynamic';
import NProgress from 'nprogress';
import Router from 'next/router';
import { ExchangeRateProvider } from 'src/hooks/useExchangeRates';
import { GraphProvider } from 'src/hooks/useGraphData';
import { ModalProvider } from 'src/hooks/useModal';
import { NavProvider } from 'src/hooks/useNav';
import { Toaster } from 'react-hot-toast';

import {
  WagmiConfig,
  chain,
  createClient,
  configureChains,
} from 'wagmi';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';

const Wallet = dynamic(() => import('src/components/Wallet'), {
  ssr: false
});

NProgress.configure({ showSpinner: false });
Router.events.on('routeChangeStart', (url) => {
  NProgress.start();
});
Router.events.on('routeChangeComplete', () => NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());

Modal.setAppElement('#__next');

const alchemyId = process.env.NEXT_PUBLIC_ALCHEMY_PROJECT_ID;
const { chains, provider, webSocketProvider } = configureChains(
  [chain.polygonMumbai, chain.mainnet],
  [alchemyProvider({ alchemyId }), publicProvider()],
);

const client = createClient({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: 'welding.app',
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
          <ModalProvider>
            <NavProvider>
              <div
                className="absolute right-0 top-0 pr-2 md:pr-4 py-3 md:py-4 flex">
                <Wallet />
              </div>
              <Component {...pageProps} />
              <Toaster />
            </NavProvider>
          </ModalProvider>
        </GraphProvider>
      </ExchangeRateProvider>
    </WagmiConfig>
  );
};

export default MyApp;
