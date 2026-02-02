import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-slate-900/30 border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-2xl hover:shadow-indigo-200/30 dark:hover:shadow-indigo-900/20 transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
