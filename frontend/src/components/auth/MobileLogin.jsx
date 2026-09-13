// src/components/auth/MobileLogin.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Spinner from '../shared/Spinner';

function MobileLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.email || !formData.password) {
      setError('لطفاً ایمیل و رمز عبور را وارد کنید');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/login', formData);
      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        toast.success(`خوش آمدید ${response.data.user.name}!`);
        navigate('/');
        window.location.reload();
      }
    } catch (error) {
      if (error.response && error.response.data) setError(error.response.data.message);
      else setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E8DCC8] pl-1 pr-1 pb-0">
      {/* ===== هدر (بدون دکمه برگشت) ===== */}
      <div className="sticky top-0 z-30 bg-[#E8DCC8] px-4 py-0 flex items-center pb-0 justify-center border-b border-gray-200/60">
        <h1 className="text-xl font-bold text-gray-800 relative inline-block pb-2">
          ورود
          <span className="absolute -bottom-0 right-0 w-full h-1 rounded-full bg-[#800E2F]"></span>
        </h1>
      </div>

      {/* ===== فرم ===== */}
      <div className="mx-1 mt-1 pb-3 bg-white rounded-2xl shadow-sm border border-gray-200/60 p-3">
        <div className="text-center mb-5">
          <div className="w-16 h-16 mx-auto bg-[#800E2F]/10 rounded-full flex items-center justify-center mb-2">
            <svg className="w-8 h-8 text-[#800E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">خوش آمدید! لطفاً وارد حساب خود شوید</p>
        </div>

        {error && (
          <div className="bg-red-50 border-r-4 border-red-500 text-red-700 px-3 py-2.5 rounded-lg mb-4 flex items-center gap-2 text-sm">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">ایمیل</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] focus:border-transparent bg-gray-50/50 text-sm"
                placeholder="example@email.com"
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">رمز عبور</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800E2F] focus:border-transparent bg-gray-50/50 text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-white font-bold text-base transition duration-300 shadow-md flex items-center justify-center gap-2 ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#800E2F] hover:bg-[#6B0A26] active:scale-95'
            }`}
          >
            {loading ? <Spinner size="sm" /> : 'ورود'}
          </button>
        </form>

        <div className="mt-5 text-center space-y-3">
          <p className="text-sm text-gray-600">
            حساب کاربری ندارید؟{' '}
            <Link to="/register" className="text-[#800E2F] hover:underline font-medium">
              ثبت‌نام کنید
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default MobileLogin;