import truncate from 'src/utils/truncate';
import copyToClipboard from 'src/utils/copyToClipboard';
import Copy from 'src/components/Icons/Copy';

const metadataLink = (hash) => {
  return `https://ipfs.io/ipfs/${hash}/metadata.json`;
};

const Revision = ({
  revision
}) => {
  return (
    <tr className="border-b border-color border-dashed">
      <td className="pl-2 py-4 whitespace-nowrap truncate">
        <p className="font-semibold">{revision.block}</p>
      </td>
      <td className="px-2 py-4 text-center whitespace-nowrap truncate">
        <a href={metadataLink} target="_blank">
          <p className="underline">View Revision ↗</p>
        </a>
      </td>
      <td className="px-2 py-4 text-center whitespace-nowrap truncate">
        <a href={metadataLink} target="_blank">
          <p className="underline">View JSON ↗</p>
        </a>
      </td>
      <td
        onClick={() => copyToClipboard(revision.hash)}
        className="pr-2 py-4 cursor-pointer whitespace-nowrap">
        <Copy />
      </td>
    </tr>
  );
};

const Revisions = ({
  node
}) => {
  return (
    <table className="table-auto w-full">
      <tbody>
        <Revision revision={node.currentRevision} />
      </tbody>
    </table>
  );
};

export default Revisions;
