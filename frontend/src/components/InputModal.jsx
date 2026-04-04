import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const InputModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  placeholder = "Enter identifier...",
  confirmText = "Apply",
  cancelText = "Cancel",
  initialValue = "",
  icon = "link"
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
    }
  }, [isOpen, initialValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(value);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
        >
          <form onSubmit={handleSubmit}>
            <div className="p-8 pb-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-2xl">{icon}</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {title}
                  </h3>
                  {message && (
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                      {message}
                    </p>
                  )}
                </div>
              </div>

              <div className="relative group">
                <input
                  autoFocus
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={placeholder}
                  className="w-full h-14 px-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>

            <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800/50">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-all text-sm"
              >
                {cancelText}
              </button>
              <button
                type="submit"
                className="px-8 py-2.5 bg-primary text-white rounded-xl font-black text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
              >
                {confirmText}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InputModal;
