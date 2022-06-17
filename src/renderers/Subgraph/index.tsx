import { FC, useContext, useState, useEffect } from 'react';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import NodeMeta from 'src/components/NodeMeta';

import { GraphContext } from 'src/hooks/useGraphData';
import { ModalContext, ModalType } from 'src/hooks/useModal';
import useConfirmRouteChange from 'src/hooks/useConfirmRouteChange';
import useEditableImage from 'src/hooks/useEditableImage';
import makeFormikForBaseNode from 'src/lib/makeBaseNodeFormik';
import slugify from 'src/utils/slugify';
import slugifyNode from 'src/utils/slugifyNode';
import getRelatedNodes from 'src/utils/getRelatedNodes';

import type {
  BaseNodeFormValues,
  MintState,
  BaseNode,
  Account
} from 'src/types';

import { useSigner, useConnect, useAccount } from 'wagmi';
import { useFormik, FormikProps } from 'formik';
import * as yup from 'yup';

import Tile from 'src/components/Tile';
import VerticalDots from 'src/components/Icons/VerticalDots';
import NodeImage from 'src/components/NodeImage';
import Frontmatter from 'src/components/Frontmatter';
import EditNav from 'src/components/EditNav';
import TopicManager from 'src/components/TopicManager';
import SubgraphSwitcher from 'src/components/Modals/SubgraphSwitcher';
import Document from 'src/renderers/Document';
import Graph from 'src/components/Icons/Graph';

import withPublisher from 'src/hoc/withPublisher';

import Client from 'src/lib/Client';
import Welding from 'src/lib/Welding';

import dynamic from 'next/dynamic';
const SubgraphSidebar = dynamic(() => import('src/components/SubgraphSidebar'), {
  ssr: false
});

interface Props extends WithPublisherProps {
  node: BaseNode
  document?: BaseNode,
};

const Subgraph: FC<Props> = ({
  node,
  document,

  formik,
  imageDidChange,
  imagePreview,
  clearImage
}) => {
  const router = useRouter();
  const { isConnecting } = useConnect();
  const { data: signer } = useSigner();
  const { data: account } = useAccount();
  const { accountData, loadAccountData } = useContext(GraphContext);
  const { openModal } = useContext(ModalContext);

  const canEditSubgraph =
    node.tokenId.startsWith('-') ||
    accountData?.roles.find(r => r.tokenId === node.tokenId);

  const canEditDocument = document
    ? accountData?.roles.find(r => r.tokenId === document.tokenId)
    : canEditSubgraph;

  const subgraphTopics =
    getRelatedNodes(node, 'incoming', 'Topic', 'DESCRIBES');

  const documentTopics = document
    ? getRelatedNodes(document, 'incoming', 'Topic', 'DESCRIBES')
    : [];

  useConfirmRouteChange(formik.dirty, () => {
    return confirm(
      "You have unsaved changes. Discard them?"
    );
  });

  //useEffect(() => {
  //  if (account?.address) {
  //    window.document.body.style.backgroundImage = null;
  //  } else {
  //    window.document.body.style.backgroundImage =
  //      'url(https://media.giphy.com/media/XrnJ3ofl5DCtG/giphy.gif)';
  //  }
  //}, [account]);

  const showSubgraph = node.tokenId.startsWith('-')
    ? !!account?.address
    : true;

  const showDocument = document?.tokenId.startsWith('-')
    ? canEditSubgraph
    : true;

  return (
    <>
      {!document && <NodeMeta formik={formik} />}

      {showSubgraph && (
        <SubgraphSidebar
          formik={formik}
          canEdit={canEditSubgraph}
          currentDocument={document}
        />
      )}

      {document && showDocument && (
        <div className="pl-4 ml-64 pt-14">
          <Document node={document} />
        </div>
      )}

      {/*!(account?.address) && (
        <div
          className="pt-14 absolute right-0 top-0 pointer-events-none">
          <div className="p-4 border border-dashed border-color rounded inline-block mr-4 background-color">
            <p className="font-semibold">
              Connect a wallet to get started ↑
            </p>
          </div>
        </div>
      )*/}

      {/*account?.address && subgraph.tokenId.startsWith('-') && (
        <div
          className="pl-4 ml-64 pt-14 pointer-events-none">
          <div className="ml-4 p-4 border border-dashed border-color rounded inline-block mr-4 background-color">
            <p className="font-semibold">
              ← Mint a subgraph to publish docs
            </p>
          </div>
        </div>
      )*/}
    </>
  );
}

export default withPublisher("Subgraph", Subgraph);
