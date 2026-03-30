import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import applicationService from '../api/services/applicationService';
import AuthorApplicationModal from './AuthorApplicationModal';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { icon: 'grid_view', label: 'Dashboard', path: '/dashboard', roles: ['AUTHOR', 'ADMIN'] },
  { icon: 'home', label: 'Home Feed', path: '/feed', roles: ['READER', 'AUTHOR', 'ADMIN'] },
  { icon: 'explore', label: 'Explore', path: '/search', roles: ['READER', 'AUTHOR', 'ADMIN'] },
  { icon: 'edit_note', label: 'Create Post', path: '/editor', roles: ['AUTHOR', 'ADMIN'] },
  { icon: 'admin_panel_settings', label: 'Admin Panel', path: '/admin', roles: ['ADMIN'] },
];

const Sidebar = ({ isExpanded, setIsExpanded }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);

  const { data: myApplications, refetch: refetchApplications } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => applicationService.getMyApplications(),
    enabled: !!user && user.role === 'READER',
    staleTime: 60000,
  });

  const latestApplication = myApplications?.length > 0
    ? myApplications.reduce((latest, app) =>
        new Date(app.createdAt) > new Date(latest.createdAt) ? app : latest
      )
    : null;

  const hasPendingApplication = latestApplication?.status === 'PENDING';

  const handleBecomeAuthor = () => {
    if (hasPendingApplication) {
      navigate('/my-applications');
    } else {
      setIsApplicationModalOpen(true);
    }
  };

  const handleApplicationClose = () => {
    setIsApplicationModalOpen(false);
    refetchApplications();
  };

  const isActive = (path) => {
    if (path === '/feed') return location.pathname === '/feed';
    return location.pathname.startsWith(path);
  };

  if (!user) return null;

  const visibleItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <>
      <motion.aside
        initial={{ width: 72 }}
        animate={{ width: isExpanded ? 240 : 72 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 bottom-0 bg-white dark:bg-slate-900 flex flex-col z-50 border-r border-slate-100 dark:border-white/5 shadow-xl overflow-hidden"
      >
        {/* Top Header Section */}
        <div className="h-20 flex items-center px-4 relative">
          <AnimatePresence mode="wait">
            {!isExpanded ? (
              <motion.button
                key="menu-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsExpanded(true)}
                className="size-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors absolute left-4"
              >
                <span className="material-symbols-outlined text-2xl">menu</span>
              </motion.button>
            ) : (
              <motion.div
                key="expanded-header"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <span className="material-symbols-outlined text-white text-xl">edit_square</span>
                  </div>
                  <span className="font-black text-slate-900 dark:text-white tracking-tight">BlogSpace</span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-1.5 mt-4">
          {visibleItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center h-12 rounded-xl transition-all duration-200 group relative ${
                  active
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="size-12 shrink-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[23px]">{item.icon}</span>
                </div>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="text-sm font-bold whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {!isExpanded && (
                   <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all pointer-events-none z-50 whitespace-nowrap shadow-xl border border-white/5">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}

          {/* My Public Feed (Author/Admin Only) */}
          {(user.role === 'AUTHOR' || user.role === 'ADMIN') && (
            <Link
              to={`/feed?authorId=${user.id}`}
              className={`flex items-center h-12 rounded-xl transition-all duration-200 group relative ${
                location.search.includes(`authorId=${user.id}`)
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="size-12 shrink-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-[23px]">contact_page</span>
              </div>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-sm font-bold whitespace-nowrap"
                  >
                    My Public Feed
                  </motion.span>
                )}
              </AnimatePresence>

              {!isExpanded && (
                 <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all pointer-events-none z-50 whitespace-nowrap shadow-xl border border-white/5">
                  My Public Feed
                </div>
              )}
            </Link>
          )}

          {/* Special Actions (Reader Only) */}
          {user.role === 'READER' && (
            <div className="pt-4 border-t border-slate-100 dark:border-white/5 mt-4 space-y-1.5">
              <button
                onClick={handleBecomeAuthor}
                className={`flex items-center w-full h-12 rounded-xl transition-all duration-200 group relative ${
                  hasPendingApplication
                    ? 'bg-amber-500/10 text-amber-500'
                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <div className="size-12 shrink-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[23px]">
                    {hasPendingApplication ? 'hourglass_top' : 'badge'}
                  </span>
                </div>
                {isExpanded && (
                  <span className="text-sm font-bold whitespace-nowrap">
                    {hasPendingApplication ? 'Pending Review' : 'Become Author'}
                  </span>
                )}
              </button>
            </div>
          )}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-slate-100 dark:border-white/5 space-y-4">
          <div className="flex items-center gap-3 h-12 px-1">
            <div className="size-10 rounded-xl border-2 border-slate-100 dark:border-white/10 p-0.5 overflow-hidden shrink-0">
               <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'U')}&background=10b981&color=fff&bold=true&size=80`}
                  className="w-full h-full object-cover rounded-lg"
                  alt="Profile"
                />
            </div>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col min-w-0"
              >
                <span className="text-sm font-black text-slate-900 dark:text-white truncate tracking-tight">{user.displayName}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{user.role}</span>
              </motion.div>
            )}
          </div>

          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center w-full h-12 rounded-xl text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 transition-all group relative"
          >
            <div className="size-12 shrink-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-[23px]">logout</span>
            </div>
            {isExpanded && (
              <span className="text-sm font-bold whitespace-nowrap">Logout System</span>
            )}
            {!isExpanded && (
               <div className="absolute left-full ml-4 px-3 py-1.5 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all pointer-events-none z-50 whitespace-nowrap shadow-xl">
                Sign Out
              </div>
            )}
          </button>
        </div>
      </motion.aside>

      <AuthorApplicationModal
        isOpen={isApplicationModalOpen}
        onClose={handleApplicationClose}
      />
    </>
  );
};

export default Sidebar;
