import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  ...props
}) => {
  const baseClasses = 'font-bold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95';

  const variantClasses = {
    primary: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-300 dark:hover:shadow-indigo-900/30 shadow-md',
    secondary: 'bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-600 text-white hover:shadow-lg hover:shadow-slate-400/20 shadow-lg',
    ghost: 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/80 dark:hover:bg-slate-800',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
