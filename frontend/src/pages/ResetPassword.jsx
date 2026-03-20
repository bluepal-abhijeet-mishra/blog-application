import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import authService from '../api/services/authService';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const validateToken = async () => {
      if (!token) {
        if (mounted) {
          setIsTokenValid(false);
          setValidatingToken(false);
        }
        return;
      }

      try {
        const result = await authService.validateResetToken(token);
        if (mounted) {
          setIsTokenValid(Boolean(result?.valid));
        }
      } catch {
        if (mounted) {
          setIsTokenValid(false);
        }
      } finally {
        if (mounted) {
          setValidatingToken(false);
        }
      }
    };

    validateToken();
    return () => {
      mounted = false;
    };
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      toast.success('Password reset successful. Please sign in.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Unable to reset password.';
      if (msg.toLowerCase().includes('token')) {
        setIsTokenValid(false);
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-8 md:p-10 text-center">
          <p className="text-slate-600 dark:text-slate-300 font-semibold">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-8 md:p-10">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Reset link invalid</h1>
          <p className="mt-3 text-slate-500 dark:text-slate-400">
            This reset link is invalid or expired. Request a new one to continue.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Link
              to="/forgot-password"
              className="inline-flex items-center justify-center px-5 h-11 rounded-xl bg-primary text-white font-black hover:bg-primary/90 transition-colors"
            >
              Request new link
            </Link>
            <Link to="/login" className="text-sm font-bold text-primary hover:underline">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-8 md:p-10">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Set a new password</h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Choose a strong password with at least 8 characters.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">New Password</label>
            <div className="relative mt-2">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Confirm Password</label>
            <div className="relative mt-2">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock_reset</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none"
                required
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-4 py-3 text-rose-600 dark:text-rose-300 text-sm font-semibold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-primary text-white font-black hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {loading ? 'Resetting password...' : 'Reset password'}
          </button>

          <div className="text-center">
            <Link to="/login" className="text-sm font-bold text-primary hover:underline">
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
