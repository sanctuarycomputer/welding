import { FC } from 'react';
import Button from 'src/components/Button';
import { FormikProps } from 'formik';
import { BaseNodeFormValues } from 'src/types';

type Props = {
  unsavedChanges: boolean;
  formik: FormikProps<BaseNodeFormValues>;
  buttonLabel: string;
  coverImageFileDidChange: (e: React.ChangeEvent<HTMLInputElement>) => void
};

const EditNav: FC<Props> = ({
  unsavedChanges,
  formik,
  buttonLabel,
  coverImageFileDidChange
}) => {
  return (
    <nav className="mt-2 mb-4 w-full background-color flex items-center sticky top-0 z-20 justify-between shadow-lg">
      <label className="cursor-pointer">
        <input
          style={{display: 'none'}}
          type="file"
          onChange={coverImageFileDidChange}
          accept="image/*"
        />
        <p className="pl-4">+ Set Cover Image</p>
      </label>

      <div className="flex pr-4 py-4">
        {unsavedChanges ? (
          <div
            className="background-warning-color text-background-color font-medium text-xs px-2 py-1 rounded-full mr-2"
          >
            Unsaved Changes
          </div>
        ) : (
          <div
            className="text-passive-color text-xs px-2 py-1 rounded-full mr-2"
          >
            No Changes
          </div>
        )}
        <Button
          disabled={formik.isSubmitting || !(formik.isValid && unsavedChanges)}
          onClick={() => formik.handleSubmit()}
          label={buttonLabel}
        />
      </div>
    </nav>
  );
};

export default EditNav;
