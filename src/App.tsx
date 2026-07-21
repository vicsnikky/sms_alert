import React, { useState, useEffect } from "react";
import { Shield, LayoutDashboard, Cpu, MessageSquareCode, Sliders, BookOpen, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import Dashboard from "./components/Dashboard";
import ImageAnalyzer from "./components/ImageAnalyzer";
import TextVerifier from "./components/TextVerifier";
import AlertSandbox from "./components/AlertSandbox";
import EducationalResources from "./components/EducationalResources";

type TabType = "dashboard" | "receipt" | "sms" | "resources";

interface Stats {
  analyzed: number;
  fakeAlerts: number;
  genuineAlerts: number;
}

interface HistoryItem {
  id: string;
  timestamp: string;
  bank: string;
  type: string;
  status: string;
  confidence: number;
  reason: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [stats, setStats] = useState<Stats>({ analyzed: 0, fakeAlerts: 0, genuineAlerts: 0 });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Load backend stats & history logs
  const loadSystemState = async () => {
    try {
      const [healthRes, historyRes] = await Promise.all([
        fetch("/api/health"),
        fetch("/api/history")
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setStats(healthData.stats);
        setApiKeyConfigured(healthData.apiKeyConfigured);
      }

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData);
      }
    } catch (error) {
      console.error("Failed to load server statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSystemState();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      {/* Top Application Bar */}
      <header className="bg-slate-950 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight block uppercase">AlertGuard</span>
              <span className="text-[10px] text-indigo-400 font-semibold block tracking-wider -mt-0.5">Forensic Verification Suite</span>
            </div>
          </div>

          {/* Verification Engine Badges */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
              <span className={`w-2 h-2 rounded-full ${apiKeyConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
              <span className="text-slate-300 font-medium text-[11px]">
                {apiKeyConfigured ? "Machine Learning Core Active" : "Local Heuristic Engine Active"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar */}
        <nav className="w-full md:w-64 shrink-0 flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">Navigation Panel</span>
          
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-3 p-3 rounded-xl text-xs font-semibold transition-all text-left ${
              activeTab === "dashboard"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-950"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            Research Dashboard
          </button>

          <button
            onClick={() => setActiveTab("receipt")}
            className={`flex items-center gap-3 p-3 rounded-xl text-xs font-semibold transition-all text-left ${
              activeTab === "receipt"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-950"
            }`}
          >
            <Cpu className="w-4 h-4 shrink-0" />
            OCR Receipt Forensics
          </button>

          <button
            onClick={() => setActiveTab("sms")}
            className={`flex items-center gap-3 p-3 rounded-xl text-xs font-semibold transition-all text-left ${
              activeTab === "sms"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-950"
            }`}
          >
            <MessageSquareCode className="w-4 h-4 shrink-0" />
            SMS Copy-Paste Verifier
          </button>

          <button
            onClick={() => setActiveTab("resources")}
            className={`flex items-center gap-3 p-3 rounded-xl text-xs font-semibold transition-all text-left ${
              activeTab === "resources"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-950"
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            Project Reference Guide
          </button>

          {/* Sticky Informative alert for supervisors */}
          <div className="mt-8 bg-indigo-50 border border-indigo-150 rounded-xl p-4 space-y-1 text-[11px] leading-relaxed text-indigo-800">
            <p className="font-extrabold flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Supervisor Note</p>
            <p>
              This app is fully compatible with offline presentations. You can select pre-built transaction alerts representing standard genuine and spoofed messages from GTB, Zenith Bank, and OPay to demonstrate real-time defensive checks.
            </p>
          </div>
        </nav>

        {/* Content Body */}
        <section className="flex-1 min-w-0">
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-medium">Bootstrapping Security Systems...</p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.18 }}
              >
                {activeTab === "dashboard" && (
                  <Dashboard
                    stats={stats}
                    history={history}
                    onRefresh={loadSystemState}
                    apiKeyConfigured={apiKeyConfigured}
                    engineType={apiKeyConfigured ? "ML Classifier (Active)" : "Heuristics (Fallback)"}
                  />
                )}
                {activeTab === "receipt" && (
                  <ImageAnalyzer
                    onAddHistory={loadSystemState}
                    apiKeyConfigured={apiKeyConfigured}
                  />
                )}
                {activeTab === "sms" && (
                  <TextVerifier
                    onAddHistory={loadSystemState}
                    apiKeyConfigured={apiKeyConfigured}
                  />
                )}
                {activeTab === "resources" && (
                  <EducationalResources />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </section>
      </main>

      {/* Footer copyright */}
      <footer className="bg-slate-900 text-slate-500 text-[10px] py-4 border-t border-slate-800 text-center">
        <p>© 2026 AlertGuard Fraud Verification Systems. Undergraduate Capstone Project Submission. All rights reserved.</p>
      </footer>
    </div>
  );
}
