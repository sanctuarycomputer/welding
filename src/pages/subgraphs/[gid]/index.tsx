import type { NextPage, GetServerSideProps } from 'next';
import Welding from 'src/lib/Welding';

const SubgraphShow: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = async (context) => {
  let { gid } = context.query;
  gid = gid.split('-')[0];

  const subgraph = await Welding.loadNodeById(gid, null);
  const topics =
    await Welding.loadNodeConnectionsByLabel(subgraph.id, 'topic');
  const documents =
    await Welding.loadNodeConnectionsByLabel(subgraph.id, 'document');

  if (documents.length) {
    return {
      redirect: {
        permanent: false,
        destination: `/subgraphs/${subgraph.slug}/${documents[0].slug}`
      },
      props:{},
    };
  }

  return {
    redirect: {
      permanent: false,
      destination: `/subgraphs/${subgraph.id}/mint`
    },
    props:{},
  };
}

export default SubgraphShow;
