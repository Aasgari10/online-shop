// src/components/pages/StaticPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Spinner from '../shared/Spinner';
import DOMPurify from 'dompurify';

function StaticPage({ slug: propSlug }) {
  const { slug: paramSlug } = useParams();
  const slug = propSlug || paramSlug;
  
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) {
        setError('شناسه صفحه نامعتبر است');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const res = await api.get(`/pages/${slug}`);
        if (res.data.success) {
          setPage(res.data.data);
        } else {
          setError('صفحه یافت نشد');
        }
      } catch (err) {
        console.error('❌ خطا در دریافت صفحه:', err);
        setError('خطا در دریافت اطلاعات صفحه');
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug]);

  const createMarkup = (html) => {
    return { __html: DOMPurify.sanitize(html) };
  };

  if (loading) return <Spinner />;
  
  if (error) {
    return (
      <div className="min-h-[60vh] bg-[#E8DCC8] flex items-center justify-center py-16">
        <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md mx-auto text-center">
          <div className="w-20 h-20 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">خطا</h2>
          <p className="text-gray-500">{error}</p>
          <Link to="/" className="inline-block mt-6 text-[#800E2F] hover:underline font-medium">
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-[60vh] bg-[#E8DCC8] flex items-center justify-center py-16">
        <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md mx-auto text-center">
          <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">صفحه یافت نشد</h2>
          <p className="text-gray-500">صفحه مورد نظر شما وجود ندارد.</p>
          <Link to="/" className="inline-block mt-6 text-[#800E2F] hover:underline font-medium">
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8DCC8] py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-[#800E2F] hover:text-[#6B0A26] font-medium transition group">
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            بازگشت به صفحه اصلی
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 md:p-8 lg:p-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 border-b border-gray-200 pb-4">
              {page.title}
            </h1>
            <div 
              className="prose prose-lg prose-gray max-w-none [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-800 [&_h1]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-800 [&_h2]:mt-5 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-gray-800 [&_p]:text-gray-600 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pr-8 [&_ol]:list-decimal [&_ol]:pr-8 [&_li]:text-gray-600 [&_a]:text-[#800E2F] [&_a]:hover:underline [&_img]:rounded-xl [&_img]:shadow-md [&_blockquote]:border-r-4 [&_blockquote]:border-[#800E2F] [&_blockquote]:pr-4 [&_blockquote]:text-gray-600 [&_blockquote]:bg-gray-50 [&_blockquote]:p-4 [&_blockquote]:rounded-lg"
              dangerouslySetInnerHTML={createMarkup(page.content)}
            />
          </div>
        </div>

        {page.meta_title && (
          <div className="mt-4 text-xs text-gray-400 text-center border-t border-gray-200 pt-4">
            <span className="font-medium">عنوان سئو:</span> {page.meta_title}
            {page.meta_description && (
              <span className="block mt-1">{page.meta_description}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default StaticPage;