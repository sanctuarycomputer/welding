import { FC, useEffect, useContext, useState } from 'react';
import { ModalContext, ModalType } from 'src/hooks/useModal';
import Modal from 'react-modal';
import ModalHeader from 'src/components/Modals/ModalHeader';
import Button from 'src/components/Button';
import { useAccount, useNetwork } from 'wagmi';
import Spinner from 'src/components/Icons/Spinner';
import Warning from 'src/components/Icons/Warning';
import { detailedDiff } from 'deep-object-diff';
import { formatUnits, parseUnits } from 'ethers/lib/utils';

export type PublisherMeta = {
  formik: BaseNode;
};

type Props = {
  onRequestClose: Function;
  meta: PublisherMeta;
};

enum PublishStep {
  INIT = "INIT",
  FEES = "FEES",
  PUBLISH = "PUBLISH",
  REQUEST_SIG = "REQUEST_SIG",
  TRANSACT = "TRANSACT",
  CONFIRM = "CONFIRM",
};

const PublisherStep = ({
  icon,
  title,
  description,
  active,
  error,
  children
}) => {
  return (
    <div>
      <p className="flex items-center text-base">
        <span className={`text-3xl pr-2 ${active ? 'text-color' : 'text-passive-color'}`}>{icon}</span> {title}
      </p>
      {active && (
        <div
          className="border-l border-color my-2"
          style={{
            marginLeft: '13px',
            paddingLeft: '22px'
          }}
        >
          <div className="border border-color rounded p-4 flex">
            {error ? (
              <>
                <Warning />
                <p className="pl-2">
                  {error.message || "An unknown error occured."}
                </p>
              </>
            ) : (
              children || (
                <>
                  <span className="loader flex items-center">
                    <Spinner />
                  </span>
                  <p className="pl-2">{description}</p>
                </>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const NodeTile = ({
  node
}) => {
  const collectionType =
    node.labels.filter(l => l !== "BaseNode")[0] || 'Unknown';
  return (
    <p className="whitespace-nowrap border rounded-full p-1 border-color mb-1">
      <span>
        {node.currentRevision.metadata.properties.emoji.native}
      </span>
      <span className="ml-1">
        {node.currentRevision.metadata.name}
      </span>
    </p>
  );
};

const EdgeTile = ({
  edge
}) => {
  return (
    <p
      className="background-passive-color rounded-sm whitespace-nowrap p-1"
    >{edge.name.replace(/_/g, ' ')}
    </p>
  );
};

const ConnectionDiff = ({
  formik
}) => {
  const { activeChain } = useNetwork();
  const symbol = activeChain?.nativeCurrency.symbol || '';

  const node = formik.values.__node__;
  const incomingDiff =
    detailedDiff(node.incoming, formik.values.incoming);
  const outgoingDiff =
    detailedDiff(node.outgoing, formik.values.outgoing);

  const hasAddedConnections =
    Object.values(incomingDiff.added).length > 0 ||
    Object.values(outgoingDiff.added).length > 0;

  const hasRemovedConnections =
    Object.values(incomingDiff.deleted).length > 0 ||
    Object.values(outgoingDiff.deleted).length > 0;

  // TODO: check if incoming connection is owned by address,
  // because then it's free

  return (
    <div className="w-full">
      {hasAddedConnections ? (
        <table className="w-full mb-2">
          <tbody>
          {Object.values(incomingDiff.added).map((edge: Edge) => {
            const n = formik.values.related.find((n: BaseNode) => {
              return edge.tokenId === n.tokenId;
            });
            if (!n) return null;
            return (
              <tr key={`in-${edge.tokenId}-${edge.name}`}>
                <td><NodeTile node={n} /></td>
                <td className="text-center">—</td>
                <td className="text-center">
                  <EdgeTile edge={edge} />
                </td>
                <td className="text-center">→</td>
                <td><NodeTile node={node} /></td>
                <td className="text-right" style={{ width: '99%'}}>
                  <p>{formatUnits(n.fee, "ether")} {symbol}</p>
                </td>
              </tr>
            );
          })}

          {Object.values(outgoingDiff.added).map((edge: Edge) => {
            const n = formik.values.related.find((n: BaseNode) => {
              return edge.tokenId === n.tokenId;
            });
            if (!n) return null;
            return (
              <tr key={`out-${edge.tokenId}-${edge.name}`}>
                <td><NodeTile node={node} /></td>
                <td className="text-center">—</td>
                <td className="text-center">
                  <EdgeTile edge={edge} />
                </td>
                <td className="text-center">→</td>
                <td><NodeTile node={n} /></td>
                <td className="text-right" style={{ width: '99%'}}>
                  <p>{formatUnits(node.fee, "ether")} {symbol}</p>
                </td>
              </tr>
            );
          })}
          </tbody>
        </table>
      ) : (
        <div className="text-center pb-3">
          <p>No new connections</p>
        </div>
      )}

      <div className="border-t border-color pt-3 text-right">
        <Button
          label="Confirm"
          onClick={formik.handleSubmit}
          disabled={
            formik.isSubmitting ||
            !(formik.isValid && !formik.isDirty)
          }
        />
      </div>
    </div>
  );

};

const Publisher: FC<Props> = ({
  onRequestClose,
  meta: {
    publishStep,
    setPublishStep,
    publishError,
    formik
  }
}) => {
  const attemptClose = () => {
    if (publishStep === PublishStep.FEES) {
      setPublishStep(null);
      return onRequestClose();
    }
    if (!!publishStep && !publishError) {
      return alert("Currently publishing, please wait.");
    }
    setPublishStep(null);
    onRequestClose();
  };

  const node = formik.values.__node__;
  const incomingDiff =
    detailedDiff(node.incoming, formik.values.incoming);
  const outgoingDiff =
    detailedDiff(node.outgoing, formik.values.outgoing);
  const hasAddedConnections =
    Object.values(incomingDiff.added).length > 0 ||
    Object.values(outgoingDiff.added).length > 0;
  const hasRemovedConnections =
    Object.values(incomingDiff.deleted).length > 0 ||
    Object.values(outgoingDiff.deleted).length > 0;
  const hasConnectionChanges =
    hasAddedConnections ||
    hasRemovedConnections;

  useEffect(() => {
    if (
      !hasConnectionChanges &&
      !formik.isSubmitting
    ) formik.handleSubmit();
  }, []);

  return (
    <Modal
      isOpen={true}
      onRequestClose={attemptClose}
    >
      <div className="h-screen sm:h-auto flex flex-col">
        <ModalHeader
          title="Publishing Node"
          hint="Publish updates to this Node on IPFS & the Blockchain"
          onClickClose={attemptClose}
        />
        <div className="p-4">
          {hasConnectionChanges && (
            <PublisherStep
              icon="①"
              title="Confirm New Connections"
              description="Your node’s data is being published on the permanent internet."
              active={publishStep === PublishStep.FEES}
              error={publishError}
            >
              <ConnectionDiff formik={formik} />
            </PublisherStep>
          )}

          <PublisherStep
            icon={hasConnectionChanges ? "②" : "①"}
            title="Publishing NFT Metadata to IPFS"
            description="Your node’s data is being published on the permanent internet."
            active={publishStep === PublishStep.PUBLISH}
            error={publishError}
          />
          <PublisherStep
            icon={hasConnectionChanges ? "③" : "②"}
            title="Confirm Transaction with your Wallet Provider"
            description="Please confirm the transaction to publish."
            active={publishStep === PublishStep.REQUEST_SIG}
            error={publishError}
          />
          <PublisherStep
            icon={hasConnectionChanges ? "④" : "③" }
            title="Processing Transaction on the Blockchain"
            description="Transaction processing. This usually takes ~30 seconds or so."
            active={publishStep === PublishStep.TRANSACT}
            error={publishError}
          />
          <PublisherStep
            icon={hasConnectionChanges ? "⑤" : "④" }
            title="Confirming & Caching Transaction"
            description="We're caching your new NFT metadata for fast access."
            active={publishStep === PublishStep.CONFIRM}
            error={publishError}
          />
        </div>
      </div>
    </Modal>
  );
};

export default Publisher;
