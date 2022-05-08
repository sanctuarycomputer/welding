import { FC, useContext } from 'react';
import { ModalContext, ModalType } from 'src/hooks/useModal';
import { GraphContext } from 'src/hooks/useGraphData';
import Modal from 'react-modal';
import Button from 'src/components/Button';
import { useState } from 'react';
import Link from 'next/link';
import { WithContext as ReactTags } from 'src/components/Tags';
import { Picker, emojiIndex, EmojiData, BaseEmoji } from 'emoji-mart';
import Add from 'src/components/Icons/Add';
import TopicTile from 'src/components/TopicTile';
import { BaseNode } from 'src/types';
import { useSigner } from 'wagmi';
import slugifyNode from 'src/utils/slugifyNode';

type Props = {
  topics: Array<BaseNode>;
  setTopics: Function;
  readOnly: boolean;
};

const TopicManager: FC<Props> = ({
  topics,
  setTopics,
  readOnly
}) => {
  const { openModal } = useContext(ModalContext);

  return (
    <div className="flex mb-4">
      {topics.map(t => {
        return (
          <Link key={t.tokenId} href={`/${slugifyNode(t)}`}>
            <a className="inline-block">
              <TopicTile key={t.tokenId} topic={t} />
            </a>
          </Link>
        );
      })}

      <div
        onClick={() => openModal({
          type: ModalType.TOPIC_CONNECTOR,
          meta: {
            topics,
            setTopics
          }
        })}>
        <p className="cursor-pointer shadow-lg border-2 border-color background-color flex rounded-full text-xs px-2 py-1 font-medium">+ Add Topics</p>
      </div>
    </div>
  );
};

export default TopicManager;
