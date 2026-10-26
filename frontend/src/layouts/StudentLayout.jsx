import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function StudentLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-offwhite">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link className="text-xl font-extrabold text-navy" to="/student/dashboard">
            SmartQuiz AI
          </Link>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-slate-600">مرحبًا، {user?.name}</span>
            <span className="rounded-full bg-teal-50 px-3 py-1 font-semibold text-teal-800">
              مقرر مكونات الحاسوب
            </span>
            <button
              className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
              onClick={logout}
              type="button"
            >
              تسجيل الخروج
            </button>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8">
        <Outlet />
      </main>
    </div>
  );
}
