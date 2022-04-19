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

  it("should be able to mint a Node and enumerate by label", async function () {
    expect(await contract.exists(0)).to.equal(false);
    expect(await contract.labelFor(0)).to.equal('');

    let tx = await contract.connect(addr1).mintNode('document', '123', [], []);
    tx = await tx.wait();
    const transferEvent = tx.events.find(e => e.event === "Transfer");
    const nodeId = transferEvent.args.tokenId;
    expect(await contract.exists(nodeId)).to.equal(true);

    expect(await contract.labelFor(nodeId)).to.equal("document");
    expect(await contract.getNodeCountForLabel("document")).to.equal(1);
    expect(await contract.getNodeForLabelAtIndex("document", 0)).to.equal(0);

    await (await contract.connect(addr1).mintNode('subgraph', '123', [], [])).wait();
    await (await contract.connect(addr1).mintNode('subgraph', '123', [], [])).wait();
    expect(await contract.getNodeCountForLabel('subgraph')).to.equal(2);
    expect(await contract.getNodeForLabelAtIndex('subgraph', 1)).to.equal(2);
  });

  it("should be able to make initial connections when minting", async function () {
    let tx = await contract.connect(addr1).mintNode('subgraph', '123', [], []);
    let transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const subgraphId = transferEvent.args.tokenId;

    tx = await contract.connect(addr1).mintNode('topic', '123', [], []);
    transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const topic1Id = transferEvent.args.tokenId;

    tx = await contract.connect(addr1).mintNode('topic', '123', [], []);
    transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const topic2Id = transferEvent.args.tokenId;

    tx = await contract.connect(addr1).mintNode('document', '123', [topic1Id, topic2Id], [subgraphId]);
    transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const docId = transferEvent.args.tokenId;

    const topicCountForDoc =
      await contract.connect(addr1).getConnectedNodeCountForNodeByLabel(docId, 'topic');
    expect(topicCountForDoc).to.equal(2);

    const topicId1ForDoc =
      await contract.connect(addr1).getConnectedNodeForNodeByLabelAndIndex(docId, 'topic', 0);
    expect(topicId1ForDoc).to.equal(topic1Id);
    const topicId2ForDoc =
      await contract.connect(addr1).getConnectedNodeForNodeByLabelAndIndex(docId, 'topic', 1);
    expect(topicId2ForDoc).to.equal(topic2Id);

    const backlinkedGraphCountForDoc =
      await contract.connect(addr1).getBacklinkedNodeCountForNodeByLabel(docId, 'subgraph');
    expect(backlinkedGraphCountForDoc).to.equal(1);

    const subgraphBacklinkIdForDoc =
      await contract.connect(addr1).getBacklinkedNodeForNodeByLabelAndIndex(docId, 'subgraph', 0);
    expect(subgraphBacklinkIdForDoc).to.equal(subgraphId);
  });

  it("should disallow connections when the caller cant edit the destination node", async function () {
    let tx = await contract.connect(addr1).mintNode('subgraph', '123', [], []);
    let transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const subgraphId = transferEvent.args.tokenId;

    tx = await contract.connect(addr1).mintNode('topic', '123', [], []);
    transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const topicId = transferEvent.args.tokenId;

    await expect(
      contract.connect(addr2).connectNodes(topicId, subgraphId)
    ).to.be.revertedWith("insufficient_permissions");

    await expect(
      contract.connect(addr1).connectNodes(topicId, subgraphId)
    ).to.not.be.reverted;
  });

  it("should not be able to mint a node with an empty label", async function() {
    await expect(
      contract.connect(addr1).mintNode('', '123', [], [])
    ).to.be.revertedWith("invalid_string")
  });

  it("should not be able to mint a node with an empty hash", async function() {
    await expect(
      contract.connect(addr1).mintNode('subgraph', '', [], [])
    ).to.be.revertedWith("invalid_string");
  });

  it("should not be able to connect nonexistent nodes", async function () {
    let tx = await contract.connect(addr1).mintNode('subgraph', '123', [], []);
    let transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const subgraphId = transferEvent.args.tokenId;
    await expect(
      contract.connect(addr1).connectNodes(56, subgraphId)
    ).to.be.revertedWith("node_nonexistent");
  });

  it("should not be able to connect to a node it cant edit", async function () {
    // Addr1 makes a subgraph
    let tx = await contract.connect(addr1).mintNode('subgraph', '123', [], []);
    let transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const subgraphId = transferEvent.args.tokenId;

    // Addr2 makes a topic
    tx = await contract.connect(addr2).mintNode('topic', '123', [], []);
    transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const topicId = transferEvent.args.tokenId;

    // Addr2 attempts to connect their topic to a subgraph they can't edit
    await expect(
      contract.connect(addr2).connectNodes(topicId, subgraphId)
    ).to.be.revertedWith("insufficient_permissions");

    await contract.connect(addr1).grantRole(subgraphId, EDITOR_ROLE, addr2.address);

    await expect(
      contract.connect(addr2).connectNodes(topicId, subgraphId)
    ).to.not.be.revertedWith("insufficient_permissions");
  });

  it("should be able to mint a subgraph and add a topic", async function () {
    let tx = await contract.connect(addr1).mintNode('subgraph', '123', [], []);
    let transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const subgraphId = transferEvent.args.tokenId;

    tx = await contract.connect(addr1).mintNode('topic', '123', [], []);
    transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const topicId = transferEvent.args.tokenId;

    await contract.connect(addr1).connectNodes(topicId, subgraphId);

    const topicCountForSubgraph =
      await contract.connect(addr1).getConnectedNodeCountForNodeByLabel(subgraphId, 'topic');
    expect(topicCountForSubgraph).to.equal(1);

    const topicIdForSubgraph =
      await contract.connect(addr1).getConnectedNodeForNodeByLabelAndIndex(subgraphId, 'topic', 0);
    expect(topicIdForSubgraph).to.equal(topicId);

    const subgraphBacklinksCountForTopic =
      await contract.connect(addr1).getBacklinkedNodeCountForNodeByLabel(topicId, 'subgraph');
    expect(subgraphBacklinksCountForTopic).to.equal(1);

    const subgraphBacklinkIdForTopic =
      await contract.connect(addr1).getBacklinkedNodeForNodeByLabelAndIndex(topicId, 'subgraph', 0);
    expect(subgraphBacklinkIdForTopic).to.equal(subgraphId);
  });

  it("should be able to load things for an address", async function () {
    // Nodes I'm an admin for
    // Nodes I'm an editor for
    // Nodes I own as an NFT
    // Nodes I've commented on?
  });
});
