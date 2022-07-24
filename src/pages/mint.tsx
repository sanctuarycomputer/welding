import { FC, useContext, useEffect } from "react";
import { NavContext } from "src/hooks/useNav";
import makeDummyNode from "src/utils/makeDummyNode";
import Head from "src/components/Head";

import dynamic from "next/dynamic";
const Subgraph = dynamic(() => import("src/renderers/Subgraph"), {
  ssr: false,
});

const Mint: FC<Record<string, never>> = () => {
  const { setContent } = useContext(NavContext);
  useEffect(() => {
    setContent(null);
  }, [setContent]);

  const node = makeDummyNode("Subgraph");
  return (
    <>
      <Head node={node} />
      <Subgraph node={node} />
    </>
  );
};

export default Mint;
