const { expect } = require("chai");

describe("Behavior: Basics", function () {
  let contract;
  let deployer;
  let addr1;
  let addr2;
  let addr3;

  beforeEach(async function () {
    [deployer, addr1, addr2, addr3] = await ethers.getSigners();
    contract = await (await ethers.getContractFactory("Node")).deploy();
  });

  it("can test if a token has been issued yet", async function () {
    expect(await contract.exists(ethers.BigNumber.from(0))).to.equal(false);
    await contract.connect(addr1).mintNode('document', '123', [], []);
    expect(await contract.exists(ethers.BigNumber.from(0))).to.equal(true);
  });

  it("It should be able to mint a new Graph", async function () {
    expect(await contract.balanceOf(addr1.address)).to.equal(0);
    await contract.connect(addr1).mintNode('document', '123', [], []);
    expect(await contract.balanceOf(addr1.address)).to.equal(1);
  });
});
