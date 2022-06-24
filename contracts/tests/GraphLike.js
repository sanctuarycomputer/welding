const { expect } = require("chai");

describe("Behavior: GraphLike", function () {
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

  it("should have the correct Name & Symbol", async function () {
    expect(await contract.name()).to.equal("Node");
    expect(await contract.symbol()).to.equal("NODE");
  });

  it("should be able to mint a Node", async function () {
    expect(await contract.exists(0)).to.equal(false);

    let tx = await contract.connect(addr1).mint('document', '123', [], [], []);
    tx = await tx.wait();
    const transferEvent = tx.events.find(e => e.event === "Transfer");
    const nodeId = transferEvent.args.tokenId;
    expect(await contract.exists(nodeId)).to.equal(true);
  });

  it("should be able to make initial connections when minting", async function () {
    let tx = await contract.connect(addr1).mint('subgraph', '123', [], [], []);
    let transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const subgraphId = transferEvent.args.tokenId;

    tx = await contract.connect(addr1).mint('topic', '123', [], [], []);
    transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const topic1Id = transferEvent.args.tokenId;

    tx = await contract.connect(addr1).mint('topic', '123', [], [], []);
    transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const topic2Id = transferEvent.args.tokenId;

    tx = await contract.connect(addr1).mint('document', '123', [{
      tokenId: topic1Id,
      name: "DESCRIBES"
    }, {
      tokenId: topic2Id,
      name: "DESCRIBES"
    }], [{
      tokenId: subgraphId,
      name: "BELONGS_TO"
    }], []);
    tx = await tx.wait();
    transferEvent = tx.events.find(e => e.event === "Transfer");
    const docId = transferEvent.args.tokenId;
  });

  it("should disallow connections when the caller cant edit the destination node", async function () {
    let tx = await contract.connect(addr1).mint('subgraph', '123', [], [], []);
    let transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const subgraphId = transferEvent.args.tokenId;

    tx = await contract.connect(addr1).mint('topic', '123', [], [], []);
    transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const topicId = transferEvent.args.tokenId;

    await expect(
      contract.connect(addr2).merge(topicId, '123', [], [{
        tokenId: subgraphId,
        name: "DESCRIBES"
      }])
    ).to.be.revertedWith("insufficient_permissions");

    await expect(
      contract.connect(addr1).merge(topicId, '123', [], [{
        tokenId: subgraphId,
        name: "DESCRIBES"
      }])
    ).to.not.be.reverted;
  });

  it("should not be able to mint a node with an empty label", async function() {
    await expect(
      contract.connect(addr1).mint('', '123', [], [], [])
    ).to.be.revertedWith("invalid_string")
  });

  it("should not be able to mint a node with an empty label starting with _", async function() {
    await expect(
      contract.connect(addr1).mint('_', '123', [], [], [])
    ).to.be.revertedWith("reserved_string")
  });

  it("should not be able to mint a node with an empty hash", async function() {
    await expect(
      contract.connect(addr1).mint('subgraph', '', [], [], [])
    ).to.be.revertedWith("invalid_string");
  });

  it("should not allow edge names that begin with _", async function () {
    let tx = await contract.connect(addr1).mint('subgraph', '123', [], [], []);
    let transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const subgraphId = transferEvent.args.tokenId;

    tx = await contract.connect(addr2).mint('topic', '123', [], [], []);
    transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const topicId = transferEvent.args.tokenId;

    await expect(
      contract.connect(addr1).merge(subgraphId, '123', [{
        tokenId: topicId,
        name: "_DESCRIBES"
      }], [])
    ).to.be.revertedWith("reserved_string");

    await expect(
      contract.connect(addr1).merge(subgraphId, '123', [{
        tokenId: topicId,
        name: "DESCRIBES_x"
      }], [])
    ).to.not.be.reverted;
  });

  it("should not be able to connect nonexistent nodes", async function () {
    let tx = await contract.connect(addr1).mint('subgraph', '123', [], [], []);
    let transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const subgraphId = transferEvent.args.tokenId;
    await expect(
      contract.connect(addr1).merge(subgraphId, '123', [{
        tokenId: 56,
        name: "DESCRIBES"
      }], [])
    ).to.be.revertedWith("node_nonexistent");
    await expect(
      contract.connect(addr1).merge(56, '123', [{
        tokenId: subgraphId,
        name: "DESCRIBES"
      }], [])
    ).to.be.revertedWith("node_nonexistent");
  });

  it("should not be able to connect to a node it cant edit", async function () {
    // Addr1 makes a subgraph
    let tx = await contract.connect(addr1).mint('subgraph', '123', [], [], []);
    let transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const subgraphId = transferEvent.args.tokenId;

    // Addr2 makes a topic
    tx = await contract.connect(addr2).mint('topic', '123', [], [], []);
    transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const topicId = transferEvent.args.tokenId;

    // Addr2 attempts to connect their topic to a subgraph they can't edit
    await expect(
      contract.connect(addr2).merge(subgraphId, '123', [{
        tokenId: topicId,
        name: "DESCRIBES"
      }], [])
    ).to.be.revertedWith("insufficient_permissions");

    await expect(
      contract.connect(addr2).merge(topicId, '123', [], [{
        tokenId: subgraphId,
        name: "DESCRIBES"
      }])
    ).to.be.revertedWith("insufficient_permissions");

    await contract.connect(addr1).grantRole(subgraphId, EDITOR_ROLE, addr2.address);

    await expect(
      contract.connect(addr2).merge(subgraphId, '123', [{
        tokenId: topicId,
        name: "DESCRIBES"
      }], [])
    ).to.not.be.revertedWith("insufficient_permissions");

    await expect(
      contract.connect(addr2).merge(topicId, '123', [], [{
        tokenId: subgraphId,
        name: "DESCRIBES"
      }])
    ).to.not.be.revertedWith("insufficient_permissions");
  });

  it("should be able to mint a subgraph and add a topic", async function () {
    let tx = await contract.connect(addr1).mint('subgraph', '123', [], [], []);
    let transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const subgraphId = transferEvent.args.tokenId;

    tx = await contract.connect(addr1).mint('topic', '123', [], [], []);
    transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const topicId = transferEvent.args.tokenId;

    await contract.connect(addr1).merge(subgraphId, '123', [{
      tokenId: topicId,
      name: "DESCRIBES"
    }], []);
  });

  it("should be able to disconnect nodes", async function () {
    let tx = await contract.connect(addr1).mint('subgraph', '123', [], [], []);
    let transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const subgraphId = transferEvent.args.tokenId;

    tx = await contract.connect(addr1).mint('topic', '123', [], [], []);
    transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const topicId = transferEvent.args.tokenId;

    await contract.connect(addr1).merge(subgraphId, '123', [{
      tokenId: topicId,
      name: "DESCRIBES"
    }], []);

    // Can only disconnect from an editable node
    await expect(
      contract.connect(addr2).merge(subgraphId, '123', [], [])
    ).to.be.revertedWith('insufficient_permissions');

    // Now it works
    await contract.connect(addr1).merge(subgraphId, '123', [], [])
  });
});
