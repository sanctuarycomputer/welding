import styles from './styles.module.css';
import Modal from 'react-modal';
import Button from 'src/components/Button';
import { useState } from 'react';
import { WithContext as ReactTags } from 'src/components/Tags';
import { Picker, emojiIndex } from 'emoji-mart';
import TopicTile from 'src/components/TopicTile';

import { ethers } from 'ethers';
import Welding from 'src/lib/Welding';

// TODO Discard unminted topics warning
// TODO Loadable Topic Tiles

const emojis = Object.values(emojiIndex.emojis);

const Steps = {
  CONNECT: 'connect',
  MINT: 'mint'
};

const suggestions = [{
  id: '1',
  name: 'Thailand',
  description: "A country in the world",
  emoji: emojis[0]
}];

const TopicManager = ({ topics, setTopics, readOnly }) => {
  const [modalStep, setModalStep] = useState(Steps.CONNECT);
  const [current, setCurrent] = useState(null);

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const openModal = () => setModalIsOpen(true);
  const closeModal = () => {
    setModalIsOpen(false);
    setModalStep(Steps.CONNECT);
  };

  const handleDelete = i => {
    setTopics(topics.filter((tag, index) => index !== i));
  };

  const handleAddition = tag => {
    if (tag.id === tag.name) {
      return setTopics([...topics, {
        id: '-1',
        name: tag.name,
        description: '',
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        mintState: {
          label: 'Mint',
          progress: 0,
          disabled: false
        },
      }]);
    }
    setTopics([...topics, tag]);
  };

  const handleDrag = (tag, currPos, newPos) => {
    const newTopics = topics.slice();
    newTopics.splice(currPos, 1);
    newTopics.splice(newPos, 0, tag);
    setTopics(newTopics);
  };

  const topicsNeedMinting = topics.filter(t => !!t.mintState);
  const allMinted = topicsNeedMinting.every(t => t.mintState.progress === 1);

  const didClickConfirm = () => {
    if (topicsNeedMinting.length && !allMinted) return setModalStep(Steps.MINT);
    closeModal();
  };

  const setEmojiForCurrentTag = emoji => {
    const index = topics.indexOf(current);
    if (index !== -1) topics[index] = { ...current, emoji };
    setTopics([...topics]);
    setCurrent(null);
  };

  const setTagDescription = (t, description) => {
    const index = topics.indexOf(t);
    if (index !== -1) topics[index] = { ...t, description };
    setTopics([...topics]);
  };

  const updateTopic = (t, params) => {
    const index = topics.indexOf(t);
    if (index !== -1) topics[index] = { ...t, ...params };
    setTopics([...topics]);
    return topics[index];
  };

  const mintTopic = async (t) => {
    try {
      t = updateTopic(t, {
        mintState: {
          label: 'Publishing...',
          progress: 0.3,
          disabled: true
        }
      });

      const { name, description, emoji } = t;
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

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      t = updateTopic(t, {
        mintState: {
          label: 'Signing...',
          progress: 0.6,
          disabled: true
        }
      });

      let tx = await Welding.Nodes.connect(signer).mintNode(Welding.LABELS.topic, hash, [], [])

      t = updateTopic(t, {
        mintState: {
          label: 'Minting...',
          progress: 0.8,
          disabled: true
        }
      });

      tx = await tx.wait();
      const transferEvent = tx.events.find(e => e.event === "Transfer");
      const topicId = transferEvent.args.tokenId;

      updateTopic(t, {
        id: topicId.toString(),
        metadata: {
          name,
          description,
          properties: {
            emoji,
          }
        },
        uri: `ipfs://${hash}/metadata.json`,
        mintState: {
          label: 'Success',
          progress: 1,
          disabled: true
        }
      })
    } catch(e) {
      console.log(e);
      updateTopic(t, {
        mintState: {
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
              Selected topics that don't exist will be minted.
            </p>
          </div>
          <span onClick={closeModal} className="cursor-pointer flex items-center pl-8">✕</span>
        </div>

        <div className="border-b border-color">
          <ReactTags
            labelField="name"
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
              Mint the new topics you've selected below.
              <br />
              Owners of topic NFTs get a small payment whenever they're used.
            </p>
          </div>
          <span onClick={closeModal} className="cursor-pointer flex items-center pl-8">✕</span>
        </div>

        <div>
          {topicsNeedMinting.map(t =>
            <div key={t.name} className="flex relative p-4 justify-between items-center flex-row border-b border-color">
              <div className="absolute background-text-color left-0 top-0 h-0.5 transition-all duration-1000 ease-in-out" style={{
                width: `${t.mintState.progress * 100}%`,
              }}></div>
              <div className="flex flex-row items-center py-1 flex-grow">
                <div className="cursor-pointer" onClick={() => setCurrent(t)}>
                  <div className="aspect-square p-1 mr-2 background-passive-color rounded-full w-8 text-center">
                    {t.emoji.native}
                  </div>
                </div>
                <p className="pr-2 font-semibold w-32 truncate">#{t.name}</p>
                <input
                  value={t.description}
                  onChange={e => setTagDescription(t, e.target.value)}
                  className="text-xs py-2 mr-4"
                  placeholder="Add a description"
                  disabled={t.mintState.disabled}
                />
              </div>
              <Button
                disabled={t.mintState.disabled}
                label={`${t.mintState.label}`}
                onClick={() => mintTopic(t)}
              />
            </div>
          )}
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

  const renderEmojiSelectStep = () => {
    return (
      <>
        <div className="flex p-4 border-b border-color justify-between">
          <div>
            <p onClick={() => setCurrent(null)} className="text-xs flex items-center inline-block cursor-pointer pb-1">
              ← Back
            </p>
            <h2 className="pb-1">Select Emoji</h2>
            <p>
              Select an emoji for <span className="font-semibold">#{current.text}</span>
            </p>
          </div>
          <span onClick={closeModal} className="cursor-pointer flex items-center pl-8">✕</span>
        </div>

        <div>
          <Picker
            onSelect={setEmojiForCurrentTag}
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
            (current ? renderEmojiSelectStep() : renderMintStep()) :
            null
          }
        </div>
      </Modal>

      <div className="flex mb-4">
        {!readOnly && (
          <Button
            onClick={openModal}
            label={'+ Manage Topics'}
          />
        )}
        {topics.map(t => {
          return <TopicTile key={t.id} topic={t} />
        })}
      </div>
    </>
  );
};

export default TopicManager;
