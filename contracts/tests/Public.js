const { expect } = require("chai");

describe("Behavior: Public", function () {
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

  it("should allow outgoing connections to a permission bypassed node", async function () {
    let tx = await contract.connect(addr1).mint('subgraph', '123', [], []);
    tx = await tx.wait();
    const transferEvent = tx.events.find(e => e.event === "Transfer");
    const subgraphId = transferEvent.args.tokenId;

    await expect(
      contract.connect(addr2).mint('document', '123', [], [{
        tokenId: subgraphId,
        name: "BELONGS_TO"
      }])
    ).to.be.revertedWith("insufficient_permissions");

    await contract.connect(addr1).setPermissionsBypass(subgraphId, true);

    await expect(
      contract.connect(addr2).mint('document', '123', [], [{
        tokenId: subgraphId,
        name: "BELONGS_TO"
      }])
    ).to.not.be.reverted;
  });

  it("should be able to toggle permissions bypass", async function () {
    let tx = await contract.connect(addr1).mint('document', '123', [], []);
    tx = await tx.wait();
    const transferEvent = tx.events.find(e => e.event === "Transfer");
    const docId = transferEvent.args.tokenId;

    await expect(
      contract.connect(addr2).setPermissionsBypass(docId, true)
    ).to.be.revertedWith("insufficient_permissions");

    await contract.connect(addr1).setPermissionsBypass(docId, true);
    expect(await contract.connect(addr1).hasPermissionsBypass(docId)).to.equal(true);

    // Now anyone can revise!
    await contract.connect(addr3).merge(docId, '456', [], []);

    // Only the actual ADMIN group can disable permissions bypass, though, even when public.
    await expect(
      contract.connect(addr2).setPermissionsBypass(docId, false)
    ).to.be.revertedWith("insufficient_permissions");

    await contract.connect(addr1).setPermissionsBypass(docId, false)
    expect(await contract.connect(addr1).hasPermissionsBypass(docId)).to.equal(false);

    await expect(
      contract.connect(addr3).merge(docId, '456', [], [])
    ).to.be.revertedWith("insufficient_permissions");
  });
});
