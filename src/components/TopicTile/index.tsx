import { FC } from 'react';
import { BaseNode } from 'src/types';

type Props = {
  topic: BaseNode
};

const TopicTile: FC<Props> = ({ topic }) => {
  const emoji = topic.currentRevision.metadata.properties.emoji.native;
  const name = topic.currentRevision.metadata.name;
  return (
    <p className="ml-2 border-2 border-color flex rounded-full text-xs px-2 py-1 font-medium">
      {emoji} #{name}
    </p>
  );
};

export default TopicTile;
