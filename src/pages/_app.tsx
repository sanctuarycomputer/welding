import 'emoji-mart/css/emoji-mart.css'
import '@rainbow-me/rainbowkit/styles.css';

import 'src/styles/globals.css';
import 'src/styles/emojimart.css';
import 'src/styles/editor.css';

import type { AppProps } from 'next/app';
import Modal from 'react-modal';

import {
  RainbowKitProvider,
  Chain,
  getDefaultWallets,
  connectorsForWallets,
  ConnectButton,
  lightTheme,
  darkTheme,
  midnightTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider, chain } from 'wagmi';
import { providers } from 'ethers';

Modal.setAppElement('#__next');

const infuraId = process.env.NEXT_PUBLIC_INFURA_PROJECT_ID;

const provider = ({ chainId }: { chainId?: number }) =>
  new providers.InfuraProvider(chainId, infuraId);

const chains: Chain[] = [
  { ...chain.polygonMainnet, name: 'Polygon' },
  { ...chain.polygonTestnetMumbai, name: 'Mumbai' },
];

const wallets = getDefaultWallets({
  chains,
  infuraId,
  appName: 'welding.app',
  jsonRpcUrl: ({ chainId }) =>
    chains.find(x => x.id === chainId)?.rpcUrls?.[0] ??
    chain.mainnet.rpcUrls[0],
});

const connectors = connectorsForWallets(wallets);

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <RainbowKitProvider
      chains={chains}
      theme={{
        lightMode: lightTheme(),
        darkMode: darkTheme()
      }}>
      <WagmiProvider autoConnect connectors={connectors} provider={provider}>
        <div className="m-2 absolute right-0 top-0">
          <ConnectButton />
        </div>
        <Component {...pageProps} />
      </WagmiProvider>
    </RainbowKitProvider>
  );
};

export default MyApp;
