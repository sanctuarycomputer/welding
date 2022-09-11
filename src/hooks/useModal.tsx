import { useState, createContext, useEffect } from "react";
import { useRouter } from "next/router";
import WrongNetworkModal from "src/components/Modals/WrongNetwork";
import NeedsSessionModal from "src/components/Modals/NeedsSession";
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
  openModal: (currentModal: CurrentModal) => void;
  closeModal: (modalType: ModalType) => void;
}

export enum ModalType {
  WRONG_NETWORK = "WRONG_NETWORK",
  NEEDS_SESSION = "NEEDS_SESSION",
  TOPIC_CONNECTOR = "TOPIC_CONNECTOR",
  TOPIC_MINTER = "TOPIC_MINTER",
  EMOJI_PICKER = "EMOJI_PICKER",
  NODE_SETTINGS = "NODE_SETTINGS",
  PUBLISHER = "PUBLISHER",
}

type CurrentModal =
  | {
      type: ModalType.WRONG_NETWORK;
    }
  | {
      type: ModalType.NEEDS_SESSION;
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
    };

const ModalContext = createContext<IModalContext>({
  openModal: () => undefined,
  closeModal: () => undefined,
});
const { Provider } = ModalContext;

const ModalProvider = ({ children }) => {
  const [, setIsOpen] = useState<boolean>(false);
  const [currentModal, setCurrentModal] = useState<CurrentModal | null>(null);

  function openModal(currentModal: CurrentModal) {
    setCurrentModal(currentModal);
    setIsOpen(true);
  }
  function closeModal(modalType: ModalType) {
    if (modalType === currentModal?.type) {
      setCurrentModal(null);
      setIsOpen(false);
    }
  }

  // TODO: Maybe move?
  const { events } = useRouter();
  useEffect(() => {
    const onRouteChange = () => closeModal(ModalType.PUBLISHER)
    events.on("routeChangeComplete", onRouteChange);
    return () => events.off("routeChangeComplete", onRouteChange);
  }, [closeModal, events]);

  return (
    <Provider value={{ openModal, closeModal }}>
      {currentModal?.type === ModalType.WRONG_NETWORK && (
        <WrongNetworkModal isOpen onRequestClose={() => closeModal(ModalType.WRONG_NETWORK)} />
      )}
      {currentModal?.type === ModalType.NEEDS_SESSION && (
        <NeedsSessionModal isOpen onRequestClose={() => closeModal(ModalType.NEEDS_SESSION)} />
      )}
      {currentModal?.type === ModalType.TOPIC_CONNECTOR && (
        <TopicConnectorModal
          isOpen
          onRequestClose={() => closeModal(ModalType.TOPIC_CONNECTOR)}
          meta={currentModal.meta}
        />
      )}
      {currentModal?.type === ModalType.TOPIC_MINTER && (
        <TopicMinterModal
          isOpen
          onRequestClose={() => closeModal(ModalType.TOPIC_MINTER)}
          meta={currentModal.meta}
        />
      )}
      {currentModal?.type === ModalType.EMOJI_PICKER && (
        <EmojiPickerModal
          isOpen
          onRequestClose={() => closeModal(ModalType.EMOJI_PICKER)}
          meta={currentModal.meta}
        />
      )}
      {currentModal?.type === ModalType.NODE_SETTINGS && (
        <NodeSettingsModal
          isOpen
          onRequestClose={() => closeModal(ModalType.NODE_SETTINGS)}
          meta={currentModal.meta}
        />
      )}
      {currentModal?.type === ModalType.PUBLISHER && (
        <PublisherModal
          isOpen
          onRequestClose={() => closeModal(ModalType.PUBLISHER)}
          meta={currentModal.meta}
        />
      )}
      {children}
    </Provider>
  );
};

export { ModalContext, ModalProvider };
