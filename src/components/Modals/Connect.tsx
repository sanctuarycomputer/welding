import { FC, useEffect, useContext } from "react";
import { ModalContext } from "src/hooks/useModal";
import Modal from "react-modal";
import ModalHeader from "src/components/Modals/ModalHeader";
import Wallet from "src/components/Icons/Wallet";
import Button from "src/components/Button";

import { useConnect, useAccount } from "wagmi";

type Props = {
  isOpen: boolean;
  onRequestClose: () => void;
};

const Connect: FC<Props> = ({ isOpen, onRequestClose }) => {
  const { closeModal } = useContext(ModalContext);
  const { connect, connectors, error } = useConnect();
  const { address } = useAccount();

  useEffect(() => {
    if (address) closeModal();
  }, [address, closeModal]);

  return (
    <Modal isOpen={isOpen} onRequestClose={() => onRequestClose()}>
      <div className="h-screen sm:h-auto flex flex-col">
        <ModalHeader
          title="Connect"
          hint="Connect a provider."
          onClickClose={() => onRequestClose()}
        />

        <div>
          {connectors
            .filter((c) => c.ready)
            .map((connector) => (
              <div
                onClick={() => connect({ connector })}
                key={connector.id}
                className="cursor-pointer flex relative p-4 justify-between items-center flex-row border-b border-color"
              >
                <div className="flex flex-row items-center py-1 flex-grow">
                  <p className="pr-2 font-semibold w-32 truncate">
                    {connector.name}
                  </p>
                </div>
              </div>
            ))}
        </div>

        <div className="py-16 px-4 text-center flex relative flex-grow justify-center items-center flex-col border-b border-color">
          <Wallet />
          <p className="pt-2 font-semibold">
            Connect a provider to get started.
          </p>
        </div>

        <div className="p-4 flex flex-row-reverse justify-between items-center">
          <Button
            label="Cancel"
            onClick={() => onRequestClose()}
            disabled={false}
          />
          <p className="text-red-500 font-semibold">
            {error && (error?.message ?? "Failed to connect")}
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default Connect;
