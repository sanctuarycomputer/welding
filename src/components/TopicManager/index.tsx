import styles from './styles.module.css';

const TopicManager = ({ }) => {
  return (
    <div className={`${styles.topicManager} mb-4 cursor-pointer`}>
      <span className={styles.primary}>+ Connect a Topic</span>
    </div>
  );
};

export default TopicManager;
