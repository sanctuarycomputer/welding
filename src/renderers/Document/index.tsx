import { FC, useContext, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { GraphContext } from "src/hooks/useGraphData";
import { NavContext } from "src/hooks/useNav";
import useConfirmRouteChange from "src/hooks/useConfirmRouteChange";
import slugifyNode from "src/utils/slugifyNode";
import EditNav from "src/components/EditNav";
import NodeImage from "src/components/NodeImage";
import NodeMeta from "src/components/NodeMeta";
import Actions from "src/components/Actions";
import Frontmatter from "src/components/Frontmatter";
import TopicManager from "src/components/TopicManager";
import withPublisher from "src/hooks/withPublisher";
import { getRelatedNodes, stageNodeRelations } from "src/lib/useBaseNodeFormik";
import extractTokenIdsFromContentBlocks from "src/utils/extractTokenIdsFromContentBlocks";
import { textPassive } from "src/utils/theme";
import { diff } from "deep-object-diff";

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
    const name = subgraph.currentRevision.metadata.name;
    const emoji = subgraph.currentRevision.metadata.properties.emoji.native;
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
  const { formik, imagePreview, imageDidChange, clearImage, reloadData } =
    withPublisher(node);

  const router = useRouter();
  let nid = router.query.nid;
  nid = Array.isArray(nid) ? nid[0] : nid;

  const { canEditNode, shallowNodes } = useContext(GraphContext);
  const { setContent } = useContext(NavContext);

  const subgraphParent = getRelatedNodes(
    formik,
    "outgoing",
    "Subgraph",
    "BELONGS_TO"
  )[0];

  const canEdit = node.tokenId.startsWith("-")
    ? canEditNode(subgraphParent)
    : canEditNode(node);

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

  // We assume that shallowNodes is always up to date.
  useEffect(() => {
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
  }, [formik.values.content, shallowNodes]);

  const isMounted = useRef(false);
  const label = node.labels.filter((l) => l !== "BaseNode")[0] || "Document";
  const draftKey = `-welding:Drafts:${label}:${node.tokenId}`;
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (isMounted.current) {
        if (formik.dirty) {
          const draft = {
            name: formik.values.name,
            description: formik.values.description,
            content: formik.values.content,
          };
          window.localStorage.setItem(draftKey, JSON.stringify(draft));
        } else {
          window.localStorage.removeItem(draftKey);
        }
      } else {
        let draft: any = window.localStorage.getItem(draftKey);
        if (draft) {
          draft = JSON.parse(draft);
          if (draft && draft.name && draft.name !== formik.values.name) {
            formik.setFieldValue("name", draft.name);
          }
          if (
            draft &&
            draft.description &&
            draft.description !== formik.values.description
          ) {
            formik.setFieldValue("description", draft.description);
          }
          const contentDiff: any = diff(draft.content, formik.values.content);
          if (draft && draft.content && contentDiff.blocks) {
            formik.setFieldValue("content", draft.content);
          }
        }
        isMounted.current = true;
      }
    }
  }, [formik.values]);

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
      <NodeMeta formik={formik} />
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
          <TopicManager
            formik={formik}
            readOnly={!canEdit || formik.isSubmitting}
          />
          <Editor
            readOnly={!canEdit || formik.isSubmitting}
            content={formik.values.content}
            contentDidChange={(content) =>
              formik.setFieldValue("content", content)
            }
          />

          {references.length > 0 && (
            <>
              <div className="flex justify-between ">
                <p
                  className={`${textPassive} pb-2 font-semibold tracking-wide uppercase`}
                >
                  In-Graph References
                </p>
              </div>
              <ol className="list-decimal text-xs list-inside">
                {references.map((n) => {
                  const name = n.currentRevision.metadata.name;
                  const emoji =
                    n.currentRevision.metadata.properties.emoji.native;
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
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Document;
