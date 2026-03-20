import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import applicationService from '../api/services/applicationService';
import AuthorApplicationModal from './AuthorApplicationModal';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { icon: 'home', label: 'Feed', path: '/feed', roles: ['READER', 'AUTHOR', 'ADMIN'] },
  { icon: 'explore', label: 'Explore', path: '/search', roles: ['READER', 'AUTHOR', 'ADMIN'] },
  { icon: 'dashboard', label: 'Dashboard', path: '/dashboard', roles: ['AUTHOR', 'ADMIN'] },
  { icon: 'edit_note', label: 'Write', path: '/editor', roles: ['AUTHOR', 'ADMIN'] },
  { icon: 'admin_panel_settings', label: 'Admin', path: '/admin', roles: ['ADMIN'] },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  // Fetch reader's application status
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
      <aside className="fixed left-0 top-0 bottom-0 w-[72px] bg-slate-900 flex flex-col items-center z-50 border-r border-white/5 shadow-2xl">
        {/* Premium Logo */}
        <Link
          to="/feed"
          className="mt-6 mb-8 w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 hover:scale-110 active:scale-95 transition-all duration-300 group"
        >
          <span className="material-symbols-outlined text-white text-2xl group-hover:rotate-12 transition-transform">edit_square</span>
        </Link>

        {/* Navigation Section */}
        <nav className="flex-1 flex flex-col items-center gap-2 w-full px-3">
          {visibleItems.map((item) => (
            <div key={item.path} className="relative w-full">
              <Link
                to={item.path}
                onMouseEnter={() => setHoveredItem(item.path)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`w-full h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative group ${
                  isActive(item.path)
                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined text-2xl font-light">{item.icon}</span>
                
                {isActive(item.path) && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
              
              {/* Refined Tooltip */}
              <AnimatePresence>
                {hoveredItem === item.path && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-2xl z-[100] pointer-events-none whitespace-nowrap border border-white/10"
                  >
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-800"></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {/* Role-Specific Special Actions */}
          {user.role === 'READER' && (
            <div className="w-8 h-px bg-white/5 my-2"></div>
          )}

          {user.role === 'READER' && (
            <>
              <div className="relative w-full">
                <button
                  onClick={handleBecomeAuthor}
                  onMouseEnter={() => setHoveredItem('become-author')}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`w-full h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative group ${
                    hasPendingApplication
                      ? 'bg-amber-500/10 text-amber-500'
                      : 'text-slate-500 hover:text-primary hover:bg-primary/10'
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl font-light">
                    {hasPendingApplication ? 'hourglass_top' : 'badge'}
                  </span>
                  {hasPendingApplication && (
                    <span className="absolute top-2 right-3 size-2 bg-amber-500 rounded-full animate-pulse shadow-sm shadow-amber-500/50"></span>
                  )}
                </button>
                <AnimatePresence>
                  {hoveredItem === 'become-author' && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-2xl z-[100] pointer-events-none whitespace-nowrap border border-white/10"
                    >
                      {hasPendingApplication ? 'Pending Review' : 'Become Author'}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-800"></div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative w-full">
                <Link
                  to="/my-applications"
                  onMouseEnter={() => setHoveredItem('my-apps')}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`w-full h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative group ${
                    isActive('/my-applications')
                      ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                      : 'text-slate-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl font-light">assignment</span>
                </Link>
                <AnimatePresence>
                  {hoveredItem === 'my-apps' && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-2xl z-[100] pointer-events-none whitespace-nowrap border border-white/10"
                    >
                      My Applications
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-800"></div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </nav>

        {/* User & Settings Section */}
        <div className="w-full flex flex-col items-center gap-4 p-3 mb-6">
          <div className="w-8 h-px bg-white/5"></div>

          {/* Profile Group */}
          <div className="relative group w-full">
            <div
              className="w-full h-12 flex items-center justify-center cursor-pointer"
              onMouseEnter={() => setHoveredItem('user-profile')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div className="size-10 rounded-[14px] border-2 border-white/10 hover:border-primary transition-all p-0.5 group-hover:scale-105">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'U')}&background=10b981&color=fff&bold=true&size=80`}
                  className="w-full h-full object-cover rounded-[10px]"
                  alt="Profile"
                />
              </div>
            </div>
            
            <AnimatePresence>
              {hoveredItem === 'user-profile' && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-slate-800 text-white p-4 rounded-2xl shadow-2xl z-[100] pointer-events-none border border-white/10 min-w-[160px]"
                >
                  <p className="font-black text-sm tracking-tight">{user?.displayName}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{user?.role}</p>
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-800"></div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative w-full flex justify-center">
            <button
              onClick={() => { logout(); navigate('/'); }}
              onMouseEnter={() => setHoveredItem('logout')}
              onMouseLeave={() => setHoveredItem(null)}
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all group"
            >
              <span className="material-symbols-outlined text-2xl font-light">logout</span>
            </button>
            <AnimatePresence>
              {hoveredItem === 'logout' && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-rose-500 text-white text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-2xl z-[100] pointer-events-none whitespace-nowrap border border-white/10"
                >
                  Sign Out
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-rose-500"></div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>

      <AuthorApplicationModal
        isOpen={isApplicationModalOpen}
        onClose={handleApplicationClose}
      />
    </>
  );
};

export default Sidebar;
