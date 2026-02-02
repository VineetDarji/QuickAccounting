
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
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 rounded-3xl shadow-2xl shadow-indigo-400/20 max-w-xs mx-auto border border-slate-700/50 hover:shadow-3xl hover:shadow-indigo-400/30 transition-all duration-300 animate-scale-in">
      <div className="text-right mb-6 overflow-hidden">
        <div className="text-slate-500 text-xs h-4 font-medium">{equation}</div>
        <div className="text-white text-5xl font-light tracking-wider truncate pt-2">{display}</div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <button onClick={clear} className="col-span-2 bg-gradient-to-r from-red-600 to-red-500 text-white p-4 rounded-xl font-bold hover:shadow-lg hover:shadow-red-400/50 transition-all transform hover:scale-105 active:scale-95">AC</button>
        <button onClick={() => handleOperator('/')} className="bg-gradient-to-br from-indigo-600 to-indigo-500 text-white p-4 rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-400/50 transition-all transform hover:scale-105 active:scale-95">/</button>
        <button onClick={() => handleOperator('*')} className="bg-gradient-to-br from-indigo-600 to-indigo-500 text-white p-4 rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-400/50 transition-all transform hover:scale-105 active:scale-95">×</button>
        
        {[7,8,9].map(n => <button key={n} onClick={() => handleNumber(String(n))} className="bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95 duration-200">{n}</button>)}
        <button onClick={() => handleOperator('-')} className="bg-gradient-to-br from-indigo-600 to-indigo-500 text-white p-4 rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-400/50 transition-all transform hover:scale-105 active:scale-95">-</button>
        
        {[4,5,6].map(n => <button key={n} onClick={() => handleNumber(String(n))} className="bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95 duration-200">{n}</button>)}
        <button onClick={() => handleOperator('+')} className="bg-gradient-to-br from-indigo-600 to-indigo-500 text-white p-4 rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-400/50 transition-all transform hover:scale-105 active:scale-95">+</button>
        
        {[1,2,3].map(n => <button key={n} onClick={() => handleNumber(String(n))} className="bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95 duration-200">{n}</button>)}
        <button onClick={calculate} className="row-span-2 bg-gradient-to-br from-green-600 to-green-500 text-white p-4 rounded-xl font-bold hover:shadow-lg hover:shadow-green-400/50 transition-all transform hover:scale-105 active:scale-95 text-xl">=</button>
        
        <button onClick={() => handleNumber('0')} className="col-span-2 bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95 duration-200">0</button>
        <button onClick={() => handleNumber('.')} className="bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-xl font-bold transition-all transform hover:scale-105 active:scale-95 duration-200">.</button>
      </div>
    </div>
  );
};

export default SimpleCalculator;
