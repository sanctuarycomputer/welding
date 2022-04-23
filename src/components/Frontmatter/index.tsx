import styles from './styles.module.css';
import { useState } from 'react';
import Modal from 'react-modal';
import { Picker } from 'emoji-mart';

const FrontmatterReadOnly = ({ formik }) => {
  return (
    <div className={styles.Frontmatter}>
      <div className="pb-4">
        <div className="flex items-center">
          <div className={styles.emoji}>
            {formik.values.emoji.native}
          </div>
          <div className="grow">
            <h1>{formik.values.name}</h1>
          </div>
        </div>

        <div>
          <h2>{formik.values.description}</h2>
        </div>
      </div>

      <hr className="pb-4 mb-0" />
    </div>
  );
};

const Frontmatter = ({
  formik,
  label,
  readOnly
}) => {
  if (readOnly) return <FrontmatterReadOnly formik={formik} />

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
        <div className="flex items-center">
          <div className={`${styles.emoji} cursor-pointer`} onClick={openEmojiPicker}>
            {formik.values.emoji.native}
          </div>
          <div className="grow">
            <input
              type="text"
              name="name"
              placeholder={`${label} name`}
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
          value={formik.values.description}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
      </form>

      <hr className="pb-4 mb-0" />
    </div>
  );
};

export default Frontmatter;
