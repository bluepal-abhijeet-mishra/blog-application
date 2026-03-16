import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
  const location = useLocation();
  
  // Routes that should NOT have the global Navbar and Footer
  const isBespokeLayout = location.pathname === '/' || 
                          location.pathname.startsWith('/dashboard') || 
                          location.pathname.startsWith('/admin') || 
                          location.pathname.startsWith('/editor');

  if (isBespokeLayout) {
    return (
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
        {children}
      </div>
    );
  }

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
