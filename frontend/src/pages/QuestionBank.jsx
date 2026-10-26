import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { normalizeImportedQuestion, parseQuestionText } from '../utils/parseQuestions.js';

const emptyForm = {
  question_text: '',
  options: ['', '', '', ''],
  correct_answer: '',
  unit_name: 'مكونات الحاسوب',
  difficulty_level: 'متوسط'
};

function prepareImportedQuestions(input, unitName) {
  if (!Array.isArray(input)) throw new Error('يجب أن يكون ملف JSON مصفوفة من الأسئلة.');
  return input.map((question) => normalizeImportedQuestion(question, unitName));
}

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [pasteText, setPasteText] = useState('');
  const [bulkUnit, setBulkUnit] = useState('مكونات الحاسوب');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadQuestions() {
    const { data } = await api.get('/admin/questions');
    setQuestions(data.questions);
  }

  useEffect(() => {
    loadQuestions().catch((requestError) => {
      setError(requestError.response?.data?.error || 'تعذر تحميل بنك الأسئلة.');
    });
  }, []);

  function setField(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function saveQuestion(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    const question = { ...form, options: form.options.map((option) => option.trim()).filter(Boolean) };
    setBusy(true);
    try {
      if (editingId) {
        await api.put(`/admin/questions/${editingId}`, question);
        setMessage('تم تحديث السؤال.');
      } else {
        await api.post('/admin/questions', question);
        setMessage('تمت إضافة السؤال.');
      }
      resetForm();
      await loadQuestions();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'تعذر حفظ السؤال.');
    } finally {
      setBusy(false);
    }
  }

  function editQuestion(question) {
    setEditingId(question.id);
    setForm({
      ...question,
      options: [...question.options, '', '', '', ''].slice(0, Math.max(4, question.options.length))
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteQuestion(question) {
    if (!window.confirm(`هل تريد حذف السؤال: ${question.question_text}؟`)) return;
    setError('');
    setMessage('');
    try {
      await api.delete(`/admin/questions/${question.id}`);
      setQuestions((previous) => previous.filter((item) => item.id !== question.id));
      setMessage('تم حذف السؤال.');
      if (editingId === question.id) resetForm();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'تعذر حذف السؤال.');
    }
  }

  async function importQuestions(importedQuestions) {
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const { data } = await api.post('/admin/questions/bulk', { questions: importedQuestions });
      setMessage(`تم استيراد ${data.importedCount} سؤالًا بنجاح.`);
      setPasteText('');
      await loadQuestions();
    } catch (requestError) {
      const details = requestError.response?.data?.details;
      setError(details ? details.join(' ') : requestError.response?.data?.error || 'تعذر استيراد الأسئلة.');
    } finally {
      setBusy(false);
    }
  }

  async function importPastedText() {
    const parsed = parseQuestionText(pasteText, bulkUnit);
    if (parsed.errors.length) {
      setError(parsed.errors.join(' '));
      return;
    }
    await importQuestions(parsed.questions);
  }

  async function importFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    try {
      const parsedQuestions = prepareImportedQuestions(JSON.parse(await file.text()), bulkUnit);
      await importQuestions(parsedQuestions);
    } catch (parseError) {
      setError(parseError.message || 'تعذر قراءة ملف JSON.');
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold text-navy">بنك الأسئلة</h1>
        <p className="mt-2 text-slate-600">إضافة الأسئلة وتصنيفها وتحريرها واستيرادها دفعة واحدة.</p>
      </header>

      {error && <p className="rounded-lg bg-red-50 p-4 text-red-800" role="alert">{error}</p>}
      {message && <p className="rounded-lg bg-teal-50 p-4 text-teal-900" role="status">{message}</p>}

      <section className="rounded-2xl bg-white p-6 shadow-panel">
        <h2 className="mb-5 text-xl font-bold text-navy">{editingId ? 'تحرير السؤال' : 'إضافة سؤال'}</h2>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={saveQuestion}>
          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-semibold">نص السؤال</span>
            <textarea className="w-full rounded-lg border border-slate-300 p-3" onChange={(event) => setField('question_text', event.target.value)} required rows="2" value={form.question_text} />
          </label>
          {form.options.map((option, index) => (
            <label key={index}>
              <span className="mb-1 block text-sm font-semibold">الخيار {index + 1}</span>
              <input className="w-full rounded-lg border border-slate-300 p-3" onChange={(event) => {
                const options = [...form.options];
                options[index] = event.target.value;
                setField('options', options);
              }} value={option} />
            </label>
          ))}
          <label>
            <span className="mb-1 block text-sm font-semibold">الإجابة الصحيحة</span>
            <select className="w-full rounded-lg border border-slate-300 bg-white p-3" onChange={(event) => setField('correct_answer', event.target.value)} required value={form.correct_answer}>
              <option value="">اختر الإجابة الصحيحة</option>
              {form.options.filter(Boolean).map((option, index) => <option key={`${option}-${index}`} value={option}>{option}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold">الوحدة</span>
            <input className="w-full rounded-lg border border-slate-300 p-3" onChange={(event) => setField('unit_name', event.target.value)} required value={form.unit_name} />
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold">مستوى الصعوبة</span>
            <select className="w-full rounded-lg border border-slate-300 bg-white p-3" onChange={(event) => setField('difficulty_level', event.target.value)} value={form.difficulty_level}>
              <option>سهل</option><option>متوسط</option><option>صعب</option>
            </select>
          </label>
          <div className="flex gap-3 md:col-span-2">
            <button className="rounded-lg bg-navy px-5 py-3 font-bold text-white disabled:opacity-50" disabled={busy} type="submit">
              {busy ? 'جارٍ الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة السؤال'}
            </button>
            {editingId && <button className="rounded-lg border border-slate-300 px-5 py-3 font-semibold" onClick={resetForm} type="button">إلغاء</button>}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-teal-100 bg-teal-50/60 p-6">
        <h2 className="text-xl font-bold text-navy">استيراد جماعي</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          الصق سؤالًا واحدًا في كل سطر بهذا الشكل:
          <code className="mx-1 rounded bg-white px-2 py-1" dir="ltr">Q: Text | Options: A, B, C, D | Answer: A | Diff: Easy</code>
        </p>
        <label className="mt-4 block max-w-md">
          <span className="mb-1 block text-sm font-semibold">الوحدة الافتراضية للنص الملصق</span>
          <input className="w-full rounded-lg border border-slate-300 bg-white p-3" onChange={(event) => setBulkUnit(event.target.value)} value={bulkUnit} />
        </label>
        <textarea className="mt-4 w-full rounded-lg border border-slate-300 p-3" onChange={(event) => setPasteText(event.target.value)} placeholder="Q: ... | Options: ... | Answer: ... | Diff: ..." rows="6" value={pasteText} />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button className="rounded-lg bg-primary px-5 py-3 font-bold text-white disabled:opacity-50" disabled={busy || !pasteText.trim()} onClick={importPastedText} type="button">استيراد النص</button>
          <label className="cursor-pointer rounded-lg border border-navy px-5 py-3 font-bold text-navy hover:bg-white">
            تحميل ملف JSON
            <input accept="application/json,.json" className="sr-only" onChange={importFile} type="file" />
          </label>
          <span className="text-xs text-slate-600">ملف JSON: مصفوفة كائنات question_text, options, correct_answer, unit_name, difficulty_level.</span>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl bg-white shadow-panel">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-xl font-bold text-navy">الأسئلة ({questions.length})</h2>
        </div>
        {questions.length === 0 ? <p className="p-6 text-slate-600">لم تتم إضافة أسئلة بعد.</p> : (
          <div className="divide-y divide-slate-100">
            {questions.map((question) => (
              <article className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center" key={question.id}>
                <div>
                  <h3 className="font-bold text-slate-900">{question.question_text}</h3>
                  <p className="mt-2 text-sm text-slate-600">{question.unit_name} · {question.difficulty_level} · {question.options.length} خيارات</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold" onClick={() => editQuestion(question)} type="button">تحرير</button>
                  <button className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700" onClick={() => deleteQuestion(question)} type="button">حذف</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
