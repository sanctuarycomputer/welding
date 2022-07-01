import { FC, useEffect } from "react";
import Modal from "react-modal";
import ModalHeader from "src/components/Modals/ModalHeader";
import Network from "src/components/Icons/Network";
import Button from "src/components/Button";

import { useNetwork, chain } from "wagmi";

type Props = {
  isOpen: boolean;
  onRequestClose: () => void;
};

const WrongNetwork: FC<Props> = ({ isOpen, onRequestClose }) => {
  const { activeChain, switchNetwork } = useNetwork();

  useEffect(() => {
    if (activeChain) {
      if (activeChain.network === process.env.NEXT_PUBLIC_NETWORK) {
        onRequestClose();
      }
    } else {
      onRequestClose();
    }
  }, [activeChain]);

  const expectedChain = Object.values(chain).find(
    (c) => c.network === process.env.NEXT_PUBLIC_NETWORK
  );

  const hint = expectedChain
    ? `Please select &quot;${expectedChain.name}&quot; in your wallet provider.`
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
            Select &quot;{expectedChain?.name || "correct network"}&quot; to get
            started.
          </p>
        </div>

        <div className="p-4 flex flex-row-reverse justify-between">
          <Button
            label="Switch Network"
            onClick={() => switchNetwork?.(expectedChain?.id)}
            disabled={false}
          />
        </div>
      </div>
    </Modal>
  );
};

export default WrongNetwork;
