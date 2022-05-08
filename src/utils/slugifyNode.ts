import slugify from 'slugify';

const slugifyNode = (node: BaseNode) => {
  return slugify(
    `${node.tokenId} ${node.currentRevision.metadata.name}`,
    { lower: true }
  );
}

export default slugifyNode;
