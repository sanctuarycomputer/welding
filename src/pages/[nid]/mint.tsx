import slugifyNode from "src/utils/slugifyNode";
import Client from "src/lib/Client";
import makeDummyNode from "src/utils/makeDummyNode";
import baseNodeToDraft from "src/utils/baseNodeToDraft";
import { FC } from "react";
import { GetServerSideProps } from "next";
import { BaseNode } from "src/types";
import Head from "src/components/Head";
import { withIronSessionSsr } from "iron-session/next";
import { IRON_OPTIONS } from "src/utils/constants";
import DEFAULT_EMOJI from "src/utils/defaultEmoji";

import dynamic from "next/dynamic";
const Subgraph = dynamic(() => import("src/renderers/Subgraph"), {
  ssr: false,
});

type Props = {
  node: BaseNode;
  document: BaseNode;
};

const NodeShow: FC<Props> = ({ node, document }) => {
  return (
    <>
      <Head node={node} />
      <Subgraph node={node} document={document} />
    </>
  );
};

export const getServerSideProps: GetServerSideProps = withIronSessionSsr(
  async function getServerSideProps(context) {
    if (!context.req.session.siwe) {
      return {
        redirect: {
          permanent: false,
          destination: `/`,
        },
      };
    }

    let nid = context.params?.nid;
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

    let draftTokenId = context.query?.tokenId;
    if (!draftTokenId) {
      // Should take values
      const newDoc = makeDummyNode("Document");
      newDoc.outgoing = [
        {
          name: "BELONGS_TO",
          tokenId: node.tokenId,
          active: true,
          pivotTokenId: newDoc.tokenId,
        },
        {
          name: "_DELEGATES_PERMISSIONS_TO",
          tokenId: node.tokenId,
          active: true,
          pivotTokenId: newDoc.tokenId,
        },
      ];
      newDoc.related = [node];
      const { tokenId } = await Client.Drafts.makeDummyNode(
        baseNodeToDraft(newDoc),
        context.req.headers
      );
      return {
        redirect: {
          permanent: false,
          destination: `/${slugifyNode(node)}/mint?tokenId=${tokenId}`,
        },
      };
    }

    const draftNode = await Client.Drafts.fetchDummyNode(
      draftTokenId,
      context.req.headers
    );
    if (!draftNode) return { notFound: true };

    const draftNodeType = draftNode.labels.filter((l) => l !== "BaseNode")[0];
    const subgraphBelongsToEdge = draftNode.outgoing.find((e) => {
      return e.active && e.name === "BELONGS_TO" && e.tokenId === node.tokenId;
    });

    // Ensure it's a Document & it belongs to the given Subgraph
    if (draftNodeType !== "Document" || !subgraphBelongsToEdge) {
      return {
        redirect: {
          permanent: false,
          destination: `/${slugifyNode(node)}/mint`,
        },
      };
    }

    // Ensure the Subgraph Node is in the related array
    draftNode.related.find((n) => n.tokenId === node.tokenId) ||
      (draftNode.related = [...draftNode.related, node]);

    return {
      props: { node, document: draftNode },
    };
  },
  IRON_OPTIONS
);

export default NodeShow;
