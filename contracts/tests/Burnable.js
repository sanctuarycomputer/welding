const { expect } = require("chai");

describe("Behavior: Burnable", function () {
  let contract;
  let deployer;
  let addr1;
  let addr2;
  let addr3;
  let ADMIN_ROLE;
  let EDITOR_ROLE;

  beforeEach(async function () {
    [deployer, addr1, addr2, addr3] = await ethers.getSigners();
    contract = await (await ethers.getContractFactory("Node")).deploy();
    ADMIN_ROLE = await contract.ADMIN_ROLE();
    EDITOR_ROLE = await contract.EDITOR_ROLE();
  });

  it("should be able to burn a Node", async function () {
    let tx = await contract.connect(addr1).mintNode('document', '123', [], []);
    tx = await tx.wait();
    let transferEvent = tx.events.find(e => e.event === "Transfer");
    const nodeId = transferEvent.args.tokenId;

    await expect(
      contract.burnNode(955)
    ).to.be.revertedWith("node_nonexistent");

    await expect(
      contract.burnNode(nodeId)
    ).to.be.revertedWith("insufficient_permissions");

    tx = await contract.connect(addr1).burnNode(nodeId);
    tx = await tx.wait();
    transferEvent = tx.events.find(e => e.event === "Transfer");
    expect(transferEvent.args.to).to.equal('0x0000000000000000000000000000000000000000');
  });
});
