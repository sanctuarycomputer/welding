import Client from 'src/lib/Client';
import Subgraph from 'src/renderers/Subgraph';
import slugifyNode from 'src/utils/slugifyNode';

type Props = {
  subgraph: BaseNode;
  document: BaseNode;
};

const NodeShow: FC<Props> = ({ subgraph, document }) => {
  return <Subgraph subgraph={subgraph} document={document} />;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  let { nid } = context.query;
  nid = ((Array.isArray(nid) ? nid[0] : nid) || '').split('-')[0];
  const subgraph =
    await Client.fetchBaseNodeByTokenId(nid);
  if (!subgraph) return { notFound: true };
  if (subgraph.labels.filter(l => l !== "BaseNode")[0] !== 'Subgraph') {
    return {
      redirect: {
        permanent: false,
        destination: `/${slugifyNode(subgraph)}`
      }
    };
  }

  let { did } = context.query;
  did = ((Array.isArray(did) ? did[0] : did) || '').split('-')[0];
  const document =
    await Client.fetchBaseNodeByTokenId(did);
  if (!document) return { notFound: true };
  if (document.labels.filter(l => l !== "BaseNode")[0] !== 'Document') {
    return {
      redirect: {
        permanent: false,
        destination: `/${slugifyNode(subgraph)}`
      }
    };
  }

  let { did: givenDidSlug, nid: givenNidSlug  } = context.query;
  givenNidSlug = ((Array.isArray(givenNidSlug) ? givenNidSlug[0] : givenNidSlug) || '');
  givenDidSlug = ((Array.isArray(givenDidSlug) ? givenDidSlug[0] : givenDidSlug) || '');
  if (
    givenNidSlug !== slugifyNode(subgraph) ||
    givenDidSlug !== slugifyNode(document)
  ) {
    return {
      redirect: {
        permanent: false,
        destination:
          `/${slugifyNode(subgraph)}/${slugifyNode(document)}`
      }
    };
  }

  return {
    props: {
      key: `${subgraph.tokenId}-${document.tokenId}`,
      subgraph,
      document
    }
  };
};

export default NodeShow;
