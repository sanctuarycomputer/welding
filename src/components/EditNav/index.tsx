import { FC } from 'react';
import Button from 'src/components/Button';
import { FormikProps } from 'formik';
import { BaseNodeFormValues } from 'src/types';
import VerticalDots from 'src/components/Icons/VerticalDots';

type Props = {
  unsavedChanges: boolean;
  formik: FormikProps<BaseNodeFormValues>;
  buttonLabel: string;
  coverImageFileDidChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClick?: Function
  onClickExtra?: Function
};

const EditNav: FC<Props> = ({
  unsavedChanges,
  formik,
  buttonLabel,
  coverImageFileDidChange,
  onClick,
  onClickExtra
}) => {
  return (
    <nav className="mt-2 mb-4 w-full background-color flex items-center sticky top-0 z-20 justify-between">
      <label className="cursor-pointer">
        <input
          style={{display: 'none'}}
          type="file"
          onChange={coverImageFileDidChange}
          accept="image/*"
        />
        <p className="pl-4">+ Set Cover Image</p>
      </label>

      <div className="flex pr-4 py-4 items-center">
        {unsavedChanges ? (
          <div
            className="background-warning-color text-background-color font-medium text-xs px-2 py-1 rounded-full mr-2"
          >
            Unsaved
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
          onClick={() => onClick ? onClick() : formik.handleSubmit()}
          label={buttonLabel}
        />
        {onClickExtra && (
          <div className="cursor-pointer pl-1" onClick={() => onClickExtra()}>
            <VerticalDots />
          </div>
        )}
      </div>
    </nav>
  );
};

export default EditNav;
