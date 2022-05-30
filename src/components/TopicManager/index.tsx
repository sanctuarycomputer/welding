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
import { getRelatedNodes } from 'src/lib/makeBaseNodeFormik';
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
    // get related nodes without incoming topics
    // get incoming edges without incoming topics
    const node = formik.values.__node__;
    const topicIds = topics.map(t => t.tokenId);

    const incomingEdges =
      node.incoming.reduce((acc, e) => {
        const n = node.related.find((r: BaseNode) => r.tokenId === e.tokenId);
        if (!n) return acc;
        if (!n.labels.includes("Topic")) return [...acc, e];
        if (e.name !== "DESCRIBES") return [...acc, e];
        if (topicIds.includes(n.tokenId)) {
          return [...acc, { ...e, active: true }];
        }
        return [...acc, { ...e, active: false }];
      }, []);

    const missingIncomingEdges = topics.map(n => {
      const existingEdge =
        incomingEdges.find(e => {
          return e.name === "DESCRIBES" && e.tokenId === n.tokenId;
        });
      if (!!existingEdge) return null;
      return {
        __typename: "Edge",
        name: "DESCRIBES",
        tokenId: n.tokenId,
        active: true
      };
    }).filter(e => e !== null);

    formik.setFieldValue('incoming', [
      ...incomingEdges,
      ...missingIncomingEdges
    ]);

    const otherRelatedNodes = node.related.filter((n: BaseNode) => {
      return !topicIds.includes(n.tokenId);
    });
    formik.setFieldValue('related', [
      ...otherRelatedNodes,
      ...topics
    ]);
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
          <p className="inline-block border-2 border-color background-color rounded-full text-xs px-2 py-1 font-medium">+ Topic</p>
        </div>
      )}
    </div>
  );
};

export default TopicManager;
