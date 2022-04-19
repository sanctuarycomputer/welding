const { expect } = require("chai");

describe("Node", function () {
  let Node;
  let nodeContract;
  let deployer;
  let addr1;
  let addr2;
  let addr3;

  beforeEach(async function () {
    [deployer, addr1, addr2, addr3] = await ethers.getSigners();

    Node = await ethers.getContractFactory("Node");
    nodeContract = await Node.deploy();
  });

  it("should have the correct Name & Symbol", async function () {
    expect(await nodeContract.name()).to.equal("Node");
    expect(await nodeContract.symbol()).to.equal("NODE");
  });

  it("should be able to mint a Node and enumerate by label", async function () {
    expect(await nodeContract.exists(0)).to.equal(false);
    try {
      await nodeContract.labelFor(0);
    } catch(e) {
      expect(!!e).to.equal(true);
    }

    let tx = await nodeContract.connect(addr1).mintNode('document', '123', [], []);
    tx = await tx.wait();
    const transferEvent = tx.events.find(e => e.event === "Transfer");
    const nodeId = transferEvent.args.tokenId;
    expect(await nodeContract.exists(nodeId)).to.equal(true);

    expect(await nodeContract.labelFor(nodeId)).to.equal("document");
    expect(await nodeContract.getNodeCountForLabel("document")).to.equal(1);
    expect(await nodeContract.getNodeForLabelAtIndex("document", 0)).to.equal(0);

    await (await nodeContract.connect(addr1).mintNode('subgraph', '123', [], [])).wait();
    await (await nodeContract.connect(addr1).mintNode('subgraph', '123', [], [])).wait();
    expect(await nodeContract.getNodeCountForLabel('subgraph')).to.equal(2);
    expect(await nodeContract.getNodeForLabelAtIndex('subgraph', 1)).to.equal(2);
  });

  it("should disallow connections when the caller cant edit the destination node", async function () {
    const contract = nodeContract.connect(addr1);

    let tx = await contract.mintNode('subgraph', '123', [], []);
    let transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const subgraphId = transferEvent.args.tokenId;

    tx = await contract.mintNode('topic', '123', [], []);
    transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const topicId = transferEvent.args.tokenId;

    expect(
      nodeContract.connect(addr2).connectNodes(topicId, subgraphId)
    ).to.be.revertedWith("insufficient_permissions");

    expect(
      contract.connectNodes(topicId, subgraphId)
    ).to.not.be.revertedWith("insufficient_permissions");
  });

  it("should be able to mint a subgraph and add a topic", async function () {
    const contract = nodeContract.connect(addr1);

    let tx = await contract.mintNode('subgraph', '123', [], []);
    let transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const subgraphId = transferEvent.args.tokenId;

    tx = await contract.mintNode('topic', '123', [], []);
    transferEvent = (await tx.wait()).events.find(e => e.event === "Transfer");
    const topicId = transferEvent.args.tokenId;

    await contract.connectNodes(topicId, subgraphId);

    const topicCountForSubgraph =
      await contract.getConnectedNodeCountForNodeByLabel(subgraphId, 'topic');
    expect(topicCountForSubgraph).to.equal(1);

    const topicIdForSubgraph =
      await contract.getConnectedNodeForNodeByLabelAndIndex(subgraphId, 'topic', 0);
    expect(topicIdForSubgraph).to.equal(topicId);

    const subgraphBacklinksCountForTopic =
      await contract.getBacklinkedNodeCountForNodeByLabel(topicId, 'subgraph');
    expect(subgraphBacklinksCountForTopic).to.equal(1);

    const subgraphBacklinkIdForTopic =
      await contract.getBacklinkedNodeForNodeByLabelAndIndex(topicId, 'subgraph', 0);
    expect(subgraphBacklinkIdForTopic).to.equal(subgraphId);
  });

  it("should be able to load things for an address", async function () {
    // Nodes I'm an admin for
    // Nodes I'm an editor for
    // Nodes I own as an NFT
    // Nodes I've commented on?
  });
});
