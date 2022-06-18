import { FC, useContext, useState } from 'react';
import { ModalContext, ModalType } from 'src/hooks/useModal';
import { FormikProps } from 'formik';
import { BaseNodeFormValues } from 'src/types';

type ReadOnlyProps = {
  formik: FormikProps<BaseNodeFormValues>;
};

const FrontmatterReadOnly: FC<ReadOnlyProps> = ({ formik }) => {
  return (
    <div className={`px-2 md:px-0`}>
      <div className="pb-4">
        <div className="flex items-center mt-4 mb-2">
          <div className={`text-3xl md:text-5xl mr-1`}>
            {formik.values.emoji.native}
          </div>
          <div className="grow truncate">
            <h1 className="text-3xl md:text-5xl font-bold">{formik.values.name}</h1>
          </div>
        </div>

        <div>
          <h2 className="text-base font-normal">{formik.values.description}</h2>
        </div>
      </div>
      <hr className="pb-2 mb-0" />
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
  if (readOnly) return <FrontmatterReadOnly formik={formik} />;
  const { openModal, closeModal } = useContext(ModalContext);

  return (
    <div className={`px-2 md:px-0`}>
      <form className="pb-4" onSubmit={formik.handleSubmit}>
        <div className="flex items-center mt-4 mb-2">
          <div
            className={`cursor-pointer text-3xl md:text-5xl mr-2`}
            onClick={() => openModal({
              type: ModalType.EMOJI_PICKER,
              meta: {
                didPickEmoji: (emoji: BaseEmoji) => {
                  formik.setFieldValue('emoji', emoji);
                  closeModal();
                }
              }
            })}>
            {formik.values.emoji.native}
          </div>
          <div className="grow">
            <input
              type="text"
              name="name"
              placeholder={`${label} name`}
              className="text-3xl md:text-5xl font-bold"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
          </div>
        </div>
        <input
          name="description"
          placeholder="Description..."
          value={formik.values.description}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
      </form>
      <hr className="pb-2 mb-0" />
    </div>
  );
};

export default Frontmatter;
