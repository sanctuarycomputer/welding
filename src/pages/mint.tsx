import { FC, useContext, useEffect } from "react";
import { NavContext } from "src/hooks/useNav";
import makeDummyNode from "src/utils/makeDummyNode";

import dynamic from "next/dynamic";
const Subgraph = dynamic(() => import("src/renderers/Subgraph"), {
  ssr: false,
});

const Mint: FC<Record<string, never>> = () => {
  const { setContent } = useContext(NavContext);
  useEffect(() => {
    setContent(null);
  }, [setContent]);
  return <Subgraph node={makeDummyNode("Subgraph")} />;
};

export default Mint;
