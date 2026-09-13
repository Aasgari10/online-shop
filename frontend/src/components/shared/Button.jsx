// src/components/shared/Button.jsx
function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  fullWidth = false,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    primary: 'bg-[#800E2F] text-white hover:bg-[#6B0A26] focus:ring-[#800E2F] shadow-md hover:shadow-lg',
    secondary: 'bg-white text-[#800E2F] border-2 border-[#800E2F] hover:bg-[#800E2F]/5 focus:ring-[#800E2F]',
    outline: 'bg-transparent text-gray-700 border-2 border-gray-300 hover:bg-gray-50 focus:ring-gray-400',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-md hover:shadow-lg',
    success: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500 shadow-md hover:shadow-lg',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-400',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-2.5 text-base',
    xl: 'px-8 py-3 text-lg',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className} ${
        disabled || loading ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'
      }`}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;