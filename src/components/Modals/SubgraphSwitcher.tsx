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

const labelForRole = (role: null | "0" | "1") => {
  if (role === null) return "Owner";
  if (role === "0") return "Admin";
  if (role === "1") return "Editor";
  return "?";
}

const SubgraphSwitcher: FC<Props> = ({
  isOpen,
  onRequestClose
}) => {
  const { accountData } = useContext(GraphContext);

  let subgraphRolesByTokenId = {};
  if (accountData) {
    subgraphRolesByTokenId =
      accountData.roles.reduce((acc: object, role: Role) => {
        const n = accountData.related.find((node: BaseNode) => {
          return node.tokenId === role.tokenId;
        });
        if (!n) return acc;
        if (!n.labels.includes("Subgraph")) return acc;
        acc[n.tokenId] =
          acc[n.tokenId] || { subgraph: n, roles: [] };
        acc[n.tokenId].roles.push(labelForRole(role.role));
        return acc;
      }, subgraphRolesByTokenId);
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
          <Link href="/mint">
            <a className="Button text-xs font-semibold">+ Mint Subgraph</a>
          </Link>
        </div>
      </div>
    </Modal>
  );
};

export default SubgraphSwitcher;
