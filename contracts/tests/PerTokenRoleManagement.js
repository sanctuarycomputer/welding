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
});
