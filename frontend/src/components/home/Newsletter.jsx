// src/components/home/Newsletter.jsx
import { useState } from 'react';
import toast from 'react-hot-toast';

function Newsletter() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('لطفاً ایمیل خود را وارد کنید');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      toast.success('با موفقیت عضو شدید! 🎉');
      setEmail('');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="w-full py-16" style={{ backgroundColor: '#f5f0e8' }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto bg-[#800E2F]/10 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-800">عضویت در خبرنامه</h3>
          <p className="text-gray-500 mt-2 text-sm">
            اولین نفری باشید که از تخفیف‌ها و محصولات جدید با خبر می‌شوید.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mt-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ایمیل خود را وارد کنید..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#800E2F] bg-white"
              dir="rtl"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#800E2F] hover:bg-[#6B0A26] text-white rounded-xl font-bold transition shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {loading ? 'در حال ثبت...' : 'عضویت'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Newsletter;