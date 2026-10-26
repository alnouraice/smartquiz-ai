import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/student/dashboard')
      .then(({ data }) => setDashboard(data))
      .catch((requestError) => {
        setError(requestError.response?.data?.error || 'تعذر تحميل بيانات لوحة الطالب.');
      });
  }, []);

  if (error) return <p className="rounded-xl bg-red-50 p-5 text-red-800" role="alert">{error}</p>;
  if (!dashboard) return <p className="text-slate-600" role="status">جارٍ تحميل لوحة الطالب...</p>;

  return (
    <div className="space-y-8">
      <header className="rounded-3xl bg-gradient-to-bl from-navy to-blue-800 p-7 text-white shadow-panel sm:p-10">
        <p className="font-semibold text-teal-200">مساحة التعلّم الذكي</p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">مرحبًا، {user?.name}</h1>
        <p className="mt-3 max-w-2xl leading-7 text-blue-100">
          كل خطوة تقرّبك من إتقان مكونات الحاسوب. اختر وحدة وابدأ التعلّم وفق وتيرتك.
        </p>
      </header>

      <section aria-label="ملخص التقدم" className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl bg-white p-6 shadow-panel">
          <p className="text-sm font-semibold text-slate-500">إجمالي المحاولات</p>
          <p className="mt-3 text-3xl font-extrabold text-navy">{dashboard.totalAttempts}</p>
        </article>
        <article className="rounded-2xl bg-white p-6 shadow-panel">
          <p className="text-sm font-semibold text-slate-500">أعلى درجة</p>
          <p className="mt-3 text-3xl font-extrabold text-navy">{dashboard.highestScore}%</p>
        </article>
        <article className="rounded-2xl bg-white p-6 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-500">التقدم في الوحدات</p>
            <span className="font-bold text-teal-700">{dashboard.progress}%</span>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            أكملت {dashboard.practicedUnits} من {dashboard.totalUnits} وحدات
          </p>
          <div
            aria-label={`التقدم ${dashboard.progress}%`}
            aria-valuemax="100"
            aria-valuemin="0"
            aria-valuenow={dashboard.progress}
            className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
          >
            <div className="h-full rounded-full bg-turquoise transition-all" style={{ width: `${dashboard.progress}%` }} />
          </div>
        </article>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-teal-700">مقرر التعلّم</p>
          <h2 className="mt-1 text-2xl font-extrabold text-navy">مكونات الحاسوب</h2>
          <p className="mt-2 text-slate-600">اختر إحدى الوحدات التدريبية لبدء اختبار تفاعلي.</p>
        </div>

        {dashboard.units.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-slate-600 shadow-panel">
            لا توجد وحدات أو أسئلة متاحة حاليًا.
          </p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {dashboard.units.map((unit, index) => (
              <article className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-panel" key={unit.unitName}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-teal-700">الوحدة {index + 1}</p>
                    <h3 className="mt-2 text-xl font-bold leading-8 text-navy">{unit.unitName}</h3>
                  </div>
                  <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal-50 text-xl text-teal-800">◈</span>
                </div>
                <div className="mt-5 flex items-center gap-3 text-sm text-slate-500">
                  <span>{unit.questionCount} سؤالًا</span>
                  <span aria-hidden="true">·</span>
                  <span>{unit.attempts} محاولات</span>
                </div>
                <Link
                  className="mt-6 inline-flex items-center justify-center rounded-xl bg-navy px-5 py-3 font-bold text-white transition hover:bg-blue-900"
                  to={`/student/quiz?unit=${encodeURIComponent(unit.unitName)}`}
                >
                  ابدأ الاختبار
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
