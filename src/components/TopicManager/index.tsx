import { FC } from 'react';
import Modal from 'react-modal';
import Button from 'src/components/Button';
import { useState } from 'react';
import { WithContext as ReactTags } from 'src/components/Tags';
import { Picker, emojiIndex, EmojiData, BaseEmoji } from 'emoji-mart';
import TopicTile from 'src/components/TopicTile';
import { BaseNode, MintState } from 'src/types';
import { useSigner } from 'wagmi';
import Welding from 'src/lib/Welding';

// TODO Discard unminted topics warning
// TODO Loadable Topic Tiles

const emojis = Object.values(emojiIndex.emojis);

enum Steps {
  CONNECT = "CONNECT",
  MINT = "MINT",
};

const suggestions = [{
  tokenId: '1',
  connections: [],
  backlinks: [],
  currentRevision: {
    hash: '',
    timestamp: 0,
    metadata: {
      name: 'Thailand',
      description: "A country in the world",
      properties: {
        emoji: emojis[0]
      }
    }
  }
}];

type Props = {
  topics: Array<BaseNode>,
  setTopics: Function,
  mintState: {
    [tokenId: string]: MintState
  },
  setMintState: Function,
  readOnly: boolean
};

const TopicManager: FC<Props> = ({
  topics,
  setTopics,
  mintState,
  setMintState,
  readOnly
}) => {
  const { data: signer } = useSigner();
  const [modalStep, setModalStep] = useState<Steps>(Steps.CONNECT);
  const [current, setCurrent] = useState<BaseNode | null>(null);

  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
  const openModal = () => setModalIsOpen(true);
  const closeModal = () => {
    setModalIsOpen(false);
    setModalStep(Steps.CONNECT);
  };

  const handleDelete = (i: number) => {
    setTopics(topics.filter((tag, index) => index !== i));
  };

  const handleAddition = (
    tag: {
      tokenId: string,
      'currentRevision.metadata.name': string
    }
  ) => {
    if (tag.tokenId !== tag['currentRevision.metadata.name'])
      return setTopics([...topics, tag]);

    const newTopic: BaseNode = {
      tokenId: '-1',
      labels: ['Node', 'Topic'],
      connections: [],
      backlinks: [],
      currentRevision: {
        hash: '',
        timestamp: 0,
        content: '',
        contentType: '',
        metadata: {
          name: tag['currentRevision.metadata.name'],
          description: '',
          image: '',
          properties: {
            emoji: emojis[Math.floor(Math.random() * emojis.length)]
          }
        }
      },
    };

    setTopics([...topics, newTopic]);

    setMintState({
      ...mintState,
      [newTopic.tokenId]: {
        tokenId: newTopic.tokenId,
        label: 'Mint',
        progress: 0,
        disabled: false
      }
    });
  };

  const handleDrag = (
    tag: BaseNode,
    currPos: number,
    newPos: number
  ) => {
    const newTopics = topics.slice();
    newTopics.splice(currPos, 1);
    newTopics.splice(newPos, 0, tag);
    setTopics(newTopics);
  };

  const topicsNeedMinting = Object.values(mintState);
  const allMinted =
    topicsNeedMinting.every(t => t.progress === 1);

  const didClickConfirm = () => {
    if (topicsNeedMinting.length && !allMinted) return setModalStep(Steps.MINT);
    closeModal();
  };

  const setEmojiForTopic = (t: BaseNode, emoji: EmojiData) => {
    if (!(emoji as BaseEmoji).native) return;

    const index = topics.indexOf(t);
    if (index !== -1) topics[index] = {
      ...t,
      currentRevision: {
        ...t.currentRevision,
        metadata: {
          ...t.currentRevision.metadata,
          properties: {
            ...t.currentRevision.metadata.properties,
            emoji: (emoji as BaseEmoji)
          }
        }
      }
    };
    setTopics([...topics]);
    setCurrent(null);
  };

  const setTagDescription = (t: BaseNode, description: string) => {
    const index = topics.indexOf(t);
    if (index !== -1) topics[index] = {
      ...t,
      currentRevision: {
        ...t.currentRevision,
        metadata: {
          ...t.currentRevision.metadata,
          description
        }
      }
    };
    setTopics([...topics]);
  };


  const mintTopic = async (t: BaseNode) => {
    try {
      setMintState({
        ...mintState,
        [t.tokenId]: {
          tokenId: t.tokenId,
          label: 'Publishing...',
          progress: 0.3,
          disabled: true
        }
      });

      const { name, description, properties: { emoji }} =
        t.currentRevision.metadata;
      const response = await fetch('/api/publish-graph-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description,
          emoji,
        })
      });
      const { hash } = await response.json();

      setMintState({
        ...mintState,
        [t.tokenId]: {
          tokenId: t.tokenId,
          label: 'Signing...',
          progress: 0.6,
          disabled: true
        }
      });

      if (!signer) return;
      let tx = await Welding.Nodes.connect(signer).mintNode(
        Welding.LABELS.topic,
        hash,
        [],
        []
      );

      setMintState({
        ...mintState,
        [t.tokenId]: {
          tokenId: t.tokenId,
          label: 'Minting...',
          progress: 0.8,
          disabled: true
        }
      });

      tx = await tx.wait();
      const transferEvent = tx.events.find((e: any) => e.event === "Transfer");
      if (!transferEvent) return;
      const topicId = transferEvent.args.tokenId;

      const tempTopicId = t.tokenId;

      // Replace the Topic with the minted ID (TODO: Should we pull this?)
      const persistedTopic: BaseNode = {
        tokenId: topicId.toString(),
        labels: ['Node', 'Topic'],
        connections: [],
        backlinks: [],
        currentRevision: {
          hash,
          timestamp: 0,
          content: '',
          contentType: '',
          metadata: {
            name,
            description,
            properties: {
              emoji,
            }
          },
        }
      };
      const index = topics.indexOf(t);
      if (index !== -1) {
        topics[index] = persistedTopic;
        setTopics([...topics]);
      }

      // Update the mint state for the fully minted topic
      const newMintState: { [id: string]: MintState } = {
        ...mintState,
        [topicId.toString()]: {
          tokenId: topicId.toString(),
          label: 'Success',
          progress: 1,
          disabled: true
        }
      };
      delete newMintState[tempTopicId];
      setMintState(newMintState);
    } catch(e) {
      console.log(e);
      setMintState({
        ...mintState,
        [t.tokenId]: {
          tokenId: t.tokenId,
          label: 'Retry',
          progress: 0,
          disabled: false
        }
      });
    }
  };

  const renderConnectStep = () => {
    return (
      <>
        <div className="flex p-4 border-b border-color justify-between">
          <div>
            <h2 className="pb-1">Connect Topics</h2>
            <p>
              Connect topics to improve discoverability for this Node.
              <br />
              Selected topics that do not exist will be minted.
            </p>
          </div>
          <span onClick={closeModal} className="cursor-pointer flex items-center pl-8">✕</span>
        </div>

        <div className="border-b border-color">
          <ReactTags
            idField="tokenId"
            labelField="currentRevision.metadata.name"
            tags={topics}
            suggestions={suggestions}
            handleDelete={handleDelete}
            handleAddition={handleAddition}
            handleDrag={handleDrag}
            inputFieldPosition="bottom"
            placeholder="Find or mint new topics"
          />
        </div>

        <div>
          <div className="flex p-4 justify-between flex-row items-center">
            <p>What are topics?</p>
            <Button
              disabled={false}
              label={(topicsNeedMinting.length && !allMinted) ? `Mint & Connect` : `Connect`}
              onClick={didClickConfirm}
            />
          </div>
        </div>
      </>
    );
  };

  const renderMintStep = () => {
    return (
      <>
        <div className="flex p-4 border-b border-color justify-between">
          <div>
            <p onClick={() => setModalStep(Steps.CONNECT)} className="text-xs flex items-center inline-block cursor-pointer pb-1">
              ← Connect
            </p>
            <h2 className="pb-1">Mint Topics</h2>
            <p>
              Mint the new topics selected below.
              <br />
              Owners of topic NFTs get a small payment whenever referenced.
            </p>
          </div>
          <span onClick={closeModal} className="cursor-pointer flex items-center pl-8">✕</span>
        </div>

        <div>
          {topicsNeedMinting.map(mintState => {
            const t =
              topics.find(topic => topic.tokenId === mintState.tokenId);
            if (!t) return null;

            return (
              <div key={t.currentRevision.metadata.name} className="flex relative p-4 justify-between items-center flex-row border-b border-color">
                <div className="absolute background-text-color left-0 top-0 h-0.5 transition-all duration-1000 ease-in-out" style={{
                  width: `${mintState.progress * 100}%`,
                }}></div>
                <div className="flex flex-row items-center py-1 flex-grow">
                  <div className="cursor-pointer" onClick={() => setCurrent(t)}>
                    <div className="aspect-square p-1 mr-2 background-passive-color rounded-full w-8 text-center">
                      {t.currentRevision.metadata.properties.emoji.native}
                    </div>
                  </div>
                  <p className="pr-2 font-semibold w-32 truncate">
                    #{t.currentRevision.metadata.name}
                  </p>
                  <input
                    value={t.currentRevision.metadata.description}
                    onChange={e => setTagDescription(t, e.target.value)}
                    className="text-xs py-2 mr-4"
                    placeholder="Add a description"
                    disabled={mintState.disabled}
                  />
                </div>
                <Button
                  disabled={mintState.disabled}
                  label={`${mintState.label}`}
                  onClick={() => mintTopic(t)}
                />
              </div>
            );
          })}
        </div>

        <div>
          <div className="flex p-4 justify-between flex-row items-center">
            <p>Why mint a topic?</p>
            <Button
              label="Connect"
              disabled={allMinted !== true}
              onClick={closeModal}
            />
          </div>
        </div>
      </>
    );
  };

  const renderEmojiSelectStep = ({ topic }: { topic: BaseNode }) => {
    return (
      <>
        <div className="flex p-4 border-b border-color justify-between">
          <div>
            <p onClick={() => setCurrent(null)} className="text-xs flex items-center inline-block cursor-pointer pb-1">
              ← Back
            </p>
            <h2 className="pb-1">Select Emoji</h2>
            <p>
              Select an emoji for <span className="font-semibold">#{topic.currentRevision.metadata.name}</span>
            </p>
          </div>
          <span onClick={closeModal} className="cursor-pointer flex items-center pl-8">✕</span>
        </div>

        <div>
          <Picker
            onSelect={emoji => setEmojiForTopic(topic, emoji)}
            showSkinTones={false}
            showPreview={false}
          />
        </div>
      </>
    );
  };

  return (
    <>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Topic Manager"
      >
        <div className="max-w-xl">
          {modalStep === Steps.CONNECT ? renderConnectStep() : null}
          {modalStep === Steps.MINT ?
            (current ? renderEmojiSelectStep({ topic: current }) : renderMintStep()) :
            null
          }
        </div>
      </Modal>

      <div className="flex mb-4">
        {!readOnly && (
          <Button
            disabled={false}
            onClick={openModal}
            label={'+ Manage Topics'}
          />
        )}
        {topics.map(t => {
          return <TopicTile key={t.tokenId} topic={t} />
        })}
      </div>
    </>
  );
};

export default TopicManager;
