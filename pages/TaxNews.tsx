
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

const TaxNews: React.FC = () => {
  const [news, setNews] = useState<string>('');
  const [links, setLinks] = useState<{web: {uri: string, title: string}}[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {
    setLoading(true);
    try {
      // Fix: Initializing GoogleGenAI with process.env.API_KEY directly as per SDK requirements
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: 'What are the latest Indian Income Tax updates, circulars, and news for FY 2024-25? Provide a bulleted summary with key dates.',
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      setNews(response.text || 'No updates found.');
      setLinks(response.candidates?.[0]?.groundingMetadata?.groundingChunks || []);
    } catch (e) {
      console.error(e);
      setNews('Error fetching latest news. Please check back later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900">Tax Flash</h1>
          <p className="text-slate-500">Latest Indian Income Tax & GST Updates</p>
        </div>
        <button 
          onClick={fetchNews}
          className="bg-indigo-600 text-white p-2 rounded-full hover:rotate-180 transition-all duration-500"
          title="Refresh News"
        >
          🔄
        </button>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-slate-100 rounded w-full mb-2"></div>
              <div className="h-4 bg-slate-100 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl prose prose-indigo max-w-none">
            <div className="whitespace-pre-line text-slate-700 leading-relaxed">
              {news}
            </div>
          </div>

          {links.length > 0 && (
            <div className="bg-slate-900 p-8 rounded-3xl text-white">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-indigo-400">🔗</span> Verifiable Sources
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {links.map((link, idx) => (
                  link.web && (
                    <a 
                      key={idx} 
                      href={link.web.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/10"
                    >
                      <div className="text-xs text-indigo-400 mb-1 truncate font-mono">{new URL(link.web.uri).hostname}</div>
                      <div className="text-sm font-bold truncate">{link.web.title}</div>
                    </a>
                  )
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaxNews;
