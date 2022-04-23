const TopicTile = ({ topic }) => {
  const emoji = topic.id === "-1"
    ? topic.emoji.native
    : topic.metadata.properties.emoji.native;
  const name = topic.id === "-1"
    ? topic.name
    : topic.metadata.name;
  return (
    <p className="ml-2 border-2 border-color flex rounded-full text-xs px-2 py-1 font-medium">
      {emoji} #{name}
    </p>
  );
};

export default TopicTile;
