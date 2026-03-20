import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import postService from '../api/services/postService';
import adminService from '../api/services/adminService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import AdminCharts from '../components/AdminCharts';
import Pagination from '../components/Pagination';

const EMPTY_ANALYTICS_STATS = {
  totalUsers: 0,
  totalPosts: 0,
  totalComments: 0,
  authorCount: 0,
  userGrowth: [],
  postActivity: [],
  categoryDistribution: {},
  roleDistribution: {},
};

const StatCard = ({ label, value, icon, color, delay, subtext, progress }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: "easeOut" }}
    className="relative group"
  >
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-6 rounded-[24px] shadow-sm hover:shadow-lg transition-all duration-300">
      <div className={`size-10 rounded-xl flex items-center justify-center ${color} mb-4 transition-transform group-hover:scale-110 duration-300`}>
        <span className="material-symbols-outlined text-xl">{icon}</span>
      </div>
      
      <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.12em] mb-1.5">
        {label}
      </h3>
      
      <div className="flex items-baseline gap-2 mb-3">
        <p className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
          {value}
        </p>
      </div>

      {subtext && (
        <p className="text-emerald-500 text-[10px] font-bold mb-4 flex items-center gap-1">
          {subtext}
        </p>
      )}

      {/* Progress Bar Container */}
      <div className="w-full h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ delay: delay + 0.3, duration: 1 }}
          className={`h-full ${color.split(' ')[2] || 'bg-primary'}`}
          style={{ backgroundColor: 'currentColor' }}
        />
      </div>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';

  const [page, setPage] = useState(0);
  const { data: postsData, isLoading: isLoadingPosts } = useQuery({
    queryKey: ['my-posts', page],
    queryFn: () => postService.getMyPosts({ page, size: 5 }),
  });

  const posts = postsData?.content || [];
  const totalPages = postsData?.totalPages || 0;

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['my-stats'],
    queryFn: () => postService.getStats(),
  });

  const {
    data: adminStats,
    isLoading: isAdminStatsLoading,
    isError: isAdminStatsError,
  } = useQuery({
    queryKey: ['admin-stats', 'dashboard'],
    queryFn: () => adminService.getPlatformStats(),
    enabled: isAdmin,
    retry: 1,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (isAdmin && isAdminStatsError) {
      toast.error('Failed to load platform analytics.');
    }
  }, [isAdmin, isAdminStatsError]);

  const safePosts = useMemo(() => Array.isArray(posts) ? posts : [], [posts]);
  const safeAdminStats = adminStats || EMPTY_ANALYTICS_STATS;

  const draftCount = useMemo(() => {
    const total = stats?.totalPosts || 0;
    const published = stats?.publishedPosts || 0;
    return Math.max(0, total - published);
  }, [stats]);

  const authorSnapshot = useMemo(() => {
    const totalPosts = stats?.totalPosts || 0;
    const publishedPosts = stats?.publishedPosts || 0;
    const publishRate = totalPosts > 0 ? Math.round((publishedPosts / totalPosts) * 100) : 0;
    const latestPublished = safePosts
      .filter((post) => post?.status === 'PUBLISHED' && post?.publishedAt)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())[0];

    return {
      draftPosts: draftCount,
      publishRate,
      latestPublishedText: latestPublished
        ? format(new Date(latestPublished.publishedAt), 'MMM dd, yyyy')
        : 'No live stories yet',
    };
  }, [safePosts, stats?.publishedPosts, stats?.totalPosts, draftCount]);

  const publishMutation = useMutation({
    mutationFn: (id) => postService.publishPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      queryClient.invalidateQueries({ queryKey: ['my-stats'] });
      if (isAdmin) {
        queryClient.invalidateQueries({ queryKey: ['admin-stats', 'dashboard'] });
      }
      toast.success('Strategy live on intelligence feed.');
    },
    onError: (err) => toast.error(err.message || 'Transmission failed.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => postService.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      queryClient.invalidateQueries({ queryKey: ['my-stats'] });
      if (isAdmin) {
        queryClient.invalidateQueries({ queryKey: ['admin-stats', 'dashboard'] });
      }
      toast.success('Asset purged.');
    },
    onError: (err) => toast.error(err.message || 'Purge failed.'),
  });

  if (isLoadingPosts || isLoadingStats || (isAdmin && isAdminStatsLoading)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 min-h-screen">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }} 
          transition={{ repeat: Infinity, duration: 2 }}
          className="size-16 relative"
        >
          <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
        </motion.div>
        <p className="mt-8 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Establishing Connection...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-12 lg:p-16">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="mb-16 flex flex-col md:flex-row md:items-center justify-between gap-10">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                Operations Center
              </div>
            </div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              Intelligence <span className="text-primary tracking-tighter decoration-primary/30 underline-offset-8">Dashboard</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-base mt-4 max-w-xl leading-relaxed">
              Synthesize your high-signal contributions and monitor network influence through real-time telemetry.
            </p>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <Link to="/editor" className="group relative flex items-center gap-4 bg-primary text-white pl-8 pr-10 py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 active:scale-95 transition-all overflow-hidden">
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="material-symbols-outlined text-xl transition-transform group-hover:rotate-90 duration-500">add_box</span>
              New Publication
            </Link>
          </motion.div>
        </div>

        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <StatCard 
            label="Published Posts" 
            value={stats?.publishedPosts || 0} 
            icon="edit_square" 
            color="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500"
            delay={0.1}
            subtext={stats?.publishedPosts > 0 ? `+${stats.publishedPosts} this week` : "0 this week"}
            progress={stats?.totalPosts > 0 ? (stats.publishedPosts / stats.totalPosts) * 100 : 0}
          />
          <StatCard 
            label="Total Comments" 
            value={stats?.totalComments || 0} 
            icon="forum" 
            color="bg-sky-50 dark:bg-sky-500/10 text-sky-500"
            delay={0.2}
            subtext={stats?.totalComments > 0 ? `+${stats.totalComments} total interaction` : "No interactions"}
            progress={75} // Placeholder for total interaction progress
          />
          <StatCard 
            label="Draft Posts" 
            value={draftCount} 
            icon="drafts" 
            color="bg-amber-50 dark:bg-amber-500/10 text-amber-500"
            delay={0.3}
            subtext={`${draftCount} pending signals`}
            progress={stats?.totalPosts > 0 ? (draftCount / stats.totalPosts) * 100 : 0}
          />
        </div>

        {/* Middle Section: Analytics or Snapshot */}
        {isAdmin ? (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-16"
          >
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Platform Analytics</h2>
                <div className="h-1 w-20 bg-primary mt-2 rounded-full"></div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[40px] border border-slate-100 dark:border-white/5 shadow-sm">
              {isAdminStatsError ? (
                <div className="py-20 text-center">
                  <span className="material-symbols-outlined text-6xl text-rose-200 dark:text-rose-900/40 mb-6">signal_disconnected</span>
                  <p className="text-rose-600 dark:text-rose-400 font-black text-sm uppercase tracking-widest">Telemetry Link Severed</p>
                  <p className="text-slate-400 text-sm mt-3">Unable to retrieve network performance datasets.</p>
                </div>
              ) : (
                <AdminCharts stats={safeAdminStats} variant="platform" />
              )}
            </div>
          </motion.section>
        ) : (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-16"
          >
            <div className="mb-8">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Performance Snapshot</h2>
              <div className="h-1 w-20 bg-primary mt-2 rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: 'Draft Queue', value: authorSnapshot.draftPosts, sub: 'Assets pending transmission' },
                { label: 'Publish Rate', value: `${authorSnapshot.publishRate}%`, sub: 'Efficiency optimization' },
                { label: 'Latest Live Story', value: authorSnapshot.latestPublishedText, sub: 'Most recent signal active' }
              ].map((item, i) => (
                <div key={i} className="group h-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-8 rounded-[32px] shadow-sm hover:shadow-xl transition-all duration-300">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-primary transition-colors">{item.label}</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white mt-4 group-hover:scale-105 origin-left transition-transform duration-300">{item.value}</p>
                  <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-2 italic">{item.sub}</p>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Main Table: Portfolio */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-black/40 overflow-hidden"
        >
          <div className="p-10 border-b border-slate-50 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Author Portfolio</h3>
              <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">Asset Management Protocol</p>
            </div>
            <div className="px-6 py-2.5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              {postsData?.totalElements || 0} Assets Indexed
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50/50 dark:bg-white/5">
                <tr>
                  <th className="pl-12 pr-6 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Designation</th>
                  <th className="px-6 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Registered Date</th>
                  <th className="pl-6 pr-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Operational Tools</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                <AnimatePresence mode="popLayout">
                  {posts.length === 0 ? (
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <td colSpan="4" className="px-10 py-32 text-center">
                        <div className="size-24 bg-slate-50 dark:bg-white/5 rounded-[32px] flex items-center justify-center mx-auto mb-8 text-slate-200 dark:text-slate-800 transition-transform hover:scale-110">
                          <span className="material-symbols-outlined text-5xl">folder_off</span>
                        </div>
                        <p className="text-slate-900 dark:text-white font-black uppercase tracking-[0.3em] text-sm">Portfolio Core is Empty</p>
                        <p className="text-slate-400 text-xs mt-3 font-medium">Initialize your first strategy to synchronize intelligence feeds.</p>
                        <Link to="/editor" className="inline-flex items-center gap-2 mt-8 text-primary font-black text-[10px] uppercase tracking-widest hover:gap-4 transition-all">
                          Start Creation <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                      </td>
                    </motion.tr>
                  ) : (
                    posts.map((post, index) => (
                      <motion.tr 
                        key={post.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + (index * 0.1) }}
                        className="hover:bg-slate-50/80 dark:hover:bg-white/5 transition-all group"
                      >
                        <td className="pl-12 pr-6 py-10">
                          <Link to={`/posts/${post.slug}`} className="font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors text-lg tracking-tight block max-w-sm xl:max-w-md line-clamp-1">
                            {post.title}
                          </Link>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">ID-{post.id?.slice(0, 8)}</span>
                            <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">/intel/{post.slug}</span>
                          </div>
                        </td>
                        <td className="px-6 py-10 text-center">
                          <div className="flex justify-center">
                            {post.status === 'PUBLISHED' ? (
                              <span className="relative flex items-center gap-2.5 rounded-2xl bg-emerald-500/5 text-emerald-500 px-5 py-2 text-[9px] font-black uppercase tracking-[0.2em] border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                                <span className="relative flex size-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                                </span>
                                Active Signal
                              </span>
                            ) : (
                              <span className="flex items-center gap-2.5 rounded-2xl bg-amber-500/5 text-amber-500 px-5 py-2 text-[9px] font-black uppercase tracking-[0.2em] border border-amber-500/20">
                                <span className="size-2 bg-amber-500/40 rounded-full"></span>
                                Staged Draft
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-10 text-slate-500 dark:text-slate-400 font-black text-xs uppercase tracking-tight">
                          <span className="text-slate-300 dark:text-slate-700 mr-2 opacity-50">TS:</span>
                          {format(new Date(post.createdAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="pl-6 pr-12 py-10 text-right">
                          <div className="flex justify-end gap-3 items-center opacity-70 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                            {post.status === 'DRAFT' && (
                              <button
                                onClick={() => publishMutation.mutate(post.id)}
                                className="bg-primary hover:bg-primary/90 text-white font-black text-[9px] uppercase tracking-widest px-5 py-2.5 rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                              >
                                Activate
                              </button>
                            )}
                            <Link to={`/editor/${post.id}`} className="size-11 flex items-center justify-center rounded-2xl bg-white dark:bg-white/5 text-slate-400 hover:text-primary transition-all border border-slate-100 dark:border-white/10 hover:border-primary/30 shadow-sm" title="Modify Asset">
                              <span className="material-symbols-outlined text-lg">settings_suggest</span>
                            </Link>
                            <button
                              onClick={() => {
                                if (confirm('Irreversible Operation: Purge this intelligence asset?')) {
                                  deleteMutation.mutate(post.id);
                                }
                              }}
                              className="size-11 flex items-center justify-center rounded-2xl bg-white dark:bg-white/5 text-slate-400 hover:text-rose-500 transition-all border border-slate-100 dark:border-white/10 hover:border-rose-500/30 shadow-sm"
                              title="Purge Sequence"
                            >
                              <span className="material-symbols-outlined text-lg">delete_sweep</span>
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          {totalPages >= 1 && (
            <div className="p-10 bg-slate-50/50 dark:bg-white/5 border-t border-slate-50 dark:border-white/5">
              <Pagination 
                currentPage={page} 
                totalPages={totalPages} 
                onPageChange={(newPage) => {
                  setPage(newPage);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} 
              />
            </div>
          )}
        </motion.div>

        {/* Support Section */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 1, duration: 1 }}
          className="mt-16 text-center"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 dark:text-slate-700">
            Secure Intelligence Node System v4.0.0
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
