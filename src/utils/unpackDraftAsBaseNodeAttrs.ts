import { Draft, BaseNode } from "src/types";

const unpackDraftToBaseNodeAttrs = (draft: Draft): BaseNode => {
  return {
    currentRevision: {
      name: draft.name,
      description: draft.description,
      image: draft.image,
      nativeEmoji: draft.emoji.native,
      metadata: {
        properties: {
          emoji: draft.emoji,
          ui: draft.ui || {},
          content: draft.content || {},
        }
      }
    },
    outgoing: draft.outgoing,
    incoming: draft.incoming,
  };
};

export default unpackDraftToBaseNodeAttrs;
