import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
// We'll use a cleaner background or a subtle gradient instead of the noisy png if requested, 
// but for now we'll keep the png with a much better overlay for a "Premium" look.
import loginBg from '../assets/login-bg.png';

const AuthContainer = ({ initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setIsLogin(initialMode === 'login');
    setFieldErrors({});
    setError('');
  }, [initialMode]);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = {};
    if (!email) {
      errors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!isLogin) {
      if (!displayName) {
        errors.displayName = 'Public display name is required';
      }
      if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateForm()) return;

    setLoading(true);
    
    try {
      if (isLogin) {
        await login(email.trim(), password);
        toast.success('Welcome back to BlogSpace!');
      } else {
        await register(email.trim(), password, displayName.trim());
        toast.success('Account created! Welcome to our community.');
      }
      navigate('/feed');
    } catch (err) {
      const responseData = err.response?.data;
      if (responseData?.details) {
        setFieldErrors(responseData.details);
      } else {
        const msg = responseData?.error || responseData?.message || err.message || 'Authentication failed. Please check your credentials.';
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) => `
    w-full h-12 pl-12 pr-4 bg-slate-50 dark:bg-slate-800/50 border rounded-xl text-slate-900 dark:text-white outline-none transition-all
    ${fieldErrors[field] 
      ? 'border-rose-500/50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5' 
      : 'border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/5'}
  `;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#f8fafc] dark:bg-slate-950 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <img src={loginBg} className="w-full h-full object-cover opacity-10 dark:opacity-20 transition-opacity duration-700" alt="" />
        <div className="absolute inset-0 bg-gradient-to-tr from-white via-white/80 to-transparent dark:from-slate-950 dark:via-slate-950/80 dark:to-transparent"></div>
      </div>

      <div className="w-full max-w-[1100px] flex bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl shadow-slate-200/50 dark:shadow-black/50 overflow-hidden relative z-10 border border-slate-100 dark:border-slate-800">
        
        {/* Branding Side (Desktop) */}
        <div className="hidden lg:flex w-5/12 bg-primary relative p-16 flex-col justify-between overflow-hidden">
          {/* Abstract blobs for premium feel */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
          
          <Link to="/" className="flex items-center gap-3 relative z-10">
            <div className="bg-white text-primary p-2 rounded-xl shadow-lg">
              <span className="material-symbols-outlined text-2xl">auto_stories</span>
            </div>
            <span className="text-2xl font-black text-white tracking-tight">BlogSpace</span>
          </Link>

          <div className="relative z-10">
            <h1 className="text-5xl font-black text-white leading-[1.1] mb-6">
              Connect with <br /> the world's <br /> top minds.
            </h1>
            <p className="text-emerald-50/80 font-medium text-lg max-w-xs">
              The premier platform for high-signal content and professional publishing.
            </p>
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-10 h-10 rounded-full border-2 border-primary shadow-sm" alt="" />
              ))}
            </div>
            <p className="text-xs font-bold text-white/90">Joined by 10k+ readers</p>
          </div>
        </div>

        {/* Form Side */}
        <div className="flex-1 flex flex-col p-8 md:p-16 lg:p-20">
          <div className="lg:hidden flex justify-center mb-10">
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-primary text-white p-2 rounded-xl shadow-lg">
                <span className="material-symbols-outlined text-2xl">auto_stories</span>
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">BlogSpace</span>
            </Link>
          </div>

          <div className="max-w-md mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login' : 'register'}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-10">
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                    {isLogin ? 'Welcome back' : 'Create account'}
                  </h2>
                  <p className="text-slate-500 font-medium">
                    {isLogin ? 'Enter your details to access your account.' : 'Join the most influential writing community.'}
                  </p>
                </div>

                <form className="space-y-5" onSubmit={handleAuth}>
                  {!isLogin && (
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Display Name</label>
                      <div className="relative group">
                        <span className={`material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.displayName ? 'text-rose-500' : 'text-slate-400 group-focus-within:text-primary'}`}>person</span>
                        <input 
                          type="text" 
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className={inputClass('displayName')} 
                          placeholder="Your professional name"
                        />
                      </div>
                      {fieldErrors.displayName && <p className="text-[10px] text-rose-500 font-bold px-1">{fieldErrors.displayName}</p>}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                    <div className="relative group">
                      <span className={`material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.email ? 'text-rose-500' : 'text-slate-400 group-focus-within:text-primary'}`}>alternate_email</span>
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputClass('email')} 
                        placeholder="name@company.com"
                      />
                    </div>
                    {fieldErrors.email && <p className="text-[10px] text-rose-500 font-bold px-1">{fieldErrors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Password</label>
                      {isLogin && <button type="button" className="text-xs font-bold text-primary hover:underline">Forgot?</button>}
                    </div>
                    <div className="relative group">
                      <span className={`material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.password ? 'text-rose-500' : 'text-slate-400 group-focus-within:text-primary'}`}>lock</span>
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={inputClass('password')} 
                        placeholder="••••••••"
                      />
                    </div>
                    {fieldErrors.password && <p className="text-[10px] text-rose-500 font-bold px-1">{fieldErrors.password}</p>}
                  </div>

                  {!isLogin && (
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Confirm Password</label>
                      <div className="relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary">lock_reset</span>
                        <input 
                          type="password" 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={inputClass('confirmPassword')} 
                          placeholder="••••••••"
                        />
                      </div>
                      {fieldErrors.confirmPassword && <p className="text-[10px] text-rose-500 font-bold px-1">{fieldErrors.confirmPassword}</p>}
                    </div>
                  )}

                  {error && <p className="text-rose-500 text-xs font-bold px-1 py-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg">{error}</p>}

                  <button 
                    disabled={loading}
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-98 disabled:opacity-50 mt-4"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        Verifying...
                      </div>
                    ) : (
                      isLogin ? 'Sign In' : 'Create Account'
                    )}
                  </button>
                </form>

                <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-slate-500 font-medium">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button 
                      onClick={() => setIsLogin(!isLogin)}
                      className="ml-2 text-primary font-black hover:underline"
                    >
                      {isLogin ? 'Get Started' : 'Log In'}
                    </button>
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthContainer;
