import { useQuery } from '@tanstack/react-query';
import applicationService from '../api/services/applicationService';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const MyApplications = () => {
  const { user } = useAuth();

  const { data: applications, isLoading } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => applicationService.getMyApplications(),
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="size-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
        <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Request Records...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-12 lg:p-16">
      <div className="mx-auto max-w-5xl">
        
        {/* Modern Header */}
        <div className="mb-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
              <span className="material-symbols-outlined text-sm">shield</span>
              Credential Verification
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Access Log</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Track the status of your requests to join the verified contributor network.</p>
          </motion.div>
        </div>

        {/* Applications List */}
        <div className="space-y-6">
          {applications?.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 p-16 text-center shadow-sm"
            >
              <div className="size-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-8 text-slate-300">
                <span className="material-symbols-outlined text-4xl">inventory_2</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No Requests Logged</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-10 max-w-sm mx-auto">You haven't initiated a contributor verification process yet. Become an author to share your expertise.</p>
              <Link to="/feed" className="inline-flex items-center gap-3 bg-primary text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                Access Feed
              </Link>
            </motion.div>
          ) : (
            applications?.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map((app, idx) => (
              <motion.div 
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-8 flex flex-col md:flex-row gap-8 items-start shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Status Icon */}
                <div className={`size-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  app.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-500' :
                  app.status === 'REJECTED' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500 animate-pulse'
                }`}>
                  <span className="material-symbols-outlined text-2xl">
                    {app.status === 'APPROVED' ? 'verified_user' : 
                     app.status === 'REJECTED' ? 'error' : 'hourglass_top'}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Verification Request #{app.id.substring(0, 8)}</h3>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
                        Logged on {format(new Date(app.createdAt), 'MMMM dd, yyyy @ HH:mm')}
                      </p>
                    </div>
                    <div>
                       <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                         app.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                         app.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                         'bg-amber-50 text-amber-600 border-amber-100'
                       }`}>
                         {app.status === 'APPROVED' ? 'Access Granted' :
                          app.status === 'REJECTED' ? 'Verification Denied' : 'Pending Review'}
                       </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/50 mb-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Submission Motivation</p>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 italic leading-relaxed">"{app.bio}"</p>
                  </div>

                  {app.status === 'REJECTED' && app.rejectionReason && (
                    <div className="bg-rose-50/50 dark:bg-rose-950/10 rounded-2xl p-6 border border-rose-100/50 dark:border-rose-900/20">
                       <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3">Feedback from Network Admin</p>
                       <p className="text-sm font-bold text-rose-700 dark:text-rose-400 leading-relaxed italic">"{app.rejectionReason}"</p>
                    </div>
                  )}

                  {app.status === 'APPROVED' && (
                    <div className="flex items-center gap-3 text-emerald-600">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <p className="text-[11px] font-black uppercase tracking-widest">Protocol complete. Author dashboard activated.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MyApplications;
