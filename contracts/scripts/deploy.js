const HUGH_SUBGRAPH_METADATA =
  'bafyreidd7c3jyne7lmixstttq6oayoqqll7idf7mvkmsvpyl622mpkti6a';
const WELDING_SUBGRAPH_METADATA =
  'bafyreihfpbb2obyyypum57rjs2atcdleehrdggsd34a2ltpset4vsawhrq';
const INTRO_DOC_METADATA =
  'bafyreign76il4a5jq4x5lzj2dpdpsxzsqhmtdwrt6utwruewberhcerwj4';
const ETH_TOPIC_METADATA =
  'bafyreid6eydnjq7ffrswk6u7ewunnmpawfoqlaguruk3lzwyljtqokzjee';
const IPFS_TOPIC_METADATA =
  'bafyreieqexbkdienxvsuvpn3upe3dqpilqt3abilftptemn6wluhnkbtvm';
const WELDING_TOPIC_METADATA =
  'bafyreiead6til3rcxtwj3jka2lfb64vdd2ppgpinda63obxpzxkc2pfe64';
const GRAPH_THEORY_TOPIC_METADATA =
  'bafyreiaopqvufupxtbl722ay4tzc3odf6ic3akcwgexh7rxtoslzqify5e';

async function seed(contract) {
  let tx, transferEvent;

  // Seed Topics
  tx = await contract.mintNode('topic', ETH_TOPIC_METADATA, [], []);
  transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
  const ethId = transferEvent.args.tokenId;

  tx = await contract.mintNode('topic', IPFS_TOPIC_METADATA, [], []);
  transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
  const ipfsId = transferEvent.args.tokenId;

  tx = await contract.mintNode('topic', WELDING_TOPIC_METADATA, [], []);
  transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
  const weldingId = transferEvent.args.tokenId;

  tx = await contract.mintNode('topic', GRAPH_THEORY_TOPIC_METADATA, [], []);
  transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
  const graphTheoryId = transferEvent.args.tokenId;

  // Seed Subgraph
  tx = await contract.mintNode('subgraph', WELDING_SUBGRAPH_METADATA, [weldingId, graphTheoryId], []);
  transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
  const weldingSubgraphId = transferEvent.args.tokenId;

  // Seed Intro Doc
  tx = await contract.mintNode('document', INTRO_DOC_METADATA, [weldingId, ethId, ipfsId], [weldingSubgraphId]);
  transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
  const documentId = transferEvent.args.tokenId;

  tx = await contract.mintNode('subgraph', HUGH_SUBGRAPH_METADATA, [weldingSubgraphId, weldingId, graphTheoryId], []);
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
