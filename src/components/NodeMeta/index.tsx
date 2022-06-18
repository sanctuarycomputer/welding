import Head from "next/head";
import Welding from "src/lib/Welding";

const NodeMeta = ({ formik }) => {
  let imageSrc = null;
  if (formik.values.image) {
    imageSrc = `${Welding.ipfsGateways[0]}${formik.values.image.replace(
      "ipfs://",
      "/ipfs/"
    )}`;
  }

  const nameWithEmoji = `${formik.values.emoji.native} ${formik.values.name}`;
  const emojiCDN = `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@14.0.0/img/apple/64/${formik.values.emoji.unified}.png`;

  return (
    <Head>
      <title>{formik.values.name}</title>
      <link rel="shortcut icon" href={emojiCDN} />
      <meta name="description" content={formik.values.description} />
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={nameWithEmoji} key="title" />
      <meta property="og:description" content={formik.values.description} />
      <meta property="og:image" content={imageSrc} />
      <meta property="og:locale" content="en_US" />
      <meta name="twitter:title" content={nameWithEmoji} />
      <meta name="twitter:description" content={formik.values.description} />
      <meta name="twitter:image" content={imageSrc} />
      <meta name="twitter:card" content="summary_large_image" />
    </Head>
  );
};

export default NodeMeta;
