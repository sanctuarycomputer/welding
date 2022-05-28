const getRelatedNodes = (
  node: BaseNode,
  relation: 'incoming' | 'outgoing',
  label
) => {
  return node[relation].map((e: Edge) => {
    const n = node.related.find((node: BaseNode) => node.tokenId === e.tokenId);
    if (!n) return null;
    if (!n.labels.includes(label)) return null;
    return n;
  }).filter(r => r !== null);
};

export default getRelatedNodes;
