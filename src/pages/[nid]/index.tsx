import Client from "src/lib/Client";
import Document from "src/renderers/Document";
import Subgraph from "src/renderers/Subgraph";
import Topic from "src/renderers/Topic";
import slugifyNode from "src/utils/slugifyNode";
import getRelatedNodes from "src/utils/getRelatedNodes";

type Props = {
  node: BaseNode;
};

const NodeShow: FC<Props> = ({ node }) => {
  const nodeType = node.labels.filter((l) => l !== "BaseNode")[0];
  switch (nodeType) {
    case "Subgraph":
      return <Subgraph node={node} />;
    case "Document":
      return <Document node={node} />;
    case "Topic":
      return <Topic node={node} />;
  }
  return null;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const q = context.resolvedUrl.split("?")[1];

  let { nid } = context.query;
  nid = ((Array.isArray(nid) ? nid[0] : nid) || "").split("-")[0];
  const node = await Client.fetchBaseNodeByTokenId(nid);
  if (!node) return { notFound: true };

  const nodeType = node.labels.filter((l) => l !== "BaseNode")[0];

  // Ensure slug is correct
  let { nid: givenNidSlug } = context.query;
  givenNidSlug =
    (Array.isArray(givenNidSlug) ? givenNidSlug[0] : givenNidSlug) || "";
  if (givenNidSlug !== slugifyNode(node)) {
    return {
      redirect: {
        permanent: false,
        destination: q ? `/${slugifyNode(node)}?${q}` : `/${slugifyNode(node)}`,
      },
    };
  }

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

  if (nodeType === "Document") {
    const documentSubgraphs = getRelatedNodes(
      node,
      "outgoing",
      "Subgraph",
      "BELONGS_TO"
    );
    // TODO: Reference the "Belongs To" Subgraph
    if (documentSubgraphs.length === 1)
      return {
        redirect: {
          permanent: false,
          destination: q
            ? `/${slugifyNode(documentSubgraphs[0])}/${slugifyNode(node)}?${q}`
            : `/${slugifyNode(documentSubgraphs[0])}/${slugifyNode(node)}`,
        },
      };
  }

  let revision = null;
  if (context.query.hash) {
    const rev = await Client.fetchRevisionByHash(context.query.hash);
    if (rev) node.currentRevision = rev;
  }

  return {
    props: {
      key: `${node.tokenId}`,
      node,
    },
  };
};

export default NodeShow;
