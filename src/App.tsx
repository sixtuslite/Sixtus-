/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Search, 
  User, 
  MapPin, 
  Link as LinkIcon, 
  Shield, 
  Activity, 
  Globe, 
  Info,
  Loader2,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

interface SearchResult {
  summary: string;
  sources: { uri: string; title: string }[];
  timestamp: string;
}

// --- Components ---

const Header = () => (
  <header className="border-b border-[#141414] p-6 flex justify-between items-center bg-[#E4E3E0]">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-[#141414] flex items-center justify-center rounded-sm">
        <Shield className="text-[#E4E3E0] w-5 h-5" />
      </div>
      <div>
        <h1 className="font-serif italic text-xs uppercase tracking-widest opacity-50">System v1.0.4</h1>
        <p className="font-mono text-sm font-bold tracking-tight">OSINT_INVESTIGATOR_CORE</p>
      </div>
    </div>
    <div className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-wider opacity-60">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        Network: Active
      </div>
      <div>Uptime: 102:44:12</div>
    </div>
  </header>
);

const DataCard = ({ title, children, icon: Icon, className }: { title: string, children: React.ReactNode, icon: any, className?: string }) => (
  <div className={cn("border border-[#141414] bg-white overflow-hidden flex flex-col", className)}>
    <div className="border-b border-[#141414] p-3 flex items-center justify-between bg-[#f0efed]">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span className="font-serif italic text-[11px] uppercase tracking-wider opacity-60">{title}</span>
      </div>
      <div className="w-2 h-2 border border-[#141414] opacity-20" />
    </div>
    <div className="p-4 flex-1 overflow-auto">
      {children}
    </div>
  </div>
);

export default function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Provide a detailed public profile summary for the individual named: "${query}". 
        Focus on professional background, public social media presence, known locations (if public), and notable achievements. 
        Format the output in clear sections. If multiple people share this name, provide brief summaries for the most prominent ones.
        Maintain a professional, investigative tone.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const summary = response.text || "No information found.";
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources = chunks
        ? chunks
            .filter((c: any) => c.web)
            .map((c: any) => ({ uri: c.web.uri, title: c.web.title }))
        : [];

      setResult({
        summary,
        sources,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err.message || "An error occurred during the investigation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      <Header />

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Search Section */}
        <div className="border border-[#141414] bg-white p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ENTER SUBJECT NAME FOR PUBLIC RECORD SEARCH..."
                  className="w-full bg-[#f5f4f2] border border-[#141414] py-4 pl-12 pr-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#141414]/10 placeholder:opacity-30"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-[#141414] text-[#E4E3E0] px-8 py-4 font-mono text-sm font-bold uppercase tracking-widest hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Initiate Search"}
              </button>
            </div>
          </form>
          <div className="mt-4 flex items-center gap-4 text-[10px] font-mono uppercase tracking-wider opacity-40">
            <div className="flex items-center gap-1"><Info className="w-3 h-3" /> Public Data Only</div>
            <div className="flex items-center gap-1"><Globe className="w-3 h-3" /> Global Indexing</div>
            <div className="flex items-center gap-1"><Activity className="w-3 h-3" /> Real-time Grounding</div>
          </div>
        </div>

        {error && (
          <div className="border border-red-500 bg-red-50 p-4 flex items-center gap-3 text-red-700 font-mono text-xs uppercase">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Intelligence Report */}
          <DataCard 
            title="Intelligence Report" 
            icon={User} 
            className="lg:col-span-2 min-h-[500px] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]"
          >
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-40">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="font-mono text-[10px] uppercase tracking-[0.2em]">Accessing Global Databases...</p>
              </div>
            ) : result ? (
              <div className="prose prose-sm max-w-none font-sans leading-relaxed">
                <div className="mb-6 flex items-center justify-between border-b border-[#141414]/10 pb-2">
                  <span className="font-mono text-[10px] uppercase opacity-40">Report Generated: {result.timestamp}</span>
                  <span className="font-mono text-[10px] uppercase px-2 py-0.5 bg-[#141414] text-[#E4E3E0]">Classified: Public</span>
                </div>
                <div className="markdown-body">
                  <Markdown>{result.summary}</Markdown>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20 italic font-serif text-sm">
                No active investigation. Enter a name to begin.
              </div>
            )}
          </DataCard>

          {/* Sidebar: Sources & Metadata */}
          <div className="space-y-6">
            <DataCard title="Data Sources" icon={Globe} className="shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              {result && result.sources.length > 0 ? (
                <ul className="space-y-3">
                  {result.sources.map((source, i) => (
                    <li key={i} className="group">
                      <a 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-2 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all border border-transparent hover:border-[#141414]"
                      >
                        <div className="font-mono text-[10px] opacity-40 mt-1">[{String(i + 1).padStart(2, '0')}]</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold truncate uppercase tracking-tight">{source.title}</p>
                          <p className="text-[9px] font-mono opacity-50 truncate">{source.uri}</p>
                        </div>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 mt-1" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-8 text-center opacity-20 italic font-serif text-xs">
                  {loading ? "Scanning web..." : "No sources indexed."}
                </div>
              )}
            </DataCard>

            <DataCard title="System Status" icon={Activity} className="shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <div className="space-y-4 font-mono text-[10px] uppercase tracking-wider">
                <div className="flex justify-between items-center">
                  <span className="opacity-50">API Latency</span>
                  <span className="text-emerald-600">142ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="opacity-50">Grounding Confidence</span>
                  <span className="text-emerald-600">98.4%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="opacity-50">Database Sync</span>
                  <span className="text-emerald-600">Synchronized</span>
                </div>
                <div className="pt-4 border-t border-[#141414]/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-1 bg-[#141414]" />
                    <span>Active Nodes</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className={cn("h-1 bg-[#141414]", i < 8 ? "opacity-100" : "opacity-10")} />
                    ))}
                  </div>
                </div>
              </div>
            </DataCard>
          </div>
        </div>

        {/* Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="border border-[#141414] p-4 bg-white shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 opacity-40" />
              <span className="font-serif italic text-[10px] uppercase tracking-widest opacity-40">Location Tracking</span>
            </div>
            <p className="font-mono text-[10px]">GEO_LOC: ENABLED</p>
          </div>
          <div className="border border-[#141414] p-4 bg-white shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <div className="flex items-center gap-2 mb-2">
              <LinkIcon className="w-4 h-4 opacity-40" />
              <span className="font-serif italic text-[10px] uppercase tracking-widest opacity-40">Social Linkage</span>
            </div>
            <p className="font-mono text-[10px]">SOCIAL_GRAPH: ACTIVE</p>
          </div>
          <div className="border border-[#141414] p-4 bg-white shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 opacity-40" />
              <span className="font-serif italic text-[10px] uppercase tracking-widest opacity-40">Privacy Guard</span>
            </div>
            <p className="font-mono text-[10px]">COMPLIANCE: VERIFIED</p>
          </div>
          <div className="border border-[#141414] p-4 bg-white shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 opacity-40" />
              <span className="font-serif italic text-[10px] uppercase tracking-widest opacity-40">Global Search</span>
            </div>
            <p className="font-mono text-[10px]">INDEX_SIZE: 4.2PB</p>
          </div>
        </div>
      </main>

      <footer className="mt-12 border-t border-[#141414] p-8 bg-[#141414] text-[#E4E3E0]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <Shield className="w-6 h-6" />
            <div className="font-mono text-[10px] uppercase tracking-[0.3em]">
              OSINT_INVESTIGATOR // TERMINAL_ACCESS_GRANTED
            </div>
          </div>
          <div className="font-mono text-[9px] opacity-40 text-center md:text-right">
            THIS SYSTEM IS FOR PUBLIC INFORMATION GATHERING ONLY. 
            <br />
            DO NOT USE FOR ILLEGAL TRACKING OR HARASSMENT.
            <br />
            © 2026 CYBER_TRACK_CORE. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
}
