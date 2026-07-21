import React, { useState } from "react";
import { Sparkles, RefreshCw, ClipboardList, CheckCircle2, AlertOctagon, HelpCircle, AlertCircle } from "lucide-react";
import { SAMPLE_ALERTS } from "../data/samples";
import { AnalysisReport, SampleAlert } from "../types";

export default function TextVerifier({
  onAddHistory,
  apiKeyConfigured
}: {
  onAddHistory: () => void;
  apiKeyConfigured: boolean;
}) {
  const [inputText, setInputText] = useState<string>("");
  const [selectedPreset, setSelectedPreset] = useState<SampleAlert | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [activeEngine, setActiveEngine] = useState<string>("");

  // Filter SMS samples
  const smsSamples = SAMPLE_ALERTS.filter((s) => s.type.startsWith("SMS"));

  const selectPreset = (preset: SampleAlert) => {
    setSelectedPreset(preset);
    setInputText(preset.content || "");
    setReport(null);
  };

  const handleClear = () => {
    setInputText("");
    setSelectedPreset(null);
    setReport(null);
  };

  const runAnalysis = async () => {
    if (!inputText.trim()) {
      alert("Please copy and paste an SMS alert or load a preset alert first.");
      return;
    }

    setAnalyzing(true);
    setReport(null);

    try {
      const response = await fetch("/api/analyze-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText })
      });

      if (!response.ok) {
        let errMsg = `Server returned status ${response.status}`;
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          } else if (errData && errData.errorDetails) {
            errMsg = `${errData.errorDetails}`;
          }
        } catch (e) {
          try {
            const txt = await response.text();
            if (txt) {
              errMsg += `: ${txt.slice(0, 150)}`;
            }
          } catch (inner) {}
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      setReport(data.report);
      setActiveEngine(data.engine);
      onAddHistory(); // Sync statistics in root App
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred during verification.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8" id="text-verifier-component">
      {/* Left Console: Input and presets */}
      <div className="xl:col-span-5 space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-600" /> Alert Text Forensics
            </h3>
            <p className="text-xs text-slate-500">
              Paste suspicious SMS text logs or load preset transaction alerts from major commercial banks to test.
            </p>
          </div>

          {/* Preset buttons */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Pre-configured SMS Alert Samples</label>
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
              {smsSamples.map((sample) => {
                const isSelected = selectedPreset?.id === sample.id;
                return (
                  <button
                    key={sample.id}
                    onClick={() => selectPreset(sample)}
                    className={`w-full p-2 rounded-lg border text-left text-xs transition-all flex justify-between items-center ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/50"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-800">{sample.name}</p>
                      <p className="text-[10px] text-slate-400">{sample.bank}</p>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${sample.type === "SMS_GENUINE" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                      {sample.type === "SMS_GENUINE" ? "Genuine" : "Forged"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">or</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Main Textarea */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 block">Suspicious SMS Text</label>
              {inputText && (
                <button 
                  onClick={handleClear}
                  className="text-[10px] font-bold text-rose-500 hover:underline"
                >
                  Clear Body
                </button>
              )}
            </div>
            <textarea
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                setSelectedPreset(null);
                setReport(null);
              }}
              placeholder="Paste raw SMS message content directly from the phone log here..."
              className="w-full min-h-[140px] text-xs p-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none font-mono"
            />
          </div>

          {/* Run Analysis Action Button */}
          <button
            onClick={runAnalysis}
            disabled={analyzing || !inputText.trim()}
            className="w-full bg-slate-900 hover:bg-slate-950 disabled:bg-slate-200 text-white p-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Verifying SMS tokens...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-yellow-400" /> Verify Notification
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Console: Forensics analysis and detailed reports */}
      <div className="xl:col-span-7 space-y-6">
        {report ? (
          <div className="space-y-6 animate-fade-in">
            {/* Main Verdict Card */}
            <div className={`p-5 rounded-xl border flex gap-4 items-start ${report.isFake ? "bg-rose-50 border-rose-200" : "bg-emerald-50 border-emerald-200"}`}>
              {report.isFake ? (
                <AlertOctagon className="w-8 h-8 text-rose-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
              )}
              <div className="space-y-1.5 flex-1">
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${report.isFake ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>
                    {report.isFake ? "FAKE SMS DETECTED" : "GENUINE LAYOUT PASS"}
                  </span>
                  <span className="text-slate-400 text-[10px]">Engine: {activeEngine}</span>
                </div>
                <h4 className="font-extrabold text-slate-900 text-base">{report.primaryReason}</h4>
                <div className="flex gap-4 text-xs">
                  <p className="text-slate-500">Confidence: <strong className={report.isFake ? "text-rose-600" : "text-emerald-600"}>{report.confidence}%</strong></p>
                  <p className="text-slate-500">Threat Level: <strong className={report.isFake ? "text-rose-600" : "text-emerald-600"}>{report.confidenceLevel}</strong></p>
                </div>
              </div>
            </div>

            {/* AI Warning if not configured */}
            {!apiKeyConfigured && (
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Basic Heuristics Check Active</p>
                  Advanced contextual and mathematical balance calculations were processed locally. Activate the Machine Learning API credentials to run linguistic logic analyzers.
                </div>
              </div>
            )}

            {/* Highlighted Flags */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 font-extrabold text-slate-700">
                LATEST SECURITY COMPLIANCE AUDIT
              </div>
              <div className="divide-y divide-slate-100">
                {report.fraudSignals.map((signal, idx) => (
                  <div key={idx} className="p-3 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${signal.severity === 'HIGH' ? 'bg-red-500' : 'bg-amber-400'}`} />
                        {signal.indicator}
                      </p>
                      <p className="text-slate-500 leading-relaxed text-[11px]">{signal.details}</p>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${signal.severity === 'HIGH' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                      {signal.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Extracted Details Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-extrabold text-slate-700">
                ALERT PARSING DATA
              </div>
              <table className="w-full border-collapse text-left text-[11px]">
                <tbody className="divide-y divide-slate-150">
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-400 bg-slate-50/50 w-1/3">Detected Sender:</td>
                    <td className="p-2.5 font-bold text-slate-800">{report.ocrDetails.extractedSender}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-400 bg-slate-50/50">Calculated Value:</td>
                    <td className="p-2.5 font-extrabold text-indigo-600">{report.ocrDetails.extractedAmount}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-400 bg-slate-50/50">Transaction Reference:</td>
                    <td className="p-2.5 font-mono text-slate-700 font-bold">{report.ocrDetails.extractedRef}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-400 bg-slate-50/50">Extracted Datetime:</td>
                    <td className="p-2.5 font-bold text-slate-800">{report.ocrDetails.extractedDate}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Academic Advice */}
            <div className="bg-indigo-950 text-indigo-200 p-4 rounded-xl border border-indigo-800 text-xs leading-relaxed">
              <p className="font-extrabold text-white mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-400" /> Academic Explanatory Insights
              </p>
              {report.educationalTakeaway}
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[350px] bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
            {analyzing ? (
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Running Threat Heuristics</p>
                  <p className="text-xs text-slate-400">Parsing carrier IDs, transaction alignment, and mathematical balances...</p>
                </div>
              </div>
            ) : (
              <>
                <ClipboardList className="w-12 h-12 stroke-1" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Verification Report Board</p>
                  <p className="text-xs max-w-xs mx-auto">No text has been analyzed. Load an SMS preset on the left or paste your custom SMS notification text to get immediate diagnostics.</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
