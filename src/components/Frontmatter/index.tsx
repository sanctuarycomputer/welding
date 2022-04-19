import styles from './styles.module.css';
import { useState } from 'react';
import Modal from 'react-modal';
import { Picker } from 'emoji-mart';

const FrontmatterReadOnly = ({ meta }) => {
  return (
    <div className={styles.Frontmatter}>
      <div className="pb-4">
        <div className="flex items-center">
          <div className={styles.emoji}>
            {meta.metadata.properties.emoji.native}
          </div>
          <div className="grow">
            <h1>{meta.metadata.name}</h1>
          </div>
        </div>

        <div>
          <h2>{meta.metadata.description}</h2>
        </div>
      </div>

      <hr className="pb-4 mb-0" />
    </div>
  );
};

const Frontmatter = ({
  formik,
  meta
}) => {
  if (!formik && meta) return <FrontmatterReadOnly meta={meta} />

  const [emojiPickerIsOpen, setEmojiPickerIsOpen] = useState(false);
  const openEmojiPicker = () => setEmojiPickerIsOpen(true);
  const closeModal = () => setEmojiPickerIsOpen(false);
  const didSelectEmoji = (emoji) => {
    setEmojiPickerIsOpen(false);
    formik.setFieldValue('emoji', emoji);
  };

  return (
    <div className={styles.Frontmatter}>
      <Modal
        isOpen={emojiPickerIsOpen}
        onRequestClose={closeModal}
        contentLabel="Emoji Picker"
      >
        <Picker
          onSelect={didSelectEmoji}
          showSkinTones={false}
          showPreview={false}
        />
      </Modal>

      <form className="pb-4" onSubmit={formik.handlesubmit}>
        <button>+ Add Cover Image</button>

        <div className="flex items-center">
          <div className={`${styles.emoji} cursor-pointer`} onClick={openEmojiPicker}>
            {formik.values.emoji.native}
          </div>
          <div className="grow">
            <input
              type="text"
              name="name"
              placeholder="Name"
              className="mb-2"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </div>
        </div>

        {formik.errors.name && (
          <div className="mb-4 mt-1">
            <div className="pill inline">{formik.errors.name}</div>
          </div>
        )}

        <input
          name="description"
          placeholder="Description..."
          value={formik.values.message}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
      </form>

      <hr className="pb-4 mb-0" />
    </div>
  );
};

export default Frontmatter;
