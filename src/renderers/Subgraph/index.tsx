import { FC, useContext, useState } from "react";
import type { BaseNode } from "src/types";
import { GraphContext } from "src/hooks/useGraphData";
import useConfirmRouteChange from "src/hooks/useConfirmRouteChange";
import { useAccount } from "wagmi";
import Document from "src/renderers/Document";
import usePublisher from "src/hooks/usePublisher";
import Link from "next/link";
import cx from "classnames";
import Graph from "src/components/Icons/Graph";
import { IS_BETA } from "src/utils/constants";
import canEditNode from "src/utils/canEditNode";

import dynamic from "next/dynamic";
const SubgraphSidebar = dynamic(
  () => import("src/components/SubgraphSidebar"),
  {
    ssr: false,
  }
);

interface Props {
  node: BaseNode;
  document?: BaseNode;
}

const Subgraph: FC<Props> = ({ node, document }) => {
  const [currentDocument, setCurrentDocument] = useState<BaseNode | undefined>(document);
  const { formik, imagePreview, imageDidChange, clearImage, reloadData } =
    usePublisher(node);

  const { address } = useAccount();
  const { shallowNodes, shallowNodesLoading } = useContext(GraphContext);
  const canEditSubgraph =
    node.tokenId.includes("-") || canEditNode(node, address);

  const subgraphs = shallowNodes
    ? shallowNodes.filter((n) => n.labels.includes("Subgraph") && !n.burnt)
    : [];
  const remainingForBeta = shallowNodesLoading
    ? "?"
    : `${50 - subgraphs.length}`;

  useConfirmRouteChange(
    formik.dirty && formik.status?.status !== "COMPLETE",
    () => {
      const didConfirm = confirm("You have unsaved changes. Discard them?");
      if (didConfirm) formik.resetForm();
      return didConfirm;
    }
  );

  const showSubgraph = node.tokenId.includes("-") ? !!address : true;
  return (
    <>
      {showSubgraph && (
        <SubgraphSidebar
          formik={formik}
          canEdit={canEditSubgraph}
          currentDocument={currentDocument}
          imagePreview={imagePreview}
          imageDidChange={imageDidChange}
          clearImage={clearImage}
          reloadData={reloadData}
          betaIsClosed={IS_BETA && remainingForBeta === "0"}
          autoOpenSidebarOnMobile={node.tokenId.includes("-")}
        />
      )}

      {document ? (
        <div className="md:pl-2 md:ml-52 lg:ml-64 pt-14 md:pr-2 min-h-screen relative">
          <Document node={document} setCurrentDocument={setCurrentDocument} />
        </div>
      ) : (
        <div
          className={cx(`flex h-screen items-center justify-center`, {
            "md:pl-4 md:ml-64": showSubgraph,
          })}
        >
          {address ? (
            <div className="pt-14 absolute left-0 md:left-64 top-0 pointer-events-none">
              <div className="ml-4 p-4 border border-dashed border-color rounded inline-block mr-4 background-color pulse">
                <p className="font-semibold">
                  ↖ Mint a subgraph to publish docs
                </p>
              </div>
            </div>
          ) : (
            <div className="pt-14 absolute right-0 top-0 pointer-events-none">
              <div className="p-4 border border-dashed border-color rounded inline-block mr-4 background-color pulse">
                <p className="font-semibold">
                  Connect a wallet to get started ↑
                </p>
              </div>
            </div>
          )}

          <div className="text-center w-64 flex flex-col items-center">
            <Graph />
            <p className="pb-4 pt-4">
              Welding is a decentralized knowledge graph protocol, built with
              Ethereum & IPFS, and deployed to Polygon.
            </p>

            <Link href={`/4-welding-docs`}>
              <a>
                <p>
                  Explore the <strong>👩‍🏭 Welding Docs ↗</strong>
                </p>
              </a>
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export default Subgraph;
