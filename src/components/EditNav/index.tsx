import Link from 'next/link';
import Button from 'src/components/Button';

const EditNav = ({
  formik,
  buttonLabel
}) => {
  return (
    <nav className="mt-2 mb-4 w-full background-color flex items-center sticky top-0 z-10 justify-between">
      <p className="pl-4">+ Add Cover Image</p>

      <div className="flex pr-4 py-4">
        {formik.dirty ? (
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
          disabled={formik.isSubmitting || !(formik.isValid && formik.dirty)}
          onClick={formik.handleSubmit}
          label={buttonLabel}
        />
      </div>
    </nav>
  );
};

export default EditNav;
