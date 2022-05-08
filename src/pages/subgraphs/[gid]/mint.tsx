import type { GetServerSideProps } from 'next';
import Client from 'src/lib/Client';
import SubgraphShow from 'src/pages/subgraphs/[gid]/[did]';

export const getServerSideProps: GetServerSideProps = async (context) => {
  let { gid } = context.query;
  gid = ((Array.isArray(gid) ? gid[0] : gid) || '').split('-')[0];
  const subgraph =
    await Client.fetchBaseNodeByTokenId(gid);
  if (!subgraph || !subgraph.labels.includes('Subgraph')) return {
    redirect: { permanent: false, destination: `/` },
    props: {},
  };

  return {
    props: { subgraph, mintMode: true }
  };
}

export default SubgraphShow;
