import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input: React.FC<InputProps> = ({ label, id, ...props }) => {
  return (
    <div>
      {label && <label htmlFor={id} className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{label}</label>}
      <input
        id={id}
        className="w-full p-4 border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-lg font-bold focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-500"
        {...props}
      />
    </div>
  );
};

export default Input;
