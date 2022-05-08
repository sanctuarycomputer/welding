import { ethers } from 'ethers';
import type { BaseProvider, EventType } from '@ethersproject/providers';
import type { BigNumberish } from '@ethersproject/bignumber';
import Node from 'artifacts/contracts/src/Node.sol/Node.json';
import slugify from 'slugify';
import { Metadata, BaseNode } from 'src/types';

// TODO: Use private API key if it's avail (ie, on the server)
const fallbackProvider = new ethers.providers.AlchemyProvider(
  process.env.NEXT_PUBLIC_NETWORK,
  process.env.NEXT_PUBLIC_ALCHEMY_PROJECT_ID
);

const Welding = {
  Nodes: new ethers.Contract(process.env.NEXT_PUBLIC_NODE_ADDRESS || "no_address_given", Node.abi),
  fallbackProvider,

  LABELS: {
    subgraph: 'subgraph',
    document: 'document',
    topic: 'topic',
  },

  ipfsGateways: [
    "https://welding.infura-ipfs.io",
    "https://ipfs.io",
    "https://cloudflare-ipfs.com",
  ],

  getBlockNumber: async function(
    provider: BaseProvider | null,
  ): Promise<number> {
    const p = provider || fallbackProvider;
    return await p.getBlockNumber();
  },

  queryEvents: async function(
    provider: BaseProvider | null,
    startAt: number,
    endAt: number | undefined,
  ): Promise<{ latestBlock: number, events: EventType[] }> {
    const p = provider || fallbackProvider;
    endAt = endAt || await p.getBlockNumber();
    const events =
      await Welding.queryEventsByBlockRange(
        startAt,
        endAt
      );
    return {
      endAt,
      events
      //events.sort(function(a, b){ return a.blockNumber - b.blockNumber; })
    };
  },

  queryEventsByBlockRange: async function(
    fromBlock: number,
    toBlock: number
  ): Promise<EventType[]> {
    try {
      return await Welding
        .Nodes
        .connect(fallbackProvider)
        .queryFilter("*", fromBlock, toBlock);
    } catch (error: any) {
      // TODO: Better types for this error
      if (
        JSON.parse(error.body).error.code !== -32005
      ) throw new Error(error);
      console.log(fromBlock, toBlock);
      const midBlock = (fromBlock + toBlock) >> 1;
      const arr1 = await Welding.queryEventsByBlockRange(fromBlock, midBlock);
      const arr2 = await Welding.queryEventsByBlockRange(midBlock + 1, toBlock);
      return [...arr1, ...arr2];
    }
  },

  publishMetadataToIPFS: async function(values) {
    const { name, description, emoji, content, image } = values;
    const response = await fetch('/api/metadata/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image,
        name,
        description,
        emoji,
        content
      })
    });
    const { hash } = await response.json();
    return hash;
  },

  slugifyNode: function(node: BaseNode) {
    return slugify(
      `${node.tokenId} ${node.currentRevision.metadata.name}`,
      { lower: true }
    );
  },
};

export default Welding;
