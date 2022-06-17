import { FC, useContext, useEffect } from 'react';
import { NavContext } from 'src/hooks/useNav';
import Subgraph from 'src/renderers/Subgraph';
import makeDummyNode from 'src/lib/makeDummyNode';

const Mint: FC<{}> = () => {
  const { setContent } = useContext(NavContext);
  useEffect(() => {
    setContent(null);
  }, []);

  return <Subgraph node={makeDummyNode('Subgraph')} />;
};

export default Mint;
