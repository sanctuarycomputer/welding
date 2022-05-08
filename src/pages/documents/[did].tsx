import { FC, useContext, useState } from 'react';
import type { GetServerSideProps } from 'next';

import { GraphContext } from 'src/hooks/useGraphData';
import { ModalContext, ModalType } from 'src/hooks/useModal';
import useEditableImage from 'src/hooks/useEditableImage';
import makeFormikForBaseNode from 'src/lib/makeBaseNodeFormik';

import EditNav from 'src/components/EditNav';
import NodeImage from 'src/components/NodeImage';
import Frontmatter from 'src/components/Frontmatter';
import TopicManager from 'src/components/TopicManager';
import Tile from 'src/components/Tile';
import VerticalDots from 'src/components/Icons/VerticalDots';

import Client from 'src/lib/Client';

import dynamic from 'next/dynamic';
const Editor = dynamic(() => import('src/components/Editor'), {
  ssr: false
});

type Props = {
  document: BaseNode;
};

const DocumentShow: FC<Props> = ({
  document
}) => {
  const { accountData } = useContext(GraphContext);
  const { openModal } = useContext(ModalContext);

  let canEdit = false;
  if (accountData && (
    accountData.adminOf.find(n => n.tokenId === document.tokenId) ||
    accountData.editorOf.find(n => n.tokenId === document.tokenId)
  )) canEdit = true;

  const documentTopics = (document.backlinks || []).filter(n =>
    n.labels.includes('Topic')
  );
  const [topics, setTopics] =
    useState<BaseNode[]>(documentTopics);

  const formik = makeFormikForBaseNode(document);
  const [imagePreview, imageDidChange] =
    useEditableImage(formik);

  return (
    <div>
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
          <Tile label="Document NFT" tracked />
          <div
            style={{ transform: 'translate(0, -50%)' }}
            onClick={() => openModal({
              type: ModalType.NODE_SETTINGS,
              meta: {
                canEdit,
                node: document
              }
            })}
            className="cursor-pointer top-0 right-2 absolute background-color border-2 border-color shadow-lg p-1 rounded-full z-10">
            <VerticalDots />
          </div>
        </NodeImage>

        <Frontmatter
          formik={formik}
          readOnly={!canEdit || formik.isSubmitting}
          label="document"
        />
        <TopicManager
          setTopics={setTopics}
          topics={topics}
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
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  let { did } = context.query;
  did = ((Array.isArray(did) ? did[0] : did) || '').split('-')[0];

  const document =
    await Client.fetchBaseNodeByTokenId(did);
  if (!document || !document.labels.includes('Document')) return {
    redirect: { permanent: false, destination: `/` },
    props: {},
  };

  return {
    props: { document }
  };
}

export default DocumentShow;
