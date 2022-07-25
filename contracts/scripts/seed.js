const Node = require("../../artifacts/contracts/src/Node.sol/Node.json");

async function seed(tokenId, hash) {
  const provider = new ethers.providers.AlchemyProvider(
    process.env.NEXT_PUBLIC_NETWORK,
    process.env.NEXT_PUBLIC_ALCHEMY_PROJECT_ID
  );
  const signer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

  const contract = new ethers.Contract(
    process.env.NEXT_PUBLIC_NODE_ADDRESS || "no_address_given",
    Node.abi
  ).connect(signer);
  tx = await contract.revise(tokenId, hash, {
    gasPrice: 410000000000,
    from: '0x791bD6bF15f9910092be1bBcEea80686731581F6'
  });
  console.log(`Revised`);
};

seed("", "")
 .then(() => process.exit(0))
 .catch((error) => {
   console.error(error);
   process.exit(1);
 });
