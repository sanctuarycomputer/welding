import { FC } from "react";
import { bg } from "src/utils/theme";

type Props = {
  label: string;
  disabled: boolean;
  onClick: () => void;
  className?: string;
};

const Button: FC<Props> = ({ label, disabled, onClick, className }) => {
  return (
    <button
      className={`Button ${className} ${bg}`}
      disabled={disabled}
      onClick={() => onClick()}
    >
      {label}
    </button>
  );
};

export default Button;
