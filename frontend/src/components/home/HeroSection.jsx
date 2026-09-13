// src/components/home/HeroSection.jsx
import { Link } from 'react-router-dom';
import ImageWithFallback from '../shared/ImageWithFallback';

function HeroSection({ data }) {
  const {
    mainTitle = 'خانه‌ای زیباتر با ما',
    subtitle = 'لوازم خانگی مدرن',
    description = 'دکوری شیک و کاربردی',
    imageUrl = '/src/assets/phone.png'   // ← phone.png در لوکال
  } = data || {};

  return (
    <section
      className="w-full overflow-hidden relative hidden md:block"
      style={{ backgroundColor: '#FEFCF9' }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-[#e8e0d0]/5 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#ddd5c5]/3 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-white/15 blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 md:pt-0 pb-0">
        <div className="flex flex-col-reverse md:flex-row-reverse items-center gap-6 md:gap-18">
          <div className="w-full md:w-1/2 flex ml-11 flex-col items-end text-right space-y-4 md:space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-px bg-[#800E2F]/30"></div>
              <p className="text-sm sm:text-base font-serif italic text-[#800E2F]/70 tracking-widest">
                {description}
              </p>
              <div className="w-8 h-px bg-[#800E2F]/30"></div>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 leading-tight w-full text-right">
              {mainTitle}
            </h1>

            <div className="flex items-stretch gap-3 justify-start w-full">
              <div className="w-1 rounded-full flex-shrink-0 self-stretch" style={{ backgroundColor: '#800E2F', minHeight: '3rem' }}></div>
              <div className="flex flex-col items-end text-gray-600 leading-relaxed justify-center">
                <p className="text-base sm:text-lg text-right w-full font-light">{subtitle}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-start w-full pt-1">
              <Link
                to="/products"
                className="relative px-8 py-3 text-white text-base font-medium rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 overflow-hidden group"
                style={{ backgroundColor: '#800E2F' }}
              >
                <span className="relative z-10">مشاهده محصولات</span>
                <span className="absolute inset-0 bg-white/10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 origin-center"></span>
              </Link>
              <Link
                to="/shop"
                className="relative px-8 py-3 text-[#800E2F] text-base font-medium rounded-full transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 bg-white/80 backdrop-blur-sm border-2 border-[#800E2F]/30 overflow-hidden group"
              >
                <span className="relative z-10">فروشگاه</span>
                <span className="absolute inset-0 bg-[#800E2F]/5 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 origin-center"></span>
              </Link>
            </div>
          </div>

          <div className="w-full ml-14 mt-6 md:w-[35.5%] flex justify-end">
            <div className="relative w-full">
              <ImageWithFallback
                src={imageUrl.startsWith('http') ? imageUrl : imageUrl}
                alt="لوازم خانگی"
                className="w-full h-auto rounded-2xl object-cover"
fallbackSrc="/assets/phone-Djre6sB6.png"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;