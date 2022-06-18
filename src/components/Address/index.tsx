import { FC } from "react";
import { useEnsName } from "wagmi";
import truncate from "src/utils/truncate";
import toast from "react-hot-toast";
import Copy from "src/components/Icons/Copy";
import Avatar from "src/components/Avatar";
import { bg, bgInverted, textInverted } from "src/utils/theme";

type Props = {
  address: string;
  showAvatar?: boolean;
  copyToClipboard?: boolean;
};

async function copyTextToClipboard(text: string) {
  if (!navigator.clipboard) return toast.error("Could not copy");
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied address.", {
      className: "toast",
    });
  } catch (e) {
    toast.error("Could not copy", {
      className: "toast",
    });
  }
}

const Address: FC<Props> = ({ address, showAvatar, copyToClipboard }) => {
  const { data: ensName } = useEnsName({
    address: address,
    chainId: 1,
  });
  return (
    <div className="flex items-center">
      <div className={`${bgInverted} rounded-full flex pl-1 py-1 w-fit`}>
        {showAvatar && <Avatar address={address} />}
        <p className={`${textInverted} ml-1 font-semibold inline-block pr-2`}>
          {ensName ? ensName : truncate(address || "null", 6)}
        </p>
      </div>
      {copyToClipboard && (
        <div
          onClick={() => copyTextToClipboard(address)}
          className={`${bg} aspect-square w-4 rounded-full inline-block ml-2 cursor-pointer`}
        >
          <Copy />
        </div>
      )}
    </div>
  );
};

export default Address;
