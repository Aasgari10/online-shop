// src/components/support/MobileSupportPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Spinner from '../shared/Spinner';
function MobileSupportPage() {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ بارگذاری user فقط در کلاینت
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      setIsLoggedIn(!!user);
    }
  }, []);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await api.get('/pages/support');
        if (res.data.success) {
          setPageData(res.data.data);
        } else {
          setError('خطا در دریافت اطلاعات صفحه');
        }
      } catch (err) {
        console.error('❌ [MobileSupportPage] خطا:', err);
        setError('خطا در ارتباط با سرور');
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, []);

  const content = pageData?.content_json || {};
  const faqs = content.faqs || [];
  const mainTitle = content.mainTitle || 'پشتیبانی';
  const faqTitle = content.faqTitle || 'سوالات متداول';

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  if (loading) return <Spinner />;
  if (error) {
    return (
      <div className="bg-[#E8DCC8] flex items-center justify-center py-16">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm text-center">
          <div className="text-red-500 text-4xl mb-3">⚠️</div>
          <h2 className="text-lg font-bold text-gray-800">خطا</h2>
          <p className="text-gray-600 text-sm">{error}</p>
          <Link to="/" className="inline-block mt-4 text-[#800E2F] text-sm hover:underline">
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <title>{pageData?.seo_title || 'پشتیبانی | HomeMart'}</title>
        <meta name="description" content={pageData?.seo_description || 'صفحه پشتیبانی فروشگاه HomeMart'} />

      <div className="bg-[#E8DCC8] py-1 px-1">
        <div className="max-w-lg mx-auto mb-3">
          <div className="text-center mb-3">
            <h1 className="text-xl font-bold text-gray-800 relative inline-block pb-2">
              {mainTitle}
              <span className="absolute -bottom-0 right-0 w-full h-1 rounded-full bg-[#800E2F]"></span>
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <Link
              to="/support/tickets"
              className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:shadow-md transition"
            >
              <svg className="w-6 h-6 text-[#800E2F] mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-[11px] font-bold text-gray-800">ثبت تیکت جدید</span>
              <span className="text-[8px] text-gray-400">ارسال سوال یا مشکل</span>
            </Link>

            <Link
              to="/support/tickets"
              className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:shadow-md transition"
            >
              <svg className="w-6 h-6 text-[#800E2F] mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="text-[11px] font-bold text-gray-800">تیکت‌های من</span>
              <span className="text-[8px] text-gray-400">مشاهده و پیگیری</span>
            </Link>
          </div>

          {faqs.length > 0 && (
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-2">
              <h2 className="text-xs font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {faqTitle}
              </h2>

              <div className="space-y-2">
                {faqs.map((faq, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full flex items-center justify-between px-3 py-2 text-right bg-gray-50/50 hover:bg-gray-100/70 transition"
                    >
                      <span className="text-[11px] font-medium text-gray-800 flex-1 ml-2">{faq.question}</span>
                      <svg
                        className={`w-4 h-4 text-[#800E2F] transition-transform duration-300 flex-shrink-0 ${
                          openFaq === index ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        openFaq === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="px-3 py-2 text-[10px] text-gray-600 leading-relaxed border-t border-gray-100 bg-white">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLoggedIn && (
            <div className="mt-4 mb-3 p-2 bg-yellow-50 rounded-xl border border-yellow-200 text-center">
              <p className="text-[10px] text-gray-700">
                برای ثبت تیکت یا مشاهده تیکت‌های قبلی، لطفاً
                <Link to="/login" className="text-[#800E2F] font-bold hover:underline mx-1">وارد شوید</Link>
                یا
                <Link to="/register" className="text-[#800E2F] font-bold hover:underline mx-1">ثبت‌نام کنید</Link>.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default MobileSupportPage;