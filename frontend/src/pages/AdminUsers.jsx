import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/users')
      .then(({ data }) => setUsers(data.users))
      .catch((requestError) => {
        setError(requestError.response?.data?.error || 'تعذر تحميل قائمة المستخدمين.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold text-navy">إدارة المستخدمين</h1>
        <p className="mt-2 text-slate-600">عرض حسابات المستخدمين المسجلين وأدوارهم.</p>
      </header>

      {error && <p role="alert" className="text-red-700">{error}</p>}
      {isLoading ? (
        <p role="status" className="text-slate-600">جارٍ تحميل المستخدمين...</p>
      ) : !error && users.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-slate-600 shadow-panel">
          لا يوجد مستخدمون مسجلون حتى الآن.
        </p>
      ) : !error && (
        <section className="overflow-hidden rounded-2xl bg-white shadow-panel">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-right text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">الرقم</th>
                  <th scope="col" className="px-6 py-4 font-semibold">الاسم</th>
                  <th scope="col" className="px-6 py-4 font-semibold">البريد الإلكتروني</th>
                  <th scope="col" className="px-6 py-4 font-semibold">الدور</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 text-slate-600">{user.id}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{user.name}</td>
                    <td className="px-6 py-4 text-slate-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 font-semibold ${
                        user.role === 'admin'
                          ? 'bg-blue-50 text-blue-800'
                          : 'bg-teal-50 text-teal-800'
                      }`}>
                        {user.role === 'admin' ? 'مسؤول' : 'طالب'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
