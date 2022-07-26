import { FC, useContext } from "react";
import { ModalContext, ModalType } from "src/hooks/useModal";
import { FormikProps } from "formik";
import { BaseNodeFormValues } from "src/types";
import { BaseEmoji } from "emoji-mart";
import TextareaAutosize from 'react-textarea-autosize';

type Props = {
  formik: FormikProps<BaseNodeFormValues>;
  readOnly: boolean;
};

const Frontmatter: FC<Props> = ({ formik, readOnly }) => {
  const { openModal, closeModal } = useContext(ModalContext);

  return (
    <div className={`px-2 md:px-0`}>
      <form className="pb-4" onSubmit={formik.handleSubmit}>
        <div className="flex items-center mt-4 mb-2">
          <div
            className={`${readOnly ? '' : 'cursor-pointer'} text-3xl md:text-5xl mr-2`}
            onClick={() => {
              if (readOnly) return;
              openModal({
                type: ModalType.EMOJI_PICKER,
                meta: {
                  didPickEmoji: (emoji: BaseEmoji) => {
                    formik.setFieldValue("emoji", emoji);
                    closeModal();
                  },
                },
              })}
            }
          >
            {formik.values.emoji.native}
          </div>
          <div className="grow">
            <TextareaAutosize
              disabled={readOnly}
              name="name"
              placeholder={`My Document`}
              className="text-3xl md:text-5xl font-bold"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              style={{resize: 'none'}}
            />
          </div>
        </div>
        <input
          disabled={readOnly}
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
