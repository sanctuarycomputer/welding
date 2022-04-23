const Button = ({
  label,
  disabled,
  onClick
}) => {
  return (
    <button
      className="Button font-medium text-xs px-2 py-1 rounded-full"
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export default Button;
