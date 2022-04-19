const { expect } = require("chai");

describe("Document", function () {
  let Document;
  let documentContract;
  let Topic;
  let topicContract;
  let deployer;
  let addr1;
  let addr2;
  let addr3;

  beforeEach(async function () {
    [deployer, addr1, addr2, addr3] = await ethers.getSigners();

    Document = await ethers.getContractFactory("Document");
    documentContract = await Document.deploy();

    Topic = await ethers.getContractFactory("Topic");
    topicContract = await Topic.deploy();
  });

  it("It should have the correct Name & Symbol", async function () {
    expect(await documentContract.name()).to.equal("Document");
    expect(await documentContract.symbol()).to.equal("DOC");
  });
});
