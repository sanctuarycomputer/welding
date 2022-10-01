import { FC } from "react";
import Button from "src/components/Button";
import { FormikProps } from "formik";
import { BaseNodeFormValues } from "src/types";
import { textPassive } from "src/utils/theme";

type Props = {
  formik: FormikProps<BaseNodeFormValues>;
  draftsPersisting?: boolean;
  unstageDraft?: () => void;
  buttonLabel: string;
  onClick?: () => void;
};

const NO_OP = () => {};
const EditNav: FC<Props> = ({
  formik,
  draftsPersisting,
  unstageDraft,
  buttonLabel,
  onClick,
}) => {
  return (
    <div className="flex pr-2 items-center border-r border-color mr-2">
      {formik.dirty ? (
        <div
          onClick={unstageDraft || NO_OP}
          className="bg-yellow-400 text-stone-800 font-medium text-xs px-2 py-1 rounded-full mr-2"
        >
          {draftsPersisting ? "Saving..." : "Draft"}
        </div>
      ) : (
        <div className={`${textPassive} text-xs px-2 py-1 rounded-full mr-2`}>
          No Changes
        </div>
      )}
      <Button
        disabled={formik.isSubmitting || !(formik.isValid && formik.dirty)}
        onClick={() => (onClick ? onClick() : formik.handleSubmit())}
        label={buttonLabel}
      />
    </div>
  );
};

export default EditNav;
