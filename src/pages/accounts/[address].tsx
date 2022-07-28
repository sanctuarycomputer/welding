import { FC } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import type { GetStaticProps } from "next";
import type { Account, BaseNode, Role } from "src/types";
import Client from "src/lib/Client";
import Document from "src/components/Icons/Document";
import Graph from "src/components/Icons/Graph";
import Hashtag from "src/components/Icons/Hashtag";
import dynamic from "next/dynamic";
import Card from "src/components/Card";
import TopicTile from "src/components/TopicTile";
import getRelatedNodes from "src/utils/getRelatedNodes";
import slugifyNode from "src/utils/slugifyNode";
import { fetchEnsAddress } from "@wagmi/core";

const Address = dynamic(() => import("src/components/Address"), {
  ssr: false,
});
const Avatar = dynamic(() => import("src/components/Avatar"), {
  ssr: false,
});

type Props = {
  accountData: Account | null;
  address: string;
};

const AccountsShow: FC<Props> = ({ accountData, address }) => {
  const router = useRouter();
  let { collection } = router.query;
  collection =
    (Array.isArray(collection) ? collection[0] : collection) || "Subgraph";

  let accountNodesByCollectionType = {};
  if (accountData) {
    accountNodesByCollectionType = accountData.roles.reduce(
      (acc: object, role: Role) => {
        const n = accountData.related.find((node: BaseNode) => {
          return node.tokenId === role.tokenId;
        });
        if (!n) return acc;
        const collectionType = n.labels.filter((l) => l !== "BaseNode")[0];
        acc[collectionType] = acc[collectionType] || {};
        acc[collectionType][n.tokenId] = acc[collectionType][n.tokenId] || n;
        return acc;
      },
      accountNodesByCollectionType
    );
  }
  const nodes: BaseNode[] = Object.values(
    accountNodesByCollectionType[collection] || {}
  );

  return (
    <div className="content py-4 mt-24 mx-auto">
      <div className="flex flex-col items-center pb-8">
        <Avatar width={32} address={address} />
      </div>
      <div className="flex flex-col items-center pb-8">
        <Address copyToClipboard address={address} />
      </div>

      <div className="border-b border-color flex justify-between">
        <Link href={`/accounts/${address}?collection=Subgraph`}>
          <a
            className={`p-4 flex-grow basis-0 text-center ${
              collection === "subgraphs" ? "border-b" : ""
            }`}
          >
            <p>
              Subgraphs •{" "}
              {
                Object.values(accountNodesByCollectionType["Subgraph"] || {})
                  .length
              }
            </p>
          </a>
        </Link>

        <Link href={`/accounts/${address}?collection=Document`}>
          <a
            className={`p-4 flex-grow basis-0 text-center ${
              collection === "documents" ? "border-b" : ""
            }`}
          >
            <p>
              Documents •{" "}
              {
                Object.values(accountNodesByCollectionType["Document"] || {})
                  .length
              }
            </p>
          </a>
        </Link>

        <Link href={`/accounts/${address}?collection=Topic`}>
          <a
            className={`p-4 flex-grow basis-0 text-center ${
              collection === "topics" ? "border-b" : ""
            }`}
          >
            <p>
              Topics •{" "}
              {
                Object.values(accountNodesByCollectionType["Topic"] || {})
                  .length
              }
            </p>
          </a>
        </Link>
      </div>

      {nodes.length === 0 && (
        <div className="flex flex-col pt-16 items-center">
          {collection === "Subgraph" && <Graph />}
          {collection === "Document" && <Document />}
          {collection === "Topic" && <Hashtag />}
          <p className="pt-4">This account does not have any {collection}.</p>
        </div>
      )}

      {nodes.length !== 0 && collection === "Subgraph" && (
        <div className="">
          {nodes.map((node) => {
            return (
              <Link key={node.tokenId} href={`/${slugifyNode(node)}`}>
                <a className="flex relative py-4 px-4 sm:px-0 justify-between items-center flex-row border-b border-color">
                  <div className="flex flex-row items-center py-1 flex-grow">
                    <p className="pr-2 font-semibold w-32 truncate">
                      {node.currentRevision.nativeEmoji}{" "}
                      {node.currentRevision.name}
                    </p>
                  </div>
                  <div className="flex">
                    <p>↙ {node.incoming.length} Backlinks</p>
                  </div>
                </a>
              </Link>
            );
          })}
        </div>
      )}

      {nodes.length !== 0 && collection === "Topic" && (
        <div className="pt-4 px-4 sm:px-0">
          {nodes.map((node) => {
            return (
              <Link key={node.tokenId} href={`/${slugifyNode(node)}`}>
                <a className="inline-block pb-2">
                  <TopicTile topic={node} />
                </a>
              </Link>
            );
          })}
        </div>
      )}

      {nodes.length !== 0 && collection === "Document" && (
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 sm:px-0">
          {nodes.map((node) => {
            const subgraphs = getRelatedNodes(
              node,
              "outgoing",
              "Subgraph",
              "BELONGS_TO"
            );

            let link = `/${slugifyNode(node)}`;
            if (subgraphs.length === 1) {
              link = `/${slugifyNode(subgraphs[0])}/${slugifyNode(node)}`;
            } else if (subgraphs.length > 1) {
              const ownedSubgraphs = subgraphs.reduce<BaseNode[]>(
                (acc, subgraph) => {
                  if (
                    accountNodesByCollectionType["Subgraph"][subgraph.tokenId]
                  ) {
                    return [...acc, subgraph];
                  }
                  return acc;
                },
                []
              );
              if (ownedSubgraphs.length === 1) {
                link = `/${slugifyNode(ownedSubgraphs[0])}/${slugifyNode(
                  node
                )}`;
              }
            }

            return (
              <Link key={node.tokenId} href={link}>
                <a>
                  <Card key={node.tokenId} node={node} />
                </a>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  let address = context.params?.address;
  address = (Array.isArray(address) ? address[0] : address) || "";
  const resolvedAddress = await fetchEnsAddress({ chainId: 1, name: address });
  if (resolvedAddress) address = resolvedAddress;
  const accountData = await Client.fetchAccount(address);
  return {
    props: { accountData, address },
    revalidate: 1440,
  };
};

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export default AccountsShow;
