import { FC } from 'react';
import Button from 'src/components/Button';
import { FormikProps } from 'formik';
import { BaseNodeFormValues } from 'src/types';
import VerticalDots from 'src/components/Icons/VerticalDots';

type Props = {
  formik: FormikProps<BaseNodeFormValues>;
  buttonLabel: string;
  coverImageFileDidChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClick?: Function
};

const EditNav: FC<Props> = ({
  formik,
  buttonLabel,
  coverImageFileDidChange,
  onClick,
}) => {
  return (
    <div className="flex pr-2 items-center border-r border-color mr-2">
      {formik.dirty ? (
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
        disabled={
          formik.isSubmitting ||
          !(formik.isValid && formik.dirty)
        }
        onClick={() => onClick
          ? onClick() :
          formik.handleSubmit()
        }
        label={buttonLabel}
      />
    </div>
  );
};

export default EditNav;
