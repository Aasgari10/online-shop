// src/components/home/MobileHeroSection.jsx
import { Link } from 'react-router-dom';
import ImageWithFallback from '../shared/ImageWithFallback';

function MobileHeroSection({ data }) {
  // ✅ حتی اگر data null یا undefined باشد، از مقدار پیش‌فرض استفاده کن
  const imageUrl = data?.imageUrl || '/assets/phone-Djre6sB6.png';
  const mainTitle = data?.mainTitle || 'خانه‌ای زیباتر با ما';
  const subtitle = data?.subtitle || 'لوازم خانگی مدرن';
  const description = data?.description || 'دکوری شیک و کاربردی';

  return (
    <section 
      className="w-full overflow-hidden relative" 
      style={{ backgroundColor: '#FEFCF9' }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full bg-[#e8e0d0]/5 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-[250px] h-[250px] rounded-full bg-[#ddd5c5]/3 blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto sm:px-4 py-3 pb-2 pr-2 pl-2">
        <div className="flex flex-row-reverse items-center gap-4">
          <div className="flex-1 flex flex-col items-end text-right relative">
            <div 
              className="absolute top-0 left-0 w-[30%] h-[30%] border-t-[1px] border-l-[1px] border-[#800E2F]"
              style={{ borderTopColor: '#800E2F', borderLeftColor: '#800E2F' }}
            ></div>

            <p className="text-sm font-serif italic text-[#800E2F]/70 tracking-widest text-right w-full mt-4">
              اصالت و تنوع نزد ماست
            </p>

            <div className="flex items-stretch gap-2 justify-start w-full mt-1">
              <div 
                className="w-0.5 rounded-full flex-shrink-0 self-stretch" 
                style={{ backgroundColor: '#800E2F', minHeight: '1.8rem' }}
              ></div>
              <div className="flex flex-col items-end text-gray-650 leading-relaxed justify-center">
                <p className="text-sm text-right w-full font-weight-900">{subtitle}</p>
              </div>
            </div>

            <div className="flex items-stretch gap-2 justify-start w-full mt-0.5">
              <div 
                className="w-0.5 rounded-full flex-shrink-0 self-stretch" 
                style={{ backgroundColor: '#800E2F', minHeight: '1.8rem' }}
              ></div>
              <div className="flex flex-col items-end text-gray-650 leading-relaxed justify-center">
                <p className="text-sm text-right w-full font-weight-900">{description}</p>
              </div>
            </div>

            <div className="flex items-stretch gap-2 justify-start w-full mt-0.5">
              <div 
                className="w-0.5 rounded-full flex-shrink-0 self-stretch" 
                style={{ backgroundColor: '#800E2F', minHeight: '1.8rem' }}
              ></div>
              <div className="flex flex-col items-end text-gray-650 leading-relaxed justify-center">
                <p className="text-sm text-right w-full font-weight-900">قیمت مقرون و مناسب</p>
              </div>
            </div>

            <div className="flex flex-row gap-2 justify-start w-full mt-3">
              <Link 
                to="/products" 
                className="relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 overflow-hidden group flex-1 text-center" 
                style={{ backgroundColor: '#800E2F', color: '#fff' }}
              >
                <span className="relative z-10">محصولات</span>
                <span className="absolute inset-0 bg-white/10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 origin-center"></span>
              </Link>
              <Link 
                to="/shop" 
                className="relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 bg-white/80 backdrop-blur-sm border border-[#800E2F]/30 overflow-hidden group flex-1 text-center"
                style={{ color: '#800E2F' }}
              >
                <span className="relative z-10">فروشگاه</span>
                <span className="absolute inset-0 bg-[#800E2F]/5 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 origin-center"></span>
              </Link>
            </div>
          </div>

          <div className="flex justify-end flex-shrink-0">
            <div className="relative w-[170px] h-[180px] overflow-hidden">
              <ImageWithFallback
                src={imageUrl}
                alt="لوازم خانگی"
                className="w-full h-full object-cover object-center"
                fallbackSrc="/assets/phone-Djre6sB6.png"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MobileHeroSection;