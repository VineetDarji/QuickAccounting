import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

const Select: React.FC<SelectProps> = ({ label, id, children, ...props }) => {
  return (
    <div>
      {label && <label htmlFor={id} className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</label>}
      <select
        id={id}
        className="w-full p-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg outline-none transition-colors duration-200"
        {...props}
      >
        {children}
      </select>
    </div>
  );
};

export default Select;
