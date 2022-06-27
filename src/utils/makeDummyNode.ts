import { BaseNode } from "src/types";
import DEFAULT_EMOJI from "src/utils/defaultEmoji";

const makeDummyNode = (label: string): BaseNode => {
  return {
    tokenId: "-1",
    labels: ["BaseNode", label],
    burnt: false,
    fee: "0",
    currentRevision: {
      hash: "",
      block: 0,
      content: "",
      contentType: "",
      metadata: {
        name: "",
        description: "",
        image: "",
        properties: {
          emoji: DEFAULT_EMOJI,
        },
      },
    },
    outgoing: [],
    incoming: [],
    related: [],
    owner: { address: "0x0" },
    admins: [],
    editors: []
  };
};

export default makeDummyNode;
