import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000); // 5 seconds auto-dismiss
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <XCircle className="w-5 h-5 text-red-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />
  };

  const styles = {
    success: 'bg-slate-900/95 border-green-500/30 shadow-green-900/20',
    error: 'bg-slate-900/95 border-red-500/30 shadow-red-900/20',
    info: 'bg-slate-900/95 border-blue-500/30 shadow-blue-900/20',
    warning: 'bg-slate-900/95 border-yellow-500/30 shadow-yellow-900/20'
  };

  return (
    <div className={`${styles[toast.type]} border backdrop-blur-md p-4 rounded-xl shadow-2xl mb-3 w-80 transform transition-all duration-300 animate-slideIn flex items-start gap-3`}>
      <div className="mt-0.5 shrink-0">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-white">{toast.title}</h4>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{toast.message}</p>
      </div>
      <button 
        onClick={() => onClose(toast.id)} 
        className="text-slate-500 hover:text-white transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};