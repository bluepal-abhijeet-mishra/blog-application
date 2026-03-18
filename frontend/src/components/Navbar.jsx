import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Authenticated Top Bar (Dashboard Style)
  if (user) {
    return (
      <header className="h-[72px] bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-slate-900/80">
        <div className="flex-1 max-w-xl">
          <form onSubmit={handleSearch} className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
            <input
              type="text"
              placeholder="Search reports, insights, and stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-12 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
            />
          </form>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="/api/feed.rss"
            target="_blank"
            rel="noreferrer"
            className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors"
          >
            RSS
          </a>
          <button className="relative p-2 text-slate-500 hover:text-primary transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 size-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
          </button>
          
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

          <div className="flex items-center gap-3 relative">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{user.displayName}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{user.role}</p>
            </div>
            
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="size-10 rounded-xl overflow-hidden border-2 border-transparent hover:border-primary transition-all p-0.5"
            >
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=10b981&color=fff&bold=true&size=80`} 
                alt="Profile" 
                className="w-full h-full object-cover rounded-lg"
              />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-3 w-56 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-[60]"
                >
                  <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                    <span className="material-symbols-outlined text-lg">person</span>
                    Profile Settings
                  </Link>
                  <button 
                    onClick={() => { logout(); navigate('/'); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>
    );
  }

  // Unauthenticated Header (Landing Style)
  return (
    <header className="h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-900 flex items-center justify-between px-6 md:px-12 sticky top-0 z-40">
      <Link to="/" className="flex items-center gap-3">
        <div className="bg-primary text-white p-2 rounded-xl shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined text-2xl">auto_stories</span>
        </div>
        <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">BlogSpace</span>
      </Link>

      <div className="hidden md:flex items-center gap-10">
        <Link to="/feed" className="text-sm font-black text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">Intelligence Feed</Link>
        <Link to="/search" className="text-sm font-black text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">Network Search</Link>
        <a href="/api/feed.rss" target="_blank" rel="noreferrer" className="text-sm font-black text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">RSS</a>
      </div>

      <div className="flex items-center gap-4">
        <Link to="/login" className="px-6 py-2.5 text-sm font-black text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">Login</Link>
        <Link to="/register" className="px-7 py-2.5 bg-primary text-white text-sm font-black rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95">
          Join Network
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
