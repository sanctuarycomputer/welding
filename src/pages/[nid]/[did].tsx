import { GetStaticProps } from "next";
import { FC } from "react";
import Client from "src/lib/Client";
import Subgraph from "src/renderers/Subgraph";
import { BaseNode } from "src/types";
import slugifyNode from "src/utils/slugifyNode";

type Props = {
  subgraph: BaseNode;
  document: BaseNode;
};

const NodeShow: FC<Props> = ({ subgraph, document }) => {
  return <Subgraph node={subgraph} document={document} />;
};

export const getStaticProps: GetStaticProps = async (context) => {
  let nid = context.params?.nid;
  let did = context.params?.did;
  nid = ((Array.isArray(nid) ? nid[0] : nid) || "").split("-")[0];
  did = ((Array.isArray(did) ? did[0] : did) || "").split("-")[0];

  const [subgraph, document] = await Promise.all([
    Client.fetchBaseNodeByTokenId(nid),
    Client.fetchBaseNodeByTokenId(did),
  ]);

  if (!subgraph) return { notFound: true };
  if (!document) return { notFound: true };

  if (subgraph.labels.filter((l) => l !== "BaseNode")[0] !== "Subgraph") {
    return {
      redirect: {
        permanent: false,
        destination: `/${slugifyNode(subgraph)}`,
      },
    };
  }

  if (document.labels.filter((l) => l !== "BaseNode")[0] !== "Document") {
    return {
      redirect: {
        permanent: false,
        destination: `/${slugifyNode(subgraph)}`,
      },
    };
  }

  let givenDidSlug = context.params?.did;
  let givenNidSlug = context.params?.nid;
  givenNidSlug =
    (Array.isArray(givenNidSlug) ? givenNidSlug[0] : givenNidSlug) || "";
  givenDidSlug =
    (Array.isArray(givenDidSlug) ? givenDidSlug[0] : givenDidSlug) || "";
  if (
    givenNidSlug !== slugifyNode(subgraph) ||
    givenDidSlug !== slugifyNode(document)
  ) {
    return {
      redirect: {
        permanent: false,
        destination: `/${slugifyNode(subgraph)}/${slugifyNode(document)}`,
      },
    };
  }

  return {
    props: {
      key: `${subgraph.tokenId}-${document.tokenId}`,
      subgraph,
      document,
    },
    revalidate: 1440,
  };
};

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export default NodeShow;
