import { bg } from 'src/utils/theme';

type Props = {
  title: string;
  hint: string;
  onClickClose: Function;
  onClickBack: Function | null;
};

const ModalHeader: FC<Props> = ({ title, hint, onClickClose, onClickBack }) => {
  return (
    <>
      <div className={`${bg} fixed sm:relative w-full flex p-4 border-b justify-between z-10`}>
        <div>
          {onClickBack && (
            <p
              onClick={onClickBack}
              className="text-xs flex items-center inline-block cursor-pointer pb-1"
            >
              ← Back
            </p>
          )}
          <h2>{title}</h2>
          <p>{hint}</p>
        </div>
        <span
          onClick={onClickClose}
          className="cursor-pointer flex items-center pl-8"
        >
          ✕
        </span>
      </div>

      {/* This is a spacer */}
      <div className={`relative sm:hidden w-full flex p-4 border-b justify-between opacity-0`}>
        <div>
          {onClickBack && (
            <p
              onClick={onClickBack}
              className="text-xs flex items-center inline-block cursor-pointer pb-1"
            >
              ← Back
            </p>
          )}
          <h2>{title}</h2>
          <p>{hint}</p>
        </div>
      </div>
    </>
  );
};

export default ModalHeader;
