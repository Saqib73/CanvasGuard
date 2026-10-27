export const Card = ({
  children,
  className = "",
  padding = true,
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`cg-card ${padding ? "p-5" : ""} transition-colors duration-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
