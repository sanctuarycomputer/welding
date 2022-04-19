const { expect } = require("chai");

describe("Topic", function () {
  let Topic;
  let topicContract;
  let deployer;
  let addr1;
  let addr2;
  let addr3;

  beforeEach(async function () {
    Topic = await ethers.getContractFactory("Topic");
    [deployer, addr1, addr2, addr3] = await ethers.getSigners();
    topicContract = await Topic.deploy();
    ADMIN_ROLE = await topicContract.ADMIN_ROLE();
    EDITOR_ROLE = await topicContract.EDITOR_ROLE();
  });

  it("It should have the correct Name & Symbol", async function () {
    expect(await topicContract.name()).to.equal("Topic");
    expect(await topicContract.symbol()).to.equal("TOPIC");
  });
});
