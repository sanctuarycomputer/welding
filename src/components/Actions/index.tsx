import { useContext, useState, useEffect, useRef } from 'react';
import { ModalContext, ModalType } from 'src/hooks/useModal';
import { GraphContext } from 'src/hooks/useGraphData';
import VerticalDots from 'src/components/Icons/VerticalDots';
import Connect from 'src/components/Icons/Connect';
import Upload from 'src/components/Icons/Upload';
import useOutsideAlerter from 'src/hooks/useOutsideAlerter';
import Graph from 'src/components/Icons/Graph';
import { useAccount, useSigner } from 'wagmi';
import { useRouter } from 'next/router';
import makeFormikForBaseNode, {
  hasStagedRelations,
  unstageNodeRelations,
  stageNodeRelations
} from 'src/lib/makeBaseNodeFormik';
import getRelatedNodes from 'src/utils/getRelatedNodes';

const List = ({
  collection,
  didPick
}) => {
  return collection.map(item => {
    const name =
      item.node.currentRevision.metadata.name;
    const emoji =
      item.node.currentRevision.metadata.properties.emoji.native;
    return (
      <button
        key={item.node.tokenId}
        onClick={() => didPick({
          node: item.node,
          shouldStash: !item.stashed
        })}
        className="text-left flex flex-row items-center flex-grow"
      >
        <p className="pl-1 font-semibold w-32 truncate py-1">
          {emoji} {name}
        </p>
        {item.stashed && (
          <p className="pr-2">✓</p>
        )}
      </button>
    )
  });
};

const Actions = ({
  node,
  canEdit,
  imageDidChange,
  allowConnect,
  allowSettings
}) => {
  const router = useRouter();
  const { data: signer } = useSigner();

  const {
    openModal,
    closeModal
  } = useContext(ModalContext);
  const {
    accountData,
    accountNodesByCollectionType
  } = useContext(GraphContext);
  const [
    subgraphPickerOpen,
    setSubgraphPickerOpen
  ] = useState(false);

  const [focus, setFocus] = useState(null);
  const [publishStep, setPublishStep] = useState(null);
  const [publishError, setPublishError] = useState(null);

  const pickerRef = useRef(null);
  useOutsideAlerter(pickerRef, () => {
    setSubgraphPickerOpen(false);
  });

  const formik = makeFormikForBaseNode(
    signer,
    accountData,
    "Subgraph",
    ((focus && focus.node) || node),
    router.reload,
    setPublishError,
    setPublishStep
  );

  //useEffect(() => {
  //  console.log("BING");
  //  if (
  //    formik.values.__node__.tokenId ===
  //    node.tokenId
  //  ) return;

  //  if (
  //    focus?.shouldStash &&
  //    !hasStagedRelations(
  //      formik,
  //      'incoming',
  //      [node],
  //      'STASHED_BY'
  //    )
  //  ) {
  //    stageNodeRelations(
  //      formik,
  //      'incoming',
  //      [node],
  //      'STASHED_BY'
  //    );
  //  }

  //  if (
  //    !focus?.shouldStash &&
  //    hasStagedRelations(
  //      formik,
  //      'incoming',
  //      [node],
  //      'STASHED_BY'
  //    )
  //  ) {
  //    unstageNodeRelations(
  //      formik,
  //      'incoming',
  //      [node],
  //      'STASHED_BY'
  //    );
  //  }


  //  if (publishStep === null) {
  //    console.log("WILL");
  //    setPublishStep("FEES");
  //  }
  //}, [formik]);

  useEffect(() => {
    if (!publishStep) return;
    openModal({
      type: ModalType.PUBLISHER,
      meta: {
        publishStep,
        publishError,
        formik,
        setPublishStep: (step) => {
          if (step === null) {
            setFocus({ node, operation: null });
            //setPublishStep(step);
          }
        }
      }
    });
  }, [publishStep, publishError])

  const subgraphs = Object.values(
    accountNodesByCollectionType['Subgraph']
  ).filter(item => {
    return item.node.tokenId !== node.tokenId;
  }).map(item => {
    return {
      ...item,
      stashed: !!getRelatedNodes(
        node,
        'outgoing',
        'Subgraph',
        'STASHED_BY'
      ).find(n => {
        return n.tokenId === item.node.tokenId;
      })
    }
  });

  return (
    <div className="flex relative">
      {canEdit && (
        <label
          className="cursor-pointer opacity-50 hover:opacity-100 scale-75 pr-1"
        >
          <input
            style={{display: 'none'}}
            type="file"
            onChange={imageDidChange}
            accept="image/*"
          />
          <Upload />
        </label>
      )}

      {allowConnect && (
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
          className="w-fit border border-color absolute top-6 right-0 shadow-lg rounded background-color z-10"
        >
          {subgraphs.length === 0 && (
            <div className="flex flex-col items-center p-2">
              <Graph />
              <p className="pt-1 whitespace-nowrap">
                No subgraphs.
              </p>
            </div>
          )}
          <List
            collection={subgraphs}
            didPick={setFocus}
          />
        </div>
      )}

      {allowSettings && (
        <div
          className="cursor-pointer opacity-50 hover:opacity-100"
          onClick={() => openModal({
            type: ModalType.NODE_SETTINGS,
            meta: { canEdit, node }
          })}
        >
          <VerticalDots />
        </div>
      )}
    </div>
  );
};

export default Actions;
