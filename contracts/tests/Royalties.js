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
