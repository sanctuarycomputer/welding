import { BaseNode } from "src/types";

const canEditNode = (node: BaseNode, address: string | undefined) => {
  if (!address) return false;
  if (node.admins.some(a => a.address === address)) return true;
  if (node.editors.some(a => a.address === address)) return true;

  return node.outgoing.some(e => {
    if (e.name !== "_DELEGATES_PERMISSIONS_TO") return false;
    const related = node.related.find(n => n.tokenId === e.tokenId);
    if (!related) return false;
    if (related.admins.some(a => a.address === address)) return true;
    if (related.editors.some(a => a.address === address)) return true;
    return false;
  });
};

export default canEditNode;

