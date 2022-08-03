import { FC, useEffect } from "react";
import Modal from "react-modal";
import ModalHeader from "src/components/Modals/ModalHeader";
import Network from "src/components/Icons/Network";
import Button from "src/components/Button";

import { useNetwork, useSwitchNetwork } from "wagmi";
import { targetChain } from "src/pages/_app";

type Props = {
  isOpen: boolean;
  onRequestClose: () => void;
};

const WrongNetwork: FC<Props> = ({ isOpen, onRequestClose }) => {
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork({
    chainId: targetChain.id
  });

  useEffect(() => {
    if (chain) {
      if (chain.network === process.env.NEXT_PUBLIC_NETWORK) {
        onRequestClose();
      }
    } else {
      onRequestClose();
    }
  }, [chain]);

  const hint = targetChain
    ? `Please select "${targetChain.name}" in your wallet provider.`
    : `Please select the correct chain in your wallet provider.`;

  return (
    <Modal isOpen={isOpen} onRequestClose={() => alert(hint)}>
      <div className="h-screen sm:h-auto flex flex-col">
        <ModalHeader
          title="Wrong Network"
          hint={hint}
          onClickClose={() => alert(hint)}
        />

        <div className="py-16 px-4 text-center flex relative flex-grow justify-center items-center flex-col border-b border-color">
          <Network />
          <p className="pt-2 font-semibold">
            Connect to &quot;{targetChain.name || "correct network"}&quot; to
            get started.
          </p>
        </div>

        <div className="p-4 flex flex-row-reverse justify-between">
          <Button
            label="Switch Network"
            onClick={() => switchNetwork?.(targetChain.id)}
            disabled={false}
          />
        </div>
      </div>
    </Modal>
  );
};

export default WrongNetwork;
