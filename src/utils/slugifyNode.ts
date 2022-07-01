import { BaseNode } from "src/types";
import slugify from "src/utils/slugify";

const slugifyNode = (node: BaseNode) => {
  return slugify(`${node.tokenId} ${node.currentRevision.metadata.name}`);
};

export default slugifyNode;
