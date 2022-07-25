const { expect } = require("chai");

describe("Behavior: Payable", function () {
  let contract;

  let deployer;
  let addr1;
  let addr2;
  let addr3;

  let ADMIN_ROLE;
  let EDITOR_ROLE;

  const ONE_ETH = ethers.utils.parseEther('1');

  beforeEach(async function () {
    [deployer, addr1, addr2, addr3] = await ethers.getSigners();
    contract = await (await ethers.getContractFactory("Node")).deploy();
    ADMIN_ROLE = await contract.ADMIN_ROLE();
    EDITOR_ROLE = await contract.EDITOR_ROLE();
  });

  it("the owner can set connection fees", async function () {
    let tx = await contract.connect(addr1).mint('document', '123', [], [], []);
    tx = await tx.wait();
    const transferEvent = tx.events.find(e => e.event === "Transfer");
    const docId = transferEvent.args.tokenId;

    expect(await contract.getConnectionFee(docId)).to.equal(0);

    await expect(
      contract.connect(addr2).setConnectionFee(docId, 0)
    ).to.be.revertedWith("insufficient_permissions");

    await contract.connect(addr1).setConnectionFee(docId, 123);
    expect(await contract.getConnectionFee(docId)).to.equal(123);
  });

  it("should not enforce a fee for NFT owners or editors of the incoming node", async function () {
    let tx = await contract.connect(addr1).mint('topic', '123', [], [], []);
    tx = await tx.wait();
    let transferEvent = tx.events.find(e => e.event === "Transfer");
    const topicId = transferEvent.args.tokenId;
    expect(await contract.connect(addr1).payments(addr2.address)).to.equal(0);

    await contract.connect(addr1).setConnectionFee(topicId, ONE_ETH);

    await expect(
      contract.connect(addr1).mint('document', '123', [{
        tokenId: topicId,
        name: "DESCRIBES"
      }], [], [])
    ).to.not.be.reverted;
  });

  it("should enforce a fee when making incoming connections", async function () {
    let tx = await contract.connect(addr2).mint('topic', '123', [], [], []);
    tx = await tx.wait();
    let transferEvent = tx.events.find(e => e.event === "Transfer");
    const topicId = transferEvent.args.tokenId;
    expect(await contract.connect(addr2).payments(addr2.address)).to.equal(0);

    await contract.connect(addr2).setConnectionFee(topicId, ONE_ETH);

    await expect(
      contract.connect(addr1).mint('document', '123', [{
        tokenId: topicId,
        name: "DESCRIBES"
      }], [], [], {
        value: 5 // not enough ether
      })
    ).to.be.revertedWith("function call failed to execute");

    tx = await contract.connect(addr1).mint('document', '123', [{
      tokenId: topicId,
      name: "DESCRIBES"
    }], [], [], {
      value: ONE_ETH // enough ether!
    });
    tx = await tx.wait();
    transferEvent = tx.events.find(e => e.event === "Transfer");
    const docId = transferEvent.args.tokenId;

    expect(await contract.connect(addr2).payments(addr2.address)).to.equal(ONE_ETH);

    const initialBalance = await addr2.getBalance();
    tx = await contract.connect(addr2).withdrawPayments(addr2.address);
    tx = await tx.wait();
    const gasSpent = tx.gasUsed.mul(tx.effectiveGasPrice);

    // New balance is the withdraw
    expect(await addr2.getBalance()).to.equal(
      initialBalance.add(ONE_ETH).sub(gasSpent)
    );

    expect(await contract.connect(addr2).payments(addr2.address)).to.equal(0);

    // This connection has been made, so updating the node connections
    // no longer costs
    await contract.connect(addr1).merge(docId, '456', [{
      tokenId: topicId,
      name: "DESCRIBES"
    }], []);
  });
});
