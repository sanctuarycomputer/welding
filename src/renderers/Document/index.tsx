import { FC, useContext, useState, useEffect } from 'react';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';

import { useAccount, useSigner } from 'wagmi';
import { GraphContext } from 'src/hooks/useGraphData';
import { NavContext } from 'src/hooks/useNav';
import { ModalContext, ModalType } from 'src/hooks/useModal';
import useEditableImage from 'src/hooks/useEditableImage';
import makeFormikForBaseNode from 'src/lib/makeBaseNodeFormik';

import slugifyNode from 'src/utils/slugifyNode';
import EditNav from 'src/components/EditNav';
import NodeImage from 'src/components/NodeImage';
import NodeMeta from 'src/components/NodeMeta';
import Actions from 'src/components/Actions';
import Frontmatter from 'src/components/Frontmatter';
import TopicManager from 'src/components/TopicManager';
import Tile from 'src/components/Tile';
import VerticalDots from 'src/components/Icons/VerticalDots';
import Connect from 'src/components/Icons/Connect';

import Client from 'src/lib/Client';
import getRelatedNodes from 'src/utils/getRelatedNodes';
import withPublisher from 'src/hoc/withPublisher';

import dynamic from 'next/dynamic';
const Editor = dynamic(() => import('src/components/Editor'), {
  ssr: false
});

interface Props extends WithPublisherProps {
  node: BaseNode;
};

const DocumentStashInfo = ({
  subgraph
}) => {
  if (subgraph) {
    const name = subgraph.currentRevision.metadata.name;
    const emoji = subgraph.currentRevision.metadata.properties.emoji.native;
    return (
      <p>
        <span
          className="opacity-50"
        >
          Stashed from{' '}
        </span>
        <Link href={`/${slugifyNode(subgraph)}`}>
          <a className="opacity-50 hover:opacity-100">↗ {emoji} {name}</a>
        </Link>
      </p>
    );
  } else {
    return <p className="opacity-50">This document does not have a subgraph.</p>
  }
};

const Document: FC<Props> = ({
  node,

  formik,
  imageDidChange,
  imagePreview,
  clearImage
}) => {
  const router = useRouter();

  const { data: account } = useAccount();
  const { data: signer } = useSigner();
  const { accountData, loadAccountData } = useContext(GraphContext);
  const { openModal } = useContext(ModalContext);
  const { setContent } = useContext(NavContext);

  const canEdit =
    node.tokenId.startsWith("-") ||
    accountData?.roles.find(r => r.tokenId === node.tokenId);

  const canAdd = !!accountData;

  const documentTopics = getRelatedNodes(
    node,
    'incoming',
    'Topic',
    'DESCRIBES'
  );

  useEffect(() => {
    if (!canEdit || !formik.dirty) return setContent(null);
    setContent(
      <EditNav
        formik={formik}
        buttonLabel={formik.isSubmitting
          ? "Loading..."
          : "Publish"}
      />
    );
  }, [canEdit, formik]);

  const triggerConnect = () => {
    openModal({
      type: ModalType.SUBGRAPH_CONNECTOR,
      meta: { node }
    });
  };

  const subgraphParent = getRelatedNodes(
    node,
    'outgoing',
    'Subgraph',
    'BELONGS_TO'
  )[0];

  const showStashInfo = (
    router.query.nid.split('-')[0] !== subgraphParent?.tokenId
  );

  return (
    <>
      <NodeMeta formik={formik} />

      <div className="pt-8">
        <div className="content pb-4 mx-auto">
          <div className={`flex justify-${showStashInfo ? 'between' : 'end'} pb-2`}>
            {showStashInfo &&
              <DocumentStashInfo subgraph={subgraphParent} />
            }
            <Actions
              imageDidChange={imageDidChange}
              node={node}
              canEdit={canEdit}
              allowConnect={!node.tokenId.startsWith('-')}
              allowSettings={!node.tokenId.startsWith('-')}
            />
          </div>
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

export default withPublisher("Document", Document);
