import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminService from '../api/services/adminService';
import postService from '../api/services/postService';
import applicationService from '../api/services/applicationService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const AdminPanel = () => {
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState('users');
  const [rejectionModal, setRejectionModal] = useState({ open: false, applicationId: null });
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminService.getAllUsers(),
    enabled: activeView === 'users',
  });

  const { data: postsData } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: () => adminService.getAllPosts(),
    enabled: activeView === 'posts',
  });

  const { data: commentsData } = useQuery({
    queryKey: ['admin-comments'],
    queryFn: () => adminService.getAllComments(),
    enabled: activeView === 'comments',
  });

  const { data: applicationsData } = useQuery({
    queryKey: ['admin-applications'],
    queryFn: () => applicationService.getAllApplications('PENDING'),
    enabled: activeView === 'applications',
  });

  const { data: platformStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminService.getPlatformStats(),
  });

  const promoteUserMutation = useMutation({
    mutationFn: ({ id, role }) => adminService.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('User role updated.');
    },
    onError: (err) => toast.error(err.message || 'Failed to update user role.'),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id) => adminService.forceDeleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Comment deleted.');
    },
    onError: (err) => toast.error(err.message || 'Failed to delete comment.'),
  });

  const unpublishPostMutation = useMutation({
    mutationFn: (id) => postService.unpublishPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Post moved to draft.');
    },
    onError: (err) => toast.error(err.message || 'Failed to unpublish post.'),
  });

  const deletePostMutation = useMutation({
    mutationFn: (id) => postService.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Post deleted.');
    },
    onError: (err) => toast.error(err.message || 'Failed to delete post.'),
  });

  const approveApplicationMutation = useMutation({
    mutationFn: (id) => applicationService.approveApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Application approved. User promoted to Author.');
    },
    onError: (err) => toast.error(err.response?.data || 'Failed to approve application'),
  });

  const rejectApplicationMutation = useMutation({
    mutationFn: ({ id, reason }) => applicationService.rejectApplication(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
      setRejectionModal({ open: false, applicationId: null });
      setRejectionReason('');
      toast.success('Application rejected.');
    },
    onError: (err) => toast.error(err.response?.data || 'Failed to reject application'),
  });

  const getNextRole = (role) => {
    if (role === 'READER') return 'AUTHOR';
    if (role === 'AUTHOR') return 'ADMIN';
    return null;
  };

  const handlePromoteUser = (u) => {
    const nextRole = getNextRole(u.role);
    if (!nextRole) return;
    promoteUserMutation.mutate({ id: u.id, role: nextRole });
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection.');
      return;
    }
    rejectApplicationMutation.mutate({ id: rejectionModal.applicationId, reason: rejectionReason });
  };

  const viewTabs = [
    { key: 'users', label: 'Users', badge: users?.length || 0 },
    { key: 'posts', label: 'Posts', badge: postsData?.totalElements || 0 },
    { key: 'comments', label: 'Comments', badge: commentsData?.totalElements || 0 },
    { key: 'applications', label: 'Applications', badge: applicationsData?.length || 0 },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16">
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">System Control</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">High-level administration for the BlogSpace network.</p>
          </div>
          <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
            {viewTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveView(tab.key)}
                className={`relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeView === tab.key ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.label}
                {tab.badge > 0 && <span className="text-[10px] text-slate-400">({tab.badge})</span>}
                {activeView === tab.key && (
                  <motion.div layoutId="tab-active" className="absolute inset-0 bg-primary/10 rounded-xl -z-10" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            {[
              { label: 'Total Users', value: platformStats?.totalUsers || 0, icon: 'group' },
              { label: 'Authors', value: platformStats?.authorCount || 0, icon: 'verified' },
              { label: 'Posts', value: platformStats?.totalPosts || 0, icon: 'article' },
              { label: 'Comments', value: platformStats?.totalComments || 0, icon: 'chat' },
            ].map((stat, i) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i}
                className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="size-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                    <span className="material-symbols-outlined text-lg">{stat.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">{stat.label}</h3>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stat.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="lg:col-span-3">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                    {activeView === 'users' && (
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    )}
                    {activeView === 'posts' && (
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Post</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    )}
                    {activeView === 'comments' && (
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Comment</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Author</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    )}
                    {activeView === 'applications' && (
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Applicant</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bio</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeView === 'users' && users?.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-8 py-5">
                          <p className="font-black text-slate-900 dark:text-white">{u.displayName}</p>
                          <p className="text-[10px] font-bold text-slate-400 tracking-tight">{u.email}</p>
                        </td>
                        <td className="px-8 py-5">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-slate-50 text-slate-500 border-slate-200">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          {getNextRole(u.role) ? (
                            <button
                              onClick={() => handlePromoteUser(u)}
                              className="px-4 py-2 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20"
                            >
                              Promote to {getNextRole(u.role)}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-bold">Highest role</span>
                          )}
                        </td>
                      </tr>
                    ))}

                    {activeView === 'posts' && (postsData?.content?.length > 0 ? postsData.content.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-8 py-5">
                          <p className="font-black text-slate-900 dark:text-white">{p.title}</p>
                          <p className="text-[10px] font-bold text-slate-400 tracking-tight">{p.authorName} • {format(new Date(p.createdAt), 'MMM dd, yyyy')}</p>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-xs font-black text-slate-500">{p.status}</span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            {p.status === 'PUBLISHED' && (
                              <button
                                onClick={() => unpublishPostMutation.mutate(p.id)}
                                className="px-4 py-2 border border-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-xl"
                              >
                                Unpublish
                              </button>
                            )}
                            <button
                              onClick={() => deletePostMutation.mutate(p.id)}
                              className="px-4 py-2 border border-rose-100 text-rose-500 text-[9px] font-black uppercase tracking-widest rounded-xl"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="3" className="px-8 py-20 text-center text-slate-400 text-sm font-bold">No posts found.</td>
                      </tr>
                    ))}

                    {activeView === 'comments' && (commentsData?.content?.length > 0 ? commentsData.content.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-8 py-5">
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 max-w-md italic leading-relaxed">"{c.content}"</p>
                        </td>
                        <td className="px-8 py-5">
                          <p className="font-black text-slate-900 dark:text-white">{c.authorName}</p>
                          <p className="text-[10px] font-bold text-slate-400 tracking-tight">{format(new Date(c.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button
                            onClick={() => deleteCommentMutation.mutate(c.id)}
                            className="px-4 py-2 border border-rose-100 text-rose-500 text-[9px] font-black uppercase tracking-widest rounded-xl"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="3" className="px-8 py-20 text-center text-slate-400 text-sm font-bold">No comments found.</td>
                      </tr>
                    ))}

                    {activeView === 'applications' && (applicationsData?.length === 0 ? (
                      <tr><td colSpan="3" className="px-8 py-20 text-center">
                        <p className="text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs">No pending applications.</p>
                      </td></tr>
                    ) : applicationsData.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-8 py-5">
                          <p className="font-black text-slate-900 dark:text-white leading-tight">{app.userDisplayName}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-tight">{app.userEmail}</p>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 max-w-xs italic leading-relaxed">"{app.bio}"</p>
                        </td>
                        <td className="px-8 py-5 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-3">
                            <button onClick={() => approveApplicationMutation.mutate(app.id)} className="px-4 py-2 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20">Approve</button>
                            <button onClick={() => setRejectionModal({ open: true, applicationId: app.id })} className="px-4 py-2 border border-rose-100 dark:border-rose-900/30 text-rose-500 text-[9px] font-black uppercase tracking-widest rounded-xl">Reject</button>
                          </div>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {rejectionModal.open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] p-10 border border-slate-100 dark:border-slate-800 shadow-2xl">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Reject Request</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8">Provide feedback for the applicant.</p>

              <textarea
                className="w-full h-32 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-slate-300"
                placeholder="Missing expertise documentation, insufficient bio, etc..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />

              <div className="flex flex-col gap-3 mt-8">
                <button onClick={handleReject} className="w-full h-12 bg-rose-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:bg-rose-600 active:scale-95 transition-all">Finalize Rejection</button>
                <button onClick={() => setRejectionModal({ open: false, applicationId: null })} className="w-full h-12 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-all">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;
