import { useContext, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAccount, useNetwork } from "wagmi";
import useOutsideAlerter from "src/hooks/useOutsideAlerter";
import { ConnectKitButton } from "connectkit";
import { NavContext } from "src/hooks/useNav";
import { ModalContext, ModalType } from "src/hooks/useModal";
import { GraphContext } from "src/hooks/useGraphData";
import slugifyNode from "src/utils/slugifyNode";
import { bg, bgHover } from "src/utils/theme";
import { didConnect, setEnsName } from "src/utils/event";

import dynamic from "next/dynamic";
const Address = dynamic(() => import("src/components/Address"), {
  ssr: false,
});

const Wallet = () => {
  const { openModal } = useContext(ModalContext);
  const { content } = useContext(NavContext);
  const {
    sessionData,
    sessionDataLoading,
    flushSessionAndDisconnect,
    accountData,
    accountDataLoading,
    accountNodesByCollectionType,
  } = useContext(GraphContext);
  const { address } = useAccount();
  const { chain } = useNetwork();
  const [dropDownOpen, setDropDownOpen] = useState(false);

  useEffect(() => {
    if (chain && chain.network !== process.env.NEXT_PUBLIC_NETWORK) {
      openModal({ type: ModalType.WRONG_NETWORK });
    }
  }, [chain, openModal]);

  useEffect(() => {
    if (
      address &&
      !sessionData &&
      !sessionDataLoading &&
      chain &&
      chain.network === process.env.NEXT_PUBLIC_NETWORK
    ) {
      openModal({ type: ModalType.NEEDS_SESSION });
    }
  }, [address, sessionData, sessionDataLoading, chain, chain?.network]);

  const dropDownRef = useRef(null);
  useOutsideAlerter(dropDownRef, () => {
    setDropDownOpen(false);
  });

  const subgraphs = Object.values(
    accountNodesByCollectionType["Subgraph"] || {}
  );

  useEffect(() => {
    if (!address) return;
    didConnect(address);
    if (accountData?.ensName) {
      setEnsName(address, accountData.ensName);
    }
  }, [address, accountData?.ensName]);

  if (address) {
    return (
      <>
        {content || (
          <div className="pr-2 mr-2 border-r border-color flex items-center">
            <Link href="/mint">
              <a className="Button text-xs font-semibold">+ New Subgraph</a>
            </Link>
          </div>
        )}
        <button
          className="relative z-10"
          onClick={() => setDropDownOpen(!dropDownOpen)}
        >
          <Address address={address} showAvatar />
          {dropDownOpen && (
            <div
              ref={dropDownRef}
              className={`${bg} w-fit border absolute top-8 right-0 shadow-lg rounded z-10`}
            >
              <Link href={`/accounts/${accountData?.ensName || address}`}>
                <a>
                  <p className={`${bgHover} font-semibold w-32 truncate py-1`}>
                    Account
                  </p>
                </a>
              </Link>

              {accountDataLoading && (
                <p className={`pl-1 font-semibold w-32 truncate py-1`}>
                  Loading...
                </p>
              )}

              {subgraphs.map((item) => {
                const name = item.node.currentRevision.name;
                const emoji = item.node.currentRevision.nativeEmoji;
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
                  <p
                    className={`${bgHover} font-semibold w-32 truncate py-1 border-t`}
                  >
                    + New Subgraph
                  </p>
                </a>
              </Link>

              <a
                className="text-center flex flex-row items-center flex-grow"
                onClick={() => {
                  flushSessionAndDisconnect();
                }}
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
      <ConnectKitButton.Custom>
        {({ isConnected, isConnecting, show, address }) => {
          return (
            <button onClick={show} className={`Button ${bg}`}>
              {isConnecting || accountDataLoading || sessionDataLoading
                ? "Connecting..."
                : isConnected
                ? address
                : "Connect"}
            </button>
          );
        }}
      </ConnectKitButton.Custom>
    </div>
  );
};

export default Wallet;
