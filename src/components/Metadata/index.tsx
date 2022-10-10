import truncate from "src/utils/truncate";
import copyToClipboard from "src/utils/copyToClipboard";
import Copy from "src/components/Icons/Copy";
import Uwu from "src/components/Icons/Uwu";

import { useNetwork } from "wagmi";
import { CONTRACT_ADDRESS } from "src/utils/constants";

const Metadata = ({ node }) => {
  const { chain } = useNetwork();
  const explorer = chain?.blockExplorers?.default.url;
  const ipfsLink = `https://ipfs.io/ipfs/${node.currentRevision.hash}/metadata.json`;
  const scanLink = `${explorer}/token/${CONTRACT_ADDRESS}?a=${node.tokenId}`;

  if (node.labels.includes("DummyNode")) {
    return (
      <div className="py-16 px-4 text-center flex relative flex-grow justify-center items-center flex-col border-b border-color">
        <Uwu />
        <p className="pt-2 font-semibold">
          This node has not been minted. Mint your first revision to view
          metadata.
        </p>
      </div>
    );
  }

  return (
    <table className="table-auto w-full">
      <tbody>
        <tr className="border-b border-color border-dashed">
          <td className="pl-2 py-4 whitespace-nowrap truncate">
            <p className="font-semibold">Node Labels</p>
          </td>
          <td className="px-2 py-4 text-right whitespace-nowrap truncate">
            <p>{node.labels.join(", ")}</p>
          </td>
        </tr>

        <tr className="border-b border-color border-dashed">
          <td className="pl-2 py-4 whitespace-nowrap truncate">
            <p className="font-semibold">ERC721 Address</p>
          </td>
          <td className="px-2 py-4 text-right whitespace-nowrap truncate">
            <p>{truncate(CONTRACT_ADDRESS, 30)}</p>
          </td>
          <td
            onClick={() => copyToClipboard(CONTRACT_ADDRESS)}
            className="pr-2 py-4 cursor-pointer whitespace-nowrap"
          >
            <Copy />
          </td>
        </tr>

        <tr className="border-b border-color border-dashed">
          <td className="pl-2 py-4 whitespace-nowrap truncate">
            <p className="font-semibold">Token ID</p>
          </td>
          <td className="px-2 py-4 text-right whitespace-nowrap truncate">
            <p>{node.tokenId}</p>
          </td>
          <td
            onClick={() => copyToClipboard(node.tokenId)}
            className="pr-2 py-4 cursor-pointer whitespace-nowrap"
          >
            <Copy />
          </td>
        </tr>

        <tr className="border-b border-color border-dashed">
          <td className="pl-2 py-4 whitespace-nowrap truncate">
            <p className="font-semibold">Current Revision Hash</p>
          </td>
          <td className="px-2 py-4 text-right whitespace-nowrap truncate">
            <a href={ipfsLink} target="_blank" rel="noreferrer">
              <p className="underline">
                {truncate(node.currentRevision.hash, 30)} ↗
              </p>
            </a>
          </td>
          <td
            onClick={() => copyToClipboard(node.currentRevision.hash)}
            className="pr-2 py-4 cursor-pointer whitespace-nowrap"
          >
            <Copy />
          </td>
        </tr>

        <tr className="border-b border-color border-dashed">
          <td className="pl-2 py-4 whitespace-nowrap truncate">
            <p className="font-semibold">Current Owner</p>
          </td>
          <td className="px-2 py-4 text-right whitespace-nowrap truncate">
            <p>{truncate(node.owner.address, 30)}</p>
          </td>
          <td
            onClick={() => copyToClipboard(node.owner.address)}
            className="pr-2 py-4 cursor-pointer whitespace-nowrap"
          >
            <Copy />
          </td>
        </tr>

        <tr>
          <td className="pl-2 py-4 whitespace-nowrap truncate">
            <p className="font-semibold">Polygon Scan</p>
          </td>
          <td className="px-2 py-4 text-right whitespace-nowrap truncate">
            <a href={scanLink} target="_blank" rel="noreferrer">
              <p className="underline">Explore ↗</p>
            </a>
          </td>
          <td
            onClick={() => copyToClipboard(scanLink)}
            className="pr-2 py-4 cursor-pointer whitespace-nowrap"
          >
            <Copy />
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default Metadata;
