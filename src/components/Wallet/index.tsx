import { useState } from 'react';
import {
  useConnect,
  useAccount,
  useDisconnect,
  useEnsAvatar,
  useEnsName
} from 'wagmi';
import Button from 'src/components/Button';
import Modal from 'react-modal';

const truncateAddress = (address: string) =>
  `${address.substring(0, 6)}...`;

const Wallet = () => {
  const [connectModalIsOpen, setConnectModalIsOpen] =
    useState(false);
  const [accountModalIsOpen, setAccountModalIsOpen] =
    useState(false);

  const { connect, connectors, error } = useConnect();
  const { data: account } = useAccount();
  const { data: ensAvatar } = useEnsAvatar({ addressOrName: account?.address });
  const { data: ensName } = useEnsName({ address: account?.address });
  const { disconnect } = useDisconnect();

  const closeModal = () => setConnectModalIsOpen(false);
  const openModal = () => setConnectModalIsOpen(true);

  const closeAccountModal = () => setAccountModalIsOpen(false);
  const openAccountModal = () => setAccountModalIsOpen(true);

  if (account) {
    return (
      <>
        <Modal
          isOpen={accountModalIsOpen}
          onRequestClose={closeAccountModal}
          contentLabel="Account Modal"
        >
          <div className="flex p-4 border-b border-color">
            <div>
              <h2>Account</h2>
              <p>
                Connect topics to improve discoverability for this Node.
                <br />
                Selected topics that do not exist will be minted.
              </p>
            </div>
            <span
              onClick={closeAccountModal}
              className="cursor-pointer flex items-center pl-8">
              ✕
            </span>
          </div>

          <div>
            <div className="flex p-4 justify-between flex-row items-center">
              <p>Why mint a topic?</p>
              <Button
                disabled={false}
                label="Disconnect"
                onClick={disconnect}
              />
            </div>
          </div>
        </Modal>

        <div onClick={openAccountModal} className="cursor-pointer rounded-full background-text-color flex pl-1 py-1">
          {ensAvatar
            ? <img src={ensAvatar} alt="ENS Avatar" />
            : <div className="aspect-square w-4 background-color rounded-full inline-block"></div>}
          <p className="ml-1 text-background-color font-semibold inline-block pr-2">
            {ensName
              ? ensName
              : truncateAddress(account.address || 'null')}
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      <Modal
        isOpen={connectModalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Confirm Modal"
      >
        <div className="flex p-4 border-b border-color">
          <div>
            <h2>Connect Wallet</h2>
            <p>
              Connect topics to improve discoverability for this Node.
              <br />
              Selected topics that don not exist will be minted.
            </p>
          </div>
          <span
            onClick={closeModal}
            className="cursor-pointer flex items-center pl-8">
            ✕
          </span>
        </div>

        <div>
          {connectors.map(connector =>
            <div
              onClick={() => connect(connector)}
              key={connector.id} className="cursor-pointer flex relative p-4 justify-between items-center flex-row border-b border-color">
              <div className="flex flex-row items-center py-1 flex-grow">
                <p className="pr-2 font-semibold w-32 truncate">
                  {connector.name}
                  {!connector.ready && ' (unsupported)'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="flex p-4 justify-between flex-row items-center">
            <p>{error && (error?.message ?? 'Failed to connect')}</p>
            <Button
              label="Cancel"
              disabled={false}
              onClick={closeModal}
            />
          </div>
        </div>
      </Modal>

      <Button
        disabled={false}
        label="Connect"
        onClick={openModal}
      />
    </>
  );
}

export default Wallet;
