import { FC, useState } from "react";
import Modal from "react-modal";
import ModalHeader from "src/components/Modals/ModalHeader";
import { useAccount } from "wagmi";

import Data from "src/components/Icons/Data";
import TeamIcon from "src/components/Icons/Team";
import History from "src/components/Icons/History";
import FeeIcon from "src/components/Icons/Fee";
import BurnIcon from "src/components/Icons/Burn";
import Network from "src/components/Icons/Network";

import Metadata from "src/components/Metadata";
import Revisions from "src/components/Revisions";
import Fee from "src/components/Fee";
import Team from "src/components/Team";
import Burn from "src/components/Burn";
import { bgPassive } from "src/utils/theme";
import { BaseNode } from "src/types";
import Button from "src/components/Button";

export type NodeSettingsMeta = {
  node: BaseNode;
  canEdit: boolean;
  reloadData: () => void;
};

type Props = {
  isOpen: boolean;
  onRequestClose: () => void;
  meta: NodeSettingsMeta;
};

enum SettingsLevel {
  TEAM = "TEAM",
  HISTORY = "HISTORY",
  METADATA = "METADATA",
  FEE = "FEE",
  BURN = "BURN",
}

const NodeSettings: FC<Props> = ({ onRequestClose, meta }) => {
  const { address } = useAccount();
  const [level, setLevel] = useState(SettingsLevel.METADATA);
  const [locked, setLocked] = useState(false);

  const attemptClose = () => {
    if (locked) return alert("Working, please wait.");
    onRequestClose();
  };

  if (meta.node.labels.includes("DummyNode")) {
    return (
      <Modal isOpen={true} onRequestClose={attemptClose}>
        <div className="h-screen sm:h-auto flex flex-col">
          <ModalHeader
            title="Settings"
            hint="Update the settings for this Node"
            onClickClose={attemptClose}
          />
        </div>

        <div className="flex">
          <nav>
            <div
              style={{ height: "55px" }}
              className={`flex border-b border-color p-4 ${
                level === SettingsLevel.METADATA ? bgPassive : ""
              } ${locked ? "cursor-progress" : "cursor-pointer"}`}
              onClick={() => !locked && setLevel(SettingsLevel.METADATA)}
            >
              <Data />
              <p className="pl-2 font-semibold whitespace-nowrap hidden sm:block">
                Metadata
              </p>
            </div>
            <div
              style={{ height: "55px" }}
              className={`flex border-b border-color p-4 ${
                level === SettingsLevel.BURN ? bgPassive : ""
              } ${locked ? "cursor-progress" : "cursor-pointer"}`}
              onClick={() => !locked && setLevel(SettingsLevel.BURN)}
            >
              <BurnIcon />
              <p className="pl-2 font-semibold whitespace-nowrap hidden sm:block">
                Burn
              </p>
            </div>
          </nav>

          <div className="border-l border-color grow">
            {level === SettingsLevel.METADATA && <Metadata node={meta.node} />}
            {level === SettingsLevel.BURN && (
              <Burn node={meta.node} setLocked={setLocked} />
            )}
          </div>

        </div>
      </Modal>
    );
  }

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
              style={{ height: "55px" }}
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
              style={{ height: "55px" }}
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
              style={{ height: "55px" }}
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
              style={{ height: "55px" }}
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
            <div
              style={{ height: "55px" }}
              className={`flex border-b border-color p-4 ${
                level === SettingsLevel.BURN ? bgPassive : ""
              } ${locked ? "cursor-progress" : "cursor-pointer"}`}
              onClick={() => !locked && setLevel(SettingsLevel.BURN)}
            >
              <BurnIcon />
              <p className="pl-2 font-semibold whitespace-nowrap hidden sm:block">
                Burn
              </p>
            </div>
          </nav>

          <div className="border-l border-color grow">
            {level === SettingsLevel.METADATA && <Metadata node={meta.node} />}
            {level === SettingsLevel.TEAM && (
              <Team
                node={meta.node}
                currentAddress={address || ""}
                setLocked={setLocked}
                reloadData={meta.reloadData}
              />
            )}
            {level === SettingsLevel.HISTORY && <Revisions node={meta.node} />}
            {level === SettingsLevel.FEE && (
              <Fee node={meta.node} setLocked={setLocked} />
            )}
            {level === SettingsLevel.BURN && (
              <Burn node={meta.node} setLocked={setLocked} />
            )}
          </div>
        </div>

        <div className="flex relative flex-grow justify-center items-center flex-col border-t sm:hidden"></div>
      </div>
    </Modal>
  );
};

export default NodeSettings;
