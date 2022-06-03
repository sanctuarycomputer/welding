import { FC, useEffect, useContext, useState } from 'react';
import { ModalContext, ModalType } from 'src/hooks/useModal';
import Modal from 'react-modal';
import ModalHeader from 'src/components/Modals/ModalHeader';
import { useAccount } from 'wagmi';

import Data from 'src/components/Icons/Data';
import TeamIcon from 'src/components/Icons/Team';
import History from 'src/components/Icons/History';
import FeeIcon from 'src/components/Icons/Fee';

import Metadata from 'src/components/Metadata';
import Revisions from 'src/components/Revisions';
import Fee from 'src/components/Fee';

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

enum SettingsLevel {
  TEAM = "TEAM",
  HISTORY = "HISTORY",
  METADATA = "METADATA",
  FEE = "FEE",
};

const NodeSettings: FC<Props> = ({
  onRequestClose,
  meta
}) => {
  const { openModal, closeModal } = useContext(ModalContext);
  const { data: account } = useAccount();
  const [level, setLevel] = useState(SettingsLevel.METADATA);

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

        <div className="flex">
          <nav>
            <div
              className={`flex cursor-pointer border-b border-color p-4 ${level === SettingsLevel.METADATA ? 'background-passive-color' : ''}`}
              onClick={() => setLevel(SettingsLevel.METADATA)}
            >
              <Data />
              <p className="pl-2 font-semibold whitespace-nowrap">NFT Metadata</p>
            </div>
            <div
              className={`flex cursor-pointer border-b border-color p-4 ${level === SettingsLevel.TEAM ? 'background-passive-color' : ''}`}
              onClick={() => setLevel(SettingsLevel.TEAM)}
            >
              <TeamIcon />
              <p className="pl-2 font-semibold whitespace-nowrap">Team</p>
            </div>
            <div
              className={`flex cursor-pointer border-b border-color p-4 ${level === SettingsLevel.HISTORY ? 'background-passive-color' : ''}`}
              onClick={() => setLevel(SettingsLevel.HISTORY)}
            >
              <History />
              <p className="pl-2 font-semibold whitespace-nowrap">Revision History</p>
            </div>
            <div
              className={`flex cursor-pointer border-b border-color p-4 ${level === SettingsLevel.FEE ? 'background-passive-color' : ''}`}
              onClick={() => setLevel(SettingsLevel.FEE)}
            >
              <FeeIcon />
              <p className="pl-2 font-semibold whitespace-nowrap">Connection Fee</p>
            </div>
          </nav>

          <div className="border-l border-color grow">
            {level === SettingsLevel.METADATA && (
              <Metadata node={meta.node} />
            )}
            {level === SettingsLevel.TEAM && (
              <Team node={meta.node} currentAddress={account?.address} />
            )}
            {level === SettingsLevel.HISTORY && (
              <Revisions node={meta.node} />
            )}
            {level === SettingsLevel.FEE && (
              <Fee node={meta.node} />
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default NodeSettings;
