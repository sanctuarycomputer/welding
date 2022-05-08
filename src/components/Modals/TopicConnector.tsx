import { FC, useContext, useState } from 'react';
import { GraphContext } from 'src/hooks/useGraphData';
import { ModalContext, ModalType } from 'src/hooks/useModal';
import Modal from 'react-modal';
import ModalHeader from 'src/components/Modals/ModalHeader';
import Button from 'src/components/Button';
import Hashtag from 'src/components/Icons/Hashtag';

import { WithContext as ReactTags } from 'src/components/Tags';
import { emojiIndex, BaseEmoji } from 'emoji-mart';

const emojis = Object.values(emojiIndex.emojis).filter(e => {
  return 'native' in e;
});
const DEFAULT_EMOJI: BaseEmoji =
  (Object.values(emojiIndex.emojis)[0] as BaseEmoji);

export type TopicConnectorMeta = {
  topics: BaseNode[];
  setTopics: (topics: BaseNode[]) => void;
};

type Props = {
  isOpen: boolean;
  onRequestClose: Function;
  meta: TopicConnectorMeta;
};

const suggestions = [{
  tokenId: '999',
  connections: [],
  backlinks: [],
  currentRevision: {
    hash: '',
    timestamp: 0,
    metadata: {
      name: 'Thailand',
      description: "A country in the world",
      properties: {
        emoji: DEFAULT_EMOJI
      }
    }
  }
}];

const TopicConnector: FC<Props> = ({
  isOpen,
  onRequestClose,
  meta
}) => {
  const { openModal } = useContext(ModalContext);
  const { topics: initialTopics, setTopics: setParentTopics } = meta;
  const [topics, setInternalTopics] = useState(initialTopics);
  const newTopics = topics.filter(t => t.tokenId.startsWith('-'));

  const setTopics = (topics) => {
    setInternalTopics(topics);
    setParentTopics(topics);
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
      tokenId: `-${newTopics.length + 1}`,
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

  const attemptClose = () => {
    if (newTopics.length === 0) return onRequestClose();
    if (confirm("Discard unminted topics?")) {
      setTopics(topics.filter(t => !t.tokenId.startsWith('-')));
      onRequestClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={attemptClose}
    >
      <div className="h-screen sm:h-auto flex flex-col">
        <ModalHeader
          title="Topics"
          hint="Connect or mint topics to make this node easier to find."
          onClickClose={attemptClose}
        />

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
            placeholder="Search or mint new topics"
          />
        </div>

        <div
          className="py-16 flex relative flex-grow justify-center items-center flex-col border-b border-color">
          <Hashtag />
          <p className="pt-2 font-semibold">
            Topics improve discoverability of nodes, and reward the owner of the Topic NFT.
          </p>
        </div>

        <div className="p-4 flex flex-row-reverse justify-between">
          <Button
            label={newTopics.length ? "Mint & Connect" : "Connect"}
            onClick={() => (newTopics.length ? openModal({
              type: ModalType.TOPIC_MINTER,
              meta: {
                topics: topics,
                setTopics: setParentTopics
              }
            }) : onRequestClose())}
            disabled={false}
          />
        </div>
      </div>
    </Modal>
  );
};

export default TopicConnector;
