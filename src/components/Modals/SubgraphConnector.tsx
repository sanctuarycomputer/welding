import { FC, useEffect, useContext } from 'react';
import { ModalContext } from 'src/hooks/useModal';
import { GraphContext } from 'src/hooks/useGraphData';
import Modal from 'react-modal';
import ModalHeader from 'src/components/Modals/ModalHeader';

type Props = {
  isOpen: boolean;
  onRequestClose: Function
};

export type SubgraphConnectorMeta  = {
  node: BaseNode;
};

const SubgraphConnector: FC<Props> = ({
  isOpen,
  onRequestClose
}) => {
  const {
    closeModal
  } = useContext(ModalContext);
  const {
    accountData,
    accountNodesByCollectionType
  } = useContext(GraphContext);

  const subgraphs =
    accountNodesByCollectionType["Subgraph"];

  if (!accountData) {
    return (
      <p>TODO</p>
    );
  };

  const initConnection = (subgraph: BaseNode) => {
    // check that subgraph doesn't already have this backlink
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={() => onRequestClose()}
    >
      <div className="h-screen sm:h-auto flex flex-col">
        <ModalHeader
          title="Connect to a Subgraph"
          hint="Connect a provider."
          onClickClose={() => onRequestClose()}
        />
        {Object.values(subgraphs).map(({ node }) => {
          return (
            <div className="flex flex-row items-center py-1 flex-grow">
              <p className="pr-2 font-semibold w-32 truncate">
                {node.currentRevision.metadata.properties.emoji.native} {node.currentRevision.metadata.name}
              </p>
            </div>
          );
        })}
      </div>
    </Modal>
  );
};

export default SubgraphConnector;
