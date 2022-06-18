type Props = {
  title: string;
  hint: string;
  onClickClose: Function;
  onClickBack: Function | null;
};

const ModalHeader: FC<Props> = ({ title, hint, onClickClose, onClickBack }) => {
  return (
    <div className="flex p-4 border-b border-color justify-between">
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
  );
};

export default ModalHeader;
