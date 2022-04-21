const { expect } = require("chai");

describe("Behavior: Public", function () {
  let contract;

  let deployer;
  let addr1;
  let addr2;
  let addr3;

  let ADMIN_ROLE;
  let EDITOR_ROLE;
  let FEE_FALLBACK;

  beforeEach(async function () {
    [deployer, addr1, addr2, addr3] = await ethers.getSigners();
    contract = await (await ethers.getContractFactory("Node")).deploy();
    ADMIN_ROLE = await contract.ADMIN_ROLE();
    EDITOR_ROLE = await contract.EDITOR_ROLE();
    FEE_FALLBACK = await contract.FEE_FALLBACK();
  });

  it("should fallback to the FEE_FALLBACK", async function () {
    let tx = await contract.connect(addr1).mintNode('document', '123', [], []);
    tx = await tx.wait();
    const transferEvent = tx.events.find(e => e.event === "Transfer");
    const docId = transferEvent.args.tokenId;

    expect(await contract.getConnectionFee(docId)).to.equal(999999);

    await expect(
      contract.connect(addr2).setConnectionFee(docId, 0)
    ).to.be.revertedWith("insufficient_permissions");

    await contract.connect(addr1).setConnectionFee(docId, 123);
    expect(await contract.getConnectionFee(docId)).to.equal(123);
  });
});
