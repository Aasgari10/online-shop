// src/components/contact/ContactPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Spinner from '../shared/Spinner';
import toast from 'react-hot-toast';

const PRIMARY_COLOR = '#800E2F';
const SECONDARY_COLOR = '#6B0A26';
const BG_COLOR = '#E8DCC8';

function ContactPage() {
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
        console.error('❌ [ContactPage] خطا:', err);
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
      <div className={`min-h-screen bg-[${BG_COLOR}] flex items-center justify-center py-16`}>
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">خطا</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* متا تگ‌های اختصاصی با React 19 */}
      <title>تماس با ما | فروشگاه اینترنتی HomeMart</title>
      <meta name="description" content="با ما در ارتباط باشید. پاسخگوی سوالات و نظرات شما هستیم." />
      <meta property="og:title" content="تماس با ما | HomeMart" />
      <meta property="og:description" content="با ما در ارتباط باشید. پاسخگوی سوالات و نظرات شما هستیم." />

      <div className={`min-h-screen bg-[${BG_COLOR}] py-0`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center pt-4 mb-3">
            <h1 className="text-4xl md:text-3xl font-bold text-gray-800 relative inline-block">
              {content.mainTitle || 'تماس با ما'}
              <span className={`absolute -bottom-3 right-0 w-full h-1 rounded-full bg-[${PRIMARY_COLOR}]`}></span>
            </h1>
            <p className="text-gray-600 mt-4 text-lg max-w-2xl mx-auto">
              {content.description || 'خوشحال می‌شویم نظرات، پیشنهادات و سوالات شما را بشنویم. با ما در ارتباط باشید.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 order-2 lg:order-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-800 border-b pb-3 mb-4 flex items-center gap-2">
                  <svg className={`w-6 h-6 text-[${PRIMARY_COLOR}]`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  اطلاعات تماس
                </h2>

                <div className="space-y-4">
                  {content.address && (
                    <div className="flex items-start gap-3 text-gray-700">
                      <svg className={`w-5 h-5 text-[${PRIMARY_COLOR}] mt-0.5 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="font-medium">آدرس</p>
                        <p className="text-sm text-gray-500">{content.address}</p>
                      </div>
                    </div>
                  )}

                  {content.phone && (
                    <div className="flex items-start gap-3 text-gray-700">
                      <svg className={`w-5 h-5 text-[${PRIMARY_COLOR}] mt-0.5 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div>
                        <p className="font-medium">تلفن</p>
                        <p className="text-sm text-gray-500">{content.phone}</p>
                      </div>
                    </div>
                  )}

                  {content.email && (
                    <div className="flex items-start gap-3 text-gray-700">
                      <svg className={`w-5 h-5 text-[${PRIMARY_COLOR}] mt-0.5 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="font-medium">ایمیل</p>
                        <p className="text-sm text-gray-500">{content.email}</p>
                      </div>
                    </div>
                  )}

                  {content.workingHours && (
                    <div className="flex items-start gap-3 text-gray-700">
                      <svg className={`w-5 h-5 text-[${PRIMARY_COLOR}] mt-0.5 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="9" strokeWidth={2} />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 7v5l3 3" />
                      </svg>
                      <div>
                        <p className="font-medium">ساعت کاری</p>
                        <p className="text-sm text-gray-500">{content.workingHours}</p>
                      </div>
                    </div>
                  )}
                </div>

                {content.socials && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-3">ما را در شبکه‌های اجتماعی دنبال کنید:</p>
                    <div className="flex gap-3" dangerouslySetInnerHTML={{ __html: content.socials }} />
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 order-1 lg:order-2">
              <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <svg className={`w-6 h-6 text-[${PRIMARY_COLOR}]`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {content.formTitle || 'ارسال پیام'}
                </h2>

                {content.formDescription && (
                  <p className="text-gray-600 mb-6">{content.formDescription}</p>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      نام و نام خانوادگی *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[${PRIMARY_COLOR}] focus:border-transparent transition bg-gray-50/50`}
                      placeholder="نام خود را وارد کنید"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      ایمیل *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[${PRIMARY_COLOR}] focus:border-transparent transition bg-gray-50/50`}
                      placeholder="ایمیل خود را وارد کنید"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      موضوع
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[${PRIMARY_COLOR}] focus:border-transparent transition bg-gray-50/50`}
                      placeholder="موضوع پیام"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      پیام *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows="5"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[${PRIMARY_COLOR}] focus:border-transparent transition bg-gray-50/50 resize-y`}
                      placeholder="پیام خود را بنویسید..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={formLoading}
                    className={`w-full py-3 rounded-lg text-white font-bold text-lg transition shadow-md ${
                      formLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : `bg-[${PRIMARY_COLOR}] hover:bg-[${SECONDARY_COLOR}] hover:shadow-lg transform hover:-translate-y-0.5`
                    }`}
                  >
                    {formLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
            </div>
          </div>

          {content.mapEmbed && (
            <div className="mt-12 bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className={`p-4 bg-[${PRIMARY_COLOR}/5] border-b border-gray-200 flex items-center justify-between`}>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <svg className={`w-5 h-5 text-[${PRIMARY_COLOR}]`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  موقعیت ما روی نقشه
                </h3>
                <a
                  href={content.mapLink || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-xs text-[${PRIMARY_COLOR}] hover:text-[${SECONDARY_COLOR}] font-medium flex items-center gap-1`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  دریافت مسیر
                </a>
              </div>
              <div className="w-full h-[400px] md:h-[450px] bg-gray-200">
                <div dangerouslySetInnerHTML={{ __html: content.mapEmbed }} />
              </div>
              {content.address && (
                <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-500">
                    📍 <span className="font-medium">آدرس:</span> {content.address}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="text-center mt-8">
            <Link to="/" className={`inline-flex items-center gap-2 text-[${PRIMARY_COLOR}] hover:text-[${SECONDARY_COLOR}] font-medium transition`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default ContactPage;