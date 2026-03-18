import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import adminService from '../api/services/adminService';
import postService from '../api/services/postService';
import applicationService from '../api/services/applicationService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const AdminPanel = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('users');
  const [rejectionModal, setRejectionModal] = useState({ open: false, applicationId: null });
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminService.getAllUsers(),
    enabled: activeView === 'users'
  });

  const { data: postsData, isLoading: isLoadingPosts } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: () => adminService.getAllPosts(),
    enabled: activeView === 'posts'
  });

  const { data: commentsData, isLoading: isLoadingComments } = useQuery({
    queryKey: ['admin-comments'],
    queryFn: () => adminService.getAllComments(),
    enabled: activeView === 'comments'
  });

  const { data: applicationsData, isLoading: isLoadingApplications } = useQuery({
    queryKey: ['admin-applications'],
    queryFn: () => applicationService.getAllApplications('PENDING'),
    enabled: activeView === 'applications'
  });

  const { data: platformStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminService.getPlatformStats(),
  });

  const approveApplicationMutation = useMutation({
    mutationFn: (id) => applicationService.approveApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-applications']);
      queryClient.invalidateQueries(['admin-users']);
      queryClient.invalidateQueries(['admin-stats']);
      toast.success('Application approved. User promoted to Author.');
    },
    onError: (err) => toast.error(err.response?.data || 'Failed to approve application'),
  });

  const rejectApplicationMutation = useMutation({
    mutationFn: ({ id, reason }) => applicationService.rejectApplication(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-applications']);
      setRejectionModal({ open: false, applicationId: null });
      setRejectionReason('');
      toast.success('Application rejected.');
    },
    onError: (err) => toast.error(err.response?.data || 'Failed to reject application'),
  });

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection.');
      return;
    }
    rejectApplicationMutation.mutate({ id: rejectionModal.applicationId, reason: rejectionReason });
  };

  const viewTabs = [
    { key: 'users', label: 'Users', icon: 'group' },
    { key: 'posts', label: 'Posts', icon: 'description' },
    { key: 'comments', label: 'Comments', icon: 'chat_bubble' },
    { key: 'applications', label: 'Applications', icon: 'badge', badge: applicationsData?.length },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16">
        
        {/* Modern Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">System Control</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">High-level administration for the BlogSpace intelligence network.</p>
          </div>
          <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
            {viewTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveView(tab.key)}
                className={`relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeView === tab.key ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.label}
                {tab.badge > 0 && <span className="size-2 bg-primary rounded-full animate-pulse"></span>}
                {activeView === tab.key && (
                  <motion.div layoutId="tab-active" className="absolute inset-0 bg-primary/10 rounded-xl -z-10" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Stats */}
          <div className="space-y-4">
             {[
              { label: 'Total Network Nodes', value: platformStats?.totalUsers || 0, icon: 'hub' },
              { label: 'Verified Authors', value: platformStats?.authorCount || 0, icon: 'verified' },
              { label: 'Intelligence Assets', value: platformStats?.totalPosts || 0, icon: 'article' },
              { label: 'Network Signals', value: platformStats?.totalComments || 0, icon: 'bubble_chart' },
            ].map((stat, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i} 
                className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
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

          {/* Main Table Area */}
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
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identifier</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Network Access</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Protocol</th>
                      </tr>
                    )}
                    {activeView === 'applications' && (
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Requesting Node</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Motivation Case</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Verification</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {/* Simplified User Row for brevity, applying to all views */}
                    {activeView === 'users' && users?.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl p-0.5 bg-primary/5 border border-primary/20 shrink-0">
                               <img className="w-full h-full object-cover rounded-[8px]" alt="" src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName)}&background=10b981&color=fff&bold=true&size=80`} />
                            </div>
                            <div>
                              <p className="font-black text-slate-900 dark:text-white leading-tight">{u.displayName}</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-tight">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                           <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                             u.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-600 border-indigo-200/50' : 
                             u.role === 'AUTHOR' ? 'bg-primary/5 text-primary border-primary/20' : 
                             'bg-slate-50 text-slate-500 border-slate-200'
                           }`}>
                             <span className={`size-1 rounded-full ${u.role === 'ADMIN' ? 'bg-indigo-500' : u.role === 'AUTHOR' ? 'bg-primary' : 'bg-slate-400'}`}></span>
                             {u.role}
                           </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-2">
                             {u.role === 'READER' && <button className="px-4 py-1.5 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20">Elevate</button>}
                             <button className="size-9 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 transition-all"><span className="material-symbols-outlined text-lg">shield_person</span></button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Applications View */}
                    {activeView === 'applications' && (applicationsData?.length === 0 ? (
                      <tr><td colSpan="3" className="px-8 py-20 text-center">
                        <div className="size-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-4">
                          <span className="material-symbols-outlined text-3xl">verified</span>
                        </div>
                        <p className="text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs">Queue Optimized</p>
                        <p className="text-slate-400 text-xs mt-1">All author pending requests have been addressed.</p>
                      </td></tr>
                    ) : applicationsData?.map(app => (
                       <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                             <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-black text-xs shrink-0">
                               {app.userDisplayName?.substring(0,2).toUpperCase()}
                             </div>
                             <div>
                               <p className="font-black text-slate-900 dark:text-white leading-tight">{app.userDisplayName}</p>
                               <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-tight">{app.userEmail}</p>
                             </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 max-w-xs italic leading-relaxed">"{app.bio}"</p>
                        </td>
                        <td className="px-8 py-5 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-3">
                            <button onClick={() => approveApplicationMutation.mutate(app.id)} className="px-4 py-2 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all">Grant Access</button>
                            <button onClick={() => setRejectionModal({ open: true, applicationId: app.id })} className="px-4 py-2 border border-rose-100 dark:border-rose-900/30 text-rose-500 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">Deny</button>
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
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Deny Request</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8">Provide specific feedback for the applicant to address in future submissions.</p>
              
              <textarea 
                className="w-full h-32 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-slate-300"
                placeholder="Missing expertise documentation, insufficient bio, etc..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />

              <div className="flex flex-col gap-3 mt-8">
                <button onClick={handleReject} className="w-full h-12 bg-rose-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:bg-rose-600 active:scale-95 transition-all">Finalize Denial</button>
                <button onClick={() => setRejectionModal({ open: false })} className="w-full h-12 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-all">Abandon</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;
