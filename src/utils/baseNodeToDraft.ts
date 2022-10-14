import { BaseNode, Draft } from "src/types";
import DEFAULT_EMOJI from "src/utils/defaultEmoji";

const baseNodeToDraft = (node: BaseNode): Draft => {
  return {
    name: node.currentRevision.name,
    description: node.currentRevision.description,
    emoji: node.currentRevision.metadata?.properties.emoji || DEFAULT_EMOJI,
    ui: node.currentRevision.metadata?.properties.ui || {},
    content: node.currentRevision.metadata?.properties.content || {},
    image: node.currentRevision.image,
    related: node.related,
    outgoing: node.outgoing,
    incoming: node.incoming,
    __node__: node,
  };
};

export default baseNodeToDraft;
