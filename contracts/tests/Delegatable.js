const { expect } = require("chai");

describe("Behavior: Delegatable", function () {
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

  it("should ensure the delegator has ADMIN permissions for that node", async function () {
    let tx = await contract.connect(addr1).mintNode('subgraph', '123', [], []);
    tx = await tx.wait();
    let transferEvent = tx.events.find(e => e.event === "Transfer");
    const subgraphId = transferEvent.args.tokenId;

    tx = await contract.connect(addr2).mintNode('document', '123', [], []);
    tx = await tx.wait();
    transferEvent = tx.events.find(e => e.event === "Transfer");
    const doc1 = transferEvent.args.tokenId;

    await expect(
      contract.connect(addr1).delegatePermissions(doc1, subgraphId)
    ).to.be.revertedWith("insufficient_permissions");

    await contract.connect(addr2).delegatePermissions(doc1, subgraphId);
  });

  // TODO: Only admins of both can do this
  it("should not allow recursive delegation", async function () {
    let tx = await contract.connect(addr1).mintNode('subgraph', '123', [], []);
    tx = await tx.wait();
    let transferEvent = tx.events.find(e => e.event === "Transfer");
    const subgraph1Id = transferEvent.args.tokenId;

    // Can't delegate to self
    await expect(
      contract.connect(addr1).delegatePermissions(subgraph1Id, subgraph1Id)
    ).to.be.revertedWith("recursive_delegation");

    tx = await contract.connect(addr1).mintNode('document', '123', [], []);
    tx = await tx.wait();
    transferEvent = tx.events.find(e => e.event === "Transfer");
    const document1Id = transferEvent.args.tokenId;

    tx = await contract.connect(addr1).mintNode('document', '123', [], []);
    tx = await tx.wait();
    transferEvent = tx.events.find(e => e.event === "Transfer");
    const document2Id = transferEvent.args.tokenId;

    await contract.connect(addr1).delegatePermissions(document1Id, subgraph1Id);

    // Document1 already delegates to Subgraph,
    // so Document2 can't delgate to Document1
    await expect(
      contract.connect(addr1).delegatePermissions(document2Id, document1Id)
    ).to.be.revertedWith("recursive_delegation");

    // Subgraph already delegates for Document1,
    // so it's not allowed to add a delegate.
    await expect(
      contract.connect(addr1).delegatePermissions(subgraph1Id, document2Id)
    ).to.be.revertedWith("recursive_delegation");

    // But, Document2 is safe to delegate to Subgraph
    await contract.connect(addr1).delegatePermissions(document2Id, subgraph1Id);

    // ...And the documents can delegate to a second subgraph!
    tx = await contract.connect(addr1).mintNode('subgraph', '123', [], []);
    tx = await tx.wait();
    transferEvent = tx.events.find(e => e.event === "Transfer");
    const subgraph2Id = transferEvent.args.tokenId;

    await contract.connect(addr1).delegatePermissions(document1Id, subgraph2Id);
    await contract.connect(addr1).delegatePermissions(document2Id, subgraph2Id);
  });

  it("hasRole respects delegations", async function () {
    let tx = await contract.connect(addr1).mintNode('subgraph', '123', [], []);
    tx = await tx.wait();
    let transferEvent = tx.events.find(e => e.event === "Transfer");
    const subgraphId = transferEvent.args.tokenId;

    // Give addr2 Subgraph EDITOR
    await contract.connect(addr1).grantRole(subgraphId, EDITOR_ROLE, addr2.address);

    tx = await contract.connect(addr1).mintNode('document', '123', [subgraphId], []);
    tx = await tx.wait();
    transferEvent = tx.events.find(e => e.event === "Transfer");
    const docId = transferEvent.args.tokenId;

    // Ask Doc to subsume Subgraph's permission set
    await contract.connect(addr1).delegatePermissions(docId, subgraphId);

    expect(await contract.hasRole(docId, EDITOR_ROLE, addr2.address)).to.equal(true);
    expect(await contract.hasRole(docId, ADMIN_ROLE, addr2.address)).to.equal(false);

    await contract.connect(addr1).renounceDelegatePermissions(docId, subgraphId);

    // Addr2 is still an editor for the subgraph
    expect(await contract.hasRole(subgraphId, EDITOR_ROLE, addr2.address)).to.equal(true);

    // But they aren't editors on the doc, because the delegate was renounced
    expect(await contract.hasRole(docId, EDITOR_ROLE, addr2.address)).to.equal(false);
    expect(await contract.hasRole(docId, ADMIN_ROLE, addr2.address)).to.equal(false);

    // Addr1's roles are still intact of course
    expect(await contract.hasRole(docId, ADMIN_ROLE, addr1.address)).to.equal(true);
    expect(await contract.hasRole(subgraphId, ADMIN_ROLE, addr1.address)).to.equal(true);
  });
});
