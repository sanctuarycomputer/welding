const { expect } = require("chai");

describe("Behavior: Per-token Role Management", function () {
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

  it("can manage roles on a per-token basis", async function () {
    let tx = await contract.connect(addr1).mint('document', '123', [], []);
    await contract.connect(addr1).mint('document', '123', [], []);
    tx = await tx.wait();
    const transferEvent = tx.events.find(e => e.event === "Transfer");
    const docId = transferEvent.args.tokenId;

    expect(await contract.hasRole(docId, ADMIN_ROLE, addr1.address)).to.equal(true);
    expect(await contract.hasRole(docId, ADMIN_ROLE, addr2.address)).to.equal(false);

    /* Addr1 revises the NFT */
    await contract.connect(addr1).merge(docId, '456', [], []);

    /* Addr2 attempts to revise the NFT */
    await expect(
      contract.connect(addr2).merge(docId, '789', [], [])
    ).to.be.revertedWith("insufficient_permissions");

    /* Addr1 gives Addr2 the EDITOR_ROLE */
    await contract.connect(addr1).grantRole(docId, EDITOR_ROLE, addr2.address);
    expect(await contract.hasRole(docId, ADMIN_ROLE, addr2.address)).to.equal(false);
    expect(await contract.hasRole(docId, EDITOR_ROLE, addr2.address)).to.equal(true);

    /* Addr2 can now revise the NFT... */
    await contract.connect(addr2).merge(docId, '789', [], []);

    /* Addr2 but can not give anyone else any roles... */
    await expect(
      contract.connect(addr2).grantRole(docId, EDITOR_ROLE, addr3.address)
    ).to.be.revertedWith('insufficient_permissions');

    /* And they can renounce their own role too! */
    await contract.connect(addr2).renounceRole(docId, EDITOR_ROLE);
    expect(await contract.hasRole(docId, EDITOR_ROLE, addr2.address)).to.equal(false);
  });

  it("asdf", async function () {
    let tx = await contract.connect(addr1).mint('Subgraph', '123', [], []);
    tx = await tx.wait();
    let transferEvent = tx.events.find(e => e.event === "Transfer");
    const subgraphId = transferEvent.args.tokenId;

    tx = await contract.connect(addr1).mint('Document', '123', [], [{
      tokenId: subgraphId,
      name: "BELONGS_TO"
    }]);
    tx = await tx.wait();
    transferEvent = tx.events.find(e => e.event === "Transfer");
    const docId = transferEvent.args.tokenId;

    // addr2 is allowed to edit the document
    await contract.connect(addr1).grantRole(docId, EDITOR_ROLE, addr2.address);

    // addr2 adds a topic to the document
    tx = await contract.connect(addr2).mint('Topic', '123', [], []);
    tx = await tx.wait();
    transferEvent = tx.events.find(e => e.event === "Transfer");
    const topicId = transferEvent.args.tokenId;

    // Even though addr2 can't edit the subgraph, it's currently
    // connected, so the published revision allows it
    await contract.connect(addr2).merge(docId, '123', [{
      tokenId: topicId,
      name: "DESCRIBES"
    }], [{
      tokenId: subgraphId,
      name: "BELONGS_TO"
    }]);

    // addr2 removes the topic
    await contract.connect(addr2).merge(docId, '123', [], [{
      tokenId: subgraphId,
      name: "BELONGS_TO"
    }]);

    // but can not remove the subgraph
    await expect(
      contract.connect(addr2).merge(docId, '123', [], [])
    ).to.be.revertedWith("insufficient_permissions");

    // So, addr1 grants addr2 subgraph editor
    await contract.connect(addr1).grantRole(subgraphId, EDITOR_ROLE, addr2.address);

    // And now, add2 can disconnect the subgraph
    await expect(
      contract.connect(addr2).merge(docId, '123', [], [])
    ).to.not.be.reverted;
  });
});
