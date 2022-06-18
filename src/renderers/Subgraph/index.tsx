import { FC, useContext } from "react";
import NodeMeta from "src/components/NodeMeta";

import { GraphContext } from "src/hooks/useGraphData";
import { ModalContext } from "src/hooks/useModal";
import useConfirmRouteChange from "src/hooks/useConfirmRouteChange";
import getRelatedNodes from "src/utils/getRelatedNodes";

import type { BaseNode } from "src/types";

import { useSigner, useConnect, useAccount } from "wagmi";
import Document from "src/renderers/Document";

import withPublisher from "src/hoc/withPublisher";

import dynamic from "next/dynamic";
const SubgraphSidebar = dynamic(
  () => import("src/components/SubgraphSidebar"),
  {
    ssr: false,
  }
);

interface Props extends WithPublisherProps {
  node: BaseNode;
  document?: BaseNode;
}

const Subgraph: FC<Props> = ({
  document,
  formik,
  imageDidChange,
  imagePreview,
  clearImage,
  reloadData,
}) => {
  const node = formik.values.__node__;
  const { isConnecting } = useConnect();
  const { data: signer } = useSigner();
  const { data: account } = useAccount();
  const { accountData, loadAccountData, canEditNode } =
    useContext(GraphContext);
  const { openModal } = useContext(ModalContext);

  const canEditSubgraph = node.tokenId.startsWith("-") || canEditNode(node);

  const canEditDocument = document ? canEditNode(document) : canEditSubgraph;

  const subgraphTopics = getRelatedNodes(
    node,
    "incoming",
    "Topic",
    "DESCRIBES"
  );

  const documentTopics = document
    ? getRelatedNodes(document, "incoming", "Topic", "DESCRIBES")
    : [];

  useConfirmRouteChange(
    formik.dirty && formik.status?.status !== "COMPLETE",
    () => {
      const didConfirm = confirm("You have unsaved changes. Discard them?");
      if (didConfirm) formik.resetForm();
      return didConfirm;
    }
  );

  //useEffect(() => {
  //  if (account?.address) {
  //    window.document.body.style.backgroundImage = null;
  //  } else {
  //    window.document.body.style.backgroundImage =
  //      'url(https://media.giphy.com/media/XrnJ3ofl5DCtG/giphy.gif)';
  //  }
  //}, [account]);

  const showSubgraph = node.tokenId.startsWith("-") ? !!account?.address : true;

  const showDocument = document?.tokenId.startsWith("-")
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
          reloadData={reloadData}
        />
      )}

      {document && showDocument && (
        <div className="md:pl-4 md:ml-64 pt-14">
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
};

export default withPublisher("Subgraph", Subgraph);
