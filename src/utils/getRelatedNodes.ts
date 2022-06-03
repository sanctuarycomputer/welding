const getRelatedNodes = (
  node: BaseNode,
  relation: 'incoming' | 'outgoing',
  label: string,
  name: string
) => {
  return node[relation].map((e: Edge) => {
    if (e.active === false) return null;
    if (e.name !== name) return null;
    const n =
      node.related.find((node: BaseNode) =>
        node.tokenId === e.tokenId);
    if (!n) return null;
    if (!n.labels.includes(label)) return null;
    return n;
  }).filter(r => r !== null);
};

export default getRelatedNodes;
