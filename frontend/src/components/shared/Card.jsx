// src/components/shared/Card.jsx
function Card({
  children,
  className = '',
  hover = false,
  padding = 'md',
  shadow = 'md',
  ...props
}) {
  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  const shadows = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  };

  return (
    <div
      className={`bg-white rounded-2xl ${shadows[shadow]} ${paddings[padding]} ${hover ? 'hover:shadow-lg transition-all duration-300 hover:-translate-y-1' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;