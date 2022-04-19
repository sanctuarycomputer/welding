const { expect } = require("chai");

describe("Graph", function () {
  let Graph;
  let graphContract;
  let deployer;
  let addr1;
  let addr2;
  let addr3;
  let ADMIN_ROLE;
  let EDITOR_ROLE;

  beforeEach(async function () {
    Graph = await ethers.getContractFactory("Graph");
    [deployer, addr1, addr2, addr3] = await ethers.getSigners();
    graphContract = await Graph.deploy();
    ADMIN_ROLE = await graphContract.ADMIN_ROLE();
    EDITOR_ROLE = await graphContract.EDITOR_ROLE();
  });

  it("can test if a token has been issued yet", async function () {
    expect(await graphContract.exists(ethers.BigNumber.from(0))).to.equal(false);
    await graphContract.connect(addr1).mint('123');
    expect(await graphContract.exists(ethers.BigNumber.from(0))).to.equal(true);
  });

  it("It should be able to mint a new Graph", async function () {
    expect(await graphContract.balanceOf(addr1.address)).to.equal(0);
    await graphContract.connect(addr1).mint('123');
    expect(await graphContract.balanceOf(addr1.address)).to.equal(1);
  });

  it("can manage roles on a per-token basis", async function () {
    let tx = await graphContract.connect(addr1).mint('123');
    tx = await tx.wait();
    const transferEvent = tx.events.find(e => e.event === "Transfer");
    const graphId = transferEvent.args.tokenId;

    expect(await graphContract.hasRole(graphId, ADMIN_ROLE, addr1.address)).to.equal(true);
    expect(await graphContract.hasRole(graphId, ADMIN_ROLE, addr2.address)).to.equal(false);

    /* Addr1 revises the NFT */
    await graphContract.connect(addr1).makeRevision(graphId, '456');

    /* Addr2 attempts to revise the NFT */
    try {
      await graphContract.connect(addr2).makeRevision(graphId, '789');
    } catch(e) {
      expect(e.message.includes('insufficient_permissions')).to.equal(true);
    }

    /* Addr1 gives Addr2 the EDITOR_ROLE */
    expect(await graphContract.connect(addr1).getRoleMemberCount(graphId, EDITOR_ROLE)).to.equal(0);
    await graphContract.connect(addr1).grantRole(graphId, EDITOR_ROLE, addr2.address);
    expect(await graphContract.hasRole(graphId, ADMIN_ROLE, addr2.address)).to.equal(false);
    expect(await graphContract.hasRole(graphId, EDITOR_ROLE, addr2.address)).to.equal(true);
    expect(await graphContract.connect(addr1).getRoleMemberCount(graphId, EDITOR_ROLE)).to.equal(1);

    /* Roles are enumerable too, so we can list role holders */
    expect(await graphContract.getRoleMemberCount(graphId, EDITOR_ROLE)).to.equal(1);
    expect(await graphContract.getRoleMember(graphId, EDITOR_ROLE, 0)).to.equal(addr2.address);

    /* Addr2 can now revise the NFT... */
    await graphContract.connect(addr2).makeRevision(graphId, '789');

    /* Addr2 but can not give anyone else any roles... */
    try {
      await graphContract.connect(addr2).grantRole(graphId, EDITOR_ROLE, addr3.address);
    } catch(e) {
      expect(e.message.includes('insufficient_permissions')).to.equal(true);
    }

    /* And they can renounce their own role too! */
    await graphContract.connect(addr2).renounceRole(graphId, EDITOR_ROLE);
    expect(await graphContract.hasRole(graphId, EDITOR_ROLE, addr2.address)).to.equal(false);
  });

  it("should be revisable", async function () {
    let tx = await graphContract.connect(addr1).mint('123');
    tx = await tx.wait();
    const transferEvent = tx.events.find(e => e.event === "Transfer");
    const graphId = transferEvent.args.tokenId;
    expect(await graphContract.tokenURI(graphId)).to.equal('ipfs://123/metadata.json');
    expect(await graphContract.getRevisionCount(graphId)).to.equal(1);

    await graphContract.connect(addr1).makeRevision(graphId, '456');
    expect(await graphContract.tokenURI(graphId)).to.equal('ipfs://456/metadata.json');

    expect(await graphContract.getRevisionCount(graphId)).to.equal(2);
    const currentRevision = await graphContract.getRevision(graphId, ethers.BigNumber.from(1));
    expect(currentRevision.hash).to.equal('456');
  });
});
