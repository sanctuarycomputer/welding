import { useState, createContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import ConnectModal from 'src/components/Modals/Connect';
import SubgraphSwitcherModal from 'src/components/Modals/SubgraphSwitcher';
import TopicConnectorModal, { TopicConnectorMeta } from 'src/components/Modals/TopicConnector';
import TopicMinterModal, { TopicMinterMeta } from 'src/components/Modals/TopicMinter';
import EmojiPickerModal, { EmojiPickerMeta } from 'src/components/Modals/EmojiPicker';
import AddMemberModal, { AddMemberMeta } from 'src/components/Modals/AddMember';
import NodeSettingsModal, { NodeSettingsMeta } from 'src/components/Modals/NodeSettings';

interface IModalContext {
  openModal: (type: ModalType) => void;
  closeModal: () => void;
};

export enum ModalType {
  CONNECT = "CONNECT"
  SUBGRAPH_SWITCHER = "SUBGRAPH_SWITCHER"
  TOPIC_CONNECTOR = "TOPIC_CONNECTOR"
  TOPIC_MINTER = "TOPIC_MINTER"
  EMOJI_PICKER = "EMOJI_PICKER"
  ADD_MEMBER = "ADD_MEMBER"
  NODE_SETTINGS = "NODE_SETTINGS"
};

type CurrentModal = {
  type: ModalType.CONNECT
} | {
  type: ModalType.SUBGRAPH_SWITCHER
} | {
  type: ModalType.TOPIC_CONNECTOR,
  meta: TopicConnectorMeta
} | {
  type: ModalType.TOPIC_MINTER,
  meta: TopicMinterMeta
} | {
  type: ModalType.EMOJI_PICKER,
  meta: EmojiPickerMeta
} | {
  type: ModalType.ADD_MEMBER,
  meta: AddMemberMeta
} | {
  type: ModalType.NODE_SETTINGS,
  meta: NodeSettingsMeta
};

const ModalContext = createContext<IModalContext>();
const { Provider } = ModalContext;

const ModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] =
    useState<boolean>(false);
  const [currentModal, setCurrentModal] =
    useState<CurrentModal | null>(null);

  function openModal(currentModal: CurrentModal) {
    setCurrentModal(currentModal);
    setIsOpen(true);
  };
  function closeModal() {
    setCurrentModal(null);
    setIsOpen(false);
  };

  const { events } = useRouter();
  useEffect(() => {
    events.on('routeChangeComplete', closeModal);
    return () =>
      events.off('routeChangeComplete', closeModal);
  }, [closeModal, events]);

  return (
    <Provider value={{ openModal, closeModal }}>
      {currentModal?.type === ModalType.CONNECT && (
        <ConnectModal
          isOpen
          onRequestClose={closeModal}
        />
      )}
      {currentModal?.type === ModalType.SUBGRAPH_SWITCHER && (
        <SubgraphSwitcherModal
          isOpen
          onRequestClose={closeModal}
        />
      )}
      {currentModal?.type === ModalType.TOPIC_CONNECTOR && (
        <TopicConnectorModal
          isOpen
          onRequestClose={closeModal}
          meta={currentModal.meta}
        />
      )}
      {currentModal?.type === ModalType.TOPIC_MINTER && (
        <TopicMinterModal
          isOpen
          onRequestClose={closeModal}
          meta={currentModal.meta}
        />
      )}
      {currentModal?.type === ModalType.EMOJI_PICKER && (
        <EmojiPickerModal
          isOpen
          onRequestClose={closeModal}
          meta={currentModal.meta}
        />
      )}
      {currentModal?.type === ModalType.ADD_MEMBER && (
        <AddMemberModal
          isOpen
          onRequestClose={closeModal}
          meta={currentModal.meta}
        />
      )}
      {currentModal?.type === ModalType.NODE_SETTINGS && (
        <NodeSettingsModal
          isOpen
          onRequestClose={closeModal}
          meta={currentModal.meta}
        />
      )}
      {children}
    </Provider>
  );
};

export { ModalContext, ModalProvider };
