import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const navigation = [
  { label: 'لوحة التحكم', to: '/admin/dashboard' },
  { label: 'إدارة المستخدمين', to: '/admin/users' },
  { label: 'بنك الأسئلة', to: '/admin/questions' },
  { label: 'النتائج', to: '/admin/results' },
  { label: 'الإعدادات', to: '/admin/settings' }
];

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-offwhite md:flex">
      <aside className="w-full shrink-0 bg-navy p-5 text-white md:min-h-screen md:w-64">
        <div className="mb-8">
          <p className="text-xl font-extrabold">SmartQuiz AI</p>
          <p className="mt-1 text-sm text-blue-200">إدارة المنصة</p>
        </div>
        <nav aria-label="التنقل الإداري" className="flex gap-2 overflow-x-auto md:flex-col">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              end={item.end}
              to={item.to}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  isActive ? 'bg-white text-navy' : 'text-blue-100 hover:bg-blue-900'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-8 flex items-center justify-between border-t border-blue-800 pt-5">
          <span className="text-sm text-blue-100">{user?.name}</span>
          <button
            className="text-sm font-semibold text-white underline-offset-4 hover:underline"
            onClick={logout}
            type="button"
          >
            خروج
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-5 md:p-10">
        <Outlet />
      </main>
    </div>
  );
}
