import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, LogOut, User as UserIcon } from 'lucide-react';
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
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-blue-600">BlogApp</Link>
            <form onSubmit={handleSearch} className="ml-8 relative">
              <input
                type="text"
                placeholder="Search posts..."
                className="pl-10 pr-4 py-1 border rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1.5 w-4 h-4 text-gray-400" />
            </form>
          </div>

          <div className="flex items-center gap-4">
            <a href="/api/feed.rss" className="text-sm text-orange-500 font-semibold" target="_blank">RSS</a>
            {user ? (
              <>
                {(user.role === 'AUTHOR' || user.role === 'ADMIN') && (
                  <Link to="/dashboard" className="text-sm font-medium hover:text-blue-600">Dashboard</Link>
                )}
                {user.role === 'ADMIN' && (
                  <Link to="/admin" className="text-sm font-medium hover:text-blue-600">Admin</Link>
                )}
                <div className="flex items-center gap-2 ml-4">
                  <UserIcon className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium">{user.displayName}</span>
                  <button onClick={logout} className="ml-2">
                    <LogOut className="w-4 h-4 text-gray-500 hover:text-red-500" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-4">
                <Link to="/login" className="text-sm font-medium hover:text-blue-600">Login</Link>
                <Link to="/register" className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700">Register</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
