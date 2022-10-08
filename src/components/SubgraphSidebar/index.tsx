import update from "immutability-helper";
import {
  FC,
  useRef,
  useEffect,
  useContext,
  useState,
  useCallback,
  ChangeEvent,
} from "react";
import { GraphContext } from "src/hooks/useGraphData";
import { ModalContext, ModalType } from "src/hooks/useModal";
import Link from "next/link";
import type { BaseNodeFormValues, BaseNode } from "src/types";
import type { FormikProps } from "formik";
import Button from "src/components/Button";
import slugifyNode from "src/utils/slugifyNode";

import TextareaAutosize from "react-textarea-autosize";
import DraggableDocumentLink from "./DraggableDocumentLink";
import Document from "src/components/Icons/Document";
import Menu from "src/components/Icons/Menu";
import Actions from "src/components/Actions";
import NodeImage from "src/components/NodeImage";
import TopicManager from "src/components/TopicManager";
import getRelatedNodes from "src/utils/getRelatedNodes";
import { bg, border, textPassive } from "src/utils/theme";
import { BaseEmoji } from "emoji-mart";
import { IS_BETA } from "src/utils/constants";

type Props = {
  formik: FormikProps<BaseNodeFormValues>;
  canEdit: boolean;
  currentDocument?: BaseNode;
  imagePreview: string | null;
  imageDidChange: (e: ChangeEvent<HTMLInputElement>) => void;
  clearImage: () => void;
  reloadData: (tx: any) => Promise<void>;
  betaIsClosed: boolean;
  autoOpenSidebarOnMobile: boolean;
};

const SubgraphSidebar: FC<Props> = ({
  formik,
  canEdit,
  currentDocument,
  imagePreview,
  imageDidChange,
  clearImage,
  reloadData,
  betaIsClosed,
  autoOpenSidebarOnMobile,
}) => {
  const { dummyNodes, dummyNodesLoading } = useContext(GraphContext);
  const { openModal, closeModal } = useContext(ModalContext);
  const [mobileOpen, setMobileOpen] = useState(autoOpenSidebarOnMobile);

  const emoji = formik.values.emoji.native;
  const subgraph = formik.values.__node__;

  const subgraphDummyNodes = dummyNodes.filter((node) => {
    const nodeType = node.labels.filter((l) => l !== "BaseNode")[0];
    if (nodeType !== "Document") return false;
    return !!node.outgoing.find((e) => {
      return (
        e.active && e.name === "BELONGS_TO" && e.tokenId === subgraph.tokenId
      );
    });
  });

  const topics = getRelatedNodes(subgraph, "incoming", "Topic", "DESCRIBES");
  const documents = getRelatedNodes(
    subgraph,
    "incoming",
    "Document",
    "BELONGS_TO"
  );
  const stashedDocuments = getRelatedNodes(
    subgraph,
    "incoming",
    "Document",
    "STASHED_BY"
  );

  const allDocumentNodes = [...documents, ...stashedDocuments];

  const stashedSubgraphs = getRelatedNodes(
    subgraph,
    "incoming",
    "Subgraph",
    "STASHED_BY"
  );

  const descriptionPresent =
    !!formik.values.description && formik.values.description.length > 0;

  const sortOrder =
    subgraph.currentRevision.metadata?.properties.ui
      ?.subgraphSidebarDocumentSortOrder || [];
  const [documentNodes, setDocumentNodes] = useState(
    allDocumentNodes.sort(function (a, b) {
      return sortOrder.indexOf(a.tokenId) - sortOrder.indexOf(b.tokenId);
    })
  );

  const moveDocumentNode = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      setDocumentNodes((prevDocumentNodes: BaseNode[]) =>
        update(prevDocumentNodes, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, prevDocumentNodes[dragIndex] as BaseNode],
          ],
        })
      );
    },
    []
  );

  const isMounted = useRef(false);
  useEffect(() => {
    if (isMounted.current) {
      const newSortOrder = documentNodes.map((d) => d.tokenId);
      formik.setFieldValue("ui", {
        ...formik.values.ui,
        subgraphSidebarDocumentSortOrder: newSortOrder,
      });
    } else {
      isMounted.current = true;
    }
  }, [documentNodes]);

  const renderDocumentLink = useCallback(
    (documentNode: BaseNode, index: number) => {
      return (
        <DraggableDocumentLink
          key={documentNode.tokenId}
          index={index}
          id={documentNode.tokenId}
          node={documentNode}
          subgraph={subgraph}
          move={moveDocumentNode}
          isStashed={stashedDocuments.indexOf(documentNode) > -1}
          isCurrent={documentNode.tokenId === currentDocument?.tokenId}
        />
      );
    },
    [currentDocument?.tokenId, moveDocumentNode, stashedDocuments, subgraph]
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="absolute pl-2 flex py-4 items-center z-10"
      >
        <Menu />
        <p className="ml-1 font-semibold">
          {emoji} {formik.values.name}
        </p>
      </button>

      <div
        onClick={() => setMobileOpen(!mobileOpen)}
        className={`${bg} w-full top-0 bottom-0 fixed z-30 md:z-10 curtain ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:-translate-x-full`}
      ></div>

      <nav
        className={`${bg} ${border} ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed top-0 bottom-0 inline-block w-64 md:w-52 lg:w-64 border-r z-40 md:z-20 transition-transform ease-in-out duration-500`}
      >
        <div className="pl-2 pr-1 pt-4 text-xs flex items-center">
          <p
            className={`${
              canEdit ? "cursor-pointer" : "pointer-events-none"
            } mr-1 py-1`}
            onClick={() =>
              canEdit &&
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
            {emoji}
          </p>
          <input
            readOnly={!canEdit}
            type="text"
            name="name"
            className={`${
              canEdit ? "cursor-edit" : "pointer-events-none"
            } font-semibold`}
            placeholder={`Subgraph name`}
            autoFocus={subgraph.tokenId.includes("-")}
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />

          <Actions
            node={subgraph}
            canEdit={canEdit}
            imageDidChange={imageDidChange}
            allowConnect={!subgraph.tokenId.includes("-")}
            allowSettings={!subgraph.tokenId.includes("-")}
            reloadData={reloadData}
          />
        </div>

        <div className={`${bg} flex flex-col`}>
          <NodeImage
            showDefault={false}
            readOnly={!canEdit}
            imagePreview={imagePreview}
            imageDidChange={imageDidChange}
            clearImage={clearImage}
          />

          {subgraph.burnt && (
            <p className="text-red-500 px-2">This node was burnt.</p>
          )}

          {(descriptionPresent || canEdit) && (
            <div className={`border-b ${border}`}>
              <TextareaAutosize
                minRows={2}
                style={{ resize: "none" }}
                readOnly={!canEdit}
                className={`${
                  canEdit ? "cursor-edit" : "pointer-events-none"
                } block pb-2 w-full bg-transparent text-xs px-2 pt-1`}
                name="description"
                placeholder="Add a description"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
            </div>
          )}

          {(topics.length || canEdit) && (
            <div className="px-2 pt-2">
              <TopicManager readOnly={!canEdit} formik={formik} />
            </div>
          )}

          <div className="pb-2 px-2 pt-2">
            <div className="flex justify-between">
              <p
                className={`${textPassive} pb-2 font-semibold tracking-wide uppercase`}
              >
                Documents
              </p>
              {canEdit && !subgraph.tokenId.includes("-") && (
                <Link href={`/${slugifyNode(subgraph)}/mint`}>
                  <a className="pb-2 text-xs opacity-60 hover:opacity-100">
                    + New
                  </a>
                </Link>
              )}
            </div>

            {canEdit
              ? documentNodes.map((n, i) => renderDocumentLink(n, i))
              : documentNodes.map((d) => {
                  const isStashed = stashedDocuments.indexOf(d) > -1;
                  if (d.tokenId === currentDocument?.tokenId) {
                    return (
                      <p key={d.tokenId} className="text-xs font-semibold pb-1">
                        {isStashed ? "↗ " : ""}
                        {d.currentRevision.nativeEmoji} {d.currentRevision.name}
                      </p>
                    );
                  }
                  return (
                    <Link
                      key={d.tokenId}
                      href={`/${slugifyNode(subgraph)}/${slugifyNode(d)}`}
                    >
                      <a className="block text-xs pb-1">
                        {isStashed ? "↗ " : ""}
                        {d.currentRevision.nativeEmoji} {d.currentRevision.name}
                      </a>
                    </Link>
                  );
                })}

            {documentNodes.length === 0 && (
              <div className="flex flex-col items-center py-8 opacity-50">
                <Document />
                <p className="pt-1 text-center">
                  {subgraph.tokenId.includes("-")
                    ? "Publish this subgraph to start writing."
                    : "No documents (yet)"}
                </p>
              </div>
            )}

            {subgraphDummyNodes.length > 0 && (
              <div className="flex justify-between">
                <p
                  className={`${textPassive} py-2 font-semibold tracking-wide uppercase`}
                >
                  Drafts
                </p>
              </div>
            )}
            {subgraphDummyNodes.map((s) => {
              if (s.tokenId === currentDocument.tokenId)
                return (
                  <p key={s.tokenId} className="text-xs font-semibold pb-1">
                    {s.currentRevision.nativeEmoji} {s.currentRevision.name}
                  </p>
                );
              return (
                <Link
                  key={s.tokenId}
                  href={`/${slugifyNode(subgraph)}/mint?tokenId=${s.tokenId}`}
                >
                  <a className="block text-xs pb-1">
                    {s.currentRevision.nativeEmoji} {s.currentRevision.name}
                  </a>
                </Link>
              );
            })}

            {stashedSubgraphs.length > 0 && (
              <div className="flex justify-between">
                <p
                  className={`${textPassive} py-2 font-semibold tracking-wide uppercase`}
                >
                  Subgraphs
                </p>
              </div>
            )}

            {stashedSubgraphs.map((s) => {
              return (
                <Link key={s.tokenId} href={`/${slugifyNode(s)}`}>
                  <a className="block text-xs pb-1">
                    ↗ {s.currentRevision.nativeEmoji} {s.currentRevision.name}
                  </a>
                </Link>
              );
            })}
          </div>

          {formik.dirty && (
            <div
              className={`absolute w-full bottom-0 text-center border-t ${border}`}
            >
              <div className="flex px-2 py-4 justify-between">
                {IS_BETA && betaIsClosed ? (
                  <div className="basis-0 flex-grow bg-yellow-400 text-stone-800 font-medium text-xs px-2 py-1 rounded-full mr-2 text-center">
                    Beta is closed
                  </div>
                ) : (
                  <>
                    <div className="basis-0 flex-grow bg-yellow-400 text-stone-800 font-medium text-xs px-2 py-1 rounded-full mr-2 text-center">
                      Unsaved
                    </div>
                    <Button
                      className="basis-0 flex-grow"
                      disabled={
                        formik.isSubmitting || !(formik.isValid && formik.dirty)
                      }
                      onClick={formik.handleSubmit}
                      label={"Publish"}
                    />
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default SubgraphSidebar;
