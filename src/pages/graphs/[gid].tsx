import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { NextPage, GetServerSideProps } from 'next';
import { ethers } from 'ethers';
import Welding from '../../lib/Welding';
import Frontmatter from '../../components/Frontmatter';

const GraphShow: NextPage = ({ graph }) => {
  const loadPermissions = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const address = await signer.getAddress();

    await Welding.init();
    await Welding.loadGraphPermissions(graph.id, signer);
  };
  useEffect(() => {
    loadPermissions();
  }, []);
  return (
    <div className="content py-4 mt-24 mx-auto">
      <Frontmatter meta={graph} />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { gid } = context.query;
  await Welding.init();
  const graph = await Welding.loadGraph(gid, null);
  return {
    props: { graph },
  };
}

export default GraphShow;
