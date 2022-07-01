import slugifyNode from "src/utils/slugifyNode";
import Client from "src/lib/Client";
import makeDummyNode from "src/utils/makeDummyNode";
import { FC } from "react";
import { GetServerSideProps } from "next";
import { BaseNode } from "src/types";

import dynamic from "next/dynamic";
const Subgraph = dynamic(() => import("src/renderers/Subgraph"), {
  ssr: false,
});

type Props = {
  node: BaseNode;
  document: BaseNode;
};

const NodeShow: FC<Props> = ({ node, document }) => {
  return <Subgraph node={node} document={document} />;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  let { nid } = context.query;
  nid = ((Array.isArray(nid) ? nid[0] : nid) || "").split("-")[0];
  const node = await Client.fetchBaseNodeByTokenId(nid);
  if (!node) return { notFound: true };

  const nodeType = node.labels.filter((l) => l !== "BaseNode")[0];

  if (nodeType !== "Subgraph") {
    return {
      redirect: {
        permanent: false,
        destination: `/${slugifyNode(node)}`,
      },
    };
  }

  const document = makeDummyNode("Document");
  document.outgoing = [
    {
      name: "BELONGS_TO",
      tokenId: node.tokenId,
      active: true,
      pivotTokenId: document.tokenId,
    },
  ];
  document.related = [node];

  return {
    props: { node, document },
  };
};

export default NodeShow;
