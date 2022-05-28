import Subgraph from 'src/renderers/Subgraph';
import slugifyNode from 'src/utils/slugifyNode';
import Client from 'src/lib/Client';
import makeDummyNode from 'src/lib/makeDummyNode';

type Props = {};

const NodeShow: FC<Props> = ({ subgraph, document }) => {
  return <Subgraph subgraph={subgraph} document={document} />;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  let { nid } = context.query;
  nid = ((Array.isArray(nid) ? nid[0] : nid) || '').split('-')[0];
  const node =
    await Client.fetchBaseNodeByTokenId(nid);
  if (!node) return { notFound: true };

  const nodeType =
    node.labels.filter(l => l !== "BaseNode")[0];

  if (nodeType !== 'Subgraph') {
    return {
      redirect: {
        permanent: false,
        destination: `/${slugifyNode(node)}`
      }
    }
  };

  const document = makeDummyNode("Document");
  document.outgoing = [{
    name: "BELONGS_TO",
    tokenId: parseInt(node.tokenId)
  }];
  document.related = [node];

  return {
    props: { subgraph: node, document }
  };
};

export default NodeShow;
