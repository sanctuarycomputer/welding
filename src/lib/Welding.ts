import { ethers } from 'ethers';
import Node from 'artifacts/contracts/src/Node.sol/Node.json';
import slugify from 'slugify';

const fallbackProvider = new ethers.providers.InfuraProvider(
  process.env.NEXT_PUBLIC_INFURA_NETWORK,
  process.env.NEXT_PUBLIC_INFURA_PROJECT_ID
);

const Welding = {
  Nodes: new ethers.Contract(process.env.NEXT_PUBLIC_NODE_ADDRESS, Node.abi),
  fallbackProvider,

  LABELS: {
    subgraph: 'subgraph',
    document: 'document',
    topic: 'topic',
  },

  ipfsGateways: [
    "https://ipfs.io",
    "https://cloudflare-ipfs.com",
  ],

  publishMetadataToIPFS: async function(values) {
    const { name, description, emoji, content } = values;
    const response = await fetch('/api/publish-graph-metadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        description,
        emoji,
        content
      })
    });
    const { hash } = await response.json();
    return hash;
  },

  fetchMetadataFromIPFS: async function(ipfsURI) {
    const gatewayURL = `${Welding.ipfsGateways[0]}${ipfsURI.replace("ipfs://", "/ipfs/")}`;
    return (await fetch(gatewayURL)).json();
  },

  loadNodePermissions: async function(id, provider) {
    const p = (provider || fallbackProvider);

    const adminCount =
      await Welding.Nodes
        .connect(p)
        .getRoleMemberCount(id, 0);

    const editorCount =
      await Welding.Nodes
        .connect(p)
        .getRoleMemberCount(id, 1);

    //const editorCount =
    //  await Welding.Nodes
    //    .connect(p)
    //    .canEdit(id, address);
  },

  loadNodeConnectionsByLabel: async function(id, label, provider) {
    const p = (provider || fallbackProvider);
    const connectedNodeCount =
      await Welding.Nodes
        .connect(p)
        .getConnectedNodeCountForNodeByLabel(id, label);

    const nodeIds = [];
    let counter = ethers.BigNumber.from(0);
    while (counter.lt(connectedNodeCount)) {
      nodeIds.push(
        (await Welding.Nodes
          .connect(p)
          .getConnectedNodeForNodeByLabelAndIndex(id, label, counter)
        ).toString()
      );
      counter = counter.add(1);
    }
    return Promise.all(nodeIds.map(n => Welding.loadNodeById(n, p)));
  },

  loadNodeById: async function(id, provider) {
    const uri =
      await Welding.Nodes.connect(provider || Welding.fallbackProvider).tokenURI(id);
    const metadata = await Welding.fetchMetadataFromIPFS(uri);
    const slug = Welding.slugify(`${id} ${metadata.name}`);
    return { id, uri, slug, metadata };
  },

  slugify: function(str) {
    return slugify(str, { lower: true });
  }
};

export default Welding;
