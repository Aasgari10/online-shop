// src/components/shared/Spinner.jsx
function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-4',
    lg: 'h-14 w-14 border-4',
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-[#800E2F] border-t-transparent ${sizes[size]}`}
      />
    </div>
  );
}

export default Spinner;