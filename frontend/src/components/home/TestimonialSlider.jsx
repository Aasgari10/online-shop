// src/components/home/TestimonialSlider.jsx
function TestimonialSlider({ testimonials, currentIndex, onIndexChange }) {
  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  const goToSlide = (index) => onIndexChange(index);
  const prevSlide = () => onIndexChange(currentIndex === 0 ? testimonials.length - 1 : currentIndex - 1);
  const nextSlide = () => onIndexChange((currentIndex + 1) % testimonials.length);

  return (
    <div className="w-full py-16" style={{ backgroundColor: '#f5f0e8' }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 relative inline-block">
            <span className="text-[#800E2F]">نظرات</span> مشتریان
            <span className="absolute -bottom-2 right-0 w-full h-0.5 rounded-full" style={{ backgroundColor: '#b3808a' }}></span>
          </h2>
          <p className="text-gray-400 text-sm mt-2">نظرات خریداران واقعی</p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100/50 p-6 md:p-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={`transition-all duration-500 ease-in-out ${index === currentIndex ? 'block' : 'hidden'}`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#800E2F]/20 to-[#b3808a]/10 flex items-center justify-center text-3xl font-bold text-[#800E2F] mb-4 shadow-md">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="mb-3">
                    <h4 className="text-lg font-bold text-gray-800">{testimonial.name}</h4>
                    <span className="text-xs text-gray-400">{testimonial.date}</span>
                  </div>
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300 fill-current'}`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                  <div className="relative">
                    <svg className="absolute -top-2 -right-2 w-8 h-8 text-gray-200/50" fill="currentColor" viewBox="0 0 32 32">
                      <path d="M10 8H6C4.9 8 4 8.9 4 10v6c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm16 0h-4c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z" />
                    </svg>
                    <p className="text-gray-600 text-base leading-relaxed max-w-2xl mx-auto px-4 py-2">
                      {testimonial.comment}
                    </p>
                  </div>
                  <div className="mt-4 inline-block px-4 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                    <span className="text-xs text-gray-500">خرید: {testimonial.product}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 mt-6">
            <button onClick={prevSlide} className="bg-white/80 hover:bg-white text-gray-600 w-10 h-10 rounded-full shadow-md flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg border border-gray-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-[#800E2F] w-8' : 'bg-gray-300 hover:bg-gray-400 w-2'}`}
                />
              ))}
            </div>
            <button onClick={nextSlide} className="bg-white/80 hover:bg-white text-gray-600 w-10 h-10 rounded-full shadow-md flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg border border-gray-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestimonialSlider;