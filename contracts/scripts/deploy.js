const WELDING_SUBGRAPH_METADATA =
  'bafyreieuckykhmoltvk7v3y6omgu5lsyx3qqmrxjxtyfrj7cdhuayl4a3e';
const INTRO_DOC_METADATA =
  'bafybeifgqhh3u6ksbbrn3rh46dcisdp6ziuiuvhcu4hwvngkbmr4uprcta';
const ETH_TOPIC_METADATA =
  'bafyreiedhcvbl4p2gs5xu5tucxn3eibeptxb52ilqxxplxgtzg3j6qx5de';
const IPFS_TOPIC_METADATA =
  'bafyreibrsrjoiyracuglprgepht3opxtzruar6ost2mujxhsve4mzptjka';
const WELDING_TOPIC_METADATA =
  'bafyreifmtnsaaehszio5zuujdyhszadlfhxm5uzynfeeqqjctu2oafy5iy';

async function seed(contract) {
  console.log(`Seeding initial nodes...`);
  let tx, transferEvent;

  // Seed Topics
  tx = await contract.mint('topic', WELDING_TOPIC_METADATA, [], [], []);
  transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
  const weldingId = transferEvent.args.tokenId;

  tx = await contract.mint('topic', ETH_TOPIC_METADATA, [], [], []);
  transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
  const ethId = transferEvent.args.tokenId;

  tx = await contract.mint('topic', IPFS_TOPIC_METADATA, [], [], []);
  transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
  const ipfsId = transferEvent.args.tokenId;

  // Seed Subgraph
  tx = await contract.mint('subgraph', WELDING_SUBGRAPH_METADATA, [{
    tokenId: ethId,
    name: "DESCRIBES"
  }, {
    tokenId: ipfsId,
    name: "DESCRIBES"
  }], [], []);
  transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
  const weldingSubgraphId = transferEvent.args.tokenId;

  // Seed Intro Doc
  tx = await contract.mint('document', INTRO_DOC_METADATA, [{
    tokenId: weldingId,
    name: "DESCRIBES"
  }], [{
    tokenId: weldingSubgraphId,
    name: "BELONGS_TO"
  }], [weldingSubgraphId]);
  transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
  const documentId = transferEvent.args.tokenId;

  console.log(`Seeding complete!`);
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
