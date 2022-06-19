import { FC, useEffect, useContext, useState } from "react";
import { GraphContext } from "src/hooks/useGraphData";
import { ExchangeRateContext } from "src/hooks/useExchangeRates";
import { detailedDiff } from "deep-object-diff";
import { formatUnits } from "ethers/lib/utils";
import { useNetwork } from "wagmi";
import Modal from "react-modal";

import Button from "src/components/Button";
import ModalHeader from "src/components/Modals/ModalHeader";
import Spinner from "src/components/Icons/Spinner";
import Warning from "src/components/Icons/Warning";
import { bgPassive, text, textPassive } from "src/utils/theme";

export type PublisherMeta = {
  formik: BaseNode;
};

type Props = {
  onRequestClose: Function;
  meta: PublisherMeta;
};

enum PublishStep {
  FEES = "FEES",
  PUBLISH = "PUBLISH",
  REQUEST_SIG = "REQUEST_SIG",
  TRANSACT = "TRANSACT",
  CONFIRM = "CONFIRM",
  COMPLETE = "COMPLETE",
  ERROR = "ERROR",
}

const PublisherStep = ({
  icon,
  title,
  description,
  active,
  error,
  children,
}) => {
  return (
    <div>
      <p className="flex items-center text-base">
        <span className={`text-3xl pr-2 ${active ? text : textPassive}`}>
          {icon}
        </span>{" "}
        {title}
      </p>
      {active && (
        <div
          className="border-l border-color my-2"
          style={{
            marginLeft: "13px",
            paddingLeft: "22px",
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

const NodeTile = ({ node }) => {
  let name, emoji;

  if ("__typename" in node) {
    name = node.currentRevision.metadata.name;
    emoji = node.currentRevision.metadata.properties.emoji.native;
  } else if ("dirty" in node) {
    name = node.values.name;
    emoji = node.values.emoji.native;
  }

  return (
    <p className="py-1 px-2 whitespace-nowrap border rounded-full border-color">
      {emoji} {name}
    </p>
  );
};

const EdgeTile = ({ edge }) => {
  return (
    <p className={`${bgPassive} rounded-full whitespace-nowrap px-2 py-1`}>
      {edge.name.replace(/_/g, " ")}
    </p>
  );
};

const ConnectionTile = ({ to, from, edge, prevConnected, owned }) => {
  const { activeChain } = useNetwork();
  const symbol = activeChain?.nativeCurrency.symbol || "";

  const { exchangeRate } = useContext(ExchangeRateContext);
  const [USDEstimate, setUSDEstimate] = useState(null);

  useEffect(() => {
    if (from.fee && exchangeRate) {
      setUSDEstimate(
        (parseFloat(formatUnits(from.fee, "ether")) * exchangeRate).toFixed(2)
      );
    } else {
      setUSDEstimate(null);
    }
  }, [from.fee, exchangeRate]);

  return (
    <tr>
      <td>
        <NodeTile node={from} />
      </td>
      <td className="text-center">—</td>
      <td className="text-center">
        <EdgeTile edge={edge} />
      </td>
      <td className="text-center">→</td>
      <td>
        <NodeTile node={to} />
      </td>

      <td className="text-right" style={{ width: "99%" }}>
        {prevConnected ? (
          <p>Prev. Connected ✓</p>
        ) : from.fee === "0" || owned ? (
          <p>No Fee ✓</p>
        ) : (
          <p>
            {formatUnits(from.fee, "ether")} {symbol} / {USDEstimate || "??"}{" "}
            USD
          </p>
        )}
      </td>
    </tr>
  );
};

const ConnectionDiff = ({ formik, incomingDiff, resolve }) => {
  const { accountData } = useContext(GraphContext);
  const node = formik.values.__node__;

  const addedConnections = Object.values(incomingDiff.added);
  const toggledOnConnections = Object.values(incomingDiff.updated).filter(
    (d) => d.active
  );
  const removedConnections = [
    ...Object.values(incomingDiff.deleted),
    ...Object.values(incomingDiff.updated).filter((d) => !d.active),
  ];

  return (
    <div className="w-full">
      {addedConnections.length > 0 || toggledOnConnections.length > 0 ? (
        <table className="w-full mb-2">
          <tbody>
            {Object.keys(incomingDiff.added).map((key) => {
              if (!incomingDiff.added[key].active) return null;
              const edge = formik.values.incoming[key];
              if (!edge || !edge.active) return null;
              const n = formik.values.related.find(
                (n: BaseNode) => edge.tokenId === n.tokenId
              );
              if (!n) return null;
              const owned =
                accountData &&
                !!accountData.related.find((r) => {
                  return r.tokenId === n.tokenId;
                });

              return (
                <ConnectionTile
                  key={`in-${edge.tokenId}-${edge.name}`}
                  to={formik}
                  from={n}
                  edge={edge}
                  prevConnected={false}
                  owned={owned}
                />
              );
            })}

            {Object.keys(incomingDiff.updated).map((key) => {
              if (!incomingDiff.updated[key].active) return null;
              const edge = formik.values.incoming[key];
              if (!edge || !edge.active) return null;
              const n = formik.values.related.find(
                (n: BaseNode) => edge.tokenId === n.tokenId
              );
              if (!n) return null;
              const owned =
                accountData &&
                !!accountData.related.find((r) => {
                  return r.tokenId === n.tokenId;
                });

              return (
                <ConnectionTile
                  key={`in-${edge.tokenId}-${edge.name}`}
                  to={node}
                  from={n}
                  edge={edge}
                  prevConnected
                  owned={owned}
                />
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="text-center pb-4">
          <p>No connections added</p>
        </div>
      )}

      <div className="border-t border-color pt-3 text-right flex justify-between items-center">
        {removedConnections.length > 0 ? (
          <p className="text-red-500">
            {removedConnections.length}x connection
            {removedConnections.length > 1 ? "s" : ""} removed
          </p>
        ) : (
          <p className={textPassive}>No connections removed</p>
        )}

        <Button label="Confirm" onClick={resolve} />
      </div>
    </div>
  );
};

const Publisher: FC<Props> = ({ onRequestClose, meta: { formik } }) => {
  const { status, error, resolve, reject } = formik.status || {};

  const attemptClose = () => {
    if (error || status === PublishStep.FEES) {
      formik.setStatus(null);
      if (reject) reject(new Error("user_rejected"));
      return onRequestClose();
    }
    return alert("Currently publishing, please wait.");
  };

  const node = formik.values.__node__;
  const incomingDiff = detailedDiff(node.incoming, formik.values.incoming);
  const hasConnectionChanges =
    Object.values(incomingDiff.added).length > 0 ||
    Object.values(incomingDiff.updated).length > 0 ||
    Object.values(incomingDiff.deleted).length > 0;

  return (
    <Modal isOpen={true} onRequestClose={attemptClose}>
      <div className="h-screen sm:h-auto flex flex-col">
        <ModalHeader
          title="Publishing Node"
          hint="Publish on-chain updates to this node"
          onClickClose={attemptClose}
        />
        <div className="p-4">
          {hasConnectionChanges && (
            <PublisherStep
              icon="①"
              title="Confirm New Connections"
              description=""
              active={status === PublishStep.FEES}
              error={error}
            >
              <ConnectionDiff
                formik={formik}
                incomingDiff={incomingDiff}
                resolve={resolve}
              />
            </PublisherStep>
          )}

          <PublisherStep
            icon={hasConnectionChanges ? "②" : "①"}
            title="Publish Metadata to IPFS"
            description="This usually takes ~30 seconds or so, but sometimes a few minutes."
            active={status === PublishStep.PUBLISH}
            error={error}
          />

          <PublisherStep
            icon={hasConnectionChanges ? "③" : "②"}
            title="Confirm Transaction"
            description="Please confirm the transaction in your wallet provider."
            active={status === PublishStep.REQUEST_SIG}
            error={error}
          />

          <PublisherStep
            icon={hasConnectionChanges ? "④" : "③"}
            title="Process Transaction on the Blockchain"
            description="This usually takes ~30 seconds or so, but sometimes a few minutes."
            active={status === PublishStep.TRANSACT}
            error={error}
          />

          <PublisherStep
            icon={hasConnectionChanges ? "⑤" : "④"}
            title="Confirm & Cache Metadata"
            description="We're caching your metadata for fast access."
            active={status === PublishStep.CONFIRM}
            error={error}
          />
        </div>
      </div>
    </Modal>
  );
};

export default Publisher;
