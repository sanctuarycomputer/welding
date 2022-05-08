import type { GetServerSideProps } from 'next';
import Client from 'src/lib/Client';
import Welding from 'src/lib/Welding';
import SubgraphShow from 'src/pages/subgraphs/[gid]/[did]';

export const getServerSideProps: GetServerSideProps = async (context) => {
  let { gid, m } = context.query;
  gid = ((Array.isArray(gid) ? gid[0] : gid) || '').split('-')[0];

  const subgraph =
    await Client.fetchBaseNodeByTokenId(gid);
  if (!subgraph || !subgraph.labels.includes('Subgraph')) return {
    redirect: { permanent: false, destination: `/` },
    props: {},
  };

  const subgraphDocuments = subgraph.backlinks.filter(n =>
    n.labels.includes('Document')
  );

  if (subgraphDocuments.length) return {
    redirect: {
      permanent: false,
      destination:
        `/subgraphs/${Welding.slugifyNode(subgraph)}/${Welding.slugifyNode(subgraphDocuments[0])}`
    },
    props:{},
  };

  return {
    props: { subgraph }
  };
}

export default SubgraphShow;
