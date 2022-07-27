const { expect } = require("chai");

describe("Behavior: Royalties", function () {
  let contract;

  let deployer;
  let addr1;
  let addr2;
  let addr3;

  const ONE_ETH = ethers.utils.parseEther('1');

  beforeEach(async function () {
    [deployer, addr1, addr2, addr3] = await ethers.getSigners();
    contract = await (await ethers.getContractFactory("Node")).deploy();
  });

  it("should only allow the creator to set royalty info when they hold it", async function () {
    let tx = await contract.connect(addr1).mint('document', '123', [], [], []);
    tx = await tx.wait();
    const transferEvent = tx.events.find(e => e.event === "Transfer");
    const docId = transferEvent.args.tokenId;

    // Addr 2 can't setTokenRoyalty
    await expect(
      contract.connect(addr2).setTokenRoyalty(docId, addr2.address, 10)
    ).to.be.revertedWith("insufficient_permissions");

    // Addr1 transfers to Addr2
    await contract.connect(addr1)[
      'safeTransferFrom(address,address,uint256)'
    ](addr1.address, addr2.address, docId);

    // Neither Addr1 or Addr2 can setTokenRoyalty
    await expect(
      contract.connect(addr1).setTokenRoyalty(docId, addr1.address, 10)
    ).to.be.revertedWith("insufficient_permissions");

    await expect(
      contract.connect(addr2).setTokenRoyalty(docId, addr2.address, 10)
    ).to.be.revertedWith("insufficient_permissions");

    // Addr2 transfers back to Addr1
    await contract.connect(addr2)[
      'safeTransferFrom(address,address,uint256)'
    ](addr2.address, addr1.address, docId);

    // Addr1 can now successfully setTokenRoyalty, as they are both the owner
    // and the original creator of the NFT
    await contract.connect(addr1).setTokenRoyalty(docId, addr1.address, 10)
  });

  it("should be able to retrieve & set royalty info", async function () {
    let tx = await contract.connect(addr1).mint('document', '123', [], [], []);
    tx = await tx.wait();
    const transferEvent = tx.events.find(e => e.event === "Transfer");
    const docId = transferEvent.args.tokenId;

    let [receiver, amount] = await contract.royaltyInfo(docId, ONE_ETH);
    expect(receiver).to.equal('0x0000000000000000000000000000000000000000');
    expect(amount).to.equal(0);

    await expect(
      contract.connect(addr2).setTokenRoyalty(docId, addr2.address, 10)
    ).to.be.revertedWith("insufficient_permissions");
    await contract.connect(addr1).setTokenRoyalty(docId, addr1.address, 10);

    [receiver, amount] = await contract.royaltyInfo(docId, ONE_ETH);
    expect(receiver).to.equal(addr1.address);
    expect(amount).to.equal(
      (ONE_ETH.mul(10)).div(10000)
    );

    await contract.connect(addr1).resetTokenRoyalty(docId);
    [receiver, amount] = await contract.royaltyInfo(docId, ONE_ETH);
    expect(receiver).to.equal('0x0000000000000000000000000000000000000000');
    expect(amount).to.equal(0);
  });
});
