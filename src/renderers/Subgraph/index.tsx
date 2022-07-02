import { FC, useContext } from "react";
import type { BaseNode } from "src/types";
import NodeMeta from "src/components/NodeMeta";
import { GraphContext } from "src/hooks/useGraphData";
import useConfirmRouteChange from "src/hooks/useConfirmRouteChange";
import { useAccount } from "wagmi";
import Document from "src/renderers/Document";
import withPublisher from "src/hooks/withPublisher";
import Link from "next/link";
import cx from "classnames";
import Graph from "src/components/Icons/Graph";

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
  const { formik, imagePreview, imageDidChange, clearImage, reloadData } =
    withPublisher(node);

  const { data: account } = useAccount();
  const { canEditNode } = useContext(GraphContext);
  const canEditSubgraph = node.tokenId.startsWith("-") || canEditNode(node);

  useConfirmRouteChange(
    formik.dirty && formik.status?.status !== "COMPLETE",
    () => {
      const didConfirm = confirm("You have unsaved changes. Discard them?");
      if (didConfirm) formik.resetForm();
      return didConfirm;
    }
  );

  const showSubgraph = node.tokenId.startsWith("-") ? !!account?.address : true;
  return (
    <>
      {!document && <NodeMeta formik={formik} />}

      {showSubgraph && (
        <SubgraphSidebar
          formik={formik}
          canEdit={canEditSubgraph}
          currentDocument={document}
          imagePreview={imagePreview}
          imageDidChange={imageDidChange}
          clearImage={clearImage}
          reloadData={reloadData}
        />
      )}

      {document ? (
        <div className="md:pl-4 md:ml-64 pt-14">
          <Document node={document} />
        </div>
      ) : (
        <div
          className={cx(`flex h-screen items-center justify-center`, {
            "md:pl-4 md:ml-64": showSubgraph,
          })}
        >
          {account?.address ? (
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
