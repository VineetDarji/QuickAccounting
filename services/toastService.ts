import toast, { Toast, Toaster } from 'react-hot-toast';

export const toastConfig = {
  success: (message: string, options = {}) =>
    toast.success(message, {
      icon: '✅',
      style: {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: '#fff',
        borderRadius: '12px',
        padding: '16px 20px',
        fontSize: '14px',
        fontWeight: '600',
        boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
      },
      duration: 3000,
      ...options,
    }),

  error: (message: string, options = {}) =>
    toast.error(message, {
      icon: '❌',
      style: {
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: '#fff',
        borderRadius: '12px',
        padding: '16px 20px',
        fontSize: '14px',
        fontWeight: '600',
        boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)',
      },
      duration: 3000,
      ...options,
    }),

  info: (message: string, options = {}) =>
    toast(message, {
      icon: 'ℹ️',
      style: {
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        color: '#fff',
        borderRadius: '12px',
        padding: '16px 20px',
        fontSize: '14px',
        fontWeight: '600',
        boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)',
      },
      duration: 3000,
      ...options,
    }),

  warning: (message: string, options = {}) =>
    toast(message, {
      icon: '⚠️',
      style: {
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        color: '#fff',
        borderRadius: '12px',
        padding: '16px 20px',
        fontSize: '14px',
        fontWeight: '600',
        boxShadow: '0 10px 30px rgba(245, 158, 11, 0.3)',
      },
      duration: 3000,
      ...options,
    }),

  loading: (message: string, options = {}) =>
    toast.loading(message, {
      style: {
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        color: '#fff',
        borderRadius: '12px',
        padding: '16px 20px',
        fontSize: '14px',
        fontWeight: '600',
        boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)',
      },
      ...options,
    }),

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    },
    options = {}
  ) =>
    toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        style: {
          borderRadius: '12px',
          padding: '16px 20px',
          fontSize: '14px',
          fontWeight: '600',
        },
        ...options,
      }
    ),
};

export default toastConfig;
