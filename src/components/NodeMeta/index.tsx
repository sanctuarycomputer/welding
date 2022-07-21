import Head from "next/head";
import Welding from "src/lib/Welding";

const NodeMeta = ({ formik }) => {
  const belongsTo = formik.values.outgoing.find((e) => e.name === "BELONGS_TO");
  const belongsToNode = formik.values.related.find(
    (n) => n.tokenId === belongsTo?.tokenId
  );

  let name = `welding.app • knowledge is valuable`;
  let imageSrc = `https://www.welding.app/share.jpg`;
  let nameWithEmoji = `👩‍🏭 ${name}`;
  const nodeLabel = formik.values.__node__.labels.filter((l) => l !== "BaseNode")[0] || "Document";
  let description = `Mint a ${nodeLabel.toLowerCase()}`;
  let emojiCDN =
    `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@14.0.0/img/apple/64/1f469-200d-1f3ed.png`;

  if (!formik.values.__node__.tokenId.startsWith('-')) {
    name = `${formik.values.name}`;
    description = `${formik.values.description}`;
    if (belongsToNode) {
      name = `${name} • ${belongsToNode.currentRevision.metadata.name}`;
    }
    nameWithEmoji = `${formik.values.emoji.native} ${name}`;
    emojiCDN = `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@14.0.0/img/apple/64/${formik.values.emoji.unified}.png`;
    if (formik.values.image) {
      imageSrc = `${Welding.ipfsGateways[0]}${formik.values.image.replace(
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

export default NodeMeta;
