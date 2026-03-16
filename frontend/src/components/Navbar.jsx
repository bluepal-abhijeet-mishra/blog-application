import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/feed" className="flex items-center gap-2 shrink-0">
          <div className="bg-primary text-white p-1.5 rounded-lg flex items-center justify-center shadow-sm shadow-primary/20">
            <span className="material-symbols-outlined">auto_stories</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">BlogSpace</h1>
        </Link>
        
        <div className="flex-1 max-w-2xl hidden md:block">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input 
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" 
              placeholder="Search for stories, people, or tags..." 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <a href="/api/feed.rss" className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors hidden sm:block" target="_blank" rel="noreferrer">
            RSS
          </a>
          {user ? (
            <>
              {(user.role === 'AUTHOR' || user.role === 'ADMIN') && (
                <Link to="/dashboard" className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors hidden sm:block">Dashboard</Link>
              )}
              {user.role === 'ADMIN' && (
                <Link to="/admin" className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors hidden sm:block">Admin</Link>
              )}
              <div className="flex items-center gap-2 ml-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:block">{user.displayName}</span>
                <button onClick={logout} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Logout">
                  <span className="material-symbols-outlined">logout</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                Login
              </Link>
              <Link to="/register" className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-emerald-700 rounded-lg shadow-sm shadow-primary/20 transition-all">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
