import { FC, useContext } from "react";
import { ModalContext, ModalType } from "src/hooks/useModal";
import Link from "next/link";
import TopicTile from "src/components/TopicTile";
import slugifyNode from "src/utils/slugifyNode";
import {
  getRelatedNodes,
  stageNodeRelations,
} from "src/lib/makeBaseNodeFormik";

type Props = {
  readOnly: boolean;
};

const TopicManager: FC<Props> = ({ formik, readOnly }) => {
  const { openModal } = useContext(ModalContext);

  const setTopics = (topics) => {
    stageNodeRelations(formik, "incoming", topics, "DESCRIBES", true);
  };

  const topics = getRelatedNodes(formik, "incoming", "Topic", "DESCRIBES");

  return (
    <div className="mb-4">
      {topics.map((t) => {
        return (
          <Link key={t.tokenId} href={`/${slugifyNode(t)}`}>
            <a className="inline-block pb-2">
              <TopicTile key={t.tokenId} topic={t} />
            </a>
          </Link>
        );
      })}

      {!readOnly && (
        <div
          className={`cursor-pointer inline-block `}
          onClick={() =>
            openModal({
              type: ModalType.TOPIC_CONNECTOR,
              meta: {
                topics,
                setTopics,
              },
            })
          }
        >
          <p
            className={`inline-block text-xs px-1 opacity-60 hover:opacity-100`}
          >
            + Topic
          </p>
        </div>
      )}
    </div>
  );
};

export default TopicManager;
