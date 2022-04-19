import Link from 'next/link';

const EditNav = ({
  backLinkHref,
  backLinkLabel,
  buttonDisabled,
  onButtonClick,
  buttonLabel
}) => {
  return (
    <nav className="EditNav fixed top-0 w-full background-passive-color flex items-center justify-between">
      <Link href={backLinkHref}>
        <a className="text-xs flex items-center h-full px-4">
          {backLinkLabel}
        </a>
      </Link>

      <div className="flex pr-4">
        <div
          className="background-warning-color text-background-color font-medium text-xs px-2 py-1 rounded-full mr-2"
        >
          Unsaved Changes
        </div>
        <button
          className="Button font-medium text-xs px-2 py-1 rounded-full"
          disabled={buttonDisabled}
          onClick={onButtonClick}
        >
          {buttonLabel}
        </button>
      </div>
    </nav>
  );
};

export default EditNav;
