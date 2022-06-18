const getRelatedNodes = (
  node: BaseNode,
  relation: "incoming" | "outgoing",
  label: string,
  name: string
) => {
  const uniqueTokenIds = new Set();
  return node[relation]
    .map((e: Edge) => {
      if (e.active === false) return null;
      if (e.name !== name) return null;
      const n = node.related.find(
        (node: BaseNode) => node.tokenId === e.tokenId
      );
      if (!n) return null;
      if (!n.labels.includes(label)) return null;
      return n;
    })
    .filter((n) => {
      if (n === null) return false;
      const dupe = uniqueTokenIds.has(n.tokenId);
      uniqueTokenIds.add(n.tokenId);
      if (!dupe) return true;
      return false;
    });
};

export default getRelatedNodes;
