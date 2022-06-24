import { FC, useContext, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

import { useAccount, useSigner } from "wagmi";
import { GraphContext } from "src/hooks/useGraphData";
import { NavContext } from "src/hooks/useNav";
import { ModalContext, ModalType } from "src/hooks/useModal";

import useConfirmRouteChange from "src/hooks/useConfirmRouteChange";
import slugifyNode from "src/utils/slugifyNode";
import EditNav from "src/components/EditNav";
import NodeImage from "src/components/NodeImage";
import NodeMeta from "src/components/NodeMeta";
import Actions from "src/components/Actions";
import Frontmatter from "src/components/Frontmatter";
import TopicManager from "src/components/TopicManager";
import withPublisher from "src/hoc/withPublisher";
import {
  getRelatedNodes,
  stageNodeRelations,
} from "src/lib/makeBaseNodeFormik";
import extractTokenIdsFromContentBlocks from "src/utils/extractTokenIdsFromContentBlocks";
import { textPassive } from "src/utils/theme";

import dynamic from "next/dynamic";
const Editor = dynamic(() => import("src/components/Editor"), {
  ssr: false,
});

interface Props extends WithPublisherProps {
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

const Document: FC<Props> = ({
  formik,
  imageDidChange,
  imagePreview,
  clearImage,
  reloadData,
}) => {
  const node = formik.values.__node__;
  const router = useRouter();

  const { data: account } = useAccount();
  const { data: signer } = useSigner();
  const { accountData, loadAccountData, canEditNode, shallowNodes } =
    useContext(GraphContext);
  const { openModal } = useContext(ModalContext);
  const { setContent } = useContext(NavContext);

  const canEdit = node.tokenId.startsWith("-") || canEditNode(node);

  const canAdd = !!accountData;

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

  const references = getRelatedNodes(
    formik,
    "incoming",
    "BaseNode",
    "REFERENCED_BY"
  );

  const subgraphParent = getRelatedNodes(
    formik,
    "outgoing",
    "Subgraph",
    "BELONGS_TO"
  )[0];
  const showStashInfo =
    !node.burnt &&
    router.query.nid &&
    router.query.nid.split("-")[0] !== subgraphParent?.tokenId;

  return (
    <>
      <NodeMeta formik={formik} />
      <div className="pt-2 md:pt-8">
        <div className="content pb-4 mx-auto">
          <div
            className={`flex justify-${
              showStashInfo || node.burnt ? "between" : "end"
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
            label="document"
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

export default withPublisher("Document", Document);
