import truncate from "src/utils/truncate";
import copyToClipboard from "src/utils/copyToClipboard";
import Copy from "src/components/Icons/Copy";

import { useNetwork } from "wagmi";

const Metadata = ({ node }) => {
  const { activeChain } = useNetwork();
  const explorer = activeChain?.blockExplorers.default.url;
  const ipfsLink = `https://ipfs.io/ipfs/${node.currentRevision.hash}/metadata.json`;
  const scanLink = `${explorer}/token/${process.env.NEXT_PUBLIC_NODE_ADDRESS}?a=${node.tokenId}`;
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
            <p>{truncate(process.env.NEXT_PUBLIC_NODE_ADDRESS, 30)}</p>
          </td>
          <td
            onClick={() =>
              copyToClipboard(process.env.NEXT_PUBLIC_NODE_ADDRESS)
            }
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
            <a href={ipfsLink} target="_blank">
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
            <a href={scanLink} target="_blank">
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
