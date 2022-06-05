const { expect } = require("chai");

describe("Behavior: Revisable", function () {
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

  // TODO test permissions
  it("should be revisable", async function () {
    let tx = await contract.connect(addr1).mint('document', '123', [], [], []);
    tx = await tx.wait();
    const transferEvent = tx.events.find(e => e.event === "Transfer");
    const docId = transferEvent.args.tokenId;
    expect(await contract.tokenURI(docId)).to.equal('ipfs://123/metadata.json');

    await contract.connect(addr1).merge(docId, '456', [], []);
    expect(await contract.tokenURI(docId)).to.equal('ipfs://456/metadata.json');
  });

  it("should not be able to revise a burnt node", async function () {
    let tx = await contract.connect(addr1).mint('document', '123', [], [], []);
    tx = await tx.wait();
    const transferEvent = tx.events.find(e => e.event === "Transfer");
    const docId = transferEvent.args.tokenId;

    tx = await contract.connect(addr1).burnNode(docId);
    tx = await tx.wait();

    expect(
      contract.connect(addr1).merge(docId, '456', [], [])
    ).to.be.revertedWith("node_nonexistent");
  });

  it("should require a non-empty hash string", async function () {
    let tx = await contract.connect(addr1).mint('document', '123', [], [], []);
    tx = await tx.wait();
    const transferEvent = tx.events.find(e => e.event === "Transfer");
    const docId = transferEvent.args.tokenId;
    expect(await contract.tokenURI(docId)).to.equal('ipfs://123/metadata.json');

    await expect(
      contract.connect(addr1).merge(docId, '', [], [])
    ).to.be.revertedWith("invalid_string");
  });
});
