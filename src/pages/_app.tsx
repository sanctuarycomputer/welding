import 'emoji-mart/css/emoji-mart.css'
import 'src/styles/globals.css';
import 'src/styles/emojimart.css';
import 'src/styles/editor.css';
import 'src/styles/react-tags.css';
import 'src/styles/nprogress.css';

import type { AppProps } from 'next/app';
import Modal from 'react-modal';
import dynamic from 'next/dynamic';
import NProgress from 'nprogress';
import Router from 'next/router';

const Wallet = dynamic(() => import('src/components/Wallet'), {
  ssr: false
});

import { Provider, chain } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { providers } from 'ethers';

NProgress.configure({ showSpinner: false });
Router.events.on('routeChangeStart', (url) => {
  NProgress.start();
});
Router.events.on('routeChangeComplete', () => NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());

Modal.setAppElement('#__next');

const infuraId =
  process.env.NEXT_PUBLIC_INFURA_PROJECT_ID;

const provider = ({ chainId }: { chainId?: number }) =>
  new providers.InfuraProvider(chainId, infuraId);

const chains: Chain[] = [
  //{ ...chain.polygonMainnet, name: 'Polygon' },
  { ...chain.polygonTestnetMumbai, name: 'Mumbai' },
];

const connectors = ({ chainId }) => {
  const rpcUrl =
    chains.find((x) => x.id === chainId)?.rpcUrls?.[0] ??
    chain.mainnet.rpcUrls[0];
  return [
    new InjectedConnector({
      chains,
      options: { shimDisconnect: true },
    }),
    new WalletConnectConnector({
      options: {
        infuraId,
        qrcode: true,
      },
    }),
    new CoinbaseWalletConnector({
      options: {
        appName: 'welding.app',
        jsonRpcUrl: `${rpcUrl}/${infuraId}`,
      },
    }),
  ]
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider
      autoConnect
      connectors={connectors}
      provider={provider}
      connectorStorageKey="welding.app"
    >
      <div className="absolute right-0 top-0 pr-4 py-4">
        <Wallet />
      </div>
      <Component {...pageProps} />
    </Provider>
  );
};

export default MyApp;
