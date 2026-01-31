
import React from 'react';

const USEFUL_LINKS = [
  {
    title: "Income Tax E-Filing",
    url: "https://www.incometax.gov.in/",
    use: "For filing ITRs, checking refund status, and verifying PAN-Aadhaar linking.",
    icon: "🏦"
  },
  {
    title: "GST Portal",
    url: "https://www.gst.gov.in/",
    use: "File monthly GST returns, register for GST, and manage tax challans.",
    icon: "🛍️"
  },
  {
    title: "TRACES Portal",
    url: "https://www.tdscpc.gov.in/",
    use: "Download Form 26AS, Form 16/16A, and reconcile TDS deductions.",
    icon: "🔍"
  },
  {
    title: "EPFO Portal",
    url: "https://www.epfindia.gov.in/",
    use: "Check PF balance, download UAN card, and manage pension claims.",
    icon: "💼"
  },
  {
    title: "PAN NSDL/UTI",
    url: "https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html",
    use: "Apply for a new PAN card or update existing PAN details.",
    icon: "💳"
  },
  {
    title: "MCA Portal",
    url: "https://www.mca.gov.in/",
    use: "Check company registration details and file annual compliance forms.",
    icon: "🏛️"
  }
];

const UsefulLinks: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Stay Updated & Compliant</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          We've compiled the most critical portals for every Indian taxpayer. Use these links to manage your government records directly.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {USEFUL_LINKS.map((link, idx) => (
          <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all group">
            <div className="text-4xl mb-6 bg-slate-50 w-16 h-16 flex items-center justify-center rounded-2xl group-hover:bg-indigo-50 transition-colors">
              {link.icon}
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">{link.title}</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">{link.use}</p>
            <a 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-indigo-600 font-bold hover:gap-2 transition-all text-sm"
            >
              Visit Portal <span className="ml-1 tracking-widest">→</span>
            </a>
          </div>
        ))}
      </div>

      <div className="mt-20 bg-indigo-900 rounded-[40px] p-12 text-white overflow-hidden relative">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">Pro Tip for Senior Citizens</h2>
          <p className="text-indigo-200 mb-8 leading-relaxed">
            Always ensure your PAN is linked with your Aadhaar before attempting to use these portals. If you find these sites too complex, our "Senior Care" team is just a call away to handle the digital heavy lifting for you.
          </p>
          <button className="bg-white text-indigo-900 px-8 py-3 rounded-xl font-black hover:bg-indigo-100 transition-colors">
            Contact Support
          </button>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[140%] bg-indigo-800 rounded-full blur-[100px] opacity-50"></div>
      </div>
    </div>
  );
};

export default UsefulLinks;
