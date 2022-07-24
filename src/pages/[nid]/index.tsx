import Client from "src/lib/Client";
import slugifyNode from "src/utils/slugifyNode";
import getRelatedNodes from "src/utils/getRelatedNodes";
import { BaseNode } from "src/types";
import { GetStaticProps } from "next";
import { FC } from "react";
import Head from "src/components/Head";
import dynamic from "next/dynamic";

const Subgraph = dynamic(() => import("src/renderers/Subgraph"), {
  ssr: false,
});
const Document = dynamic(() => import("src/renderers/Document"), {
  ssr: false,
});
const Topic = dynamic(() => import("src/renderers/Topic"), {
  ssr: false,
});

type Props = {
  node: BaseNode;
};

const NodeShow: FC<Props> = ({ node }) => {
  const nodeType = node.labels.filter((l) => l !== "BaseNode")[0];
  switch (nodeType) {
    case "Subgraph":
      return (
        <>
          <Head node={node} />
          <Subgraph node={node} />
        </>
      );
    case "Document":
      return (
        <>
          <Head node={node} />
          <Document node={node} />
        </>
      );
    case "Topic":
      return (
        <>
          <Head node={node} />
          <Topic node={node} />
        </>
      );
  }
  return null;
};

export const getStaticProps: GetStaticProps = async (context) => {
  let nid = context.params?.nid;
  nid = ((Array.isArray(nid) ? nid[0] : nid) || "").split("-")[0];
  const node = await Client.fetchBaseNodeByTokenId(nid);
  if (!node) return { notFound: true };

  const nodeType = node.labels.filter((l) => l !== "BaseNode")[0];

  // First, ensure slug is correct
  let givenNidSlug = context.params?.nid;
  givenNidSlug =
    (Array.isArray(givenNidSlug) ? givenNidSlug[0] : givenNidSlug) || "";
  if (givenNidSlug !== slugifyNode(node)) {
    return {
      redirect: {
        permanent: false,
        destination: `/${slugifyNode(node)}`,
      },
    };
  }

  // Next, if it's a Subgraph, redirect to the first document
  if (nodeType === "Subgraph") {
    const sortOrder =
      node.currentRevision.metadata.properties.ui
        ?.subgraphSidebarDocumentSortOrder || [];
    const homepage = node.related.find((n) => n.tokenId === sortOrder[0]);
    if (homepage) {
      return {
        redirect: {
          permanent: false,
          destination: `/${slugifyNode(node)}/${slugifyNode(homepage)}`,
        },
      };
    }

    const subgraphDocuments = getRelatedNodes(
      node,
      "incoming",
      "Document",
      "BELONGS_TO"
    );
    if (subgraphDocuments.length) {
      return {
        redirect: {
          permanent: false,
          destination: `/${slugifyNode(node)}/${slugifyNode(
            subgraphDocuments[0]
          )}`,
        },
      };
    } else {
      return {
        redirect: {
          permanent: false,
          destination: `/${slugifyNode(node)}/mint`,
        },
      };
    }
  }

  // If it's a Document, attempt redirect to the document's Subgraph
  if (nodeType === "Document") {
    const documentSubgraphs = getRelatedNodes(
      node,
      "outgoing",
      "Subgraph",
      "BELONGS_TO"
    );
    if (documentSubgraphs.length) {
      return {
        redirect: {
          permanent: false,
          destination: `/${slugifyNode(documentSubgraphs[0])}/${slugifyNode(
            node
          )}`,
        },
      };
    }
  }

  return {
    props: {
      key: `${node.tokenId}`,
      node,
    },
    revalidate: 1440,
  };
};

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export default NodeShow;
