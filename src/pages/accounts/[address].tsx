import { FC, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import type { Account } from 'src/types';
import { NavContext } from 'src/hooks/useNav';
import Client from 'src/lib/Client';
import Welding from 'src/lib/Welding';
import Button from 'src/components/Button';
import Document from 'src/components/Icons/Document';
import Graph from 'src/components/Icons/Graph';
import Hashtag from 'src/components/Icons/Hashtag';
import dynamic from 'next/dynamic';
import Card from 'src/components/Card';
import TopicTile from 'src/components/TopicTile';
import getRelatedNodes from 'src/utils/getRelatedNodes';
import { useAccount } from 'wagmi';

const Address = dynamic(() => import('src/components/Address'), {
  ssr: false
});
const Avatar = dynamic(() => import('src/components/Avatar'), {
  ssr: false
});

type Props = {
  accountData: Account | null;
  address: string;
};

const AccountsShow: FC<Props> = ({ accountData, address }) => {
  const router = useRouter();
  let { collection } = router.query;
  if (!collection) collection = "subgraphs";

  let nodesByCollectionType = {
    subgraphs: {},
    documents: {},
    topics: {},
  };

  const { data: account } = useAccount();
  const { setContent } = useContext(NavContext);

  useEffect(() => {
    if (!account?.address) return setContent(null);
    setContent(
      <div className="pr-2 mr-2 border-r border-color flex items-center">
        <Link href="/mint">
          <a className="Button text-xs font-semibold">
            + Mint Subgraph
          </a>
        </Link>
      </div>
    );
  }, [account?.address]);

  if (accountData) {
    nodesByCollectionType =
      accountData.roles.reduce((acc: object, role: Role) => {
        const n = accountData.related.find((node: BaseNode) => {
          return node.tokenId === role.tokenId;
        });
        if (!n) return acc;
        const collectionType =
          `${n.labels.filter(l => l !== "BaseNode")[0].toLowerCase()}s`;
        acc[collectionType][n.tokenId] =
          acc[collectionType][n.tokenId] || { n:n };
        return acc;
      }, nodesByCollectionType);
  }


  const nodes: BaseNode[] =
    Object.values(nodesByCollectionType[collection]);

  return (
    <div className="content py-4 mt-24 mx-auto">
      <div className="flex flex-col items-center pb-8">
        <Avatar
          width={32}
          address={address}
        />
      </div>
      <div className="flex flex-col items-center pb-8">
        <Address
          copyToClipboard
          address={address}
        />
      </div>

      <div className="border-b border-color flex justify-between">
        <Link href={`/accounts/${address}?collection=subgraphs`}>
          <a className={`p-4 flex-grow basis-0 text-center ${collection === "subgraphs" ? "border-b" : ""}`}>
            <p>Subgraphs • {Object.values(nodesByCollectionType["subgraphs"]).length}</p>
          </a>
        </Link>

        <Link href={`/accounts/${address}?collection=documents`}>
          <a className={`p-4 flex-grow basis-0 text-center ${collection === "documents" ? "border-b" : ""}`}>
            <p>Documents • {Object.values(nodesByCollectionType["documents"]).length}</p>
          </a>
        </Link>

        <Link href={`/accounts/${address}?collection=topics`}>
          <a className={`p-4 flex-grow basis-0 text-center ${collection === "topics" ? "border-b" : ""}`}>
            <p>Topics • {Object.values(nodesByCollectionType["topics"]).length}</p>
          </a>
        </Link>
      </div>

      {nodes.length === 0 && (
        <div className="flex flex-col pt-16 items-center">
          {collection === "subgraphs" && <Graph />}
          {collection === "documents" && <Document />}
          {collection === "topics" && <Hashtag />}
          <p className="pt-4">This account does not have any {collection}.</p>
        </div>
      )}

      {nodes.length !== 0 && collection === "subgraphs" && (
        <div className="">
          {nodes.map(node => {
            return (
              <Link
                key={node.n.tokenId}
                href={`/${Welding.slugifyNode(node.n)}`}>

              <a
                className="flex relative py-4 px-4 sm:px-0 justify-between items-center flex-row border-b border-color"
              >
                <div className="flex flex-row items-center py-1 flex-grow">
                  <p className="pr-2 font-semibold w-32 truncate">
                    {node.n.currentRevision.metadata.properties.emoji.native} {node.n.currentRevision.metadata.name}
                  </p>
                </div>
                <div className="flex">
                  <p>
                    ↙ {node.n.incoming.length} Backlinks
                  </p>
                </div>
              </a>

              </Link>
            );
          })}
        </div>
      )}

      {nodes.length !== 0 && collection === "topics" && (
        <div className="pt-4 px-4 sm:px-0">
          {nodes.map(node => {
            return (
              <Link
                key={node.n.tokenId}
                href={`/${Welding.slugifyNode(node.n)}`}>
                <a className="inline-block pb-2">
                  <TopicTile topic={node.n} />
                </a>
              </Link>
            );
          })}
        </div>
      )}

      {nodes.length !== 0 && collection === "documents" && (
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 sm:px-0">
          {nodes.map(node => {
            const subgraphs =
              getRelatedNodes(node.n, 'outgoing', 'Subgraph', 'BELONGS_TO');

            let link = `/${Welding.slugifyNode(node.n)}`;
            if (subgraphs.length === 1) {
              link =
                `/${Welding.slugifyNode(subgraphs[0])}/${Welding.slugifyNode(node.n)}`;
            } else if (subgraphs.length > 1) {
              const ownedSubgraphs =
                subgraps.reduce((acc, subgraph) => {
                  throw new Error("test_me");
                  if (nodesByCollectionType.subgraphs[subgraph.tokenId]) {
                    return [...acc, subgraph];
                  }
                  return acc;
                }, []);
              if (ownedSubgraphs.length === 1) {
                link =
                  `/${Welding.slugifyNode(ownedSubgraphs[0])}/${Welding.slugifyNode(node.n)}`;
              }
            }

            return (
              <Link
                key={node.n.tokenId}
                href={link}>
                <a>
                  <Card key={node.n.tokenId} node={node.n} />
                </a>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  let { address } = context.query;
  address = ((Array.isArray(address) ? address[0] : address) || '');
  const accountData =
    await Client.fetchAccount(address);
  return {
    props: { accountData, address },
  };
}

export default AccountsShow;
