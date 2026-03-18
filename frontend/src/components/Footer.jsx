import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-mint py-10 border-t border-primary/5">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="text-primary flex items-center justify-center">
            <span className="material-symbols-outlined font-bold">menu_book</span>
          </div>
          <span className="text-lg font-bold text-slate-900 font-display">BlogSpace</span>
        </div>
        
        <nav className="flex items-center gap-8">
          <Link to="#" className="text-xs font-bold text-slate-500 hover:text-primary transition-all">Privacy Policy</Link>
          <Link to="#" className="text-xs font-bold text-slate-500 hover:text-primary transition-all">Terms of Service</Link>
          <Link to="#" className="text-xs font-bold text-slate-500 hover:text-primary transition-all">Help Center</Link>
        </nav>

        <div className="text-xs font-bold text-slate-400">
          © {new Date().getFullYear()} BlogSpace. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
