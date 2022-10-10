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

const NO_OP = () => {
  // Do nothing
};

const EditNav: FC<Props> = ({
  formik,
  draftsPersisting,
  unstageDraft,
  buttonLabel,
  onClick,
}) => {
  const node = formik.values.__node__;
  const isDummyNode = node.labels.includes("DummyNode");

  if (isDummyNode) {
    return (
      <div className="flex pr-2 items-center border-r border-color mr-2">
        <div
          onClick={unstageDraft || NO_OP}
          className="bg-yellow-400 text-stone-800 font-medium text-xs px-2 py-1 rounded-full mr-2"
        >
          {draftsPersisting ? "Saving..." : "Draft"}
        </div>
        <Button
          disabled={formik.isSubmitting || !formik.isValid}
          onClick={() => (onClick ? onClick() : formik.handleSubmit())}
          label={buttonLabel}
        />
      </div>
    );
  }

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
