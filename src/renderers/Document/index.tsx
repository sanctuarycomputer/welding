import { FC, useContext, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { GraphContext } from "src/hooks/useGraphData";
import { NavContext } from "src/hooks/useNav";
import useConfirmRouteChange from "src/hooks/useConfirmRouteChange";
import slugifyNode from "src/utils/slugifyNode";
import canEditNode from "src/utils/canEditNode";
import EditNav from "src/components/EditNav";
import NodeImage from "src/components/NodeImage";
import Actions from "src/components/Actions";
import Frontmatter from "src/components/Frontmatter";
import TopicManager from "src/components/TopicManager";
import usePublisher from "src/hooks/usePublisher";
import { getRelatedNodes, stageNodeRelations } from "src/lib/useBaseNodeFormik";
import extractTokenIdsFromContentBlocks from "src/utils/extractTokenIdsFromContentBlocks";
import { textPassive } from "src/utils/theme";
import { useAccount } from "wagmi";

import dynamic from "next/dynamic";
import { BaseNode } from "src/types";
const Editor = dynamic(() => import("src/components/Editor"), {
  ssr: false,
});

interface Props {
  node: BaseNode;
}

const DocumentStashInfo = ({ subgraph }) => {
  if (subgraph) {
    const name = subgraph.currentRevision.name;
    const emoji = subgraph.currentRevision.nativeEmoji;
    return (
      <p className="pl-2 md:pl-0">
        <span className="opacity-50">Stashed from </span>
        <Link href={`/${slugifyNode(subgraph)}`}>
          <a className="opacity-50 hover:opacity-100">
            ↗ {emoji} {name}
          </a>
        </Link>
      </p>
    );
  } else {
    return (
      <p className="opacity-50">This document does not have a subgraph.</p>
    );
  }
};

const Document: FC<Props> = ({ node }) => {
  const { data: account } = useAccount();
  const { formik, imagePreview, imageDidChange, clearImage, reloadData } =
    usePublisher(node);

  const router = useRouter();
  let nid = router.query.nid;
  nid = Array.isArray(nid) ? nid[0] : nid;

  const { shallowNodes, shallowNodesLoading } = useContext(GraphContext);
  const { setContent } = useContext(NavContext);

  const subgraphParent = getRelatedNodes(
    formik,
    "outgoing",
    "Subgraph",
    "BELONGS_TO"
  )[0];

  const canEdit = node.tokenId.startsWith("-")
    ? canEditNode(subgraphParent, account?.address)
    : canEditNode(node, account?.address);

  useEffect(() => {
    if (!canEdit || !formik.dirty) return setContent(null);
    setContent(
      <EditNav
        formik={formik}
        buttonLabel={formik.isSubmitting ? "Loading..." : "Publish"}
      />
    );
  }, [canEdit, formik]);

  useConfirmRouteChange(
    formik.dirty && formik.status?.status !== "COMPLETE",
    () => {
      const didConfirm = confirm("You have unsaved changes. Discard them?");
      if (didConfirm) formik.resetForm();
      return didConfirm;
    }
  );

  useEffect(() => {
    if (!canEdit) return;
    if (shallowNodesLoading) return;
    if (shallowNodes.length === 0) return;
    const tokenIds = extractTokenIdsFromContentBlocks(
      formik.values.content?.blocks || []
    );
    const referencedNodes = (shallowNodes || []).filter((n) =>
      tokenIds.includes(n.tokenId)
    );
    stageNodeRelations(
      formik,
      "incoming",
      referencedNodes,
      "REFERENCED_BY",
      true
    );
  }, [formik.values.content, shallowNodes, shallowNodesLoading]);

  const references = getRelatedNodes(
    formik,
    "incoming",
    "BaseNode",
    "REFERENCED_BY"
  );

  const showStashInfo =
    !node.burnt && nid && nid.split("-")[0] !== subgraphParent?.tokenId;

  return (
    <>
      <div className="pt-2 md:pt-8">
        <div className="content pb-4 mx-auto">
          <div
            className={`flex ${
              node.burnt ? "justify-between" : "justify-end"
            } pb-2`}
          >
            {node.burnt && (
              <p className="text-red-500">
                This node was burnt and can no longer be used.
              </p>
            )}
            {showStashInfo && <DocumentStashInfo subgraph={subgraphParent} />}
            <Actions
              imageDidChange={imageDidChange}
              node={node}
              canEdit={canEdit}
              allowConnect={!node.tokenId.startsWith("-") && !node.burnt}
              allowSettings={!node.tokenId.startsWith("-")}
              reloadData={reloadData}
            />
          </div>
          <NodeImage
            imagePreview={imagePreview}
            imageDidChange={imageDidChange}
            clearImage={clearImage}
            readOnly={!canEdit || formik.isSubmitting}
          />
          <Frontmatter
            formik={formik}
            readOnly={!canEdit || formik.isSubmitting}
          />
          <div className="pl-2 md:pl-0">
            <TopicManager
              formik={formik}
              readOnly={!canEdit || formik.isSubmitting}
            />
          </div>
          <Editor
            readOnly={!canEdit || formik.isSubmitting}
            content={formik.values.content}
            contentDidChange={(content) =>
              formik.setFieldValue("content", content)
            }
          />

          {references.length > 0 && (
            <div className={`px-2 md:px-0`}>
              <div className="flex justify-between ">
                <p
                  className={`${textPassive} pb-2 font-semibold tracking-wide uppercase`}
                >
                  In-Graph References
                </p>
              </div>
              <ol className="list-decimal text-xs list-inside">
                {references.map((n) => {
                  const name = n.currentRevision.name;
                  const emoji =
                    n.currentRevision.nativeEmoji;
                  return (
                    <li key={n.tokenId}>
                      <Link href={`/${slugifyNode(n)}`}>
                        <a className="opacity-50 hover:opacity-100">
                          {emoji} {name}
                        </a>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Document;
