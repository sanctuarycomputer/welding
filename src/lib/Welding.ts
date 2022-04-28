import { ethers } from 'ethers';
import type { BaseProvider, EventType } from '@ethersproject/providers';
import type { BigNumberish } from '@ethersproject/bignumber';
import Node from 'artifacts/contracts/src/Node.sol/Node.json';
import slugify from 'slugify';
import { Metadata, BaseNode } from 'src/types';

// TODO: Use private API key if it's avail (ie, on the server)
const fallbackProvider = new ethers.providers.InfuraProvider(
  process.env.NEXT_PUBLIC_INFURA_NETWORK,
  process.env.NEXT_PUBLIC_INFURA_PROJECT_ID
);

const Welding = {
  Nodes: new ethers.Contract(process.env.NEXT_PUBLIC_NODE_ADDRESS || "no_address_given", Node.abi),
  fallbackProvider,

  fetchMetadataForHash: async function(hash: string): Promise<Metadata> {
    return await (await fetch(`http://localhost:3000/api/metadata/${hash}`)).json();
  },

  LABELS: {
    subgraph: 'subgraph',
    document: 'document',
    topic: 'topic',
  },

  ipfsGateways: [
    "https://ipfs.io",
    "https://cloudflare-ipfs.com",
  ],

  queryEvents: async function(
    provider: BaseProvider | null,
    startAt: number,
  ): Promise<{ latestBlock: number, events: EventType[] }> {
    const p = provider || fallbackProvider;
    const latestBlock = await p.getBlockNumber()
    const events =
      await Welding.queryEventsByBlockRange(
        startAt,
        latestBlock
      );
    return { latestBlock, events };
  },

  queryEventsByBlockRange: async function(
    fromBlock: number,
    toBlock: number
  ): Promise<EventType[]> {
    try {
      return await Welding
        .Nodes
        .connect(fallbackProvider)
        .queryFilter({ topics: ["*"] }, fromBlock, toBlock);
    } catch (error: any) {
      // TODO: Better types for this error
      if (
        JSON.parse(error.body).error.code !== -32005
      ) throw new Error(error);

      const midBlock = (fromBlock + toBlock) >> 1;
      const arr1 = await Welding.queryEventsByBlockRange(fromBlock, midBlock);
      const arr2 = await Welding.queryEventsByBlockRange(midBlock + 1, toBlock);
      return [...arr1, ...arr2];
    }
  },

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

  loadNodeConnectionsByLabel: async function(id, label, provider) {
    const p = (provider || fallbackProvider);
    const connectedNodeCount: BigNumberish =
      await Welding.Nodes
        .connect(p)
        .getConnectedNodeCountForNodeByLabel(id, label);

    const nodeIds: string[] = [];
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

  slugifyNode: function(node: BaseNode) {
    return slugify(
      `${node.tokenId} ${node.currentRevision.metadata.name}`,
      { lower: true }
    );
  },

  slugify: function(str) {
    return slugify(str, { lower: true });
  }
};

export default Welding;
