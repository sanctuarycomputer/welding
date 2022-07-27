import { BaseNode } from "src/types";
import slugify from "src/utils/slugify";

const slugifyNode = (node: BaseNode) => {
  try {
    if (node.currentRevision.name) {
      return slugify(`${node.tokenId} ${node.currentRevision.name}`);
    }
    return slugify(node.tokenId);
  } catch(e) {
    console.log(node);
    throw e;
  }
};

export default slugifyNode;
