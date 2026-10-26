import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }
    if (new TextEncoder().encode(password).length > 72) {
      setError('يجب ألا يتجاوز طول كلمة المرور 72 بايتًا.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim(),
        password
      });
      login(data.token, data.user);
      navigate('/student/dashboard', { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.status === 409
          ? 'هذا البريد الإلكتروني مسجل بالفعل.'
          : requestError.response?.data?.error || 'تعذر إنشاء الحساب. تحقق من البيانات وحاول مرة أخرى.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-offwhite px-4 py-10">
      <section className="w-full max-w-md rounded-3xl bg-white p-7 shadow-panel sm:p-9">
        <Link className="text-sm font-semibold text-primary hover:underline" to="/">SmartQuiz AI</Link>
        <p className="mt-7 font-bold text-teal-700">ابدأ رحلتك التعليمية</p>
        <h1 className="mt-2 text-3xl font-extrabold text-navy">إنشاء حساب طالب</h1>
        <p className="mt-2 leading-7 text-slate-600">أنشئ حسابك للبدء في اختبار مكونات الحاسوب.</p>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block font-semibold text-slate-700">الاسم</span>
            <input
              autoComplete="name"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100"
              maxLength={100}
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </label>
          <label className="block">
            <span className="mb-2 block font-semibold text-slate-700">البريد الإلكتروني</span>
            <input
              autoComplete="email"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="block">
            <span className="mb-2 block font-semibold text-slate-700">كلمة المرور</span>
            <input
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <label className="block">
            <span className="mb-2 block font-semibold text-slate-700">تأكيد كلمة المرور</span>
            <input
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100"
              minLength={8}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              type="password"
              value={confirmPassword}
            />
          </label>

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}

          <button
            className="w-full rounded-xl bg-navy px-5 py-3 font-bold text-white transition hover:bg-blue-900 disabled:cursor-wait disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting ? 'جارٍ إنشاء الحساب...' : 'إنشاء حساب'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          لديك حساب بالفعل؟ <Link className="font-bold text-primary hover:underline" to="/login">تسجيل الدخول</Link>
        </p>
      </section>
    </main>
  );
}
