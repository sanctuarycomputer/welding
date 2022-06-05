import { FC } from 'react';
import { useEnsAvatar, useEnsName } from 'wagmi';
import truncate from 'src/utils/truncate';
import toast from 'react-hot-toast';
import Copy from 'src/components/Icons/Copy';
import Avatar from 'src/components/Avatar';

type Props = {
  address: string;
  showAvatar?: boolean;
  copyToClipboard?: boolean;
};

async function copyTextToClipboard(text: string) {
  if (!navigator.clipboard) return toast.error('Could not copy');
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied address.', {
      position: 'bottom-right',
      className: 'toast'
    });
  } catch(e) {
    toast.error('Could not copy', {
      position: 'bottom-right',
      className: 'toast'
    });
  }
};

const Address: FC<Props> = ({
  address,
  showAvatar,
  copyToClipboard
}) => {
  const { data: ensName } = useEnsName({
    address: address,
    chainId: 1
  });

  return (
    <div className="flex items-center">
      <div
        className="rounded-full background-text-color flex pl-1 py-1 w-fit"
      >
        {showAvatar && <Avatar address={address} />}

        <p className="ml-1 text-background-color font-semibold inline-block pr-2">
          {ensName
            ? (<><span className="border-r border-color pr-1 mr-1">{ensName}</span><span>{truncate(address || 'null', 6)}</span></>)
            : truncate(address || 'null', 6)}
        </p>
      </div>

      {copyToClipboard && (
        <div
          onClick={() => copyTextToClipboard(address)}
          className="aspect-square w-4 background-color rounded-full inline-block ml-2 cursor-pointer">
          <Copy />
        </div>
      )}
    </div>
  )
};

export default Address;
