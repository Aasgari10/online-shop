// src/components/shared/EmptyState.jsx
function EmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="w-20 h-20 mx-auto bg-[#800E2F]/10 rounded-full flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      {description && <p className="text-gray-500 mb-6">{description}</p>}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="bg-[#800E2F] hover:bg-[#6B0A26] text-white px-6 py-2.5 rounded-lg font-medium transition shadow-md hover:shadow-lg"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

export default EmptyState;