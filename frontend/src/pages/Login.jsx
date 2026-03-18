import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-mint/30 dark:bg-[#0a0f1a]">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-primary/5 overflow-hidden flex flex-col border border-primary/5 dark:border-slate-800">
        <div className="p-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/25 transform -rotate-3 hover:rotate-0 transition-transform">
              <span className="material-symbols-outlined text-2xl">auto_stories</span>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">BlogSpace</span>
              <p className="text-[10px] text-primary font-bold uppercase tracking-[0.2em] mt-0.5">Thought Hub</p>
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-2 tracking-tight">Welcome back</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-10 font-medium">Elevate your ideas. Log in to your space.</p>
          
          {error && (
            <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-500 p-4 rounded-xl mb-8 text-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Email Connection</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">mail</span>
                <input 
                  className="w-full rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-4 focus:ring-primary/5 h-14 pl-12 pr-4 transition-all font-medium" 
                  placeholder="name@company.com" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Security Key</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">lock</span>
                <input 
                  className="w-full rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-4 focus:ring-primary/5 h-14 pl-12 pr-12 transition-all font-medium" 
                  placeholder="••••••••" 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>
            <div className="flex items-center justify-end">
              <span className="text-xs font-bold text-primary hover:underline cursor-pointer tracking-tight">Lost your key?</span>
            </div>
            <button 
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white font-black h-14 rounded-2xl transition-all shadow-xl shadow-primary/30 hover:-translate-y-0.5"
            >
              Continue to Console
            </button>
            <div className="pt-6 text-center">
              <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">
                New to the community?{' '}
                <Link to="/register" className="text-primary font-black hover:underline">
                  Join for free
                </Link>
              </p>
            </div>
          </form>
        </div>
        <div className="h-2 bg-gradient-to-r from-primary/20 via-primary to-primary/20 w-full animate-pulse-slow"></div>
      </div>
    </div>
  );
};

export default Login;
