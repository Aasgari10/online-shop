// src/components/layout/Footer.jsx
import { Link } from 'react-router-dom';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      className="w-full hidden md:block" 
      style={{ 
        backgroundColor: '#810E2F',
        position: 'relative',
        zIndex: 1000,
      }}
    >
      <div className="border-b border-white/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-right">
              <h4 className="text-white font-bold text-lg">عضویت در خبرنامه</h4>
              <p className="text-white/70 text-sm mt-1">با عضویت در خبرنامه، از تخفیف‌های ویژه باخبر شوید</p>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <input
                type="email"
                placeholder="ایمیل خود را وارد کنید..."
                className="flex-1 md:w-72 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent transition"
              />
              <button className="px-6 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium transition duration-300 whitespace-nowrap border border-white/30">
                عضویت
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-0">
          <div className="text-center md:text-right px-0 md:px-6 py-4 md:py-4">
            <Link to="/" className="flex items-center justify-center md:justify-start gap-2 group">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-xl transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">HomeMart</span>
            </Link>
            <p className="text-white/70 text-sm mt-4 leading-relaxed max-w-xs mx-auto md:mx-0">
              فروشگاه تخصصی لوازم خانگی با بهترین کیفیت و قیمت‌های منصفانه. خرید آسان، تحویل سریع و ضمانت اصالت کالا.
            </p>
            <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition duration-300">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition duration-300">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.23 0H1.77C.792 0 0 .792 0 1.77v20.46C0 23.208.792 24 1.77 24h20.46c.978 0 1.77-.792 1.77-1.77V1.77C24 .792 23.208 0 22.23 0zM7.08 20.452H3.558V8.97H7.08v11.482zM5.318 7.394c-1.138 0-2.062-.924-2.062-2.062S4.18 3.27 5.318 3.27s2.062.924 2.062 2.062-.924 2.062-2.062 2.062zM20.452 20.452h-3.522v-5.594c0-1.334-.026-3.05-1.858-3.05-1.86 0-2.146 1.454-2.146 2.956v5.688h-3.522V8.97h3.38v1.568h.048c.47-.89 1.618-1.828 3.33-1.828 3.56 0 4.218 2.342 4.218 5.386v6.356z" />
                </svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition duration-300">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition duration-300">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="text-center md:text-right px-0 md:px-6 py-4 md:py-4 md:border-l md:border-r md:border-white/20">
            <h5 className="text-white font-bold text-lg mb-4 relative inline-block">
              لینک‌های سریع
              <span className="absolute -bottom-1 right-0 w-full h-0.5 bg-white/30 rounded-full"></span>
            </h5>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" className="text-white/70 hover:text-white transition duration-300">صفحه اصلی</Link></li>
              <li><Link to="/shop" className="text-white/70 hover:text-white transition duration-300">فروشگاه</Link></li>
              <li><Link to="/contact" className="text-white/70 hover:text-white transition duration-300">تماس با ما</Link></li>
              <li><Link to="/support" className="text-white/70 hover:text-white transition duration-300">پشتیبانی</Link></li>
            </ul>
          </div>

          <div className="text-center md:text-right px-0 md:px-6 py-4 md:py-4 md:border-l md:border-r md:border-white/20">
            <h5 className="text-white font-bold text-lg mb-4 relative inline-block">
              خدمات مشتریان
              <span className="absolute -bottom-1 right-0 w-full h-0.5 bg-white/30 rounded-full"></span>
            </h5>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/faq" className="text-white/70 hover:text-white transition duration-300">پرسش‌های متداول</Link></li>
              <li><Link to="/guarantee" className="text-white/70 hover:text-white transition duration-300">گارانتی و ضمانت</Link></li>
              <li><Link to="/returns" className="text-white/70 hover:text-white transition duration-300">بازگشت کالا</Link></li>
              <li><Link to="/shipping" className="text-white/70 hover:text-white transition duration-300">روش‌های ارسال</Link></li>
            </ul>
          </div>

          <div className="text-center md:text-right px-0 md:px-6 py-4 md:py-4">
            <h5 className="text-white font-bold text-lg mb-4 relative inline-block">
              تماس با ما
              <span className="absolute -bottom-1 right-0 w-full h-0.5 bg-white/30 rounded-full"></span>
            </h5>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-center md:justify-start gap-3 text-white/70">
                <svg className="w-5 h-5 text-white/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>تهران، خیابان اصلی، پلاک ۱۲۳</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3 text-white/70">
                <svg className="w-5 h-5 text-white/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>۰۲۱-۱۲۳۴-۵۶۷۸</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3 text-white/70">
                <svg className="w-5 h-5 text-white/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>info@homemart.com</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3 text-white/70">
                <svg className="w-5 h-5 text-white/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" strokeWidth={2} />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 7v5l3 3" />
                </svg>
                <span>شنبه تا پنجشنبه ۹ الی ۲۰</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <p className="text-white/50 order-2 sm:order-1">© {currentYear} HomeMart. تمامی حقوق محفوظ است.</p>
            <div className="flex items-center gap-4 order-1 sm:order-2">
              <Link to="/privacy" className="text-white/50 hover:text-white transition duration-300">حریم خصوصی</Link>
              <span className="text-white/30">|</span>
              <Link to="/terms" className="text-white/50 hover:text-white transition duration-300">قوانین و مقررات</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;