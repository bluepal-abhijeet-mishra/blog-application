import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { format } from 'date-fns';

const Dashboard = () => {
  const queryClient = useQueryClient();
  const { data: posts, isLoading } = useQuery({
    queryKey: ['my-posts'],
    queryFn: async () => {
      const response = await api.get('/posts/my-posts');
      return response.data;
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id) => api.patch(`/posts/${id}/publish`),
    onSuccess: () => queryClient.invalidateQueries(['my-posts']),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/posts/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['my-posts']),
  });

  if (isLoading) return <div className="p-8 text-slate-500">Loading dashboard...</div>;

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
              <p className="text-[10px] text-primary mt-0.5 uppercase tracking-[0.2em] font-black">Author Console</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-3">Main Navigation</p>
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm transition-all font-bold">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-sm">My Dashboard</span>
          </Link>
          <Link to="/editor" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-all">
            <span className="material-symbols-outlined">add_circle</span>
            <span className="text-sm font-semibold">Write Story</span>
          </Link>
          <Link to="#" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-all">
            <span className="material-symbols-outlined">article</span>
            <span className="text-sm font-semibold">My Drafts</span>
          </Link>
          <Link to="#" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-all">
            <span className="material-symbols-outlined">analytics</span>
            <span className="text-sm font-semibold">Analytics</span>
          </Link>

          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-10 mb-4 px-3">Engagement</p>
          <Link to="#" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-all">
            <span className="material-symbols-outlined">forum</span>
            <span className="text-sm font-semibold">Comments</span>
          </Link>
          <Link to="#" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-all">
            <span className="material-symbols-outlined">mail</span>
            <span className="text-sm font-semibold">Newsletter</span>
          </Link>
        </nav>
        <div className="p-6 border-t border-white/5 bg-black/20">
          <Link to="#" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-all mb-2">
            <span className="material-symbols-outlined">settings</span>
            <span className="text-sm font-semibold">Settings</span>
          </Link>
          <button onClick={() => {/* logout */}} className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all">
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm font-bold">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Content Overview</h2>
            <p className="text-xs text-slate-500">Manage and track your published stories</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input type="text" placeholder="Search posts..." className="h-10 pl-10 pr-4 bg-slate-100 dark:bg-slate-800 rounded-full border-none focus:ring-2 focus:ring-primary/20 text-sm w-64 transition-all" />
            </div>
            <button className="p-2.5 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 size-2 bg-primary rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
            <div className="h-10 w-10 rounded-full border-2 border-primary/20 p-0.5">
              <img 
                src="https://ui-avatars.com/api/?name=Author&background=10b981&color=fff" 
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
                <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Authoring Panel</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Detailed statistics and management for your articles.</p>
              </div>
              <Link to="/editor" className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-sm font-black text-white shadow-xl shadow-primary/30 hover:bg-primary/90 hover:-translate-y-0.5 transition-all">
                <span className="material-symbols-outlined text-lg">add_box</span>
                New Publication
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {[
                { label: 'Total Views', value: '24.5k', icon: 'visibility', trend: '+12%', color: 'primary' },
                { label: 'Published Posts', value: posts?.length || 0, icon: 'article', trend: '+2', color: 'blue' },
                { label: 'Total Comments', value: '412', icon: 'forum', trend: '+18%', color: 'amber' },
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 bg-primary/10 text-primary rounded-2xl`}>
                      <span className="material-symbols-outlined">{stat.icon}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">{stat.trend}</span>
                  </div>
                  <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider">{stat.label}</h3>
                  <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white">Recent Articles</h3>
                  <button className="text-primary text-xs font-bold hover:underline">View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-8 py-5 font-black text-slate-500 uppercase tracking-widest text-[10px]">Title & URL</th>
                      <th className="px-8 py-5 font-black text-slate-500 uppercase tracking-widest text-[10px]">Status</th>
                      <th className="px-8 py-5 font-black text-slate-500 uppercase tracking-widest text-[10px]">Creation Date</th>
                      <th className="px-8 py-5 font-black text-slate-500 uppercase tracking-widest text-[10px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {posts?.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-8 py-16 text-center text-slate-500 font-medium whitespace-nowrap">No posts found. Elevate your status by writing a story!</td>
                      </tr>
                    ) : (
                      posts?.map(post => (
                        <tr key={post.id} className="hover:bg-primary/5 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors text-base">{post.title}</div>
                            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-medium"><span className="material-symbols-outlined text-xs">link</span> blogspace.com/{post.slug}</div>
                          </td>
                          <td className="px-8 py-6">
                            {post.status === 'PUBLISHED' ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary border border-primary/20">
                                <span className="size-1.5 bg-primary rounded-full"></span>
                                PUBLISHED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-black text-slate-500 border border-slate-200 dark:border-slate-700">
                                <span className="size-1.5 bg-slate-400 rounded-full"></span>
                                DRAFT
                              </span>
                            )}
                          </td>
                          <td className="px-8 py-6 text-slate-500 dark:text-slate-400 font-bold">
                            {format(new Date(post.createdAt), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-2 items-center">
                              {post.status === 'DRAFT' && (
                                <button
                                  onClick={() => publishMutation.mutate(post.id)}
                                  className="bg-primary hover:bg-primary/90 text-white font-bold text-[10px] uppercase tracking-tighter px-3 py-1.5 rounded-lg shadow-sm shadow-primary/20 transition-all"
                                >
                                  Go Live
                                </button>
                              )}
                              <Link to={`/editor/${post.id}`} className="size-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10 transition-all" title="Edit">
                                <span className="material-symbols-outlined text-xl">edit</span>
                              </Link>
                              <button
                                onClick={() => { if(confirm('Are you sure you want to delete this post?')) deleteMutation.mutate(post.id) }}
                                className="size-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all font-bold"
                                title="Delete"
                              >
                                <span className="material-symbols-outlined text-xl">delete</span>
                              </button>
                               {post.status === 'PUBLISHED' && (
                                <Link to={`/posts/${post.slug}`} className="size-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10 transition-all" title="View Public Page">
                                  <span className="material-symbols-outlined text-xl">open_in_new</span>
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
