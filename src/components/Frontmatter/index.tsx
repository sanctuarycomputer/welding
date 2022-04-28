import { FC } from 'react';
import styles from './styles.module.css';
import { useState } from 'react';
import Modal from 'react-modal';
import { Picker, EmojiData, BaseEmoji } from 'emoji-mart';
import { FormikProps } from 'formik';
import { BaseNodeFormValues } from 'src/types';

type ReadOnlyProps = {
  formik: FormikProps<BaseNodeFormValues>;
};

const FrontmatterReadOnly: FC<ReadOnlyProps> = ({ formik }) => {
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

type Props = {
  formik: FormikProps<BaseNodeFormValues>;
  label: string;
  readOnly: boolean;
};

const Frontmatter: FC<Props> = ({
  formik,
  label,
  readOnly
}) => {
  const [emojiPickerIsOpen, setEmojiPickerIsOpen] = useState(false);
  const openEmojiPicker = () => setEmojiPickerIsOpen(true);
  const closeModal = () => setEmojiPickerIsOpen(false);
  const didSelectEmoji = (emoji: EmojiData) => {
    setEmojiPickerIsOpen(false);
    if (!(emoji as BaseEmoji).native) return;
    formik.setFieldValue('emoji', (emoji as BaseEmoji));
  };

  if (readOnly) return <FrontmatterReadOnly formik={formik} />;

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

      <form className="pb-4" onSubmit={formik.handleSubmit}>
        <div className="flex items-center">
          <div className={`${styles.emoji} cursor-pointer`} onClick={openEmojiPicker}>
            {formik.values.emoji.native ?? '?'}
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

        {(typeof formik.errors.name === "string") && (
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
