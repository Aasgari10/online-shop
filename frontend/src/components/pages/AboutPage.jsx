// src/components/pages/AboutPage.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import Spinner from '../shared/Spinner';

function StaticPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/pages/${slug}`);
        if (res.data.success) {
          setPage(res.data.data);
        } else {
          setError('صفحه یافت نشد');
        }
      } catch (err) {
        setError('خطا در دریافت صفحه');
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug]);

  if (loading) return <Spinner />;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
  if (!page) return <div className="text-center py-10">صفحه یافت نشد</div>;

  return (
    <div className="min-h-screen bg-[#E8DCC8] py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">{page.title}</h1>
          <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
        </div>
      </div>
    </div>
  );
}

export default StaticPage;