import { FC, useContext, useState } from 'react';
import { ModalContext, ModalType } from 'src/hooks/useModal';
import type { GetServerSideProps } from 'next';
import { GraphContext } from 'src/hooks/useGraphData';
import makeFormikForBaseNode from 'src/lib/makeBaseNodeFormik';
import useEditableImage from 'src/hooks/useEditableImage';
import EditNav from 'src/components/EditNav';
import { useRouter } from 'next/router';
import Link from 'next/link';
import TopicTile from 'src/components/TopicTile';
import type { BaseNode } from 'src/types';
import Client from 'src/lib/Client';
import Welding from 'src/lib/Welding';
import Tile from 'src/components/Tile';
import Document from 'src/components/Icons/Document';
import Graph from 'src/components/Icons/Graph';
import VerticalDots from 'src/components/Icons/VerticalDots';
import Upload from 'src/components/Icons/Upload';
import Card from 'src/components/Card';
import NodeImage from 'src/components/NodeImage';

type Props = {
  topic: BaseNode
};

const TopicsShow: FC<Props> = ({
  topic
}) => {
  const router = useRouter();
  let { collection } = router.query;
  if (!collection) collection = "subgraphs";
  const { accountData } = useContext(GraphContext);
  const { openModal, closeModal } = useContext(ModalContext);

  let canEdit = false;
  if (accountData && (
    accountData.adminOf.find(n => n.tokenId === topic.tokenId) ||
    accountData.editorOf.find(n => n.tokenId === topic.tokenId)
  )) canEdit = true;

  const formik = makeFormikForBaseNode(topic, router.reload);
  const [imagePreview, imageDidChange] = useEditableImage(formik);

  const nodesByCollectionType = {
    subgraphs: {},
    documents: {},
  };
  topic.connections.forEach((n: BaseNode) => {
    const collectionType = `${n.labels.filter(l => l !== "BaseNode")[0].toLowerCase()}s`;
    if (!["subgraphs", "documents"].includes(collectionType)) return;
    nodesByCollectionType[collectionType][n.tokenId] = n;
  });
  const nodes: BaseNode[] =
    Object.values(nodesByCollectionType[collection]);

  return (
    <div className="pt-8">
      {canEdit && (
        <EditNav
          unsavedChanges={formik.dirty}
          coverImageFileDidChange={imageDidChange}
          formik={formik}
          buttonLabel={formik.isSubmitting
            ? "Loading..."
            : "+ Make Revision"}
        />
      )}

      <div className="content py-4 mx-auto">
        <NodeImage
          imagePreview={imagePreview}
          imageDidChange={imageDidChange}
        >
          <Tile label="Topic NFT" tracked />
          <div
            style={{ transform: 'translate(0, -50%)' }}
            onClick={() => openModal({
              type: ModalType.NODE_SETTINGS,
              meta: {
                canEdit,
                node: topic
              }
            })}
            className="cursor-pointer top-0 right-2 absolute background-color border-2 border-color shadow-lg p-1 rounded-full z-10">
            <VerticalDots />
          </div>
        </NodeImage>

        <div
          className="inline-block"
          style={{ transform: 'translate(0, -50%)' }}
        >
          {canEdit ? (
            <p className={`ml-2 border-2 border-color background-color flex rounded-full text-2xl px-2 py-1 font-medium shadow-lg whitespace-nowrap`}>
              <span
                className="cursor-pointer mr-1"
                onClick={() => openModal({
                  type: ModalType.EMOJI_PICKER,
                  meta: {
                    didPickEmoji: (emoji: BaseEmoji) => {
                      formik.setFieldValue('emoji', emoji);
                      closeModal();
                    }
                  }
                })}
              >{formik.values.emoji.native}</span> #
              <input
                type="text"
                name="name"
                placeholder={`Topic Name`}
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </p>
          ) : (
            <TopicTile topic={topic} textSize="2xl" />
          )}
        </div>

        <div>
          {canEdit ? (
            <textarea
              className="pb-4 w-full bg-transparent text-xs px-2 pt-2"
              type="text"
              name="description"
              placeholder="Add a description"
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          ) : (
            <p>{formik.values.description || 'No description'}</p>
          )}
        </div>

        <div className="border-b border-color flex justify-between">
          <Link href={`/${topic.tokenId}?collection=subgraphs`}>
            <a className={`p-4 flex-grow basis-0 text-center ${collection === "subgraphs" ? "border-b" : ""}`}>
              <p>Subgraphs • {Object.values(nodesByCollectionType["subgraphs"]).length}</p>
            </a>
          </Link>

          <Link href={`/${topic.tokenId}?collection=documents`}>
            <a className={`p-4 flex-grow basis-0 text-center ${collection === "documents" ? "border-b" : ""}`}>
              <p>Documents • {Object.values(nodesByCollectionType["documents"]).length}</p>
            </a>
          </Link>
        </div>

        {nodes.length === 0 && (
          <div className="flex flex-col pt-16 items-center">
            {collection === "subgraphs" && <Graph />}
            {collection === "documents" && <Document />}
            <p className="pt-4">This topic is not used by any {collection}.</p>
          </div>
        )}

        {nodes.length !== 0 && collection === "documents" && (
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 sm:px-0">
            {nodes.map(node => {
              return <Card key={node.tokenId} node={node} />;
            })}
          </div>
        )}

      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  let { tid } = context.query;
  tid = ((Array.isArray(tid) ? tid[0] : tid) || '').split('-')[0];
  const topic =
    await Client.fetchBaseNodeByTokenId(tid);
  if (!topic || !topic.labels.includes('Topic')) return {
    redirect: { permanent: false, destination: `/` },
    props: {},
  };

  return {
    props: { topic },
  };
}

export default TopicsShow;
