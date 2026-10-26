import { Link, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import StudentLayout from './layouts/StudentLayout.jsx';
import SmartQuiz from './pages/SmartQuiz.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import QuestionBank from './pages/QuestionBank.jsx';
import ResultsReport from './pages/ResultsReport.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import { useAuth } from './context/AuthContext.jsx';

function SectionPlaceholder({ title }) {
  return (
    <section className="rounded-2xl bg-white p-8 shadow-panel">
      <h1 className="text-2xl font-bold text-navy">{title}</h1>
      <p className="mt-3 text-slate-600">سيتم تنفيذ هذا القسم في خطوة لاحقة.</p>
    </section>
  );
}

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : user ? '/student/dashboard' : '/login'} replace />;
}

function Unauthorized() {
  const { user } = useAuth();
  const home = user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';

  return (
    <main className="grid min-h-screen place-items-center bg-offwhite px-5">
      <section className="max-w-md rounded-2xl bg-white p-8 text-center shadow-panel">
        <h1 className="text-2xl font-extrabold text-navy">ليس لديك صلاحية الوصول</h1>
        <p className="mt-3 leading-7 text-slate-600">هذا القسم متاح لدور مستخدم آخر.</p>
        <Link className="mt-5 inline-flex rounded-lg bg-navy px-5 py-3 font-semibold text-white" to={home}>
          العودة إلى الصفحة الرئيسية
        </Link>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route element={<ProtectedRoute role="student" />}>
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<Navigate to="/student/dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="quiz" element={<SmartQuiz />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="questions" element={<QuestionBank />} />
          <Route path="results" element={<ResultsReport />} />
          <Route path="settings" element={<SectionPlaceholder title="الإعدادات" />} />
        </Route>
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
