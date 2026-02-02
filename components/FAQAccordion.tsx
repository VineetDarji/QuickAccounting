import React, { useState } from 'react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQData: FAQItem[] = [
  {
    id: '1',
    question: 'What is the difference between Old and New Tax Regime?',
    answer: 'The Old Regime allows deductions (80C, 80D, HRA, etc.) but has higher tax slabs. The New Regime offers lower tax rates but no deductions. Choose based on your income and eligible deductions.',
    category: 'Tax Regimes'
  },
  {
    id: '2',
    question: 'When should I file my income tax return?',
    answer: 'The ITR filing deadline is usually July 31st for individuals. If you have business income or certain other sources, the deadline may be different. It\'s recommended to file early to avoid penalties.',
    category: 'ITR Filing'
  },
  {
    id: '3',
    question: 'What documents do I need for tax filing?',
    answer: 'You typically need: Form 16 (salary income), bank statements, investment proofs (80C), medical bills (80D), property documents, interest statements from banks, and business records if applicable.',
    category: 'ITR Filing'
  },
  {
    id: '4',
    question: 'How is GST calculated?',
    answer: 'GST is calculated as a percentage of the taxable value of goods/services. Tax is levied at various rates (5%, 12%, 18%, 28%) depending on the product/service category. Input tax credit is available on qualifying purchases.',
    category: 'GST'
  },
  {
    id: '5',
    question: 'Who needs to register for GST?',
    answer: 'Businesses with annual turnover exceeding ₹40 lakhs (₹10 lakhs for services) must register for GST. Some businesses below this threshold can register voluntarily.',
    category: 'GST'
  },
  {
    id: '6',
    question: 'What are the benefits of Section 80C deduction?',
    answer: 'Section 80C allows deductions up to ₹1.5 lakhs for investments in LIC, EPF, PPF, NSC, ELSS mutual funds, and tuition fees. This directly reduces your taxable income.',
    category: 'Deductions'
  },
  {
    id: '7',
    question: 'How is long-term capital gains tax calculated?',
    answer: 'LTCG tax depends on the asset type: For stocks held >1 year, 20% is charged with indexation benefit. For real estate, 20% with indexation. Some securities are taxed at concessional rates.',
    category: 'Capital Gains'
  },
  {
    id: '8',
    question: 'What happens if I miss the ITR filing deadline?',
    answer: 'Late filing attracts penalties under section 271F (₹10,000 or 50% of tax due, whichever is lower). However, you can still file under section 139(4) within 2 years of the assessment year.',
    category: 'ITR Filing'
  }
];

const Accordion: React.FC = () => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...new Set(FAQData.map(item => item.category))];
  const filteredFAQ = selectedCategory === 'All' 
    ? FAQData 
    : FAQData.filter(item => item.category === selectedCategory);

  return (
    <div className="w-full">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-3 mb-8">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 ${
              selectedCategory === category
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* FAQ Items */}
      <div className="space-y-4">
        {filteredFAQ.map(item => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-indigo-100 dark:hover:shadow-indigo-900/30 transition-all duration-300"
          >
            <button
              onClick={() => setExpanded(expanded === item.id ? null : item.id)}
              className="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200"
            >
              <span className="text-lg font-bold text-slate-900 dark:text-white text-left">{item.question}</span>
              <span className={`ml-4 text-2xl text-indigo-600 dark:text-indigo-400 transition-transform duration-300 flex-shrink-0 ${
                expanded === item.id ? 'rotate-180' : ''
              }`}>
                ▼
              </span>
            </button>

            {expanded === item.id && (
              <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-700/50">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Accordion;
