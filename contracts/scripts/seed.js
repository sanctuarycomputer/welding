const Node = require("../../artifacts/contracts/src/Node.sol/Node.json");

const map = {
  //"1": "bafyreifmtnsaaehszio5zuujdyhszadlfhxm5uzynfeeqqjctu2oafy5iy",
  //"2": "bafyreiedhcvbl4p2gs5xu5tucxn3eibeptxb52ilqxxplxgtzg3j6qx5de",
  //"3": "bafyreibrsrjoiyracuglprgepht3opxtzruar6ost2mujxhsve4mzptjka",
  //"4": "bafyreiehkreyfmbvb6whryl4xf7d2xw5vm7todwgu35nb7tqs6yau3lnly",
  //"5": "bafybeiaqghyyoswv75p73nexfdaqdwgr4rbdtrotr2xdd2zqtthicjcnma",
  "6": "bafyreibijgqm6zhfbapbqah2dif2nck3dgsxc4s6ayfvawsppq2e2n57su",
  "7": "bafyreib4uufqoird6odcfvgv6eqf4jlnmenwjy4wel7ib7ibjtxx675gga",
  "8": "bafyreibjw56psfiboh65m6bhyz7rwsoqoccc5nyeqbjt2lfcllo6xisxei",
  "9": "bafyreihbac6vh2w4dmfgvnlqczki3wqj5dncwkzztit2h4m7asxpetgp7a",
  "10": "bafyreigsknnzohnlpvh3ltrppxevhgyb2dtxh4s44mynxt3joz5byqd3gm",
  "11": "bafyreigd7ucs2l5smxvt74izjrwovckeogsprvzaujsc6z6i5vyuqskjcq",
  "12": "bafyreicsijsapkmv4lyd7sltxvc46kms3f533ivovfscsfkz2hw4m2dvam"
};

async function seed(tokenId, hash) {
  for (const [key, value] of Object.entries(map)) {
    const provider = new ethers.providers.AlchemyProvider(
      process.env.NEXT_PUBLIC_NETWORK,
      process.env.NEXT_PUBLIC_ALCHEMY_PROJECT_ID
    );
    const signer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(
      process.env.NEXT_PUBLIC_NODE_ADDRESS || "no_address_given",
      Node.abi
    ).connect(signer);
    tx = await contract.revise(key, value, {
      from: '0x791bD6bF15f9910092be1bBcEea80686731581F6',
      gasPrice: 410000000000,
    });
    console.log(`Revised: ${key}, ${value}`);
  }
};

seed()
 .then(() => process.exit(0))
 .catch((error) => {
   console.error(error);
   process.exit(1);
 });
