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
import {
  getRelatedNodes,
  stageNodeRelations
} from 'src/lib/makeBaseNodeFormik';
import Tooltip from 'src/components/Tooltip';

type Props = {
  readOnly: boolean;
};

const TopicManager: FC<Props> = ({
  formik,
  readOnly
}) => {
  const { openModal } = useContext(ModalContext);

  const setTopics = (topics) => {
    stageNodeRelations(
      formik,
      'incoming',
      topics,
      'DESCRIBES',
      true
    );
  };

  const topics =
    getRelatedNodes(formik, 'incoming', 'Topic', 'DESCRIBES');

  return (
    <div className="mb-4">
      {topics.map(t => {
        return (
          <Link key={t.tokenId} href={`/${slugifyNode(t)}`}>
            <a className="inline-block pb-2">
              <Tooltip message={t.currentRevision.metadata.description || 'No Description'}>
                <TopicTile key={t.tokenId} topic={t} />
              </Tooltip>
            </a>
          </Link>
        );
      })}

      {!readOnly && (
        <div
          className={`cursor-pointer inline-block `}
          onClick={() => openModal({
            type: ModalType.TOPIC_CONNECTOR,
            meta: {
              topics,
              setTopics
            }
          })}>
          <p className="inline-block border-2 border-color background-color border-dashed rounded-full text-xs px-2 py-1 font-medium">+ Topic</p>
        </div>
      )}
    </div>
  );
};

export default TopicManager;
