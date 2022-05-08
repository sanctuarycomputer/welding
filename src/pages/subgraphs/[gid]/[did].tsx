import { FC, useContext } from 'react';
import { GraphContext } from 'src/hooks/useGraphData';
import { ModalContext, ModalType } from 'src/hooks/useModal';
import useConfirmRouteChange from 'src/hooks/useConfirmRouteChange';
import useEditableImage from 'src/hooks/useEditableImage';
import makeFormikForBaseNode from 'src/lib/makeBaseNodeFormik';
import type { GetServerSideProps } from 'next';
import type { BaseNodeFormValues, MintState, BaseNode, Account } from 'src/types';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSigner, useConnect, useAccount } from 'wagmi';
import { useFormik, FormikProps } from 'formik';
import * as yup from 'yup';

import Tile from 'src/components/Tile';
import VerticalDots from 'src/components/Icons/VerticalDots';
import NodeImage from 'src/components/NodeImage';
import Frontmatter from 'src/components/Frontmatter';
import SubgraphSidebar from 'src/components/SubgraphSidebar';
import EditNav from 'src/components/EditNav';
import TopicManager from 'src/components/TopicManager';
import SubgraphSwitcher from 'src/components/Modals/SubgraphSwitcher';
import DocumentShow from 'src/pages/documents/[did]';

import Client from 'src/lib/Client';
import Welding from 'src/lib/Welding';
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('src/components/Editor'), {
  ssr: false
});

type Props = {
  subgraph: BaseNode,
  document?: BaseNode,
  mintMode?: boolean
};

const GraphsDocumentMint: FC<Props> = ({
  subgraph,
  document,
  mintMode
}) => {
  const subject = document || subgraph;
  const router = useRouter();

  const { isConnecting } = useConnect();
  const { data: signer } = useSigner();
  const { data: account } = useAccount();
  const { accountData } = useContext(GraphContext);
  const { openModal } = useContext(ModalContext);

  let canEditSubgraph = false;
  if (accountData && (
    accountData.adminOf.find(n => n.tokenId === subgraph.tokenId) ||
    accountData.editorOf.find(n => n.tokenId === subgraph.tokenId)
  )) canEditSubgraph = true;

  let canEditDocument = false;
  if (document) {
    if (accountData && (
      accountData.adminOf.find(n => n.tokenId === document.tokenId) ||
      accountData.editorOf.find(n => n.tokenId === document.tokenId)
    )) canEditDocument = true;
  } else {
    canEditDocument = canEditSubgraph;
  }

  const subgraphDocuments = subgraph.backlinks.filter(n =>
    n.labels.includes('Document')
  );
  const subgraphTopics = subgraph.backlinks.filter(n =>
    n.labels.includes('Topic')
  );
  const documentTopics = (document?.backlinks || []).filter(n =>
    n.labels.includes('Topic')
  );

  const [topics, setTopics] =
    useState<BaseNode[]>(documentTopics);

  const hasTopicChanges = (
    JSON.stringify(topics.map(t => t.tokenId)) !==
    JSON.stringify(documentTopics.map(t => t.tokenId))
  );

  const formik = makeFormikForBaseNode(document);
  const [documentImagePreview, documentImageDidChange] =
    useEditableImage(formik);

  const subgraphFormik = makeFormikForBaseNode(subgraph);

  const unsavedChanges = formik.dirty || hasTopicChanges;
  useConfirmRouteChange(unsavedChanges, () => {
    return confirm("You have unsaved changes. Discard them?");
  });

  return (
    <>
      <SubgraphSidebar
        subgraphFormik={subgraphFormik}
        canEdit={canEditSubgraph}
        documents={subgraphDocuments}
        currentDocument={document}
      />

      <div className="ml-64 pl-4 pt-12">
        {document && <DocumentShow document={document} />}
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  let { gid, did, m } = context.query;
  gid = ((Array.isArray(gid) ? gid[0] : gid) || '').split('-')[0];
  const subgraph =
    await Client.fetchBaseNodeByTokenId(gid);
  if (!subgraph || !subgraph.labels.includes('Subgraph')) return {
    redirect: { permanent: false, destination: `/` },
    props: {},
  };

  did = ((Array.isArray(did) ? did[0] : did) || '').split('-')[0];
  const document =
    await Client.fetchBaseNodeByTokenId(did);
  if (!document || !document.labels.includes('Document')) return {
    redirect: { permanent: false, destination: `/subgraphs/${subgraph.tokenId}`},
    props:{},
  };

  return {
    props: {
      key: `${subgraph.tokenId}-${document.tokenId}`,
      subgraph,
      document
    }
  };
}

export default GraphsDocumentMint;
