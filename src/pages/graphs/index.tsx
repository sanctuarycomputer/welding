import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { NextPage, GetServerSideProps } from 'next';

import { ethers } from 'ethers';
import Welding from 'src/lib/Welding';
import SplitPill from 'src/components/SplitPill';
import Tile from 'src/components/Tile';

const Graphs: NextPage = ({ }) => {
  const [graphs, setGraphs] = useState({});

  const loadGraphs = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const address = await signer.getAddress();

    await Welding.init();

    const graphsById = {};
    let counter = ethers.BigNumber.from(0);
    //const graphCount =
    //  await Welding.Graphs.connect(signer).balanceOf(address);
    //while (counter.lt(graphCount)) {
    //  const graphId =
    //    await Welding.Graphs.connect(signer).tokenOfOwnerByIndex(address, counter);
    //  graphsById[graphId] = await Welding.loadGraph(graphId);
    //  counter = counter.add(1);
    //}
    //setGraphs(graphsById);
  }

  useEffect(() => {
    loadGraphs();
  }, []);

  return (
    <div className="content py-4 mt-24 mx-auto">
      {Object.keys(graphs).map(gid => {
        const graph = graphs[gid];
        return (
          <Link key={gid} href={`/graphs/${gid}`}>
            <a>
              <Tile meta={graph} />
            </a>
          </Link>
        );
      })}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: { },
  };
}

export default Graphs;
