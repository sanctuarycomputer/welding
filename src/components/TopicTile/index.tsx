import { FC } from 'react';
import { BaseNode } from 'src/types';

type Props = {
  topic: BaseNode;
  textSize?: string;
};

const TopicTile: FC<Props> = ({
  topic,
  textSize,
}) => {
  const emoji = topic.currentRevision.metadata.properties.emoji.native;
  const name = topic.currentRevision.metadata.name;
  return (
    <p className={`whitespace-nowrap mr-1 border-2 border-color background-color flex rounded-full text-${textSize || 'xs'} px-2 py-1 font-medium`}>
      {emoji} #{name}
    </p>
  );
};

export default TopicTile;
