// src/components/layout/MobileFooter.jsx
import { Link } from 'react-router-dom';

function MobileFooter({ showBottomNav = false }) {
  return (
    <footer 
      className={`w-full ${showBottomNav ? 'pb-16' : ''}`} 
      style={{ backgroundColor: '#810E2F' }}
    >
      {/* ===== بخش خبرنامه + لوگو ===== */}
      <div className="border-b border-white/20 px-2 py-4">
        <div className="flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white">HomeMart</span>
          </div>
          <div className="text-left flex-1"></div>
        </div>
        <div className="flex w-full max-w-sm gap-2 mt-3 justify-end">
          <input
            type="email"
            placeholder="ایمیل خود را وارد کنید..."
            className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
          />
          <button className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition whitespace-nowrap border border-white/30">
            عضویت
          </button>
        </div>
      </div>

      {/* ===== محتوای اصلی فوتر ===== */}
      <div className="py-3">
        {/* اطلاعات تماس */}
        <div className="flex flex-col gap-2 text-xs border-b border-white/20 -mt-3 p-2 mb-3">
          <div className="flex items-center justify-start gap-2 text-white/60">
            <span>تهران، خیابان اصلی، پلاک ۱۲۳</span>
            <svg className="w-3.5 h-3.5 text-white/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex items-center justify-start gap-2 text-white/60">
            <span>۰۲۱-۱۲۳۴-۵۶۷۸</span>
            <svg className="w-3.5 h-3.5 text-white/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <div className="flex items-center justify-start gap-2 text-white/60 -mt-1">
            <span>info@homemart.com</span>
            <svg className="w-3.5 h-3.5 text-white/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* شبکه‌های اجتماعی */}
        <div className="flex items-center justify-center gap-4 pb-3">
          <a href="#" className="text-white/50 hover:text-white transition">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
            </svg>
          </a>
          <a href="#" className="text-white/50 hover:text-white transition">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.23 0H1.77C.792 0 0 .792 0 1.77v20.46C0 23.208.792 24 1.77 24h20.46c.978 0 1.77-.792 1.77-1.77V1.77C24 .792 23.208 0 22.23 0zM7.08 20.452H3.558V8.97H7.08v11.482zM5.318 7.394c-1.138 0-2.062-.924-2.062-2.062S4.18 3.27 5.318 3.27s2.062.924 2.062 2.062-.924 2.062-2.062 2.062zM20.452 20.452h-3.522v-5.594c0-1.334-.026-3.05-1.858-3.05-1.86 0-2.146 1.454-2.146 2.956v5.688h-3.522V8.97h3.38v1.568h.048c.47-.89 1.618-1.828 3.33-1.828 3.56 0 4.218 2.342 4.218 5.386v6.356z" />
            </svg>
          </a>
          <a href="#" className="text-white/50 hover:text-white transition">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          </a>
          <a href="#" className="text-white/50 hover:text-white transition">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}

export default MobileFooter;