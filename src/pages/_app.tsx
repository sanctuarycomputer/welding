import 'emoji-mart/css/emoji-mart.css'
import 'src/styles/globals.css';
import 'src/styles/emojimart.css';
import 'src/styles/editor.css';
import 'src/styles/react-tags.css';
import 'src/styles/nprogress.css';

import Head from 'next/head';
import type { AppProps } from 'next/app';
import Modal from 'react-modal';
//import dynamic from 'next/dynamic';
import NProgress from 'nprogress';
import Router from 'next/router';

import { Provider, chain, createClient } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { providers } from 'ethers';

//const Wallet = dynamic(() => import('src/components/Wallet'), {
//  ssr: false
//});

NProgress.configure({ showSpinner: false });
Router.events.on('routeChangeStart', (url) => {
  NProgress.start();
});
Router.events.on('routeChangeComplete', () => NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());

Modal.setAppElement('#__next');

const infuraId =
  process.env.NEXT_PUBLIC_INFURA_PROJECT_ID;

const chains = [chain.polygon, chain.polygonMumbai];
const defaultChain = chains[0];

//const connectors = ({ chainId }) => {
//  const rpcUrl =
//    chains.find((x) => x.id === chainId)?.rpcUrls?.[0] ??
//    chain.mainnet.rpcUrls[0];
//  return [
//    new InjectedConnector({
//      chains,
//      options: { shimDisconnect: true },
//    }),
//    new WalletConnectConnector({
//      options: {
//        infuraId,
//        qrcode: true,
//      },
//    }),
//    new CoinbaseWalletConnector({
//      options: {
//        appName: 'welding.app',
//        jsonRpcUrl: `${rpcUrl}/${infuraId}`,
//      },
//    }),
//  ]
//}

const client = createClient({
  autoConnect: true,
  connectors({ chainId }) {
    const chain = chains.find((x) => x.id === chainId) ?? defaultChain;
    const rpcUrl =
      chains.find((x) => x.id === chainId)?.rpcUrls?.[0] ??
      defaultChain.rpcUrls[0];
    return [
      new InjectedConnector({ chains }),
      new CoinbaseWalletConnector({
        chains,
        options: {
          appName: 'welding.xyz',
          chainId: chain.id,
          jsonRpcUrl: `${rpcUrl}/${infuraId}`,
        },
      }),
      new WalletConnectConnector({
        chains,
        options: {
          infuraId,
          qrcode: true,
          rpc: {
            [chain.id]: rpcUrl,
          },
        },
      }),
    ]
  },
  provider({ chainId }) {
    return new providers.InfuraProvider(chainId, infuraId);
  },
  //webSocketProvider({ chainId }) {
  //  return new providers.AlchemyWebSocketProvider(
  //    isChainSupported(chainId) ? chainId : defaultChain.id,
  //    alchemyId,
  //  )
  //},
})

const title = `Welding • knowledge is valuable`;
const description = `
There was only one problem. What was now identified as the most valuable aspect of a commodity was also – technically, at least – capable of infinite replication at near zero cost: once the cost of creating a new set of instructions has been incurred the instructions can be used over and over again at no additional cost. Developing new and better instructions is equivalent to incurring a fixed cost.’ Romer made no mention of the hacker movement, but this was starting to sound remarkably similar to Stewart Brand’s conclusion that ‘information wants to be free’ some six years earlier. — Aaron Bastini
`;
const image = `https://www.welding.app/share.jpg`;

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider client={client}>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} key="title" />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />
        <meta property="og:site_name" content={title} />
        <meta property="og:locale" content="en_US" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
        <meta name="twitter:site" content="@welding_app" />
        <meta name="twitter:creator" content="@welding_app" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      {/*<div className="absolute right-0 top-0 pr-4 py-4"><Wallet /></div>*/}
      <Component {...pageProps} />
    </Provider>
  );
};

export default MyApp;
