import DEFAULT_EMOJI from 'src/utils/defaultEmoji';

const makeDummyNode = (label: string) => {
  return {
    tokenId: '-1',
    labels: ['BaseNode', label],
    currentRevision: {
      hash: '',
      block: 0,
      content: '',
      contentType: '',
      metadata: {
        name: '',
        description: '',
        image: '',
        properties: {
          emoji: DEFAULT_EMOJI
        }
      }
    },
    outgoing: [],
    incoming: [],
    related: []
  };
};

export default makeDummyNode;
