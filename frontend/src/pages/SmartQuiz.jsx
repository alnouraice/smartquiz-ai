import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import QuizResults from './QuizResults.jsx';

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

export default function SmartQuiz() {
  const [searchParams] = useSearchParams();
  const unitName = searchParams.get('unit') || 'المكونات الداخلية للحاسوب';
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setQuestions([]);
    setAnswers({});
    setCurrentIndex(0);
    setElapsedSeconds(0);
    setResult(null);

    api.get('/questions', { params: { unit: unitName } })
      .then(({ data }) => {
        if (active) setQuestions(data.questions);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.data?.error || 'تعذر تحميل الأسئلة.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [unitName]);

  useEffect(() => {
    if (loading || result || submitting) return undefined;
    const timer = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [loading, result, submitting]);

  async function submitQuiz(event) {
    event.preventDefault();
    setError('');

    const unansweredCount = questions.filter((question) => !answers[question.id]).length;
    if (unansweredCount > 0) {
      setError(`يرجى الإجابة عن جميع الأسئلة قبل الإرسال. الأسئلة المتبقية: ${unansweredCount}`);
      return;
    }

    setSubmitting(true);
    try {
      const submittedAnswers = questions.map((question) => ({
        questionId: question.id,
        answer: answers[question.id]
      }));
      const { data } = await api.post('/evaluate-quiz', {
        unitName,
        answers: submittedAnswers
      });
      setResult(data);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'تعذر إرسال الاختبار. حاول مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-slate-600" role="status">جارٍ تحميل الأسئلة...</p>;
  if (error && questions.length === 0) {
    return (
      <section className="rounded-2xl bg-white p-6 shadow-panel">
        <p className="text-red-700" role="alert">{error}</p>
        <Link className="mt-4 inline-block font-semibold text-primary" to="/student/dashboard">العودة إلى لوحة الطالب</Link>
      </section>
    );
  }
  if (questions.length === 0) {
    return (
      <section className="rounded-2xl bg-white p-6 shadow-panel">
        <p className="text-slate-700">لا توجد أسئلة متاحة لهذه الوحدة بعد.</p>
        <Link className="mt-4 inline-block font-semibold text-primary" to="/student/dashboard">العودة إلى لوحة الطالب</Link>
      </section>
    );
  }

  if (result) {
    return (
      <QuizResults
        onRetake={() => {
          setAnswers({});
          setCurrentIndex(0);
          setElapsedSeconds(0);
          setResult(null);
          setError('');
        }}
        result={result}
      />
    );
  }

  const question = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredCount = Object.keys(answers).length;

  return (
    <section className="mx-auto max-w-3xl" aria-labelledby="quiz-title">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link className="text-sm font-semibold text-primary hover:underline" to="/student/dashboard">العودة إلى الوحدات</Link>
          <h1 className="mt-2 text-2xl font-extrabold text-navy" id="quiz-title">{unitName}</h1>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="rounded-full bg-white px-4 py-2 font-semibold text-slate-700 shadow-sm">
            {answeredCount} من {questions.length} تمت الإجابة
          </span>
          <span aria-label={`الوقت المنقضي ${formatTime(elapsedSeconds)}`} className="rounded-full bg-navy px-4 py-2 font-bold text-white" dir="ltr">
            {formatTime(elapsedSeconds)}
          </span>
        </div>
      </header>

      <form onSubmit={submitQuiz} className="rounded-2xl bg-white p-6 shadow-panel sm:p-8">
        <div
          aria-valuemax={questions.length}
          aria-valuemin={1}
          aria-valuenow={currentIndex + 1}
          className="mb-6 h-2 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-turquoise transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        <p className="mb-2 text-sm font-semibold text-slate-500">
          السؤال {currentIndex + 1} من {questions.length}
        </p>
        <h2 className="mb-6 text-xl font-bold leading-relaxed text-slate-900">{question.question_text}</h2>

        <div className="space-y-3">
          {question.options.map((option, index) => {
            const selected = answers[question.id] === option;
            return (
              <button
                aria-pressed={selected}
                className={`flex w-full items-center gap-3 rounded-xl border p-4 text-right transition ${
                  selected
                    ? 'border-primary bg-blue-50 text-navy ring-1 ring-primary'
                    : 'border-slate-200 hover:border-primary hover:bg-slate-50'
                }`}
                key={option}
                onClick={() => setAnswers((previous) => ({ ...previous, [question.id]: option }))}
                type="button"
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold ${
                  selected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="leading-7">{option}</span>
              </button>
            );
          })}
        </div>

        {error && <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}

        <div className="mt-8 flex flex-wrap justify-between gap-3">
          <button
            className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={currentIndex === 0 || submitting}
            onClick={() => setCurrentIndex((index) => index - 1)}
            type="button"
          >
            السؤال السابق
          </button>
          {isLastQuestion ? (
            <button
              className="rounded-lg bg-navy px-6 py-3 font-bold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={submitting}
              type="submit"
            >
              {submitting ? 'جارٍ تصحيح الاختبار وإعداد التقرير...' : 'إرسال الاختبار'}
            </button>
          ) : (
            <button
              className="rounded-lg bg-primary px-6 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!answers[question.id] || submitting}
              onClick={() => setCurrentIndex((index) => index + 1)}
              type="button"
            >
              السؤال التالي
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
