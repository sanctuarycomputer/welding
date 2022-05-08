import { FC } from "react";

type Props = {
  label: string;
  disabled: boolean;
  onClick: Function;
};

const Button: FC<Props> = ({
  label,
  disabled,
  onClick
}) => {
  return (
    <button
      className="Button"
      disabled={disabled}
      onClick={() => onClick()}
    >
      {label}
    </button>
  );
}

export default Button;
