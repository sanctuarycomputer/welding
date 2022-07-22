import { GetServerSideProps } from "next";
import { FC } from "react";
import Client from "src/lib/Client";
import Subgraph from "src/renderers/Subgraph";
import { BaseNode } from "src/types";
import slugifyNode from "src/utils/slugifyNode";

const WELDING_DOCS_SUBGRAPH_TOKEN_ID = "4";
const WELDING_DOCS_INTRO_DOC_TOKEN_ID = "5";

type Props = {
  subgraph: BaseNode;
  document: BaseNode;
};

const NodeShow: FC<Props> = ({ subgraph, document }) => {
  return <Subgraph node={subgraph} document={document} />;
};

export const getServerSideProps: GetServerSideProps = async () => {
  const [subgraph, document] = await Promise.all([
    Client.fetchBaseNodeByTokenId(WELDING_DOCS_SUBGRAPH_TOKEN_ID),
    Client.fetchBaseNodeByTokenId(WELDING_DOCS_INTRO_DOC_TOKEN_ID),
  ]);

  if (!subgraph) return { notFound: true };
  if (subgraph.labels.filter((l) => l !== "BaseNode")[0] !== "Subgraph") {
    return {
      redirect: {
        permanent: false,
        destination: `/${slugifyNode(subgraph)}`,
      },
    };
  }

  if (!document) return { notFound: true };
  if (document.labels.filter((l) => l !== "BaseNode")[0] !== "Document") {
    return {
      redirect: {
        permanent: false,
        destination: `/${slugifyNode(subgraph)}`,
      },
    };
  }

  return {
    props: {
      key: `${subgraph.tokenId}-${document.tokenId}`,
      subgraph,
      document,
    },
  };
};

export default NodeShow;
