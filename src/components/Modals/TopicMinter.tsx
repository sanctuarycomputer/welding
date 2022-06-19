import { FC, useContext, useState, useRef } from "react";
import { GraphContext } from "src/hooks/useGraphData";
import { ModalContext, ModalType } from "src/hooks/useModal";
import Modal from "react-modal";
import ModalHeader from "src/components/Modals/ModalHeader";
import Button from "src/components/Button";
import Check from "src/components/Icons/Check";
import toast from "react-hot-toast";

import { useSigner } from "wagmi";
import Client from "src/lib/Client";
import Welding from "src/lib/Welding";
import * as Sentry from "@sentry/nextjs";
import { bgPassive, bgInverted } from "src/utils/theme";

export type TopicMinterMeta = {
  topics: BaseNode[];
  setTopics: Function;
};

type MintState = {
  progress: number;
  label: string;
};

type Props = {
  isOpen: boolean;
  onRequestClose: Function;
  meta: TopicMinterMeta;
};

const IndividualTopicMinter: FC<{ topic: BaseNode }> = ({
  topic,
  setTopicId,
  setTopicDescription,
  openEmojiPicker,
  currentlyMinting,
}) => {
  const { loadShallowNodes } = useContext(GraphContext);
  const { openModal } = useContext(ModalContext);
  const { data: signer } = useSigner();
  const [mintState, setMintState] = useState<MintState>({
    progress: 0,
    label: "Mint",
  });

  const mintTopic = async () => {
    let toastId;
    const tempId = topic.tokenId;
    currentlyMinting.current.add(tempId);

    try {
      if (!signer) throw new Error("no_signer_present");

      toastId = toast.loading(`Publishing metadata...`, {
        className: "toast",
      });
      setMintState({
        progress: 0.3,
        label: "Publishing...",
      });

      const {
        name,
        description,
        properties: { emoji },
      } = topic.currentRevision.metadata;
      const hash = await Welding.publishMetadataToIPFS({
        name,
        description,
        emoji,
      });

      if (!signer) throw new Error("no_signer_present");

      toast.loading(`Requesting signature...`, {
        id: toastId,
      });
      setMintState({
        progress: 0.5,
        label: "Signing...",
      });

      let tx = await Welding.Nodes.connect(signer).mint(
        "Topic",
        hash,
        [],
        [],
        []
      );

      toast.loading(`Minting...`, {
        id: toastId,
      });
      setMintState({
        progress: 0.7,
        label: "Minting...",
      });

      tx = await tx.wait();

      toast.loading(`Confirming...`, {
        id: toastId,
      });
      setMintState({
        progress: 0.9,
        label: "Confirming...",
      });

      const transferEvent = tx.events.find((e: any) => e.event === "Transfer");
      if (!transferEvent) return;
      const topicId = transferEvent.args.tokenId;
      await Client.fastForward(tx.blockNumber);
      await loadShallowNodes();
      toast.success("Success!", {
        id: toastId,
      });
      setTopicId(topic, topicId.toString());
    } catch (e) {
      console.log(e);
      Sentry.captureException(e);
      toast.error("An error occured.", {
        id: toastId,
        className: "toast",
      });
    } finally {
      currentlyMinting.current.delete(tempId);
      setMintState({
        progress: 0,
        label: "Mint",
      });
    }
  };

  const isMinting = mintState.progress !== 0;

  return (
    <div
      key={topic.tokenId}
      className="flex relative p-4 justify-between items-center flex-row border-b border-color"
    >
      <div
        className={`${bgInverted} absolute left-0 top-0 h-0.5 transition-all duration-1000 ease-in-out`}
        style={{ width: `${mintState.progress * 100}%` }}
      ></div>
      <div className="flex flex-row items-center py-1 flex-grow">
        <div
          className={isMinting ? "cursor-wait" : "cursor-pointer"}
          onClick={() => {
            if (isMinting) return;
            openEmojiPicker(topic);
          }}
        >
          <div
            className={`${bgPassive} aspect-square p-1 mr-2 rounded-full w-8 text-center`}
          >
            {topic.currentRevision.metadata.properties.emoji.native}
          </div>
        </div>
        <p className="pr-2 font-semibold w-32 truncate">
          #{topic.currentRevision.metadata.name}
        </p>
        <input
          value={topic.currentRevision.metadata.description}
          onChange={(e) => setTopicDescription(topic, e.target.value)}
          className={`text-xs py-2 mr-4 ${isMinting ? "cursor-wait" : ""}`}
          placeholder="Add a description"
          disabled={isMinting}
        />
        <Button
          label={mintState.label}
          disabled={mintState.label !== "Mint"}
          onClick={mintTopic}
        />
      </div>
    </div>
  );
};

const TopicMinter: FC<Props> = ({ isOpen, onRequestClose, meta }) => {
  const { openModal } = useContext(ModalContext);
  const { topics: initialTopics, setTopics: setParentTopics } = meta;
  const [topics, setInternalTopics] = useState(initialTopics);
  const currentlyMinting = useRef(new Set());

  const setTopics = (topics) => {
    setInternalTopics(topics);
    setParentTopics(topics);
  };

  const openEmojiPicker = (t: BaseNode) => {
    openModal({
      type: ModalType.EMOJI_PICKER,
      meta: {
        back: () => {
          openModal({
            type: ModalType.TOPIC_MINTER,
            meta: {
              topics: topics,
              setTopics: setParentTopics,
            },
          });
        },
        didPickEmoji: (emoji: BaseEmoji) => {
          const index = topics.indexOf(t);
          if (index !== -1)
            topics[index] = {
              ...t,
              currentRevision: {
                ...t.currentRevision,
                metadata: {
                  ...t.currentRevision.metadata,
                  properties: {
                    ...t.currentRevision.metadata.properties,
                    emoji,
                  },
                },
              },
            };
          setTopics([...topics]);

          openModal({
            type: ModalType.TOPIC_MINTER,
            meta: {
              topics: topics,
              setTopics: setParentTopics,
            },
          });
        },
      },
    });
  };

  const newTopics = topics.filter((t) => t.tokenId.startsWith("-"));

  const attemptClose = () => {
    if (currentlyMinting.current.size)
      return alert("Currently minting, please wait.");
    if (!newTopics.length) return onRequestClose();
    if (confirm("Discard unminted topics?")) {
      setTopics(topics.filter((t) => !t.tokenId.startsWith("-")));
      onRequestClose();
    }
  };

  const attemptBack = () => {
    if (currentlyMinting.current.size)
      return alert("Currently minting, please wait.");
    openModal({
      type: ModalType.TOPIC_CONNECTOR,
      meta: {
        topics,
        setTopics: setParentTopics,
      },
    });
  };

  const setTopicDescription = (t: BaseNode, description: string) => {
    const index = topics.indexOf(t);
    if (index !== -1)
      topics[index] = {
        ...t,
        currentRevision: {
          ...t.currentRevision,
          metadata: {
            ...t.currentRevision.metadata,
            description,
          },
        },
      };
    setTopics([...topics]);
  };

  const setTopicId = (t: BaseNode, newTokenId: string) => {
    const index = topics.indexOf(t);
    if (index !== -1)
      topics[index] = {
        ...t,
        tokenId: newTokenId,
      };
    setTopics([...topics]);
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={attemptClose}>
      <div className="h-screen sm:h-auto flex flex-col">
        <ModalHeader
          onClickBack={attemptBack}
          title="Mint Topics"
          hint="Mint to own the following topics"
          onClickClose={attemptClose}
        />

        <div>
          {newTopics.map((t) => (
            <IndividualTopicMinter
              key={t.tokenId}
              topic={t}
              setTopicId={setTopicId}
              setTopicDescription={setTopicDescription}
              currentlyMinting={currentlyMinting}
              openEmojiPicker={openEmojiPicker}
            />
          ))}
        </div>

        {newTopics.length === 0 && (
          <div className="py-16 px-4 text-center flex relative flex-grow justify-center items-center flex-col border-b border-color">
            <Check />
            <p className="pt-2 font-semibold">Finished minting your topics.</p>
          </div>
        )}

        <div className="p-4 flex flex-row-reverse justify-between">
          <Button
            label="Finish & Connect"
            onClick={onRequestClose}
            disabled={newTopics.length > 0}
          />
        </div>
      </div>
    </Modal>
  );
};

export default TopicMinter;
