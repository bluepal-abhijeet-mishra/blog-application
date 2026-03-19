import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import authIllustration from '../assets/auth-3d-illustration-green.png';

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

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6, 
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const illustrationVariants = {
    animate: {
      y: [0, -20, 0],
      rotate: [0, 2, -2, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-0 md:p-6 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Background Blobs for extra depth */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1.2, 1, 1.2], x: [0, -50, 0] }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px]" 
        />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[1200px] h-full md:h-auto min-h-[700px] flex flex-col md:flex-row bg-white dark:bg-slate-900 md:rounded-[40px] shadow-2xl overflow-hidden relative z-10 border-0 md:border border-slate-100 dark:border-slate-800"
      >
        
        {/* 3D Illustration Side (Desktop) */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#064e3b] to-[#065f46] relative p-16 flex-col justify-center items-center overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none"></div>
          
          <Link to="/" className="absolute top-12 left-12 flex items-center gap-3 z-20 group">
            <motion.div 
              whileHover={{ rotate: -12, scale: 1.1 }}
              className="bg-white/10 backdrop-blur-md text-white p-2.5 rounded-2xl border border-white/20 shadow-xl transition-all"
            >
              <span className="material-symbols-outlined text-2xl">auto_stories</span>
            </motion.div>
            <span className="text-2xl font-black text-white tracking-tight">BlogSpace</span>
          </Link>

          <motion.div 
            variants={illustrationVariants}
            animate="animate"
            className="relative z-10 w-full max-w-[400px]"
          >
            <img 
              src={authIllustration} 
              alt="3D Illustration" 
              className="w-full h-auto drop-shadow-[0_35px_35px_rgba(0,0,0,0.3)]"
            />
            
            {/* Soft shadow underneath */}
            <motion.div 
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.2, 0.3] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[70%] h-6 bg-black/40 blur-xl rounded-full"
            />
          </motion.div>

          <div className="mt-16 text-center relative z-10">
            <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Experience Publishing 3.0</h2>
            <p className="text-white/60 font-medium max-w-xs mx-auto">
              Join thousands of creators using our next-gen platform to share their ideas with the world.
            </p>
          </div>
        </div>

        {/* Form Side */}
        <div className="flex-1 flex flex-col p-8 md:p-16 lg:p-20 relative bg-white dark:bg-slate-900">
          <div className="md:hidden flex justify-center mb-10">
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-primary text-white p-2.5 rounded-2xl shadow-lg">
                <span className="material-symbols-outlined text-2xl">auto_stories</span>
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight text-gradient">BlogSpace</span>
            </Link>
          </div>

          <div className="max-w-md mx-auto w-full my-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login' : 'register'}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="w-full"
              >
                <div className="mb-10">
                  <motion.h2 variants={itemVariants} className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
                    {isLogin ? 'Welcome back' : 'Get started'}
                  </motion.h2>
                  <motion.p variants={itemVariants} className="text-slate-500 font-medium text-lg">
                    {isLogin ? 'Enter your credentials to continue.' : 'Create your account to start publishing.'}
                  </motion.p>
                </div>

                <form className="space-y-6" onSubmit={handleAuth}>
                  {!isLogin && (
                    <motion.div variants={itemVariants} className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Display Name</label>
                      <div className="relative group">
                        <span className={`material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.displayName ? 'text-rose-500' : 'text-slate-400 group-focus-within:text-primary'}`}>person</span>
                        <input 
                          type="text" 
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className={inputClass('displayName')} 
                          placeholder="Your public name"
                        />
                      </div>
                      {fieldErrors.displayName && <p className="text-[10px] text-rose-500 font-bold px-1">{fieldErrors.displayName}</p>}
                    </motion.div>
                  )}

                  <motion.div variants={itemVariants} className="space-y-2">
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
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Password</label>
                      {isLogin && <button type="button" className="text-xs font-bold text-primary hover:underline">Forgot Password?</button>}
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
                  </motion.div>

                  {!isLogin && (
                    <motion.div variants={itemVariants} className="space-y-2">
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
                    </motion.div>
                  )}

                  {error && (
                    <motion.p 
                      initial={{ opacity: 0, scale: 0.9 }} 
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-rose-500 text-xs font-bold px-4 py-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">info</span>
                      {error}
                    </motion.p>
                  )}

                  <motion.button 
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading}
                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-xl shadow-primary/20 transition-all disabled:opacity-50 mt-4 overflow-hidden relative group"
                  >
                    <motion.div 
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent z-10"
                    />
                    <AnimatePresence mode="wait">
                      {loading ? (
                        <motion.div 
                          key="loading"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="flex items-center justify-center gap-2"
                        >
                          <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                          Verifying...
                        </motion.div>
                      ) : (
                        <motion.span
                          key="idle"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                        >
                          {isLogin ? 'Sign In to BlogSpace' : 'Create Free Account'}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </form>

                <motion.div 
                  variants={itemVariants}
                  className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800 text-center"
                >
                  <p className="text-slate-500 font-medium">
                    {isLogin ? "Don't have an account yet?" : "Already have an account?"}
                    <button 
                      onClick={() => setIsLogin(!isLogin)}
                      className="ml-2 text-primary font-black hover:underline transition-all"
                    >
                      {isLogin ? 'Create One Now' : 'Sign In Instead'}
                    </button>
                  </p>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthContainer;
