import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Routes that should NOT have any chrome (landing, login, register)
  const isBarePage = location.pathname === '/' ||
                     location.pathname === '/login' ||
                     location.pathname === '/register';

  if (isBarePage) {
    return (
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
        {children}
      </div>
    );
  }

  // Authenticated pages get the sidebar + top bar layout
  if (user) {
    return (
      <div className="flex min-h-screen bg-[#f8fafc] dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
        <Sidebar />
        <div className="flex-1 flex flex-col ml-[72px] min-w-0">
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // Unauthenticated but not on landing/auth pages (e.g., /feed, /posts/:slug while logged out)
  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
