const { expect } = require("chai");

describe("Plane", function () {
  let Plane;
  let planeContract;
  let Graph;
  let graphContract;
  let Topic;
  let topicContract;
  let Document;
  let documentContract;

  let deployer;
  let addr1;
  let addr2;
  let addr3;

  beforeEach(async function () {
    [deployer, addr1, addr2, addr3] = await ethers.getSigners();

    Graph = await ethers.getContractFactory("Graph");
    graphContract = await Graph.deploy();
    Topic = await ethers.getContractFactory("Topic");
    topicContract = await Topic.deploy();
    Document = await ethers.getContractFactory("Document");
    documentContract = await Document.deploy();

    Plane = await ethers.getContractFactory("Plane");
    planeContract = await Plane.deploy(
      graphContract.address,
      topicContract.address,
      documentContract.address
    );
  });

  it("can assign Topics to Graphs", async function () {
  });

  it("can assign Topics to Documents", async function () {
    let tx = await (await documentContract.connect(addr1).mint('123')).wait();
    const documentId = tx.events.find(e => e.event === "Transfer").args.tokenId;

    tx = await (await topicContract.connect(addr1).mint('123')).wait();
    const topic1Id = tx.events.find(e => e.event === "Transfer").args.tokenId;

    tx = await (await topicContract.connect(addr1).mint('123')).wait();
    const topic2Id = tx.events.find(e => e.event === "Transfer").args.tokenId;

    /* A non-editor can't add a Topic */
    try {
      await planeContract.connect(addr2).addDocumentTopic(documentId, topic1Id);
    } catch(e) {
      expect(e.message.includes('insufficient_permissions')).to.equal(true);
    }

    /* An editor can add a Topic, though */
    await planeContract.connect(addr1).addDocumentTopic(documentId, topic1Id);
    await planeContract.connect(addr1).addDocumentTopic(documentId, topic2Id);

    /* We can enumerate the relationships */
    let topicIds = [];
    let counter = ethers.BigNumber.from(0);
    const length = await planeContract.getTopicCountForDocument(documentId);
    while (counter.lt(length)) {
      topicIds.push(await planeContract.getTopicForDocument(documentId, counter));
      counter = counter.add(1);
    }
    expect(topicIds.length).to.equal(2);

    let documentIds = [];
    counter = ethers.BigNumber.from(0);
    const documentLength = await planeContract.getDocumentCountForTopic(topic1Id);
    while (counter.lt(documentLength)) {
      documentIds.push(await planeContract.getDocumentForTopic(topic1Id, counter));
      counter = counter.add(1);
    }
    expect(documentIds.length).to.equal(1);
  });

});
