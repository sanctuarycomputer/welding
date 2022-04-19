import styles from './styles.module.css';

const SplitPill = ({
  bearer,
  primary
}) => {
  return (
    <div className={`${styles.splitPill} mb-2`}>
      <span className={styles.bearer}>{bearer}</span>
      <span className={styles.primary}>{primary}</span>
    </div>
  )
};

export default SplitPill;
