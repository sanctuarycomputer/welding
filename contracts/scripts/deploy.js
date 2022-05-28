const HUGH_SUBGRAPH_METADATA =
  'bafyreidxcii7rpfkibdd2o27tpgyjrumfjwyp7sewhueoaeay4njhvfu5q';
const WELDING_SUBGRAPH_METADATA =
  'bafyreic2cpdw3fqxwtpasvokrf5tkozk2bk63gb7scaojvlief2iazmpbe';
const INTRO_DOC_METADATA =
  'bafyreih6nuukqnfaiwnsejxfrczsnhfwq5dtg7gl7ehajabg7b6jwdy6aq';
const ETH_TOPIC_METADATA =
  'bafyreiaxhjverhyncf3gdmaxkqpk5hgxtxgmzdw2lyqewn7t23aotujuui';
const IPFS_TOPIC_METADATA =
  'bafyreiejobhfsq7ysnwny2kxq7enoak6n66pjzcnv6jr2pq46abrhh2dfm';
const WELDING_TOPIC_METADATA =
  'bafyreihss6dihabqagwi2vgevgkndxmt2tjjayj7rtwatmhdsbctzoqgeu';
const GRAPH_THEORY_TOPIC_METADATA =
  'bafyreiaopqvufupxtbl722ay4tzc3odf6ic3akcwgexh7rxtoslzqify5e';

async function seed(contract) {
  let tx, transferEvent;

  // Seed Topics
  tx = await contract.mint('topic', ETH_TOPIC_METADATA, [], []);
  transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
  const ethId = transferEvent.args.tokenId;

  tx = await contract.mint('topic', IPFS_TOPIC_METADATA, [], []);
  transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
  const ipfsId = transferEvent.args.tokenId;

  tx = await contract.mint('topic', WELDING_TOPIC_METADATA, [], []);
  transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
  const weldingId = transferEvent.args.tokenId;

  tx = await contract.mint('topic', GRAPH_THEORY_TOPIC_METADATA, [], []);
  transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
  const graphTheoryId = transferEvent.args.tokenId;

  // Seed Subgraph
  tx = await contract.mint('subgraph', WELDING_SUBGRAPH_METADATA, [{
    tokenId: weldingId,
    name: "DESCRIBES"
  }, {
    tokenId: graphTheoryId,
    name: "DESCRIBES"
  }], []);
  transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
  const weldingSubgraphId = transferEvent.args.tokenId;

  // Seed Intro Doc
  tx = await contract.mint('document', INTRO_DOC_METADATA, [{
    tokenId: weldingId,
    name: "DESCRIBES"
  }, {
    tokenId: ethId,
    name: "DESCRIBES"
  }, {
    tokenId: ipfsId,
    name: "DESCRIBES"
  }], [{
    tokenId: weldingSubgraphId,
    name: "BELONGS_TO"
  }]);
  transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
  const documentId = transferEvent.args.tokenId;

  tx = await contract.mint('subgraph', HUGH_SUBGRAPH_METADATA, [{
    tokenId: weldingId,
    name: "DESCRIBES"
  }, {
    tokenId: graphTheoryId,
    name: "DESCRIBES"
  }], []);

  transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
  const hughSubgraphId = transferEvent.args.tokenId;
};

async function deploy(name, args) {
  console.log(`${name}: Deploying...`);
  const Factory = await ethers.getContractFactory(name);
  const instance = (
    args ?
    await Factory.deploy(...args) :
    await Factory.deploy()
  );
  const deployed = await instance.deployed();
  // This solves the bug in Mumbai network where the contract address is not the real one
  const txHash = instance.deployTransaction.hash;
  console.log(`${name}: Waiting for transaction...`);
  const txReceipt = await ethers.provider.waitForTransaction(txHash);
  console.log(`${name}: Deployed - ${txReceipt.contractAddress}`);
  return [txReceipt.contractAddress, deployed];
}

async function deployAll() {
  const [address, contract] = await deploy("Node");
  await seed(contract);
}

deployAll()
 .then(() => process.exit(0))
 .catch((error) => {
   console.error(error);
   process.exit(1);
 });
