import styles from './styles.module.css';
import SplitPill from 'src/components/SplitPill';

const Tile = ({ meta }) => {
  const hasMetadataError = meta.metadata === "error";
  const name = hasMetadataError ?
    "Metadata Error" :
    meta.metadata.name;
  const description = hasMetadataError ?
    "Could not read this graph's metadata" :
    meta.metadata.description;
  const emoji = hasMetadataError ?
    "⚠️" :
    meta.metadata.properties.emoji.native;

  return (
    <div className={`${styles.Tile} border rounded-md mb-4 p-4 cursor-pointer`}>
      <SplitPill
        bearer={meta.id.toString()}
        primary={`${emoji} ${name}`}
      />
      <p>{description}</p>
    </div>
  );
};

export default Tile;
