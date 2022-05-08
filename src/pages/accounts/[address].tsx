import { FC } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import type { Account } from 'src/types';
import Client from 'src/lib/Client';
import Welding from 'src/lib/Welding';
import Button from 'src/components/Button';
import Document from 'src/components/Icons/Document';
import Graph from 'src/components/Icons/Graph';
import Hashtag from 'src/components/Icons/Hashtag';
import dynamic from 'next/dynamic';
import Rail from 'src/components/Rail';
import Card from 'src/components/Card';
import TopicTile from 'src/components/TopicTile';

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

// TODO: Export
enum Roles {
  OWNER = "Owner",
  ADMIN = "Admin",
  EDITOR = "Editor"
};

const AccountsShow: FC<Props> = ({ accountData, address }) => {
  const router = useRouter();
  let { collection } = router.query;
  if (!collection) collection = "subgraphs";

  const nodesByCollectionType = {
    subgraphs: {},
    documents: {},
    topics: {},
  };

  if (accountData) {
    accountData.ownerOf.forEach((n: BaseNode) => {
      const collectionType = `${n.labels.filter(l => l !== "BaseNode")[0].toLowerCase()}s`;
      nodesByCollectionType[collectionType][n.tokenId] =
        nodesByCollectionType[collectionType][n.tokenId] || { n:n, roles: [] };
      nodesByCollectionType[collectionType][n.tokenId].roles.push(Roles.OWNER);
    });

    accountData.adminOf.forEach((n: BaseNode) => {
      const collectionType = `${n.labels.filter(l => l !== "BaseNode")[0].toLowerCase()}s`;
      nodesByCollectionType[collectionType][n.tokenId] =
        nodesByCollectionType[collectionType][n.tokenId] || { n:n, roles: [] };
      nodesByCollectionType[collectionType][n.tokenId].roles.push(Roles.ADMIN);
    });

    accountData.editorOf.forEach((n: BaseNode) => {
      const collectionType = `${n.labels.filter(l => l !== "BaseNode")[0].toLowerCase()}s`;
      nodesByCollectionType[collectionType][n.tokenId] =
        nodesByCollectionType[collectionType][n.tokenId] || { n:n, roles: [] };
      nodesByCollectionType[collectionType][n.tokenId].roles.push(Roles.EDITOR);
    });
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
        <div className="pt-4 px-4 sm:px-0">
          {nodes.map(node => {
            return (
              <Link
                key={node.n.tokenId}
                href={`/${Welding.slugifyNode(node.n)}`}>
                <a>
                  <Rail key={node.n.tokenId} node={node.n} />
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
              node.n.connections.filter(n => n.labels.includes("Subgraph"));

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
