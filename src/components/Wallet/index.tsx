import { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  useAccount,
  useSigner,
  useDisconnect,
  useNetwork
} from 'wagmi';

import Button from 'src/components/Button';
import { NavContext } from 'src/hooks/useNav';
import { ModalContext, ModalType } from 'src/hooks/useModal';
import dynamic from 'next/dynamic';
const Address = dynamic(() => import('src/components/Address'), {
  ssr: false
});

const Wallet = () => {
  const { openModal } = useContext(ModalContext);
  const { content } = useContext(NavContext);
  const { data: account } = useAccount();
  const { data: signer } = useSigner();
  const { activeChain } = useNetwork();

  const { disconnect } = useDisconnect();
  const router = useRouter();

  useEffect(() => {
    if (
      activeChain &&
      activeChain.network !== process.env.NEXT_PUBLIC_NETWORK
    ) {
      openModal({ type: ModalType.WRONG_NETWORK });
    }
  }, [activeChain]);

  if (
    router.route === "/accounts/[address]" &&
    router.query.address === account?.address
  )
    return (
      <>
        {content}
        <Button
          disabled={false}
          label="Disconnect"
          onClick={disconnect}
        />
      </>
    );

  if (account?.address)
    return (
      <>
        {content}
        <Link href={`/accounts/${account.address}`}>
          <a>
            <Address address={account.address} showAvatar />
          </a>
        </Link>
      </>
    );

  return (
    <Button
      disabled={false}
      label="Connect"
      onClick={() => openModal({ type: ModalType.CONNECT })}
    />
  );
}

export default Wallet;
