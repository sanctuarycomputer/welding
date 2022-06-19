import { FC, useContext, useState } from "react";
import { ModalContext } from "src/hooks/useModal";
import Modal from "react-modal";
import ModalHeader from "src/components/Modals/ModalHeader";
import { useAccount } from "wagmi";

import Data from "src/components/Icons/Data";
import TeamIcon from "src/components/Icons/Team";
import History from "src/components/Icons/History";
import FeeIcon from "src/components/Icons/Fee";

import Metadata from "src/components/Metadata";
import Revisions from "src/components/Revisions";
import Fee from "src/components/Fee";
import Team from "src/components/Team";
import { bgPassive } from "src/utils/theme";

export type NodeSettingsMeta = {
  node: BaseNode;
  canEdit: boolean;
  reloadData: Function;
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
}

const NodeSettings: FC<Props> = ({ onRequestClose, meta }) => {
  const { openModal, closeModal } = useContext(ModalContext);
  const { data: account } = useAccount();
  const [level, setLevel] = useState(SettingsLevel.METADATA);
  const [locked, setLocked] = useState(false);

  const attemptClose = () => {
    if (locked) return alert("Working, please wait.");
    onRequestClose();
  };

  return (
    <Modal isOpen={true} onRequestClose={attemptClose}>
      <div className="h-screen sm:h-auto flex flex-col">
        <ModalHeader
          title="Settings"
          hint="Update the settings for this Node"
          onClickClose={attemptClose}
        />

        <div className="flex">
          <nav>
            <div
              className={`flex border-b border-color p-4 ${
                level === SettingsLevel.METADATA ? bgPassive : ""
              } ${locked ? "cursor-progress" : "cursor-pointer"}`}
              onClick={() => !locked && setLevel(SettingsLevel.METADATA)}
            >
              <Data />
              <p className="pl-2 font-semibold whitespace-nowrap hidden sm:block">
                NFT Metadata
              </p>
            </div>
            <div
              className={`flex border-b border-color p-4 ${
                level === SettingsLevel.TEAM ? bgPassive : ""
              } ${locked ? "cursor-progress" : "cursor-pointer"}`}
              onClick={() => !locked && setLevel(SettingsLevel.TEAM)}
            >
              <TeamIcon />
              <p className="pl-2 font-semibold whitespace-nowrap hidden sm:block">
                Permissions
              </p>
            </div>
            <div
              className={`flex border-b border-color p-4 ${
                level === SettingsLevel.HISTORY ? bgPassive : ""
              } ${locked ? "cursor-progress" : "cursor-pointer"}`}
              onClick={() => !locked && setLevel(SettingsLevel.HISTORY)}
            >
              <History />
              <p className="pl-2 font-semibold whitespace-nowrap hidden sm:block">
                Revision History
              </p>
            </div>
            <div
              className={`flex border-b border-color p-4 ${
                level === SettingsLevel.FEE ? bgPassive : ""
              } ${locked ? "cursor-progress" : "cursor-pointer"}`}
              onClick={() => !locked && setLevel(SettingsLevel.FEE)}
            >
              <FeeIcon />
              <p className="pl-2 font-semibold whitespace-nowrap hidden sm:block">
                Connection Fee
              </p>
            </div>
          </nav>

          <div className="border-l border-color grow">
            {level === SettingsLevel.METADATA && <Metadata node={meta.node} />}
            {level === SettingsLevel.TEAM && (
              <Team
                node={meta.node}
                currentAddress={account?.address}
                setLocked={setLocked}
                reloadData={meta.reloadData}
              />
            )}
            {level === SettingsLevel.HISTORY && <Revisions node={meta.node} />}
            {level === SettingsLevel.FEE && (
              <Fee
                node={meta.node}
                setLocked={setLocked}
                reloadData={meta.reloadData}
              />
            )}
          </div>
        </div>

        <div className="flex relative flex-grow justify-center items-center flex-col border-t sm:hidden"></div>
      </div>
    </Modal>
  );
};

export default NodeSettings;