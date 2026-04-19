/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Network, Loader2, Info, MapPin, Briefcase, FileText, Globe, Sun, Moon, Download, AlertTriangle } from 'lucide-react';
import { ProjectDetails, AnalysisResult } from './types';
import { researchProjectLandscape } from './services/geminiService';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { generateSystemOverviewReport, DISCLAIMER_TEXT } from './services/pdfService';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [details, setDetails] = useState<ProjectDetails>({
    project: '',
    location: '',
    application: '',
    context: ''
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const updateDetail = (field: keyof ProjectDetails, value: string) => {
    setDetails(prev => ({ ...prev, [field]: value }));
  };

  const generateGraph = async () => {
    if (!details.project || !details.location || !details.application) {
      setError("Please provide at least Project Name, Location, and Application type.");
      return;
    }

    setAnalyzing(true);
    setError(null);
    try {
      const graphData = await researchProjectLandscape(details);
      if (graphData.nodes.length === 0) {
        setError("AI could not derive a regulatory landscape for this configuration. Please adjust your inputs.");
      } else {
        setResult(graphData);
      }
    } catch (e) {
      setError("Failed to reach the research engine. Check your connection.");
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const isFormValid = details.project && details.location && details.application;

  return (
    <div className="h-screen flex flex-col bg-background text-foreground font-sans selection:bg-foreground/10 transition-colors duration-300">
      {/* Header */}
      <header className="h-[64px] px-6 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm z-50 shrink-0 transition-colors duration-300">
        <a 
          href="https://safetyargument.com.au" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-4 hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-2">
            <img 
              src={darkMode ? "/Logo_bw.jpg" : "/Logo_wb.jpg"} 
              alt="Safety Argument Logo" 
              className="w-10 h-10 object-contain"
              referrerPolicy="no-referrer"
            />
            <div className="h-6 w-[1.5px] bg-border mx-1" />
            <h1 className="text-sm font-extrabold tracking-[0.2em] uppercase text-foreground">
              Safety Argument
            </h1>
          </div>
        </a>

        <button 
          onClick={toggleDarkMode} 
          className="p-2 rounded-full hover:bg-foreground/5 transition-colors duration-300"
          aria-label="Toggle Dark Mode"
        >
          {darkMode ? <Sun className="w-5 h-5 text-primary transition-colors duration-300" /> : <Moon className="w-5 h-5 text-primary transition-colors duration-300" />}
        </button>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[340px] bg-secondary border-r border-border p-6 flex flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar transition-colors duration-300">
          <div className="space-y-1">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-foreground/50">Project Parameters</h2>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[9px] font-mono font-bold text-foreground/60 uppercase tracking-widest">
                <Briefcase size={10} /> Project Name
              </label>
              <input
                type="text"
                value={details.project}
                onChange={(e) => updateDetail('project', e.target.value)}
                placeholder="e.g. Green Hydrogen Plant"
                className="w-full px-4 py-2 bg-background border border-border focus:border-primary rounded-[10px] text-xs outline-none transition-all placeholder:opacity-30"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[9px] font-mono font-bold text-foreground/60 uppercase tracking-widest">
                <MapPin size={10} /> Jurisdiction (City/State)
              </label>
              <input
                type="text"
                value={details.location}
                onChange={(e) => updateDetail('location', e.target.value)}
                placeholder="e.g. Melbourne, Victoria"
                className="w-full px-4 py-2 bg-background border border-border focus:border-primary rounded-[10px] text-xs outline-none transition-all placeholder:opacity-30"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[9px] font-mono font-bold text-foreground/60 uppercase tracking-widest">
                <Globe size={10} /> Application Type
              </label>
              <input
                type="text"
                value={details.application}
                onChange={(e) => updateDetail('application', e.target.value)}
                placeholder="e.g. Industrial Automation"
                className="w-full px-4 py-2 bg-background border border-border focus:border-primary rounded-[10px] text-xs outline-none transition-all placeholder:opacity-30"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[9px] font-mono font-bold text-foreground/60 uppercase tracking-widest">
                <FileText size={10} /> Operational Context
              </label>
              <textarea
                value={details.context}
                onChange={(e) => updateDetail('context', e.target.value)}
                placeholder="Constraints, environment, goals..."
                className="w-full h-32 px-4 py-2 bg-background border border-border focus:border-primary rounded-[10px] text-xs outline-none transition-all resize-none placeholder:opacity-30"
              />
            </div>
          </div>

          <div className="mt-auto pt-4 space-y-6">
            <button
              onClick={generateGraph}
              disabled={analyzing || !isFormValid}
              className="w-full py-3 bg-primary text-background rounded-[10px] text-[11px] font-bold uppercase tracking-widest hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-transparent"
            >
              {analyzing ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Researching...</span>
                </>
              ) : (
                <>
                  <span>Explore Architecture</span>
                </>
              )}
            </button>

            <div className="pt-6 border-t border-border">
              <div className="flex gap-2 text-foreground/40 mb-3">
                <span className="text-[8px] font-bold uppercase tracking-widest">Disclaimer</span>
              </div>
              <p className="text-[9px] text-foreground/50 leading-relaxed text-justify font-mono">
                {DISCLAIMER_TEXT}
              </p>
            </div>
          </div>
        </aside>

        {/* Viewport */}
        <section className="flex-1 relative flex flex-col bg-background transition-colors duration-300">
          {error && (
            <div className="absolute inset-0 z-40 flex items-center justify-center p-12 bg-background/60 backdrop-blur-sm">
              <div className="max-w-md bg-background border border-border p-8 rounded-[10px] text-center shadow-none">
                <div className="w-12 h-12 bg-foreground/5 text-foreground rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                   <Info size={24} />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-2 uppercase font-mono">Discovery Interrupted</h3>
                <p className="text-foreground/60 text-[10px] uppercase font-mono mb-6">{error}</p>
                <button 
                  onClick={generateGraph}
                  className="px-6 py-2 bg-primary text-background rounded-[10px] font-bold text-[10px] uppercase tracking-widest font-mono hover:opacity-90 transition-all"
                >
                  Retry Discovery
                </button>
              </div>
            </div>
          )}

          {!result && !analyzing && !error && (
            <div className="absolute inset-0 flex items-center justify-center p-12 text-center bg-transparent overflow-y-auto">
              <div className="max-w-xl space-y-10 py-12">
                <div className="space-y-4">
                  <h3 className="text-4xl font-bold tracking-tighter uppercase text-foreground font-mono">System Profiler</h3>
                  <div className="w-12 h-[2px] bg-primary mx-auto" />
                </div>
                
                <div className="space-y-5 text-[11px] leading-relaxed text-foreground/60 font-mono uppercase tracking-wider max-w-lg mx-auto text-justify">
                  <p>
                    OUR TOOL SERVES AS A "FIRST-PASS" SYSTEMS ENGINEERING CONSULTANT, ENSURING THAT USER HAS NOT MISSED CORE ELEMENTS AND INTERFACES, WHICH WOULD BE OTHERWISE AVAILABLE TO A REASONABLE PERSON RESEARCHING RELEVANT OPEN SOURCES.
                  </p>
                  
                  <p>
                    IT’S BUILT TO PROVOKE THOUGHT, PROVIDE STRUCTURE, AND OFFER A FOUNDATION FOR MORE DETAILED SYSTEMS ENGINEERING RESEARCH.
                  </p>
                  
                  <p className="text-foreground/40">
                    IT IS BUILT ON THE PRINCIPLE THAT HISTORIC BODY OF KNOWLEDGE CONCERNING SYSTEM ELEMENTS, ARCHITECTURE AND INTERFACES IS CODIFIED IN MULTI-TIERED STANDARDS OR PRACTICE AND REGULATIONS OF INTENDED JURISDICTION. YOUR SUPPORT IN ANY FORM IS MUCH APPRECIATED TO KEEP PAYING FOR THE TOKENS. IF YOU LIKE IT — SUPPORT US!
                  </p>
                </div>
              </div>
            </div>
          )}

          {analyzing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6 bg-background/50 backdrop-blur-sm z-50">
              <Loader2 className="animate-spin text-primary" size={48} />
              <div className="text-center space-y-2">
                <p className="text-sm font-bold uppercase tracking-[0.3em] text-foreground font-mono">Synthesising System</p>
                <p className="text-[10px] font-mono text-foreground/40 uppercase tracking-widest">Constructing architecture graph...</p>
              </div>
            </div>
          )}

          {result && !analyzing && (
            <div className="flex-1 flex flex-col overflow-hidden relative">
              <div className="absolute top-6 right-6 z-40">
                <button
                  onClick={() => generateSystemOverviewReport(details, result)}
                  className="flex items-center gap-2 px-6 py-3 bg-secondary hover:bg-background border border-border rounded-[10px] text-[10px] font-bold uppercase tracking-widest text-foreground transition-all shadow-none hover:translate-y-[-1px]"
                >
                  <Download size={14} className="text-primary" />
                  <span>System Report</span>
                </button>
              </div>
              <div className="flex-1 relative">
                <KnowledgeGraph nodes={result.nodes} links={result.links} />
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;
