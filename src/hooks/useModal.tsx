import { useState, createContext, useEffect } from "react";
import { useRouter } from "next/router";
import ConnectModal from "src/components/Modals/Connect";
import WrongNetworkModal from "src/components/Modals/WrongNetwork";
import TopicConnectorModal, {
  TopicConnectorMeta,
} from "src/components/Modals/TopicConnector";
import TopicMinterModal, {
  TopicMinterMeta,
} from "src/components/Modals/TopicMinter";
import EmojiPickerModal, {
  EmojiPickerMeta,
} from "src/components/Modals/EmojiPicker";
import NodeSettingsModal, {
  NodeSettingsMeta,
} from "src/components/Modals/NodeSettings";
import PublisherModal, { PublisherMeta } from "src/components/Modals/Publisher";

interface IModalContext {
  openModal: (type: ModalType) => void;
  closeModal: () => void;
}

export enum ModalType {
  CONNECT = "CONNECT",
  WRONG_NETWORK = "WRONG_NETWORK",
  TOPIC_CONNECTOR = "TOPIC_CONNECTOR",
  TOPIC_MINTER = "TOPIC_MINTER",
  EMOJI_PICKER = "EMOJI_PICKER",
  NODE_SETTINGS = "NODE_SETTINGS",
  PUBLISHER = "PUBLISHER",
  SUBGRAPH_CONNECTOR = "SUBGRAPH_CONNECTOR",
}

type CurrentModal =
  | {
      type: ModalType.CONNECT;
    }
  | {
      type: ModalType.WRONG_NETWORK;
    }
  | {
      type: ModalType.TOPIC_CONNECTOR;
      meta: TopicConnectorMeta;
    }
  | {
      type: ModalType.TOPIC_MINTER;
      meta: TopicMinterMeta;
    }
  | {
      type: ModalType.EMOJI_PICKER;
      meta: EmojiPickerMeta;
    }
  | {
      type: ModalType.NODE_SETTINGS;
      meta: NodeSettingsMeta;
    }
  | {
      type: ModalType.PUBLISHER;
      meta: PublisherMeta;
    }
  | {
      type: ModalType.SUBGRAPH_CONNECTOR;
      meta: SubgraphConnectorMeta;
    };

const ModalContext = createContext<IModalContext>();
const { Provider } = ModalContext;

const ModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentModal, setCurrentModal] = useState<CurrentModal | null>(null);

  function openModal(currentModal: CurrentModal) {
    setCurrentModal(currentModal);
    setIsOpen(true);
  }
  function closeModal() {
    setCurrentModal(null);
    setIsOpen(false);
  }

  const { events } = useRouter();
  useEffect(() => {
    events.on("routeChangeComplete", closeModal);
    return () => events.off("routeChangeComplete", closeModal);
  }, [closeModal, events]);

  return (
    <Provider value={{ openModal, closeModal }}>
      {currentModal?.type === ModalType.CONNECT && (
        <ConnectModal isOpen onRequestClose={closeModal} />
      )}
      {currentModal?.type === ModalType.WRONG_NETWORK && (
        <WrongNetworkModal isOpen onRequestClose={closeModal} />
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
      {currentModal?.type === ModalType.NODE_SETTINGS && (
        <NodeSettingsModal
          isOpen
          onRequestClose={closeModal}
          meta={currentModal.meta}
        />
      )}
      {currentModal?.type === ModalType.PUBLISHER && (
        <PublisherModal
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
