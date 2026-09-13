// src/components/shared/StarRating.jsx
function StarRating({ rating, max = 5, size = 'md', interactive = false, onChange }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  const handleClick = (index) => {
    if (interactive && onChange) {
      onChange(index + 1);
    }
  };

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(max)].map((_, i) => {
        let fill = false;
        if (i < fullStars) fill = true;
        else if (i === fullStars && hasHalfStar) fill = true;

        return (
          <button
            key={i}
            type="button"
            onClick={() => handleClick(i)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!interactive}
          >
            <svg
              className={`${sizes[size]} ${fill ? 'text-yellow-500 fill-current' : 'text-gray-300 fill-current'}`}
              viewBox="0 0 20 20"
            >
              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
            </svg>
          </button>
        );
      })}
      {!interactive && (
        <span className="text-sm font-medium text-gray-700 mr-1">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}

export default StarRating;