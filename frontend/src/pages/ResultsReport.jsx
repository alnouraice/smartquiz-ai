import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function downloadCsv(results) {
  const headings = ['رقم المحاولة', 'اسم الطالب', 'البريد الإلكتروني', 'الوحدة', 'الدرجة (%)', 'التاريخ'];
  const rows = results.map((result) => [
    result.id,
    result.studentName,
    result.studentEmail,
    result.unitName,
    result.score,
    result.createdAt
  ]);
  const csv = [headings, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'smartquiz-results.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function ResultsReport() {
  const [results, setResults] = useState([]);
  const [units, setUnits] = useState([]);
  const [unit, setUnit] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedIds, setExpandedIds] = useState([]);

  useEffect(() => {
    api.get('/admin/questions')
      .then(({ data }) => setUnits([...new Set(data.questions.map((question) => question.unit_name))]))
      .catch((requestError) => setError(requestError.response?.data?.error || 'تعذر تحميل قائمة الوحدات.'));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.get('/admin/results', {
      params: {
        ...(unit ? { unit } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {})
      }
    })
      .then(({ data }) => {
        if (active) setResults(data.results);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.error || 'تعذر تحميل النتائج.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [unit, startDate, endDate]);

  const canExport = useMemo(() => results.length > 0, [results]);

  function toggleFeedback(id) {
    setExpandedIds((previous) => previous.includes(id)
      ? previous.filter((item) => item !== id)
      : [...previous, id]);
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-navy">النتائج والتقارير</h1>
          <p className="mt-2 text-slate-600">سجل المحاولات والتقارير الأكاديمية.</p>
        </div>
        <button className="rounded-lg bg-navy px-5 py-3 font-bold text-white disabled:opacity-50" disabled={!canExport} onClick={() => downloadCsv(results)} type="button">
          تصدير النتائج إلى CSV
        </button>
      </header>

      <section aria-label="تصفية النتائج" className="grid gap-4 rounded-2xl bg-white p-5 shadow-panel sm:grid-cols-3">
        <label>
          <span className="mb-1 block text-sm font-semibold">الوحدة</span>
          <select className="w-full rounded-lg border border-slate-300 bg-white p-3" onChange={(event) => setUnit(event.target.value)} value={unit}>
            <option value="">كل الوحدات</option>
            {units.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">من تاريخ</span>
          <input className="w-full rounded-lg border border-slate-300 p-3" onChange={(event) => setStartDate(event.target.value)} type="date" value={startDate} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">إلى تاريخ</span>
          <input className="w-full rounded-lg border border-slate-300 p-3" onChange={(event) => setEndDate(event.target.value)} type="date" value={endDate} />
        </label>
      </section>

      {error && <p className="rounded-lg bg-red-50 p-4 text-red-800" role="alert">{error}</p>}
      {loading ? <p role="status">جارٍ تحميل النتائج...</p> : (
        <section className="overflow-hidden rounded-2xl bg-white shadow-panel">
          {results.length === 0 ? <p className="p-6 text-slate-600">لا توجد نتائج تطابق عوامل التصفية.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-right text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-5 py-4 font-semibold">الطالب</th>
                    <th className="px-5 py-4 font-semibold">البريد الإلكتروني</th>
                    <th className="px-5 py-4 font-semibold">الوحدة</th>
                    <th className="px-5 py-4 font-semibold">الدرجة</th>
                    <th className="px-5 py-4 font-semibold">التاريخ</th>
                    <th className="px-5 py-4 font-semibold">التقرير الذكي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((result) => (
                    <tr className="align-top" key={result.id}>
                      <td className="px-5 py-4 font-semibold">{result.studentName}</td>
                      <td className="px-5 py-4 text-slate-600" dir="ltr">{result.studentEmail}</td>
                      <td className="px-5 py-4">{result.unitName}</td>
                      <td className="px-5 py-4 font-bold text-navy">{result.score}%</td>
                      <td className="px-5 py-4 text-slate-600">{result.createdAt}</td>
                      <td className="px-5 py-4">
                        <button className="font-semibold text-primary underline underline-offset-4" onClick={() => toggleFeedback(result.id)} type="button">
                          {expandedIds.includes(result.id) ? 'إخفاء التقرير' : 'عرض التقرير'}
                        </button>
                        {expandedIds.includes(result.id) && (
                          <p className="mt-3 min-w-64 whitespace-pre-wrap rounded-lg bg-teal-50 p-3 leading-7 text-teal-950">
                            {result.aiFeedback || 'لا يوجد تقرير ذكي لهذه المحاولة.'}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
