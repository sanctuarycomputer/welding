import { useContext, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAccount, useDisconnect, useNetwork } from "wagmi";
import useOutsideAlerter from "src/hooks/useOutsideAlerter";
import Button from "src/components/Button";
import { NavContext } from "src/hooks/useNav";
import { ModalContext, ModalType } from "src/hooks/useModal";
import { GraphContext } from "src/hooks/useGraphData";
import slugifyNode from "src/utils/slugifyNode";
import { bg, bgHover } from "src/utils/theme";

import dynamic from "next/dynamic";
const Address = dynamic(() => import("src/components/Address"), {
  ssr: false,
});

const Wallet = () => {
  const { openModal } = useContext(ModalContext);
  const { content } = useContext(NavContext);
  const { accountData, accountNodesByCollectionType } =
    useContext(GraphContext);
  const { data: account } = useAccount();
  const { activeChain } = useNetwork();
  const { disconnect } = useDisconnect();
  const [dropDownOpen, setDropDownOpen] = useState(false);

  useEffect(() => {
    if (
      activeChain &&
      activeChain.network !== process.env.NEXT_PUBLIC_NETWORK
    ) {
      openModal({ type: ModalType.WRONG_NETWORK });
    }
  }, [activeChain, openModal]);

  const dropDownRef = useRef(null);
  useOutsideAlerter(dropDownRef, () => {
    setDropDownOpen(false);
  });

  const subgraphs = Object.values(
    accountNodesByCollectionType["Subgraph"] || {}
  );

  if (account?.address) {
    return (
      <>
        {content}
        <button
          className="relative z-10"
          onClick={() => setDropDownOpen(!dropDownOpen)}
        >
          <Address address={account.address} showAvatar />
          {dropDownOpen && (
            <div
              ref={dropDownRef}
              className={`${bg} w-fit border absolute top-8 right-0 shadow-lg rounded z-10`}
            >
              <Link
                href={`/accounts/${accountData?.ensName || account.address}`}
              >
                <a>
                  <p className={`${bgHover} font-semibold w-32 truncate py-1`}>
                    Account
                  </p>
                </a>
              </Link>

              {subgraphs.map((item) => {
                const name = item.node.currentRevision.metadata.name;
                const emoji =
                  item.node.currentRevision.metadata.properties.emoji.native;
                return (
                  <Link
                    key={item.node.tokenId}
                    href={`/${slugifyNode(item.node)}`}
                  >
                    <a>
                      <p
                        className={`${bgHover} pl-1 font-semibold w-32 truncate py-1`}
                      >
                        {emoji} {name}
                      </p>
                    </a>
                  </Link>
                );
              })}

              <Link href={`/mint`}>
                <a>
                  <p className={`${bgHover} font-semibold w-32 truncate py-1`}>
                    + New Subgraph
                  </p>
                </a>
              </Link>

              <a
                className="text-center flex flex-row items-center flex-grow"
                onClick={() => disconnect()}
              >
                <p className={`${bgHover} font-semibold w-32 truncate py-1`}>
                  Disconnect
                </p>
              </a>
            </div>
          )}
        </button>
      </>
    );
  }

  return (
    <div className="z-10">
      <Button
        disabled={false}
        label="Connect"
        onClick={() => openModal({ type: ModalType.CONNECT })}
      />
    </div>
  );
};

export default Wallet;
