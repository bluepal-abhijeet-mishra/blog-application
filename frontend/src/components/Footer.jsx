import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-12">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-primary text-white p-1 rounded-lg shadow-sm shadow-primary/20">
              <span className="material-symbols-outlined">auto_stories</span>
            </div>
            <span className="text-lg font-bold">BlogSpace</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            A space for thinkers, creators, and doers to share their stories with the world.
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-4 text-sm">Product</h4>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li><a className="hover:text-primary" href="#">Featured</a></li>
            <li><a className="hover:text-primary" href="#">Topics</a></li>
            <li><a className="hover:text-primary" href="#">Newsletters</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4 text-sm">Company</h4>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li><a className="hover:text-primary" href="#">About Us</a></li>
            <li><a className="hover:text-primary" href="#">Careers</a></li>
            <li><a className="hover:text-primary" href="#">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4 text-sm">Legal</h4>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li><a className="hover:text-primary" href="#">Privacy Policy</a></li>
            <li><a className="hover:text-primary" href="#">Terms of Service</a></li>
            <li><a className="hover:text-primary" href="#">Cookie Policy</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400">
        © 2026 BlogSpace Inc. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
