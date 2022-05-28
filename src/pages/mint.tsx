import Subgraph from 'src/renderers/Subgraph';
import makeDummyNode from 'src/lib/makeDummyNode';

const Mint: FC<{}> = () => {
  return <Subgraph subgraph={makeDummyNode('Subgraph')} />;
};

export default Mint;
