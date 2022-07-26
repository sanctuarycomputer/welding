import { useContext, useState, useEffect, useRef } from "react";
import { BaseNode } from "src/types";
import { ModalContext, ModalType } from "src/hooks/useModal";
import { GraphContext } from "src/hooks/useGraphData";
import VerticalDots from "src/components/Icons/VerticalDots";
import Connect from "src/components/Icons/Connect";
import Upload from "src/components/Icons/Upload";
import useOutsideAlerter from "src/hooks/useOutsideAlerter";
import Graph from "src/components/Icons/Graph";
import { useSigner, useAccount } from "wagmi";
import makeFormikForBaseNode, {
  stageNodeRelations,
  unstageNodeRelations,
} from "src/lib/useBaseNodeFormik";
import getRelatedNodes from "src/utils/getRelatedNodes";
import { bg, bgHover } from "src/utils/theme";

const List = ({ collection, didPick }) => {
  return collection.map((item) => {
    const name = item.node.currentRevision.metadata.name;
    const emoji = item.node.currentRevision.metadata.properties.emoji.native;
    return (
      <button
        key={item.node.tokenId}
        onClick={() =>
          didPick({
            node: item.node,
            shouldStash: !item.stashed,
          })
        }
        className={`${bgHover} w-full text-left flex flex-row items-center flex-grow`}
      >
        <p className={`pl-1 font-semibold w-32 truncate py-1`}>
          {emoji} {name}
        </p>
        {item.stashed && <p className="pr-2">✓</p>}
      </button>
    );
  });
};

const Actions = ({
  node,
  canEdit,
  imageDidChange,
  allowConnect,
  allowSettings,
  reloadData,
}) => {
  const { data: signer } = useSigner();
  const { data: account } = useAccount();
  const { openModal, closeModal } = useContext(ModalContext);
  const { accountData, accountDataLoading, accountNodesByCollectionType } =
    useContext(GraphContext);
  const [subgraphPickerOpen, setSubgraphPickerOpen] = useState(false);
  const [focus, setFocus] = useState<{
    node: BaseNode;
    shouldStash: boolean;
  } | null>(null);

  const pickerRef = useRef(null);
  useOutsideAlerter(pickerRef, () => {
    setSubgraphPickerOpen(false);
  });

  const formik = makeFormikForBaseNode(
    signer,
    accountData,
    (focus && focus.node) || node
  );

  useEffect(() => {
    if (!formik?.status) {
      closeModal();
      return;
    }
    const { status } = formik.status;
    if (status === "COMPLETE") {
      setFocus(null);
      reloadData();
      return;
    }
    openModal({
      type: ModalType.PUBLISHER,
      meta: { formik },
    });
  }, [formik?.status]);

  useEffect(() => {
    if (!focus) return;
    if (formik.values.__node__.tokenId === node.tokenId) return;

    if (focus.shouldStash) {
      stageNodeRelations(formik, "incoming", [node], "STASHED_BY", false);
    } else {
      unstageNodeRelations(formik, "incoming", [node], "STASHED_BY");
    }
  }, [focus?.shouldStash, formik.values.__node__]);

  useEffect(() => {
    if (formik.values.__node__.tokenId === node.tokenId) return;
    const incomingConnectionsDidChange =
      JSON.stringify(formik.values.incoming) !==
      JSON.stringify(formik.values.__node__.incoming);
    if (incomingConnectionsDidChange) formik.handleSubmit();
  }, [formik.values.incoming]);

  const belongsTo = node.outgoing.find((e) => e.name === "BELONGS_TO");
  const subgraphs = Object.values(
    accountNodesByCollectionType["Subgraph"] || {}
  )
    .filter((item) => {
      // Don't allow subgraphs to stash themselves
      return item.node.tokenId !== node.tokenId;
    })
    .filter((item) => {
      // Don't allow subgraphs to stash documents that belong to them
      return item.node.tokenId !== belongsTo?.tokenId;
    })
    .map((item) => {
      return {
        ...item,
        stashed: !!getRelatedNodes(
          node,
          "outgoing",
          "Subgraph",
          "STASHED_BY"
        ).find((n) => {
          return n.tokenId === item.node.tokenId;
        }),
      };
    });

  return (
    <div className="flex relative px-2 md:px-0">
      {canEdit && (
        <label className="cursor-pointer opacity-50 hover:opacity-100 scale-75 pr-1">
          <input
            style={{ display: "none" }}
            type="file"
            onChange={imageDidChange}
            accept="image/*"
          />
          <Upload />
        </label>
      )}

      {allowConnect && account?.address && (
        <div
          className="cursor-pointer opacity-50 hover:opacity-100 scale-75"
          onClick={() => setSubgraphPickerOpen(true)}
        >
          <Connect />
        </div>
      )}

      {subgraphPickerOpen && (
        <div
          ref={pickerRef}
          className={`${bg} w-fit border border-color absolute top-5 right-0 shadow-lg rounded z-10`}
        >
          <p className="pl-1 w-32 truncate py-1 border-b text-neutral-600 dark:text-neutral-400 font-semibold tracking-wide uppercase">Stash</p>

          {accountDataLoading && (
            <p className={`pl-1 font-semibold w-32 truncate py-1`}>
              Loading...
            </p>
          )}

          {!accountDataLoading && subgraphs.length === 0 && (
            <div className="flex flex-col items-center p-2">
              <Graph />
              <p className="pt-1 whitespace-nowrap">No subgraphs.</p>
            </div>
          )}

          <List collection={subgraphs} didPick={setFocus} />
        </div>
      )}

      {allowSettings && (
        <div
          className="cursor-pointer opacity-50 hover:opacity-100"
          onClick={() =>
            openModal({
              type: ModalType.NODE_SETTINGS,
              meta: { canEdit, node, reloadData },
            })
          }
        >
          <VerticalDots />
        </div>
      )}
    </div>
  );
};

export default Actions;
