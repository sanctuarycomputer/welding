import { FC, useContext, useState, useEffect } from 'react';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';

import { useAccount, useSigner } from 'wagmi';
import { GraphContext } from 'src/hooks/useGraphData';
import { ModalContext, ModalType } from 'src/hooks/useModal';
import useEditableImage from 'src/hooks/useEditableImage';
import makeFormikForBaseNode from 'src/lib/makeBaseNodeFormik';

import EditNav from 'src/components/EditNav';
import NodeImage from 'src/components/NodeImage';
import NodeMeta from 'src/components/NodeMeta';
import Frontmatter from 'src/components/Frontmatter';
import TopicManager from 'src/components/TopicManager';
import Tile from 'src/components/Tile';
import VerticalDots from 'src/components/Icons/VerticalDots';

import Client from 'src/lib/Client';
import getRelatedNodes from 'src/utils/getRelatedNodes';

import dynamic from 'next/dynamic';
const Editor = dynamic(() => import('src/components/Editor'), {
  ssr: false
});

type Props = {
  document: BaseNode;
};

const Document: FC<Props> = ({
  document
}) => {
  const router = useRouter();

  const { data: account } = useAccount();
  const { data: signer } = useSigner();
  const { accountData, loadAccountData } = useContext(GraphContext);
  const { openModal } = useContext(ModalContext);

  const canEdit =
    document.tokenId.startsWith("-") ||
    accountData?.roles.find(r => r.tokenId === document.tokenId);
  const canAdd = !!accountData;

  const documentTopics = getRelatedNodes(
    document,
    'incoming',
    'Topic'
  );

  const [publishStep, setPublishStep] = useState(null);
  const [publishError, setPublishError] = useState(null);

  const formik = makeFormikForBaseNode(
    signer,
    accountData,
    'Document',
    document,
    async (tx) => {
      await loadAccountData(account?.address);
      if (
        tx.events.find(e => e.event === "Revise") ||
        tx.events.find(e => e.event === "Merge")
      ) return router.reload();
      const mintEvent = tx.events.find(e => e.event === "Mint");
      if (mintEvent)
        return router.push(`/${mintEvent.args.tokenId.toString()}`);
    },
    setPublishError,
    setPublishStep
  );

  const triggerPublish = () => {
    if (publishError !== null) setPublishError(null);
    setPublishStep("FEES");
  };

  useEffect(() => {
    if (!publishStep) return;
    openModal({
      type: ModalType.PUBLISHER,
      meta: {
        publishStep,
        setPublishStep,
        publishError,
        formik
      }
    });
  }, [publishStep, publishError])

  const [imagePreview, imageDidChange, clearImage] =
    useEditableImage(formik);

  const triggerConnect = () => {
    openModal({
      type: ModalType.SUBGRAPH_CONNECTOR,
      meta: { node: document }
    });
  };

  return (
    <>
      <NodeMeta formik={formik} />
      <div>
        {canEdit && (
          <EditNav
            unsavedChanges={formik.dirty}
            coverImageFileDidChange={imageDidChange}
            formik={formik}
            buttonLabel={formik.isSubmitting
              ? "Loading..."
              : "Publish"}
            onClick={triggerPublish}
            onClickExtra={() => openModal({
              type: ModalType.NODE_SETTINGS,
              meta: {
                canEdit,
                node: document
              }
            })}
          />
        )}

        <div className="content pb-4 mx-auto">
          <button onClick={triggerConnect}>
            Connect
          </button>

          <NodeImage
            imagePreview={imagePreview}
            imageDidChange={imageDidChange}
            clearImage={clearImage}
          />
          <Frontmatter
            formik={formik}
            readOnly={!canEdit || formik.isSubmitting}
            label="document"
          />
          <TopicManager
            formik={formik}
            readOnly={!canEdit || formik.isSubmitting}
          />
          <Editor
            readOnly={!canEdit || formik.isSubmitting}
            content={formik.values.content}
            contentDidChange={
              content => formik.setFieldValue('content', content)
            }
          />
        </div>
      </div>
    </>
  );
};

export default Document;
