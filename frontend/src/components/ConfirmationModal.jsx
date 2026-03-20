import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  type = 'primary' // primary, danger, warning
}) => {
  if (!isOpen) return null;

  const typeConfig = {
    primary: {
      buttonClass: 'bg-primary hover:bg-primary/90 text-white shadow-primary/20',
      icon: 'info',
      iconClass: 'text-primary bg-primary/10'
    },
    danger: {
      buttonClass: 'bg-red-600 hover:bg-red-700 text-white shadow-red-200',
      icon: 'warning',
      iconClass: 'text-red-600 bg-red-50'
    },
    warning: {
      buttonClass: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200',
      icon: 'priority_high',
      iconClass: 'text-amber-600 bg-amber-50'
    }
  };

  const config = typeConfig[type] || typeConfig.primary;

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
          >
            <div className="p-8">
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${config.iconClass}`}>
                  <span className="material-symbols-outlined text-2xl">{config.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    {message}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/50 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-white dark:hover:bg-slate-800 transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`w-full sm:w-auto px-8 py-2.5 rounded-xl font-black text-sm transition-all shadow-lg ${config.buttonClass}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
