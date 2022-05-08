import { FC, useContext } from 'react';
import { GraphContext } from 'src/hooks/useGraphData';
import Modal from 'react-modal';
import ModalHeader from 'src/components/Modals/ModalHeader';
import Link from 'next/link';
import type { BaseNode, Account, Roles } from 'src/types';
import Graph from 'src/components/Icons/Graph';
import Button from 'src/components/Button';
import Tile from 'src/components/Tile';
import Welding from 'src/lib/Welding';

type Props = {
  isOpen: boolean;
  onRequestClose: Function
};

// TODO: Export
enum Roles {
  OWNER = "Owner",
  ADMIN = "Admin",
  EDITOR = "Editor"
};

const SubgraphSwitcher: FC<Props> = ({
  isOpen,
  onRequestClose
}) => {
  const { accountData } = useContext(GraphContext);

  const subgraphRolesByTokenId = {};
  if (accountData) {
    accountData.ownerOf.forEach((n: BaseNode) => {
      if (!n.labels.includes("Subgraph")) return;
      subgraphRolesByTokenId[n.tokenId] =
        subgraphRolesByTokenId[n.tokenId] || { subgraph: n, roles: [] };
      subgraphRolesByTokenId[n.tokenId].roles.push(Roles.OWNER);
    });

    accountData.adminOf.forEach((n: BaseNode) => {
      if (!n.labels.includes("Subgraph")) return;
      subgraphRolesByTokenId[n.tokenId] =
        subgraphRolesByTokenId[n.tokenId] || { subgraph: n, roles: [] };
      subgraphRolesByTokenId[n.tokenId].roles.push(Roles.ADMIN);
    });

    accountData.editorOf.forEach((n: BaseNode) => {
      if (!n.labels.includes("Subgraph")) return;
      subgraphRolesByTokenId[n.tokenId] =
        subgraphRolesByTokenId[n.tokenId] || { subgraph: n, roles: [] };
      subgraphRolesByTokenId[n.tokenId].roles.push(Roles.EDITOR);
    });
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
    >
      <div className="h-screen sm:h-auto flex flex-col">
        <ModalHeader
          title="Subgraphs"
          hint="Select a subgraph, or mint a new one."
          onClickClose={() => onRequestClose()}
        />

        {Object.values(subgraphRolesByTokenId).map(t => {
          return (
            <Link
              key={t.subgraph.tokenId}
              href={`/${Welding.slugifyNode(t.subgraph)}`}
            >
              <a
                className="cursor-pointer flex relative p-4 justify-between items-center flex-row border-b border-color">
                <div className="flex flex-row items-center py-1 flex-grow">
                  <p className="pr-2 font-semibold w-32 truncate">
                    {t.subgraph.currentRevision.metadata.properties.emoji.native} {t.subgraph.currentRevision.metadata.name}
                  </p>
                </div>
                <div>
                  {t.roles.map(r => <Tile key={r} label={r} />)}
                </div>
              </a>
            </Link>
          );
        })}

        <div
          className="py-16 flex relative flex-grow justify-center items-center flex-col border-b border-color">
          <Graph />
          <p className="pt-2 font-semibold">
            Subgraphs help you organize your documents.
          </p>
        </div>

        <div className="p-4 flex flex-row-reverse">
          <Link href="/subgraphs/mint">
            <a className="Button text-xs font-semibold">+ Mint Subgraph</a>
          </Link>
        </div>
      </div>
    </Modal>
  );
};

export default SubgraphSwitcher;
