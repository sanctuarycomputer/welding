import { FC } from "react";
import { BaseNode } from "src/types";
import { bgPassive } from "src/utils/theme";

type Props = {
  topic: BaseNode;
  textSize?: string;
};

const TopicTile: FC<Props> = ({ topic, textSize }) => {
  const emoji = topic.currentRevision.nativeEmoji;
  const name = topic.currentRevision.name;
  return (
    <p
      className={`${bgPassive} whitespace-nowrap mr-1 flex rounded-full text-${
        textSize || "xs"
      } px-2 py-1 font-normal`}
    >
      {emoji} #{name}
    </p>
  );
};

export default TopicTile;
