import { FC, useContext, useEffect } from "react";
import { ModalContext, ModalType } from "src/hooks/useModal";
import { NavContext } from "src/hooks/useNav";
import EditNav from "src/components/EditNav";
import { useRouter } from "next/router";
import Link from "next/link";
import TopicTile from "src/components/TopicTile";
import type { BaseNode, Edge } from "src/types";
import slugifyNode from "src/utils/slugifyNode";
import Document from "src/components/Icons/Document";
import Graph from "src/components/Icons/Graph";
import Card from "src/components/Card";
import NodeImage from "src/components/NodeImage";
import Actions from "src/components/Actions";
import { bg, border } from "src/utils/theme";
import useConfirmRouteChange from "src/hooks/useConfirmRouteChange";
import usePublisher from "src/hooks/usePublisher";
import { BaseEmoji } from "emoji-mart";
import { useAccount } from "wagmi";
import canEditNode from "src/utils/canEditNode";

interface Props {
  node: BaseNode;
}

const Topic: FC<Props> = ({ node }) => {
  const { address } = useAccount();
  const { formik, imagePreview, imageDidChange, clearImage, reloadData } =
    usePublisher(node);
  const router = useRouter();
  let { collection } = router.query;
  collection =
    (Array.isArray(collection) ? collection[0] : collection) || "subgraphs";
  const { openModal, closeModal } = useContext(ModalContext);
  const { setContent } = useContext(NavContext);

  const canEdit = canEditNode(node, address);

  useConfirmRouteChange(
    formik.dirty && formik.status?.status !== "COMPLETE",
    () => {
      const didConfirm = confirm("You have unsaved changes. Discard them?");
      if (didConfirm) formik.resetForm();
      return didConfirm;
    }
  );

  useEffect(() => {
    if (!canEdit || !formik.dirty) return setContent(null);
    setContent(
      <EditNav
        formik={formik}
        buttonLabel={formik.isSubmitting ? "Loading..." : "Publish"}
      />
    );
  }, [canEdit, formik]);

  const nodesByCollectionType = {
    subgraphs: {},
    documents: {},
  };
  node.outgoing.forEach((e: Edge) => {
    const n = node.related.find((node: BaseNode) => node.tokenId === e.tokenId);
    if (!n) return;
    const collectionType = `${n.labels
      .filter((l) => l !== "BaseNode")[0]
      .toLowerCase()}s`;
    if (!["subgraphs", "documents"].includes(collectionType)) return;
    nodesByCollectionType[collectionType][n.tokenId] = n;
  });
  const nodes: BaseNode[] = Object.values(nodesByCollectionType[collection]);

  return (
    <>
      <div className="pt-12 md:pt-20">
        <div className="content py-4 mx-auto">
          <div
            className={`flex ${
              node.burnt ? "justify-between" : "justify-end"
            } pb-2`}
          >
            {node.burnt && (
              <p className="text-red-500 pl-2 md:pl-0">
                This node was burnt and can no longer be used.
              </p>
            )}
            <Actions
              imageDidChange={imageDidChange}
              node={node}
              canEdit={canEdit}
              allowConnect={false}
              allowSettings
              reloadData={reloadData}
            />
          </div>

          <NodeImage
            showDefault
            readOnly={!canEdit}
            imagePreview={imagePreview}
            imageDidChange={imageDidChange}
            clearImage={clearImage}
          />

          <div
            className="inline-block"
            style={{ transform: "translate(0, -50%)" }}
          >
            {canEdit ? (
              <p
                className={`ml-2 border-2 ${border} ${bg} flex rounded-full text-2xl px-2 py-1 font-medium whitespace-nowrap`}
              >
                <span
                  className="cursor-pointer mr-1"
                  onClick={() =>
                    openModal({
                      type: ModalType.EMOJI_PICKER,
                      meta: {
                        didPickEmoji: (emoji: BaseEmoji) => {
                          formik.setFieldValue("emoji", emoji);
                          closeModal(ModalType.EMOJI_PICKER);
                        },
                      },
                    })
                  }
                >
                  {formik.values.emoji.native}
                </span>{" "}
                #{formik.values.name}
              </p>
            ) : (
              <TopicTile topic={node} textSize="2xl" />
            )}
          </div>

          <div className={`px-2 md:px-0`}>
            {canEdit ? (
              <textarea
                className="pb-4 w-full bg-transparent text-xs px-2 pt-2"
                name="description"
                placeholder="Add a description"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            ) : (
              <p>{formik.values.description || "No description"}</p>
            )}
          </div>

          <div className="border-b border-color flex justify-between">
            <Link href={`/${slugifyNode(node)}?collection=subgraphs`}>
              <a
                className={`p-4 flex-grow basis-0 text-center ${
                  collection === "subgraphs" ? "border-b" : ""
                }`}
              >
                <p>
                  Subgraphs •{" "}
                  {Object.values(nodesByCollectionType["subgraphs"]).length}
                </p>
              </a>
            </Link>

            <Link href={`/${slugifyNode(node)}?collection=documents`}>
              <a
                className={`p-4 flex-grow basis-0 text-center ${
                  collection === "documents" ? "border-b" : ""
                }`}
              >
                <p>
                  Documents •{" "}
                  {Object.values(nodesByCollectionType["documents"]).length}
                </p>
              </a>
            </Link>
          </div>

          {nodes.length === 0 && (
            <div className="flex flex-col pt-16 items-center">
              {collection === "subgraphs" && <Graph />}
              {collection === "documents" && <Document />}
              <p className="pt-4">
                This topic is not used by any {collection}.
              </p>
            </div>
          )}

          {nodes.length !== 0 && collection === "subgraphs" && (
            <div className="">
              {nodes.map((node) => {
                return (
                  <Link key={node.tokenId} href={`/${slugifyNode(node)}`}>
                    <a className="flex relative py-4 px-4 sm:px-0 justify-between items-center flex-row border-b border-color">
                      <div className="flex flex-row items-center py-1 flex-grow">
                        <p className="pr-2 font-semibold w-32 truncate">
                          {node.currentRevision.nativeEmoji}{" "}
                          {node.currentRevision.name}
                        </p>
                      </div>
                    </a>
                  </Link>
                );
              })}
            </div>
          )}

          {nodes.length !== 0 && collection === "documents" && (
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 sm:px-0">
              {nodes.map((node) => {
                return (
                  <Link key={node.tokenId} href={`/${slugifyNode(node)}`}>
                    <a>
                      <Card key={node.tokenId} node={node} />
                    </a>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Topic;
