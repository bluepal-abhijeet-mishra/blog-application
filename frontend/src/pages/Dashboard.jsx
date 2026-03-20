import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import postService from '../api/services/postService';
import adminService from '../api/services/adminService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
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

const Dashboard = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
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

  const safePosts = Array.isArray(posts) ? posts : [];
  const safeAdminStats = adminStats || EMPTY_ANALYTICS_STATS;

  const authorSnapshot = useMemo(() => {
    const totalPosts = stats?.totalPosts || 0;
    const publishedPosts = stats?.publishedPosts || 0;
    const draftPosts = Math.max(0, totalPosts - publishedPosts);
    const publishRate = totalPosts > 0 ? Math.round((publishedPosts / totalPosts) * 100) : 0;
    const latestPublished = safePosts
      .filter((post) => post?.status === 'PUBLISHED' && post?.publishedAt)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())[0];

    return {
      draftPosts,
      publishRate,
      latestPublishedText: latestPublished
        ? format(new Date(latestPublished.publishedAt), 'MMM dd, yyyy')
        : 'No live stories yet',
    };
  }, [safePosts, stats?.publishedPosts, stats?.totalPosts]);

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
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="size-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
        <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-12 lg:p-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Intelligence Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Manage your high-signal contributions and track network impact.</p>
          </motion.div>
          <Link to="/editor" className="flex items-center gap-3 bg-primary text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-lg">add_box</span>
            New Publication
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Intelligence Assets', value: stats?.totalPosts || 0, icon: 'article' },
            { label: 'Active Signals', value: stats?.publishedPosts || 0, icon: 'rocket_launch' },
            { label: 'Network Responses', value: stats?.totalComments || 0, icon: 'forum' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="size-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400">
                  <span className="material-symbols-outlined">{stat.icon}</span>
                </div>
              </div>
              <h3 className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">{stat.label}</h3>
              <p className="text-4xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {isAdmin ? (
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Platform Analytics</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
                  Live network intelligence graphs for growth, publishing, and distribution.
                </p>
              </div>
            </div>

            {isAdminStatsError ? (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl p-8 text-center">
                <p className="text-rose-600 dark:text-rose-400 font-black text-sm uppercase tracking-widest">Analytics unavailable</p>
                <p className="text-rose-500 dark:text-rose-400 text-sm mt-2">Could not fetch chart data from `/api/admin/stats`.</p>
              </div>
            ) : (
              <AdminCharts stats={safeAdminStats} variant="platform" />
            )}
          </motion.section>
        ) : (
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="mb-5">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Author Performance Snapshot</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
                Focused personal insights are shown here. Platform-level analytics are available to administrators only.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Draft Queue</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">{authorSnapshot.draftPosts}</p>
              </div>

              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Publish Rate</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-2">{authorSnapshot.publishRate}%</p>
              </div>

              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Latest Live Story</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-2">{authorSnapshot.latestPublishedText}</p>
              </div>
            </div>
          </motion.section>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/40 dark:shadow-black/20 overflow-hidden"
        >
          <div className="p-8 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Author Portfolio</h3>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {postsData?.totalElements || 0} Assets Found
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50/50 dark:bg-slate-800/20">
                <tr>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Title</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Protocol Status</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-10 py-24 text-center">
                      <span className="material-symbols-outlined text-5xl text-slate-200 block mb-4">edit_note</span>
                      <p className="text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs">Portfolio is Vacant</p>
                      <p className="text-slate-400 text-xs mt-1">Begin your publishing journey to see analytics.</p>
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-10 py-8">
                        <Link to={`/posts/${post.slug}`} className="font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors text-base tracking-tight block max-w-md line-clamp-1">{post.title}</Link>
                        <div className="text-[10px] text-slate-400 mt-1 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                          <span className="material-symbols-outlined text-[10px]">link</span>
                          /intelligence/{post.slug}
                        </div>
                      </td>
                      <td className="px-10 py-8 text-center">
                        {post.status === 'PUBLISHED' ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-600 px-4 py-1.5 text-[9px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                            <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            ACTIVE SIGNAL
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 text-slate-400 px-4 py-1.5 text-[9px] font-black uppercase tracking-widest border border-slate-100">
                            <span className="size-1.5 bg-slate-300 rounded-full"></span>
                            STAGED DRAFT
                          </span>
                        )}
                      </td>
                      <td className="px-10 py-8 text-slate-500 font-bold text-xs uppercase tracking-tighter">
                        {format(new Date(post.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="flex justify-end gap-3 items-center">
                          {post.status === 'DRAFT' && (
                            <button
                              onClick={() => publishMutation.mutate(post.id)}
                              className="bg-primary hover:bg-primary/90 text-white font-black text-[9px] uppercase tracking-widest px-4 py-2 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105"
                            >
                              Activate
                            </button>
                          )}
                          <Link to={`/editor/${post.id}`} className="size-10 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary transition-all border border-transparent hover:border-primary/20" title="Edit">
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </Link>
                          <button
                            onClick={() => {
                              if (confirm('Purge this asset?')) {
                                deleteMutation.mutate(post.id);
                              }
                            }}
                            className="size-10 flex items-center justify-center rounded-2xl bg-rose-50/50 dark:bg-rose-900/10 text-rose-300 hover:text-rose-500 transition-all border border-transparent hover:border-rose-500/20"
                            title="Purge"
                          >
                            <span className="material-symbols-outlined text-lg">delete_forever</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages >= 1 && (
            <div className="px-8 bg-slate-50/30 dark:bg-slate-800/10">
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
      </div>
    </div>
  );
};

export default Dashboard;
