import Head from "next/head";
import Welding from "src/lib/Welding";

const WrappedHead = ({ node }) => {
  const belongsTo = node.outgoing.find((e) => e.name === "BELONGS_TO");
  const belongsToNode = node.related.find(
    (n) => n.tokenId === belongsTo?.tokenId
  );

  let name = `welding.app • knowledge is valuable`;
  let imageSrc = `https://www.welding.app/share.jpg`;
  let nameWithEmoji = `👩‍🏭 ${name}`;
  const nodeLabel =
    node.labels.filter((l) => l !== "BaseNode")[0] ||
    "Document";
  let description = `Mint a ${nodeLabel.toLowerCase()}`;
  let emojiCDN = `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@14.0.0/img/apple/64/1f469-200d-1f3ed.png`;

  if (!node.tokenId.startsWith("-")) {
    name = `${node.currentRevision.metadata.name}`;
    description = `${node.currentRevision.metadata.description}`;
    if (belongsToNode) {
      name = `${name} • ${belongsToNode.currentRevision.metadata.name}`;
    }
    nameWithEmoji = `${node.currentRevision.metadata.properties.emoji.native} ${name}`;
    emojiCDN = `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@14.0.0/img/apple/64/${node.currentRevision.metadata.properties.emoji.unified}.png`;
    if (node.currentRevision.metadata.image) {
      imageSrc = `${Welding.ipfsGateways[0]}${node.currentRevision.metadata.image.replace(
        "ipfs://",
        "/ipfs/"
      )}`;
    }
  }

  return (
    <Head>
      <title>{name}</title>
      <link rel="shortcut icon" href={emojiCDN} />
      <meta name="description" content={description} />
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      <meta name="application-name" content="welding.app" />
      <meta name="apple-mobile-web-app-title" content="welding.app" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black" />
      <link rel="apple-touch-icon" href="https://www.welding.app/icon.jpg" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={nameWithEmoji} key="title" />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageSrc} />
      <meta property="og:locale" content="en_US" />
      <meta name="twitter:title" content={nameWithEmoji} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageSrc} />
      <meta name="twitter:card" content="summary_large_image" />
    </Head>
  );
};

export default WrappedHead;
