// src/components/PageViewer.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import api from '@/services/api';
import Spinner from '@/components/shared/Spinner';
import DoubleBanner from '@/components/home/DoubleBanner';
import { usePageData } from '@/context/PageDataContext';
import { useProductSeo } from '@/context/ProductSeoContext';

const SITE_URL = 'https://aasgari.ir';

function PageViewer() {
  const { slug: paramSlug } = useParams();
  const location = useLocation();
  const { updateSeo, clearSeo } = useProductSeo();

  const slug = paramSlug || location.pathname.split('/').filter(Boolean).pop() || 'home';

  const initialData = usePageData();
  const initialPage = initialData.page || null;
  const initialSlug = initialData.slug || null;

  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(!initialPage);
  const [error, setError] = useState(null);
  const [doubleBanners, setDoubleBanners] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [openFaqs, setOpenFaqs] = useState({});

  // ✅ برای جلوگیری از حلقه: نگه‌داشتن slug قبلی که fetch کردیم
  const fetchedSlugRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      setIsLoggedIn(!!user);
    }
  }, []);

  // ✅ useEffect اصلاح‌شده — بدون حلقه
  useEffect(() => {
    // اگر قبلاً برای این slug داده گرفته‌ایم، کاری نکن
    if (fetchedSlugRef.current === slug) {
      return;
    }

    // اگر داده SSR مطابق slug فعلی است، از همان استفاده کن
    if (initialPage && initialSlug === slug) {
      setPage(initialPage);
      setError(null);
      setLoading(false);
      fetchedSlugRef.current = slug;
      return;
    }

    // وگرنه، داده را از API بگیر
    const fetchPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/pages/${slug}`);
        if (res.data.success) {
          setPage(res.data.data);
          setError(null);
          fetchedSlugRef.current = slug;
        } else {
          setError('صفحه مورد نظر یافت نشد');
        }
      } catch (err) {
        setError('صفحه مورد نظر یافت نشد');
        console.error('❌ [PageViewer] خطا در دریافت صفحه:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug, initialPage, initialSlug]);

  // ✅ به‌روزرسانی متا برای SPA navigation
  useEffect(() => {
    if (page) {
      const contentJson = page.content_json || {};
      updateSeo({
        title: page.seo_title || page.title || 'HomeMart',
        description: page.seo_description || contentJson.description || '',
        image: contentJson.imageUrl || null,
        pageUrl: `${SITE_URL}${location.pathname}`,
        isPage: true,
      });
    }

    return () => {
      clearSeo();
    };
  }, [page, updateSeo, clearSeo, location.pathname]);

  useEffect(() => {
    const fetchDoubleBanners = async () => {
      try {
        const res = await api.get('/banners');
        if (res.data.success) {
          const doubles = res.data.data.filter(b => b.position === 'double' && b.is_active);
          setDoubleBanners(doubles);
        }
      } catch (error) {
        console.error('❌ [PageViewer] خطا در دریافت بنرهای دوگانه:', error);
      }
    };
    fetchDoubleBanners();
  }, []);

  const fetchUnreadCount = async () => {
    if (!isLoggedIn) return;
    try {
      const res = await api.get('/tickets/unread-count');
      if (res.data.success) {
        setUnreadCount(res.data.data.unreadCount);
      }
    } catch (error) {
      console.error('❌ [PageViewer] خطا در دریافت تعداد:', error);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const handleTicketCountUpdate = (event) => {
      if (event.detail?.unreadCount !== undefined) {
        setUnreadCount(event.detail.unreadCount);
      }
    };
    window.addEventListener('ticket-count-update', handleTicketCountUpdate);
    return () => window.removeEventListener('ticket-count-update', handleTicketCountUpdate);
  }, []);

  const toggleFaq = (index) => {
    setOpenFaqs((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const renderSocialIcons = (htmlString) => {
    if (!htmlString) return null;

    const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>([^<]*)<\/a>/g;
    const matches = [];
    let match;
    while ((match = linkRegex.exec(htmlString)) !== null) {
      matches.push({ href: match[1], text: match[2].trim() });
    }

    if (matches.length === 0) {
      return <div dangerouslySetInnerHTML={{ __html: htmlString }} />;
    }

    const socialMap = {
      'فیس‌بوک': {
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        ),
        bgColor: 'bg-[#1877f2] hover:bg-[#0d65d9]',
      },
      'توییتر': {
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        ),
        bgColor: 'bg-[#1DA1F2] hover:bg-[#0d8bdb]',
      },
      'اینستاگرام': {
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
        ),
        bgColor: 'bg-gradient-to-br from-[#f09433] to-[#bc1888] hover:opacity-90',
      },
      default: {
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
        ),
        bgColor: 'bg-gray-500 hover:bg-gray-600',
      },
    };

    const getSocialInfo = (text) => {
      const lowerText = text.toLowerCase();
      if (lowerText.includes('فیس') || lowerText.includes('facebook'))
        return socialMap['فیس‌بوک'];
      if (lowerText.includes('توییتر') || lowerText.includes('twitter'))
        return socialMap['توییتر'];
      if (lowerText.includes('اینستا') || lowerText.includes('instagram'))
        return socialMap['اینستاگرام'];
      return socialMap.default;
    };

    return (
      <div className="flex flex-wrap gap-3">
        {matches.map((link, index) => {
          const social = getSocialInfo(link.text);
          return (
            <a
              key={index}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${social.bgColor} text-white p-2.5 rounded-full transition-all duration-200 hover:scale-110 hover:shadow-md flex items-center justify-center`}
              title={link.text}
            >
              {social.icon}
            </a>
          );
        })}
      </div>
    );
  };

  if (loading) return <Spinner />;
  if (error || !page) {
    return (
      <div className="min-h-screen bg-[#E8DCC8] flex items-center justify-center py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">صفحه یافت نشد</h2>
          <p className="text-gray-600">{error}</p>
          <Link to="/" className="inline-block mt-6 text-[#800E2F] hover:underline">
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    );
  }

  const contentJson = page.content_json || {};

  return (
    <div className="min-h-screen bg-[#E8DCC8] py-1">
      <div className="container mx-auto mt-8 px-4 pb-9 max-w-4xl">
        {slug === 'home' && (
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 relative inline-block pb-3">
              {contentJson.mainTitle || page.title || 'صفحه اصلی'}
              <span className="absolute -bottom-0 right-0 w-full h-1 rounded-full bg-[#800E2F]"></span>
            </h1>
            {contentJson.description && (
              <p className="text-gray-500 mt-0.5">{contentJson.description}</p>
            )}
          </div>
        )}

        {slug === 'contact' && (
          <div className="text-center mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 relative inline-block pb-3">
              {contentJson.mainTitle || page.title || 'تماس با ما'}
              <span className="absolute -bottom-0 right-0 w-full h-1 rounded-full bg-[#800E2F]"></span>
            </h1>
            {contentJson.description && (
              <p className="text-gray-500 mt-1">{contentJson.description}</p>
            )}
          </div>
        )}

        {slug === 'support' && (
          <div className="text-center -mt-6 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 relative inline-block pb-3">
              {contentJson.mainTitle || page.title || 'پشتیبانی'}
              <span className="absolute -bottom-0 right-0 w-full h-1 rounded-full bg-[#800E2F]"></span>
            </h1>
            {contentJson.description && (
              <p className="text-gray-500 mt-1">{contentJson.description}</p>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-8 pt-3">
          {slug === 'contact' && (
            <>
              {contentJson.address && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
                    اطلاعات تماس
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contentJson.address && (
                      <div className="bg-gray-50 hover:bg-gray-100 transition p-4 rounded-xl border border-gray-200 flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-[#800E2F]/10 rounded-full flex items-center justify-center text-[#800E2F]">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">آدرس</p>
                          <p className="font-medium text-gray-800">{contentJson.address}</p>
                        </div>
                      </div>
                    )}
                    {contentJson.phone && (
                      <div className="bg-gray-50 hover:bg-gray-100 transition p-4 rounded-xl border border-gray-200 flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-[#800E2F]/10 rounded-full flex items-center justify-center text-[#800E2F]">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">تلفن</p>
                          <p className="font-medium text-gray-800">{contentJson.phone}</p>
                        </div>
                      </div>
                    )}
                    {contentJson.email && (
                      <div className="bg-gray-50 hover:bg-gray-100 transition p-4 rounded-xl border border-gray-200 flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-[#800E2F]/10 rounded-full flex items-center justify-center text-[#800E2F]">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">ایمیل</p>
                          <p className="font-medium text-gray-800">{contentJson.email}</p>
                        </div>
                      </div>
                    )}
                    {contentJson.workingHours && (
                      <div className="bg-gray-50 hover:bg-gray-100 transition p-4 rounded-xl border border-gray-200 flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-[#800E2F]/10 rounded-full flex items-center justify-center text-[#800E2F]">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="9" strokeWidth={2} />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 7v5l3 3" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">ساعت کاری</p>
                          <p className="font-medium text-gray-800">{contentJson.workingHours}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {contentJson.socials && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">ما را در شبکه‌های اجتماعی دنبال کنید:</h3>
                  {renderSocialIcons(contentJson.socials)}
                </div>
              )}

              <div className="mb-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  {contentJson.formTitle || 'ارسال پیام'}
                </h3>
                {contentJson.formDescription && (
                  <p className="text-gray-600 text-sm mb-4">{contentJson.formDescription}</p>
                )}
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="نام و نام خانوادگی" className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#800E2F] bg-white" />
                    <input type="email" placeholder="ایمیل" className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#800E2F] bg-white" />
                  </div>
                  <input type="text" placeholder="موضوع" className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#800E2F] bg-white" />
                  <textarea rows="4" placeholder="پیام خود را بنویسید..." className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#800E2F] bg-white resize-y" />
                  <button type="submit" className="px-6 py-2.5 bg-[#800E2F] text-white rounded-lg font-medium hover:bg-[#6B0A26] transition">
                    ارسال پیام
                  </button>
                </form>
              </div>

              {contentJson.mapEmbed && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">موقعیت ما روی نقشه</h3>
                  <div className="rounded-xl overflow-hidden shadow-md">
                    <div dangerouslySetInnerHTML={{ __html: contentJson.mapEmbed }} />
                  </div>
                  {contentJson.address && (
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      📍 آدرس: {contentJson.address}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {slug === 'support' && (
            <>
              <div className="mt-4">
                <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link
                    to="/support/tickets"
                    className="flex flex-col items-center justify-center p-5 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition shadow-sm hover:shadow-md group"
                  >
                    <div className="text-3xl mb-2 group-hover:scale-110 transition">📝</div>
                    <h4 className="font-bold text-gray-800">ثبت تیکت جدید</h4>
                    <p className="text-xs text-gray-500 text-center mt-1">ارسال سوال یا مشکل جدید</p>
                  </Link>

                  <Link
                    to="/support/tickets"
                    className="relative flex flex-col items-center justify-center p-5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition shadow-sm hover:shadow-md group"
                  >
                    <div className="text-3xl mb-2 group-hover:scale-110 transition">📋</div>
                    <h4 className="font-bold text-gray-800">تیکت‌های من</h4>
                    <p className="text-xs text-gray-500 text-center mt-1">مشاهده تیکت‌های قبلی و پیگیری</p>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg ring-2 ring-white/30 animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                </div>

                {contentJson.faqs && contentJson.faqs.length > 0 && (
                  <>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
                      {contentJson.faqTitle || 'سوالات متداول'}
                    </h3>
                    <div className="space-y-3">
                      {contentJson.faqs.map((faq, index) => {
                        const isOpen = openFaqs[index] || false;
                        return (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
                          >
                            <button
                              onClick={() => toggleFaq(index)}
                              className="w-full px-5 py-4 text-right flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition font-bold text-gray-800 text-lg"
                            >
                              <span className="flex-1">{faq.question}</span>
                              <span className="flex-shrink-0 text-2xl transition-transform duration-300 ml-3">
                                {isOpen ? '−' : '+'}
                              </span>
                            </button>
                            <div
                              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                              }`}
                            >
                              <div className="p-5 bg-white text-gray-600 leading-relaxed border-t border-gray-100">
                                {faq.answer}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {!isLoggedIn && (
                  <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200 text-center">
                    <p className="text-sm text-gray-700">
                      برای ثبت تیکت یا مشاهده تیکت‌های قبلی، لطفاً
                      <Link to="/login" className="text-[#800E2F] font-bold hover:underline mx-1">وارد شوید</Link>
                      یا
                      <Link to="/register" className="text-[#800E2F] font-bold hover:underline mx-1">ثبت‌نام کنید</Link>.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {slug !== 'home' && slug !== 'contact' && slug !== 'support' && (
            <div className="prose max-w-none text-gray-700 leading-relaxed">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">{page.title}</h1>
              <div dangerouslySetInnerHTML={{ __html: page.content || '' }} />
            </div>
          )}
        </div>

        {doubleBanners.length >= 2 && (
          <div className="mt-8">
            <DoubleBanner banners={doubleBanners} />
          </div>
        )}
      </div>
    </div>
  );
}

export default PageViewer;