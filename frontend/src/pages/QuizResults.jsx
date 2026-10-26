import { useState } from 'react';
import { Link } from 'react-router-dom';

function ScoreGauge({ score }) {
  return (
    <div
      aria-label={`الدرجة ${score} بالمئة`}
      className="grid h-40 w-40 place-items-center rounded-full"
      role="img"
      style={{
        background: `conic-gradient(#40e0d0 ${score}%, #e2e8f0 ${score}% 100%)`
      }}
    >
      <div className="grid h-32 w-32 place-items-center rounded-full bg-white text-center">
        <div>
          <p className="text-4xl font-extrabold text-navy">{score}%</p>
          <p className="mt-1 text-sm text-slate-500">النتيجة</p>
        </div>
      </div>
    </div>
  );
}

export default function QuizResults({ result, onRetake }) {
  const [showDetails, setShowDetails] = useState(true);
  const correctCount = result.details.filter((detail) => detail.isCorrect).length;

  return (
    <section className="mx-auto max-w-4xl space-y-6" aria-labelledby="results-title">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-teal-700">اكتمل الاختبار</p>
          <h1 className="mt-1 text-3xl font-extrabold text-navy" id="results-title">تقرير الأداء الأكاديمي</h1>
          <p className="mt-2 text-slate-600">{result.unitName}</p>
        </div>
        <div className="flex gap-3">
          <button className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-white" onClick={onRetake} type="button">
            إعادة الاختبار
          </button>
          <Link className="rounded-lg bg-navy px-4 py-2 font-semibold text-white hover:bg-blue-900" to="/student/dashboard">
            لوحة الطالب
          </Link>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-[auto_1fr]">
        <div className="grid place-items-center rounded-2xl bg-white p-6 shadow-panel">
          <ScoreGauge score={result.score} />
        </div>
        <section className="flex flex-col justify-center rounded-2xl bg-white p-6 shadow-panel">
          <h2 className="text-xl font-bold text-navy">ملخص النتيجة</h2>
          <p className="mt-3 leading-7 text-slate-600">
            أجبت إجابة صحيحة عن <strong className="text-green-700">{correctCount}</strong> من أصل{' '}
            <strong>{result.details.length}</strong> أسئلة.
          </p>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-turquoise" style={{ width: `${result.score}%` }} />
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border-2 border-turquoise bg-white shadow-panel">
        <div className="flex items-start gap-4 bg-teal-50/70 p-6">
          <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-xl text-navy shadow-sm">✦</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-teal-800">SmartQuiz AI</p>
            <h2 className="mt-1 text-xl font-extrabold text-navy">توصيات تعليمية مخصصة</h2>
            <p className="mt-1 text-sm text-slate-600">ملاحظات مولّدة لمساعدتك على تطوير مستواك.</p>
          </div>
        </div>
        <div className="whitespace-pre-wrap p-6 leading-8 text-slate-800">
          {result.aiFeedback || 'لا يتوفر تقرير ذكي لهذه المحاولة.'}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl bg-white shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <h2 className="text-xl font-bold text-navy">مراجعة الإجابات</h2>
            <p className="mt-1 text-sm text-slate-500">راجع الإجابات الصحيحة والنقاط التي تحتاج إلى مزيد من الدراسة.</p>
          </div>
          <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" onClick={() => setShowDetails((visible) => !visible)} type="button">
            {showDetails ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
          </button>
        </div>
        {showDetails && (
          <div className="divide-y divide-slate-100">
            {result.details.map((detail, index) => (
              <article className="p-5 sm:p-6" key={detail.questionId}>
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold ${
                    detail.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {detail.isCorrect ? '✓' : '×'}
                  </span>
                  <div className="min-w-0">
                    <p className="mb-1 text-xs font-semibold text-slate-500">السؤال {index + 1}</p>
                    <h3 className="font-bold leading-7 text-slate-900">{detail.questionText}</h3>
                    <p className={`mt-3 leading-7 ${detail.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                      إجابتك: {detail.submittedAnswer || 'لم تتم الإجابة'}
                    </p>
                    {!detail.isCorrect && (
                      <p className="mt-1 rounded-lg bg-green-50 p-3 leading-7 text-green-900">
                        الإجابة الصحيحة: <strong>{detail.correctAnswer}</strong>
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
