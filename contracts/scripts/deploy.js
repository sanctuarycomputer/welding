async function deploy(name, args) {
  console.log(`${name}: Deploying...`);
  const Factory = await ethers.getContractFactory(name);
  const instance = (
    args ?
    await Factory.deploy(...args) :
    await Factory.deploy()
  );
  await instance.deployed();
  // This solves the bug in Mumbai network where the contract address is not the real one
  const txHash = instance.deployTransaction.hash;
  console.log(`${name}: Waiting for transaction...`);
  const txReceipt = await ethers.provider.waitForTransaction(txHash);
  console.log(`${name}: Deployed - ${txReceipt.contractAddress}`);
  return txReceipt.contractAddress;
}

async function deployAll() {
  const graphsAddress = await deploy("Graph");
  const topicsAddress = await deploy("Topic");
  const documentsAddress = await deploy("Document");
  await deploy("Plane", [graphsAddress, topicsAddress, documentsAddress]);
}

deployAll()
 .then(() => process.exit(0))
 .catch((error) => {
   console.error(error);
   process.exit(1);
 });
