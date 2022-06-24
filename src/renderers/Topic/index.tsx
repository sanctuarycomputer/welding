import { FC, useContext, useEffect } from "react";
import { ModalContext, ModalType } from "src/hooks/useModal";
import type { GetServerSideProps } from "next";
import { GraphContext } from "src/hooks/useGraphData";
import { NavContext } from "src/hooks/useNav";
import EditNav from "src/components/EditNav";
import { useRouter } from "next/router";
import Link from "next/link";
import TopicTile from "src/components/TopicTile";
import type { BaseNode } from "src/types";
import Client from "src/lib/Client";
import slugifyNode from "src/utils/slugifyNode";
import Document from "src/components/Icons/Document";
import Graph from "src/components/Icons/Graph";
import Card from "src/components/Card";
import NodeImage from "src/components/NodeImage";
import NodeMeta from "src/components/NodeMeta";
import Actions from "src/components/Actions";
import { bg, border } from "src/utils/theme";
import useConfirmRouteChange from "src/hooks/useConfirmRouteChange";

import withPublisher from "src/hoc/withPublisher";

interface Props extends WithPublisherProps {
  node: BaseNode;
}

const TopicsShow: FC<Props> = ({
  formik,
  imageDidChange,
  imagePreview,
  clearImage,
  reloadData,
}) => {
  const node = formik.values.__node__;
  const { canEditNode } = useContext(GraphContext);
  const { openModal, closeModal } = useContext(ModalContext);
  const { content, setContent } = useContext(NavContext);

  useConfirmRouteChange(
    formik.dirty && formik.status?.status !== "COMPLETE",
    () => {
      const didConfirm = confirm("You have unsaved changes. Discard them?");
      if (didConfirm) formik.resetForm();
      return didConfirm;
    }
  );

  const router = useRouter();
  let { collection } = router.query;
  if (!collection) collection = "subgraphs";
  const canEdit = canEditNode(node);

  /* Content */
  useEffect(() => {
    setContent(
      <EditNav
        formik={formik}
        buttonLabel={formik.isSubmitting ? "Loading..." : "Publish"}
      />
    );
  }, [formik.isSubmitting, formik.isValid, formik.dirty]);

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
      <NodeMeta formik={formik} />

      <div className="pt-12 md:pt-20">
        <div className="content py-4 mx-auto">
          <div className={`flex justify-${node.burnt ? "between" : "end"} pb-2`}>
            {node.burnt && (
              <p className="text-red-500 pl-2 md:pl-0">This node was burnt and can no longer be used.</p>
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
                          closeModal();
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
                type="text"
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
                          {
                            node.currentRevision.metadata.properties.emoji
                              .native
                          }{" "}
                          {node.currentRevision.metadata.name}
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  let { tid } = context.query;
  tid = ((Array.isArray(tid) ? tid[0] : tid) || "").split("-")[0];
  const node = await Client.fetchBaseNodeByTokenId(tid);
  if (!node || !node.labels.includes("Topic"))
    return {
      redirect: { permanent: false, destination: `/` },
      props: {},
    };

  return { props: { node } };
};

export default withPublisher("Topic", TopicsShow);
