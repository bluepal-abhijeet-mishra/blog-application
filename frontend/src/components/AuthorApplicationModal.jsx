import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import applicationService from '../api/services/applicationService';
import toast from 'react-hot-toast';
import ConfirmationModal from './ConfirmationModal';

const AuthorApplicationModal = ({ isOpen, onClose }) => {
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleClose = () => {
    if (bio.trim()) {
      setShowCancelConfirm(true);
    } else {
      onClose();
      setBio('');
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelConfirm(false);
    onClose();
    setBio('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bio.trim()) {
      toast.error('Please provide a brief bio about your writing interests.');
      return;
    }

    setIsSubmitting(true);
    try {
      await applicationService.submitApplication(bio);
      toast.success('Application submitted! Our administrators will review it shortly.');
      onClose();
      setBio('');
    } catch (err) {
      toast.error(err.response?.data || 'Failed to submit application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Become an Author</h2>
                  <p className="text-slate-500 text-sm mt-1">Tell us about your expertise and why you want to write on BlogSpace.</p>
                </div>
                <button 
                  onClick={handleClose}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Writer Bio / Motivation</label>
                  <textarea
                    required
                    className="w-full h-40 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-slate-900 dark:text-white"
                    placeholder="Describe your writing experience, topics of interest, and why you'd like to join our author community..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <span className="material-symbols-outlined text-sm">send</span>
                    )}
                    Submit Application
                  </button>
                </div>
              </form>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-sm">verified_user</span>
              </div>
              <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider">
                Our editorial team reviews every application manually. High-quality bios significantly increase your probability of elevation.
              </p>
            </div>
          </motion.div>
          
          <ConfirmationModal
            isOpen={showCancelConfirm}
            onClose={() => setShowCancelConfirm(false)}
            onConfirm={handleConfirmCancel}
            title="Discard changes?"
            message="You have unsaved changes in your application. Are you sure you want to close this and discard your progress?"
            confirmText="Discard Changes"
            cancelText="Keep Editing"
            type="danger"
          />
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthorApplicationModal;
