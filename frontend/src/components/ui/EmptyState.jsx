export const EmptyState = ({
  title = "Nothing to see here",
  description = "",
  action = null,
  icon = null,
  className = "",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center text-neutral-400 ${className}`}>
      {icon && <div className="text-4xl mb-3 text-neutral-500">{icon}</div>}
      <h3 className="text-lg font-semibold text-neutral-300 mb-1">{title}</h3>
      {description && <p className="text-sm text-neutral-500 max-w-sm mb-4">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export default EmptyState;
