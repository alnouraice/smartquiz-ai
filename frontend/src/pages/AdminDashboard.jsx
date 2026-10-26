import { useEffect, useState } from 'react';
import { api } from '../api.js';

const statCards = [
  { key: 'totalStudents', label: 'الطلاب المسجلون', suffix: '' },
  { key: 'totalAttempts', label: 'محاولات الاختبار', suffix: '' },
  { key: 'averageScore', label: 'متوسط الدرجات', suffix: '%' },
  { key: 'passRate', label: 'نسبة النجاح (50% فأعلى)', suffix: '%' }
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data }) => setStats(data))
      .catch((requestError) => {
        setError(requestError.response?.data?.error || 'تعذر تحميل إحصاءات لوحة التحكم.');
      });
  }, []);

  if (error) return <p role="alert" className="text-red-700">{error}</p>;
  if (!stats) return <p role="status">جارٍ تحميل الإحصاءات...</p>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold text-navy">لوحة التحكم</h1>
        <p className="mt-2 text-slate-600">ملخص الأداء الأكاديمي ونشاط المنصة.</p>
      </header>

      <section aria-label="إحصاءات النظام" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <article key={card.key} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-panel">
            <p className="text-sm font-semibold text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-extrabold text-navy">
              {stats[card.key]}{card.suffix}
            </p>
            <div className="mt-4 h-1.5 rounded-full bg-slate-100">
              <div className="h-full w-1/2 rounded-full bg-turquoise" />
            </div>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl bg-white shadow-panel">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-xl font-bold text-navy">أحدث المحاولات</h2>
        </div>
        {stats.recentAttempts.length === 0 ? (
          <p className="p-6 text-slate-600">لا توجد محاولات اختبار حتى الآن.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-right text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-6 py-3 font-semibold">اسم الطالب</th>
                  <th className="px-6 py-3 font-semibold">الوحدة</th>
                  <th className="px-6 py-3 font-semibold">الدرجة</th>
                  <th className="px-6 py-3 font-semibold">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recentAttempts.map((attempt) => (
                  <tr key={attempt.id}>
                    <td className="px-6 py-4 font-semibold text-slate-800">{attempt.studentName}</td>
                    <td className="px-6 py-4 text-slate-600">{attempt.unitName}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-teal-50 px-3 py-1 font-bold text-teal-800">
                        {attempt.score}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(`${attempt.createdAt.replace(' ', 'T')}Z`).toLocaleString('ar')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
