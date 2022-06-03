import { FC } from "react";

type Props = {
  label: string;
  disabled: boolean;
  onClick: Function;
  className?: string;
};

const Button: FC<Props> = ({
  label,
  disabled,
  onClick,
  className
}) => {
  return (
    <button
      className={`Button ${className} background-color`}
      disabled={disabled}
      onClick={() => onClick()}
    >
      {label}
    </button>
  );
}

export default Button;
