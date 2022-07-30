import { useContext } from "react";
import { GraphContext } from "src/hooks/useGraphData";
import Link from "next/link";
import { bg, bgHover } from "src/utils/theme";
import { IS_BETA } from "src/utils/constants";
import Twitter from "src/components/Icons/Twitter";
import cx from "classnames";
import { useAccount } from "wagmi";

const Info = () => {
  const { data: account } = useAccount();
  const { shallowNodes, shallowNodesLoading } = useContext(GraphContext);
  const subgraphs = shallowNodes
    ? shallowNodes.filter((n) => n.labels.includes("Subgraph") && !n.burnt)
    : [];
  const remainingForBeta = shallowNodesLoading
    ? "?"
    : `${50 - subgraphs.length}`;

  return (
    <div className="fixed bottom-0 right-0 z-20 md:z-40 mb-4 mr-4 flex">
      {IS_BETA && !account?.address ? (
        <div
          className={cx(
            `shadow-md	bg-yellow-400 flex rounded-full pl-2 pr-1 py-1 mr-2 transition-transform ease-in-out duration-500`,
            {
              "translate-y-12": shallowNodesLoading,
              "translate-y-0": !shallowNodesLoading,
            }
          )}
        >
          {remainingForBeta === "0" ? (
            <>
              <p className="text-stone-800 mr-1 font-medium">
                Welding beta is closed.
              </p>
              <a
                href="https://forms.gle/sHWTNLtz2MtHgtUA7"
                target="_blank"
                rel="noreferrer"
              >
                <p className="rounded-full bg-stone-800 text-stone-100 px-2 font-medium">
                  Join Waitlist
                </p>
              </a>
            </>
          ) : (
            <>
              <p className="text-stone-800 mr-1 font-medium">
                {remainingForBeta}x beta subgraphs left.
              </p>
              <Link href="/mint">
                <a>
                  <p className="rounded-full bg-stone-800 text-stone-100 px-2 font-medium">
                    Join Beta
                  </p>
                </a>
              </Link>
            </>
          )}
        </div>
      ) : null}
      <Link href="/">
        <a
          className={`${bg} ${bgHover} aspect-square border rounded-full w-6 h-6 flex items-center justify-center mr-2`}
        >
          <p className="font-semibold">?</p>
        </a>
      </Link>
      <a
        href="https://twitter.com/welding_app"
        rel="noreferrer"
        target="_blank"
        className={`${bg} ${bgHover} aspect-square border rounded-full w-6 h-6 flex items-center justify-center`}
      >
        <Twitter />
      </a>
    </div>
  );
};

export default Info;
