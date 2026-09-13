// src/components/contact/MobileContactPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Spinner from '../shared/Spinner';
import toast from 'react-hot-toast';

function MobileContactPage() {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        const res = await api.get('/pages/contact');
        if (res.data.success) {
          setPageData(res.data.data);
        } else {
          setError('خطا در دریافت اطلاعات صفحه');
        }
      } catch (err) {
        console.error('❌ [MobileContactPage] خطا:', err);
        setError('خطا در ارتباط با سرور');
      } finally {
        setLoading(false);
      }
    };
    fetchPageData();
  }, []);

  const content = pageData?.content_json || {};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormLoading(true);
    setTimeout(() => {
      toast.success('پیام شما با موفقیت ارسال شد!');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setFormLoading(false);
    }, 1500);
  };

  if (loading) return <Spinner />;
  if (error) {
    return (
      <div className="min-h-screen bg-[#E8DCC8] flex items-center justify-center py-16">
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
    <div className="min-h-screen bg-[#E8DCC8] py-1 px-1">
      <div className="max-w-lg mx-auto">
        {/* ===== هدر ===== */}
        <div className="text-center mb-2">
          <h1 className="text-xl font-bold text-gray-800 relative inline-block pb-2">
            {content.mainTitle || 'تماس با ما'}
            <span className="absolute -bottom-0 right-0 w-full h-1 rounded-full bg-[#800E2F]"></span>
          </h1>
        </div>

        {/* ===== باکس اطلاعات تماس ===== */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-2 py-0">
          <div className="divide-y divide-gray-100">
            {content.address && (
              <div className="flex items-center gap-1.5 py-2.5">
                <svg className="w-4 h-4 text-[#800E2F] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-[8px] text-gray-400">آدرس</p>
                  <p className="text-[11px] font-medium text-gray-800 leading-tight">{content.address}</p>
                </div>
              </div>
            )}

            {content.phone && (
              <div className="flex items-center gap-1.5 py-2.5">
                <svg className="w-4 h-4 text-[#800E2F] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div className="flex-1">
                  <p className="text-[8px] text-gray-400">تلفن</p>
                  <p className="text-[11px] font-medium text-gray-800">{content.phone}</p>
                </div>
              </div>
            )}

            {content.email && (
              <div className="flex items-center gap-1.5 py-2.5">
                <svg className="w-4 h-4 text-[#800E2F] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div className="flex-1">
                  <p className="text-[8px] text-gray-400">ایمیل</p>
                  <p className="text-[11px] font-medium text-gray-800">{content.email}</p>
                </div>
              </div>
            )}

            {content.workingHours && (
              <div className="flex items-center gap-1.5 py-2.5">
                <svg className="w-4 h-4 text-[#800E2F] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <circle cx="12" cy="12" r="9" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
                </svg>
                <div className="flex-1">
                  <p className="text-[8px] text-gray-400">ساعت کاری</p>
                  <p className="text-[11px] font-medium text-gray-800">{content.workingHours}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== فرم تماس ===== */}
        <div className="bg-white rounded-2xl shadow-md p-2 pt-3 border mt-2 border-gray-100 mb-2">
          <h2 className="text-xs font-bold text-gray-800 mb-3 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {content.formTitle || 'ارسال پیام'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">نام و نام خانوادگی *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-gray-50/50"
                placeholder="نام خود را وارد کنید"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">ایمیل *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-gray-50/50"
                placeholder="ایمیل خود را وارد کنید"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">موضوع</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-gray-50/50"
                placeholder="موضوع پیام"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">پیام *</label>
              <textarea
                name="message"
                rows="3"
                value={formData.message}
                onChange={handleChange}
                required
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-gray-50/50 resize-y"
                placeholder="پیام خود را بنویسید..."
              />
            </div>
            <button
              type="submit"
              disabled={formLoading}
              className="w-full py-2 bg-[#800E2F] hover:bg-[#6B0A26] text-white rounded-lg font-bold text-xs transition shadow-md disabled:opacity-50"
            >
              {formLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  در حال ارسال...
                </span>
              ) : (
                'ارسال پیام'
              )}
            </button>
          </form>
        </div>

        {/* ===== نقشه ===== */}
        {content.mapEmbed && (
          <div className="bg-white mb-2 rounded-2xl shadow-md overflow-hidden border border-gray-100">
            <div className="p-2.5 bg-[#800E2F]/5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-[11px] font-bold text-gray-800 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                موقعیت ما روی نقشه
              </h3>
              {content.mapLink && (
                <a href={content.mapLink} target="_blank" rel="noopener noreferrer" className="text-[9px] text-[#800E2F] hover:underline">
                  دریافت مسیر
                </a>
              )}
            </div>
            <div className="w-full h-[180px] bg-gray-200 overflow-hidden">
              <div dangerouslySetInnerHTML={{ __html: content.mapEmbed }} />
            </div>
            {content.address && (
              <div className="p-1.5 bg-gray-50 border-t border-gray-100 text-center">
                <p className="text-[10px] text-gray-500">📍 {content.address}</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default MobileContactPage;