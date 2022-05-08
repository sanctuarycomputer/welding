import { FC, useEffect, useContext } from 'react';
import { ModalContext, ModalType } from 'src/hooks/useModal';
import Modal from 'react-modal';
import ModalHeader from 'src/components/Modals/ModalHeader';
import { useAccount } from 'wagmi';

import dynamic from 'next/dynamic';
const Team = dynamic(() => import('src/components/Team'), {
  ssr: false
});

export type NodeSettingsMeta = {
  topic: BaseNode;
  canEdit: boolean;
};

type Props = {
  onRequestClose: Function;
  meta: NodeSettingsMeta;
};

const NodeSettings: FC<Props> = ({
  onRequestClose,
  meta
}) => {
  const { openModal, closeModal } = useContext(ModalContext);
  const { data: account } = useAccount();

  return (
    <Modal
      isOpen={true}
      onRequestClose={() => onRequestClose()}
    >
      <div className="h-screen sm:h-auto flex flex-col">
        <ModalHeader
          title="Settings"
          hint="Update the settings for this Node"
          onClickClose={() => onRequestClose()}
        />

        <div className="flex flex-grow justify-between items-center py-2 px-4">
          <p className="font-semibold">Connections</p>
        </div>

        <table className="table-auto w-full">
          <tbody>
            <tr className="border-t border-b border-color">
              <td className="p-4">
                <p>
                  ↙ {meta.node.backlinks.length} Backlinks
                </p>
              </td>
              <td className="p-4 text-right">
                <p>
                  {meta.node.connections.length} Connections ↗
                </p>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="flex flex-grow justify-between items-center py-2 px-4">
          <p className="font-semibold">NFT Metadata</p>
        </div>

        <table className="table-auto w-full">
          <tbody>
            <tr className="border-t border-b border-color">
              <td className="p-4">
                <p>ERC721 Contract Address</p>
              </td>
              <td className="p-4 text-right">
                <p>{process.env.NEXT_PUBLIC_NODE_ADDRESS}</p>
              </td>
            </tr>
            <tr className="border-t border-b border-color">
              <td className="p-4">
                <p>Token ID</p>
              </td>
              <td className="p-4 text-right">
                <p>{meta.node.tokenId}</p>
              </td>
            </tr>
            <tr className="border-t border-b border-color">
              <td className="p-4">
                <p>IPFS Revision Hash</p>
              </td>
              <td className="p-4 text-right">
                <p>{meta.node.currentRevision.hash}</p>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="flex flex-grow justify-between items-center py-2 px-4">
          <p className="font-semibold">Team</p>
          {meta.canEdit && (
            <p className="cursor-pointer" onClick={() => openModal({
              type: ModalType.ADD_MEMBER,
              meta: {
                node: meta.node,
                back: () => {
                  openModal({
                    type: ModalType.NODE_SETTINGS,
                    meta: {
                      canEdit: true,
                      node: meta.node
                    }
                  })
                }
              }
            })}>+ Add Member</p>
          )}
        </div>

        <Team node={meta.node} currentAddress={account?.address} />

        <div className="p-4 flex flex-row-reverse justify-between">
          <p>hi</p>
        </div>
      </div>
    </Modal>
  );
};

export default NodeSettings;
