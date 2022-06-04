import { FC, useContext, useState, useEffect } from 'react';
import { ModalContext, ModalType } from 'src/hooks/useModal';
import type { GetServerSideProps } from 'next';
import { GraphContext } from 'src/hooks/useGraphData';
import { NavContext } from 'src/hooks/useNav';
import makeFormikForBaseNode from 'src/lib/makeBaseNodeFormik';
import useEditableImage from 'src/hooks/useEditableImage';
import slugifyNode from 'src/utils/slugifyNode';
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
import Connect from 'src/components/Icons/Connect';
import Card from 'src/components/Card';
import NodeImage from 'src/components/NodeImage';
import NodeMeta from 'src/components/NodeMeta';
import Actions from 'src/components/Actions';
import { useSigner } from 'wagmi';

type Props = {
  topic: BaseNode
};

const TopicsShow: FC<Props> = ({
  topic
}) => {
  const router = useRouter();
  let { collection } = router.query;
  if (!collection) collection = "subgraphs";
  const { data: signer } = useSigner();
  const { accountData } = useContext(GraphContext);
  const { openModal, closeModal } = useContext(ModalContext);
  const { setContent } = useContext(NavContext);

  const canEdit =
    accountData?.roles.find(r => r.tokenId === topic.tokenId);

  const [publishStep, setPublishStep] = useState(null);
  const [publishError, setPublishError] = useState(null);
  const formik = makeFormikForBaseNode(
    signer,
    accountData,
    "Topic",
    topic,
    router.reload,
    setPublishError,
    setPublishStep
  );

  const triggerPublish = () => {
    if (publishError !== null) setPublishError(null);
    setPublishStep("FEES");
  };

  useEffect(() => {
    if (!canEdit || !formik.dirty) return setContent(null);
    setContent(
      <EditNav
        formik={formik}
        buttonLabel={formik.isSubmitting
          ? "Loading..."
          : "Publish"}
        onClick={triggerPublish}
      />
    );
  }, [canEdit, formik]);

  useEffect(() => {
    if (!publishStep) return;
    openModal({
      type: ModalType.PUBLISHER,
      meta: { publishStep, publishError, formik, setPublishStep }
    });
  }, [publishStep, publishError])

  const [
    imagePreview,
    imageDidChange,
    clearImage
  ] = useEditableImage(formik);

  const nodesByCollectionType = {
    subgraphs: {},
    documents: {},
  };
  topic.outgoing.forEach((e: Edge) => {
    const n = topic.related.find((node: BaseNode) => node.tokenId === e.tokenId);
    if (!n) return;
    const collectionType = `${n.labels.filter(l => l !== "BaseNode")[0].toLowerCase()}s`;
    if (!["subgraphs", "documents"].includes(collectionType)) return;
    nodesByCollectionType[collectionType][n.tokenId] = n;
  });
  const nodes: BaseNode[] =
    Object.values(nodesByCollectionType[collection]);

  return (
    <>
      <NodeMeta formik={formik} />

      <div className="pt-20">
        <div className="content py-4 mx-auto">
          <div className="flex justify-end pb-2">
            <Actions
              imageDidChange={imageDidChange}
              node={topic}
              canEdit={canEdit}
              allowConnect={false}
              allowSettings
            />
          </div>

          <NodeImage
            showDefault
            imagePreview={imagePreview}
            imageDidChange={imageDidChange}
            clearImage={clearImage}
          />

          <div
            className="inline-block"
            style={{ transform: 'translate(0, -50%)' }}
          >
            {canEdit ? (
              <p className={`ml-2 border-2 border-color background-color flex rounded-full text-2xl px-2 py-1 font-medium whitespace-nowrap`}>
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
                >{formik.values.emoji.native}</span> #{formik.values.name}
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
            <Link href={`/${slugifyNode(topic)}?collection=subgraphs`}>
              <a className={`p-4 flex-grow basis-0 text-center ${collection === "subgraphs" ? "border-b" : ""}`}>
                <p>Subgraphs • {Object.values(nodesByCollectionType["subgraphs"]).length}</p>
              </a>
            </Link>

            <Link href={`/${slugifyNode(topic)}?collection=documents`}>
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

          {nodes.length !== 0 && collection === "subgraphs" && (
            <div className="">
              {nodes.map(node => {
                return (
                  <Link
                    key={node.tokenId}
                    href={`/${Welding.slugifyNode(node)}`}>

                  <a
                    className="flex relative py-4 px-4 sm:px-0 justify-between items-center flex-row border-b border-color"
                  >
                    <div className="flex flex-row items-center py-1 flex-grow">
                      <p className="pr-2 font-semibold w-32 truncate">
                        {node.currentRevision.metadata.properties.emoji.native} {node.currentRevision.metadata.name}
                      </p>
                    </div>
                  </a>

                  </Link>
                );
              })}
            </div>
          )}

          {nodes.length !== 0 && collection === "documents" && (
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 sm:px-0">
              {nodes.map(node => {
                return (
                  <Link
                    key={node.tokenId}
                    href={`/${Welding.slugifyNode(node)}`}>
                    <a>
                      <Card key={node.tokenId} node={node} />
                    </a>
                  </Link>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </>
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
