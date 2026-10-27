export const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  loading = false,
  type = "button",
  onClick,
  ...props
}) => {
  const variantStyles = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
    outline: "btn-outline",
    danger: "btn-error text-white",
  };

  const sizeStyles = {
    sm: "btn-sm",
    md: "btn-md",
    lg: "btn-lg",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn rounded-2xl font-medium transition-colors duration-200 ${
        variantStyles[variant] || ""
      } ${sizeStyles[size] || ""} ${className}`}
      {...props}
    >
      {loading && <span className="loading loading-spinner loading-xs mr-2" />}
      {children}
    </button>
  );
};

export default Button;
