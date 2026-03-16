import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { format } from 'date-fns';

const AdminPanel = () => {
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await api.get('/admin/users');
      return response.data;
    },
  });

  const promoteMutation = useMutation({
    mutationFn: ({ id, role }) => api.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => queryClient.invalidateQueries(['admin-users']),
  });

  if (isLoading) return <div className="p-8 text-slate-500">Loading admin panel...</div>;

  const totalUsers = users?.length || 0;
  const authorCount = users?.filter(u => u.role === 'AUTHOR').length || 0;
  const readerCount = users?.filter(u => u.role === 'READER').length || 0;
  const adminCount = users?.filter(u => u.role === 'ADMIN').length || 0;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside className="w-[260px] flex-shrink-0 bg-navy text-slate-400 flex flex-col shadow-2xl z-20">
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-white p-2 rounded-xl shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-2xl">auto_stories</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">BlogSpace</h1>
              <p className="text-[10px] text-primary mt-0.5 uppercase tracking-[0.2em] font-black">Admin Protocol</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-6 space-y-2">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-3">System Control</p>
          <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm transition-all font-bold">
            <span className="material-symbols-outlined">group</span>
            <span className="text-sm">Global Users</span>
          </Link>
          <Link to="#" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-all">
            <span className="material-symbols-outlined">description</span>
            <span className="text-sm font-semibold">Post Audit</span>
          </Link>
          <Link to="#" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-all">
            <span className="material-symbols-outlined">chat_bubble</span>
            <span className="text-sm font-semibold">Moderation</span>
          </Link>
          <Link to="#" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-all">
            <span className="material-symbols-outlined">insights</span>
            <span className="text-sm font-semibold">System Insights</span>
          </Link>
          
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-10 mb-4 px-3">Configuration</p>
          <Link to="#" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-all">
            <span className="material-symbols-outlined">settings</span>
            <span className="text-sm font-semibold">Core Settings</span>
          </Link>
        </nav>
        <div className="p-6 border-t border-white/5 bg-black/20">
          <button onClick={() => {/* handle logout */}} className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all font-bold">
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm">Exit Terminal</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">User Infrastructure</h2>
            <p className="text-xs text-slate-500">Global registry of all BlogSpace entities</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="h-10 w-10 rounded-full border-2 border-primary/20 p-0.5">
              <img 
                src="https://ui-avatars.com/api/?name=Admin&background=10b981&color=fff" 
                className="w-full h-full rounded-full object-cover"
                alt="Avatar"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Registry Management</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Administrative control over user roles and platform access.</p>
              </div>
              <button className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-sm font-black text-white shadow-xl shadow-primary/30 hover:bg-primary/90 hover:-translate-y-0.5 transition-all opacity-50 cursor-not-allowed">
                <span className="material-symbols-outlined text-lg">person_add</span>
                Provision User
              </button>
            </div>

            {/* Stats Cards */}
            <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Total Entities', value: totalUsers, icon: 'group' },
                { label: 'Content Creators', value: authorCount, icon: 'edit_square' },
                { label: 'Platform Readers', value: readerCount, icon: 'menu_book' },
                { label: 'Super Admins', value: adminCount, icon: 'shield_person' },
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="p-3 bg-primary/10 text-primary rounded-2xl w-fit mb-4">
                    <span className="material-symbols-outlined">{stat.icon}</span>
                  </div>
                  <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</h3>
                  <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* User Table */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
               <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-slate-900 dark:text-white">Entity Registry</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-8 py-5 font-black text-slate-500 uppercase tracking-widest text-[10px]">Entity</th>
                      <th className="px-8 py-5 font-black text-slate-500 uppercase tracking-widest text-[10px]">Identification</th>
                      <th className="px-8 py-5 font-black text-slate-500 uppercase tracking-widest text-[10px]">Permission</th>
                      <th className="px-8 py-5 font-black text-slate-500 uppercase tracking-widest text-[10px]">Registry Date</th>
                      <th className="px-8 py-5 font-black text-slate-500 uppercase tracking-widest text-[10px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {users?.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-8 py-16 text-center text-slate-500 font-medium whitespace-nowrap">No entities registered in the system.</td>
                      </tr>
                    ) : (
                      users?.map((u) => (
                        <tr key={u.id} className="hover:bg-primary/5 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl border-2 border-primary/20 p-0.5 overflow-hidden shrink-0">
                                 <img 
                                  className="w-full h-full object-cover rounded-xl" 
                                  alt={u.displayName} 
                                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName)}&background=10b981&color=fff`}
                                />
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors text-base">{u.displayName}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-slate-500 dark:text-slate-400 font-medium">
                            {u.email}
                          </td>
                          <td className="px-8 py-6">
                            {u.role === 'ADMIN' ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 px-3 py-1 text-xs font-black text-purple-700 dark:text-purple-400 border border-purple-200/50">
                                 <span className="size-1.5 bg-purple-600 rounded-full"></span>
                                 ADMIN
                              </span>
                            ) : u.role === 'AUTHOR' ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary border border-primary/20">
                                 <span className="size-1.5 bg-primary rounded-full"></span>
                                 AUTHOR
                              </span>
                            ) : (
                               <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-black text-slate-500 border border-slate-200">
                                 <span className="size-1.5 bg-slate-400 rounded-full"></span>
                                 READER
                              </span>
                            )}
                          </td>
                          <td className="px-8 py-6 text-slate-500 dark:text-slate-400 font-bold">
                            {format(new Date(u.createdAt || Date.now()), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-2 items-center">
                              {u.role === 'READER' && (
                                <button 
                                  onClick={() => promoteMutation.mutate({ id: u.id, role: 'AUTHOR' })}
                                  disabled={promoteMutation.isPending}
                                  className="bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-tighter px-3 py-1.5 rounded-lg shadow-sm shadow-primary/20 transition-all disabled:opacity-50"
                                >
                                  Promote to Author
                                </button>
                              )}
                              {u.role === 'AUTHOR' && (
                                <button 
                                  onClick={() => promoteMutation.mutate({ id: u.id, role: 'ADMIN' })}
                                  disabled={promoteMutation.isPending}
                                  className="bg-purple-600 hover:bg-purple-700 text-white font-black text-[10px] uppercase tracking-tighter px-3 py-1.5 rounded-lg shadow-sm shadow-purple-600/20 transition-all disabled:opacity-50"
                                >
                                  Make Admin
                                </button>
                              )}
                              <button className="size-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10 transition-all">
                                  <span className="material-symbols-outlined text-xl">visibility</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {users?.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/30 px-8 py-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">End of Registry</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
