import { useContext, useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAccount, useSigner, useDisconnect, useNetwork } from "wagmi";
import useOutsideAlerter from "src/hooks/useOutsideAlerter";
import Button from "src/components/Button";
import { NavContext } from "src/hooks/useNav";
import { ModalContext, ModalType } from "src/hooks/useModal";
import { GraphContext } from "src/hooks/useGraphData";
import slugifyNode from "src/utils/slugifyNode";
import { bg, bgHover, border } from "src/utils/theme";

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
  const { data: signer } = useSigner();
  const { activeChain } = useNetwork();

  const { disconnect } = useDisconnect();
  const router = useRouter();
  const [dropDownOpen, setDropDownOpen] = useState(false);

  useEffect(() => {
    if (
      activeChain &&
      activeChain.network !== process.env.NEXT_PUBLIC_NETWORK
    ) {
      openModal({ type: ModalType.WRONG_NETWORK });
    }
  }, [activeChain]);

  const dropDownRef = useRef(null);
  useOutsideAlerter(dropDownRef, () => {
    setDropDownOpen(false);
  });

  const subgraphs = Object.values(accountNodesByCollectionType["Subgraph"]);

  if (account?.address) {
    return (
      <>
        {content}
        <button
          className="relative"
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
                <p className={`${bgHover} font-semibold w-32 truncate py-1`}>
                  Account
                </p>
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
                    <p
                      className={`${bgHover} pl-1 font-semibold w-32 truncate py-1`}
                    >
                      {emoji} {name}
                    </p>
                  </Link>
                );
              })}

              <Link href={`/mint`}>
                <p className={`${bgHover} font-semibold w-32 truncate py-1`}>
                  + New Subgraph
                </p>
              </Link>

              <button
                className="text-center flex flex-row items-center flex-grow"
                onClick={disconnect}
              >
                <p className={`${bgHover} font-semibold w-32 truncate py-1`}>
                  Disconnect
                </p>
              </button>
            </div>
          )}
        </button>
      </>
    );
  }

  return (
    <Button
      disabled={false}
      label="Connect"
      onClick={() => openModal({ type: ModalType.CONNECT })}
    />
  );
};

export default Wallet;
