import { useContext } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  useAccount,
  useDisconnect
} from 'wagmi';
import Button from 'src/components/Button';
import { ModalContext, ModalType } from 'src/hooks/useModal';
import dynamic from 'next/dynamic';
const Address = dynamic(() => import('src/components/Address'), {
  ssr: false
});

const Wallet = () => {
  const { openModal } = useContext(ModalContext);
  const { data: account } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();

  if (router.route === "/accounts/[address]" && router.query.address === account?.address)
    return (
      <Button
        disabled={false}
        label="Disconnect"
        onClick={disconnect}
      />
    );

  if (account?.address)
    return (
      <Link href={`/accounts/${account.address}`}>
        <a>
          <Address address={account.address} showAvatar />
        </a>
      </Link>
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
