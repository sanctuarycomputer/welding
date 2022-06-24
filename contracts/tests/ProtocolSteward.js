const { expect } = require("chai");

describe("Behavior: Protocol Steward", function () {
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

  it("protocol steward is the owner of the 1st token", async function () {
    expect(await contract.getProtocolMintFee()).to.equal(0);

    await expect(
      contract.protocolSteward()
    ).to.be.revertedWith("ERC721: owner query for nonexistent token");

    let tx = await contract.connect(addr1).mint('document', '123', [], [], []);
    tx = await tx.wait();

    expect(await contract.protocolSteward()).to.equal(addr1.address);
  });

  it("only the protocol steward can apply a minting fee", async function () {
    expect(await contract.getProtocolMintFee()).to.equal(0);
    let tx = await contract.connect(addr1).mint('document', '123', [], [], []);
    tx = await tx.wait();
    await expect(
      contract.connect(addr2).setProtocolMintFee(ONE_ETH)
    ).to.be.revertedWith("only_protocol_steward");
    await contract.connect(addr1).setProtocolMintFee(ONE_ETH);
    expect(await contract.getProtocolMintFee()).to.equal(ONE_ETH);
  });

  it("applies the protocol mint fee when minting", async function () {
    let tx = await contract.connect(addr1).mint('document', '123', [], [], []);
    tx = await tx.wait();
    await contract.connect(addr1).setProtocolMintFee(ONE_ETH);

    await expect(
      contract.connect(addr2).mint('document', '123', [], [], [])
    ).to.be.reverted;

    expect(await contract.connect(addr1).payments(addr1.address)).to.equal(0);
    await contract.connect(addr2).mint('document', '123', [], [], [], {
      value: ONE_ETH
    });
    expect(await contract.connect(addr1).payments(addr1.address)).to.equal(ONE_ETH);
  });

  it("can accept donations", async function () {
    let tx = await contract.connect(addr1).mint('document', '123', [], [], []);
    tx = await tx.wait();
    const transferEvent = tx.events.find(e => e.event === "Transfer");
    const docId = transferEvent.args.tokenId;

    await contract.connect(addr1).setConnectionFee(docId, ONE_ETH);
  });

  it("excess eth sent goes to the platform steward", async function () {
    let tx = await contract.connect(addr3).mint('topic', '123', [], [], []);
    tx = await tx.wait();
    expect(await contract.protocolSteward()).to.equal(addr3.address);

    tx = await contract.connect(addr2).mint('topic', '123', [], [], []);
    tx = await tx.wait();
    let transferEvent = tx.events.find(e => e.event === "Transfer");
    const topicId = transferEvent.args.tokenId;
    await contract.connect(addr2).setConnectionFee(topicId, ONE_ETH);

    expect(await waffle.provider.getBalance(contract.address)).to.equal(0);
    tx = await contract.connect(addr1).mint('document', '123', [{
      tokenId: topicId,
      name: "DESCRIBES"
    }], [], [], {
      value: ONE_ETH.add(ONE_ETH) // accidentally sends too much ETH
    });
    tx = await tx.wait();
    expect(await waffle.provider.getBalance(contract.address)).to.equal(ONE_ETH);

    tx = await contract.connect(addr3).depositProtocolBalance();
    tx = await tx.wait();
    expect(await contract.connect(addr3).payments(addr3.address)).to.equal(ONE_ETH);
    expect(await waffle.provider.getBalance(contract.address)).to.equal(0);
  });

  it("can set default royalty info", async function () {
    let tx = await contract.connect(addr1).mint('topic', '123', [], [], []);
    tx = await tx.wait();
    let transferEvent = tx.events.find(e => e.event === "Transfer");
    const topicId = transferEvent.args.tokenId;

    let [receiver, amount] = await contract.royaltyInfo(topicId, ONE_ETH);
    expect(receiver).to.equal('0x0000000000000000000000000000000000000000');
    expect(amount).to.equal(0);

    await expect(
      contract.connect(addr2).setDefaultRoyalty(addr1.address, 10)
    ).to.be.revertedWith("only_protocol_steward");

    await contract.connect(addr1).setDefaultRoyalty(addr1.address, 10);

    [receiver, amount] = await contract.royaltyInfo(topicId, ONE_ETH);
    expect(receiver).to.equal(addr1.address);
    expect(amount).to.equal(
      (ONE_ETH.mul(10)).div(10000)
    );

    await contract.connect(addr1).resetDefaultRoyalty();

    [receiver, amount] = await contract.royaltyInfo(topicId, ONE_ETH);
    expect(receiver).to.equal('0x0000000000000000000000000000000000000000');
    expect(amount).to.equal(0);
  });
});
