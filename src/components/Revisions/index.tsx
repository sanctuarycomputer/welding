import { useContext } from "react";
import copyToClipboard from "src/utils/copyToClipboard";
import Copy from "src/components/Icons/Copy";
import { GraphContext } from "src/hooks/useGraphData";
import History from "src/components/Icons/History";

const metadataLink = (hash) => {
  return `https://ipfs.io/ipfs/${hash}/metadata.json`;
};

const Revision = ({ node, revision, current }) => {
  return (
    <tr className="border-b border-color border-dashed">
      <td className="pl-2 py-4 whitespace-nowrap truncate">
        <p className="font-semibold">{revision.block}</p>
      </td>
      <td className="px-2 py-4 text-center whitespace-nowrap truncate">
        <a href={metadataLink(revision.hash)} target="_blank" rel="noreferrer">
          <p className="underline">View JSON ↗</p>
        </a>
      </td>
      <td
        onClick={() => copyToClipboard(revision.hash)}
        className="pr-2 py-4 cursor-pointer whitespace-nowrap"
      >
        <Copy />
      </td>
    </tr>
  );
};

const Revisions = ({ node }) => {
  const { revisionData, loadRevisionsForBaseNode } = useContext(GraphContext);

  let status = "LOADING";
  if (revisionData[node.tokenId]) {
    status = revisionData[node.tokenId].status;
  } else {
    loadRevisionsForBaseNode(node.tokenId);
  }

  return (
    <>
      <table className="table-auto w-full">
        <tbody>
          <Revision
            key={node.currentRevision.hash}
            node={node}
            revision={node.currentRevision}
            current
          />
          {status === "FULFILLED" &&
            revisionData[node.tokenId].revisions
              .filter((r) => {
                return r.hash !== node.currentRevision.hash;
              })
              .map((r) => {
                return (
                  <Revision
                    key={r.hash}
                    node={node}
                    revision={r}
                    current={false}
                  />
                );
              })}
        </tbody>
      </table>

      <div className="py-16 flex relative flex-grow justify-center items-center flex-col">
        <History />
        <p className="pt-2 font-semibold">
          All revisions are stored permanently via IPFS.
        </p>
      </div>
    </>
  );
};

export default Revisions;
