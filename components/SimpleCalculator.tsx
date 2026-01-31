
import React, { useState } from 'react';

const SimpleCalculator: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  const handleNumber = (n: string) => {
    setDisplay(prev => prev === '0' ? n : prev + n);
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const calculate = () => {
    try {
      const fullEquation = equation + display;
      const result = eval(fullEquation);
      setDisplay(String(result));
      setEquation('');
    } catch {
      setDisplay('Error');
    }
  };

  const clear = () => {
    setDisplay('0');
    setEquation('');
  };

  return (
    <div className="bg-slate-900 p-6 rounded-2xl shadow-2xl max-w-xs mx-auto border border-slate-800">
      <div className="text-right mb-4 overflow-hidden">
        <div className="text-slate-500 text-xs h-4">{equation}</div>
        <div className="text-white text-4xl font-light tracking-wider truncate">{display}</div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <button onClick={clear} className="col-span-2 bg-slate-700 text-white p-4 rounded-xl font-bold hover:bg-slate-600 transition-colors">AC</button>
        <button onClick={() => handleOperator('/')} className="bg-indigo-600 text-white p-4 rounded-xl font-bold hover:bg-indigo-500 transition-colors">/</button>
        <button onClick={() => handleOperator('*')} className="bg-indigo-600 text-white p-4 rounded-xl font-bold hover:bg-indigo-500 transition-colors">×</button>
        
        {[7,8,9].map(n => <button key={n} onClick={() => handleNumber(String(n))} className="bg-slate-800 text-white p-4 rounded-xl hover:bg-slate-700 transition-colors">{n}</button>)}
        <button onClick={() => handleOperator('-')} className="bg-indigo-600 text-white p-4 rounded-xl font-bold hover:bg-indigo-500 transition-colors">-</button>
        
        {[4,5,6].map(n => <button key={n} onClick={() => handleNumber(String(n))} className="bg-slate-800 text-white p-4 rounded-xl hover:bg-slate-700 transition-colors">{n}</button>)}
        <button onClick={() => handleOperator('+')} className="bg-indigo-600 text-white p-4 rounded-xl font-bold hover:bg-indigo-500 transition-colors">+</button>
        
        {[1,2,3].map(n => <button key={n} onClick={() => handleNumber(String(n))} className="bg-slate-800 text-white p-4 rounded-xl hover:bg-slate-700 transition-colors">{n}</button>)}
        <button onClick={calculate} className="row-span-2 bg-green-600 text-white p-4 rounded-xl font-bold hover:bg-green-500 transition-colors">=</button>
        
        <button onClick={() => handleNumber('0')} className="col-span-2 bg-slate-800 text-white p-4 rounded-xl hover:bg-slate-700 transition-colors">0</button>
        <button onClick={() => handleNumber('.')} className="bg-slate-800 text-white p-4 rounded-xl hover:bg-slate-700 transition-colors">.</button>
      </div>
    </div>
  );
};

export default SimpleCalculator;
