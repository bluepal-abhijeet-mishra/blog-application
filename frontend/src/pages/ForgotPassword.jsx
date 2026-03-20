import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import authService from '../api/services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.forgotPassword(email.trim());
      setMessage(response?.message || 'If an account exists, reset instructions have been sent.');
      setSubmitted(true);
      toast.success('Password reset request submitted');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Unable to process request. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-8 md:p-10">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline mb-6">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to login
        </Link>

        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Forgot your password?</h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Enter your account email and we will send a secure reset link.
        </p>

        {submitted ? (
          <div className="mt-8 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl p-5">
            <p className="text-emerald-700 dark:text-emerald-300 font-semibold">{message}</p>
            <Link
              to="/login"
              className="mt-4 inline-flex items-center justify-center px-5 h-11 rounded-xl bg-primary text-white font-black hover:bg-primary/90 transition-colors"
            >
              Return to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
              <div className="relative mt-2">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">alternate_email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
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
              {loading ? 'Sending reset link...' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
