import { ethers } from 'ethers';

import Plane from 'artifacts/contracts/src/Plane.sol/Plane.json';
import Graph from 'artifacts/contracts/src/Graph.sol/Graph.json';
import Topic from 'artifacts/contracts/src/Topic.sol/Topic.json';
import Document from 'artifacts/contracts/src/Document.sol/Document.json';

const Welding = {
  ipfsGateways: [
    "https://cloudflare-ipfs.com",
    "https://ipfs.io"
  ],

  fetchMetadataFromIPFS: async function(ipfsURI) {
    const gatewayURL = `${Welding.ipfsGateways[0]}${ipfsURI.replace("ipfs://", "/ipfs/")}`;
    return (await fetch(gatewayURL)).json();
  },

  init: async function() {
    Welding.fallbackProvider = new ethers.providers.InfuraProvider(
      process.env.NEXT_PUBLIC_INFURA_NETWORK,
      process.env.NEXT_PUBLIC_INFURA_PROJECT_ID
    );
    Welding.Plane = new ethers.Contract(process.env.NEXT_PUBLIC_PLANE_ADDRESS, Plane.abi);
    const [
      graphsAddress,
      topicsAddress,
      documentsAddress,
    ] = await Promise.all([
      Welding.Plane.connect(Welding.fallbackProvider).GraphModel(),
      Welding.Plane.connect(Welding.fallbackProvider).TopicModel(),
      Welding.Plane.connect(Welding.fallbackProvider).DocumentModel(),
    ]);

    Welding.Graphs = new ethers.Contract(graphsAddress, Graph.abi);
    Welding.Topics = new ethers.Contract(topicsAddress, Topic.abi);
    Welding.Documents = new ethers.Contract(documentsAddress, Document.abi);
  },

  loadGraphPermissions: async function(id, provider) {
    const [
      ADMIN_ROLE,
      EDITOR_ROLE
    ] = await Promise.all([
      Welding.Graphs.connect(provider || Welding.fallbackProvider).ADMIN_ROLE(),
      Welding.Graphs.connect(provider || Welding.fallbackProvider).EDITOR_ROLE(),
    ]);

    const adminCount =
      await Welding
        .Graphs
        .connect(provider || Welding.fallbackProvider)
        .getRoleMemberCount(id, ADMIN_ROLE_2);
    console.log(adminCount.toString());

    const editorCount =
      await Welding
        .Graphs
        .connect(provider || Welding.fallbackProvider)
        .getRoleMemberCount(id, EDITOR_ROLE);
    console.log(editorCount.toString());
  },

  loadGraph: async function(id, provider) {
    const uri =
      await Welding.Graphs.connect(provider || Welding.fallbackProvider).tokenURI(id);
    let metadata;
    try {
      metadata = await Welding.fetchMetadataFromIPFS(uri);
    } catch(e) {
      metadata = "error";
    }
    return { id, uri, metadata };
  }
};

export default Welding;
