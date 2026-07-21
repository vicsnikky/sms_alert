import React, { useState, useRef } from "react";
import { Upload, FileImage, ShieldAlert, Sparkles, Check, ChevronRight, Eye, AlertCircle, RefreshCw, Layers } from "lucide-react";
import { SAMPLE_ALERTS, BANK_PROFILES } from "../data/samples";
import { AnalysisReport, SampleAlert } from "../types";

export default function ImageAnalyzer({
  onAddHistory,
  apiKeyConfigured
}: {
  onAddHistory: () => void;
  apiKeyConfigured: boolean;
}) {
  const [selectedSample, setSelectedSample] = useState<SampleAlert | null>(null);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [fileMime, setFileMime] = useState<string>("image/png");
  const [customContext, setCustomContext] = useState<string>("");
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [activeEngine, setActiveEngine] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter receipt samples
  const receiptSamples = SAMPLE_ALERTS.filter(s => s.type.startsWith("RECEIPT"));

  // Convert files to base64
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, JPEG).");
      return;
    }
    setFileMime(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedFile(e.target?.result as string);
      setSelectedSample(null);
      setReport(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const selectSample = (sample: SampleAlert) => {
    setSelectedSample(sample);
    setUploadedFile(null);
    setReport(null);
    setCustomContext(sample.description);
  };

  const triggerAnalyze = async () => {
    let base64Data = "";
    let contextText = customContext;

    if (selectedSample) {
      // Simulate/approximate receipt values for OCR in case of preconfigured sample
      base64Data = "MOCK_BASE64_FOR_PRESET";
      contextText = `Selected Preset: ${selectedSample.name}. Bank: ${selectedSample.bank}. Estimated Amount: ${selectedSample.estimatedAmount || "Unknown"}. Estimated Date: ${selectedSample.estimatedDate || "Unknown"}. ${selectedSample.description}`;
    } else if (uploadedFile) {
      // Extract pure base64 data without prefix (data:image/png;base64,...)
      const commaIdx = uploadedFile.indexOf(",");
      if (commaIdx !== -1) {
        base64Data = uploadedFile.substring(commaIdx + 1);
      } else {
        base64Data = uploadedFile;
      }
    } else {
      alert("Please upload a receipt screenshot or select an educational sample first!");
      return;
    }

    setAnalyzing(true);
    setReport(null);

    try {
      const response = await fetch("/api/analyze-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: fileMime,
          textContext: contextText
        })
      });

      if (!response.ok) {
        throw new Error("Analysis failed. Please check your network connection.");
      }

      const data = await response.json();
      setReport(data.report);
      setActiveEngine(data.engine);
      onAddHistory(); // refresh parent statistics
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred during verification.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8" id="image-analyzer-component">
      {/* Left Forensics Console (Controls & Uploads) */}
      <div className="xl:col-span-5 space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" /> Image Evidence Ingestion
            </h3>
            <p className="text-xs text-slate-500">
              Upload a transaction screenshot or select an educational sample to run forensic analysis.
            </p>
          </div>

          {/* Sample Receipt Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Undergraduate Project Presets</label>
            <div className="grid grid-cols-2 gap-2">
              {receiptSamples.map((sample) => {
                const isSelected = selectedSample?.id === sample.id;
                return (
                  <button
                    key={sample.id}
                    onClick={() => selectSample(sample)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600/30"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-extrabold text-[10px] uppercase text-slate-500">{sample.bank}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${sample.type === "RECEIPT_GENUINE" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                        {sample.type === "RECEIPT_GENUINE" ? "Genuine" : "Forged"}
                      </span>
                    </div>
                    <p className="font-bold text-xs text-slate-800 line-clamp-1">{sample.name}</p>
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

          {/* Custom File Dropzone */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Upload Screenshot (PNG/JPG)</label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                isDragOver ? "border-indigo-600 bg-indigo-50/30" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/30"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                accept="image/*"
                className="hidden"
              />
              <Upload className="w-8 h-8 text-slate-400" />
              <div>
                <p className="text-xs font-bold text-slate-800">Drag & Drop transaction receipt</p>
                <p className="text-[10px] text-slate-400">or click to browse local storage</p>
              </div>
            </div>
          </div>

          {/* User Context notes (OCR helper) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Forensic Context Notes (Optional)</label>
            <textarea
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
              placeholder="e.g. OPay receipt with reported value of 45,000 NGN. Spotting alignment flaws."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-none min-h-[60px]"
            />
          </div>

          {/* Action Trigger Button */}
          <button
            onClick={triggerAnalyze}
            disabled={analyzing || (!selectedSample && !uploadedFile)}
            className="w-full bg-slate-900 hover:bg-slate-950 disabled:bg-slate-200 text-white p-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Running Forensic Engine...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-yellow-400" /> Run AI & OCR Forensics
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Forensics Board (Analysis & Visual Output) */}
      <div className="xl:col-span-7 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Column 1: Evidence Screen (renders the layout) */}
          <div className="md:col-span-5 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-blue-500" /> Evidence Capture
            </span>
            
            {/* High-Fidelity Phone Screen Rendering of Receipt Presets for premium demo */}
            {selectedSample ? (
              <div className="w-full max-w-[220px] aspect-[9/18] bg-slate-950 rounded-2xl border-4 border-slate-800 overflow-hidden relative shadow-md text-[9px] flex flex-col justify-between">
                {/* Phone Notch/Status */}
                <div className="h-4 bg-slate-900 flex justify-between px-3 items-center text-[8px] text-slate-400">
                  <span>10:20 AM</span>
                  <div className="w-12 h-2.5 bg-black rounded-full" />
                  <span>94%</span>
                </div>

                {/* Receipt Render depending on preset */}
                <div className="flex-1 bg-white p-3 space-y-3 flex flex-col justify-between relative overflow-hidden">
                  {/* Fake watermark alert overlay on report result */}
                  {report && report.isFake && (
                    <div className="absolute inset-0 bg-red-500/5 flex items-center justify-center pointer-events-none rotate-12 select-none border-2 border-dashed border-red-500/20 m-2 rounded-lg">
                      <span className="text-red-600 font-black text-xl tracking-widest opacity-30">COUNTERFEIT</span>
                    </div>
                  )}

                  {/* Receipt Header */}
                  <div className="text-center space-y-1">
                    <div className={`mx-auto w-7 h-7 rounded-full flex items-center justify-center text-white font-extrabold text-[10px] ${selectedSample.bank.includes("OPay") ? "bg-emerald-500" : "bg-red-500"}`}>
                      {selectedSample.bank[0]}
                    </div>
                    <p className="font-extrabold text-slate-900 text-xs">{selectedSample.bank}</p>
                    <p className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block">Transaction Successful</p>
                  </div>

                  {/* Transfer details */}
                  <div className="border-t border-dashed border-slate-200 pt-2 space-y-1.5 text-[8px] text-slate-600">
                    <div className="flex justify-between">
                      <span>Sender:</span>
                      <span className="font-bold text-slate-800">ZAINAB</span>
                    </div>
                    <div className="flex justify-between items-center relative">
                      <span>Amount:</span>
                      <span className={`font-black text-xs text-slate-900 relative ${report?.isFake && selectedSample.id === "receipt-fake-1" ? "border-2 border-rose-500/50 bg-rose-50 px-1 rounded animate-pulse" : ""}`}>
                        {selectedSample.estimatedAmount}
                        {report?.isFake && selectedSample.id === "receipt-fake-1" && (
                          <span className="absolute -top-3 right-0 bg-rose-500 text-white font-bold text-[6px] px-1 rounded">FONT MISMATCH</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Recipient:</span>
                      <span className="font-bold text-slate-800">Undergrad Research Account</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span className="font-medium">{selectedSample.estimatedDate}</span>
                    </div>
                    <div className="flex justify-between items-center relative">
                      <span>Ref ID:</span>
                      <span className={`font-mono text-slate-500 text-[7px] ${report?.isFake && selectedSample.id === "receipt-fake-1" ? "border-2 border-rose-500/50 bg-rose-50 px-1 rounded" : ""}`}>
                        {selectedSample.id === "receipt-fake-1" ? "TXF/OP-999-VOID-99" : "26072049283412398234839"}
                      </span>
                    </div>
                  </div>

                  {/* Receipt Brand Footer */}
                  <div className="text-center pt-2 border-t border-slate-100 text-[6px] text-slate-400">
                    Official automated transaction receipt. Thank you.
                  </div>
                </div>

                {/* Phone Home Bar */}
                <div className="h-3 bg-slate-950 flex justify-center items-center">
                  <div className="w-16 h-1 bg-slate-700 rounded-full" />
                </div>
              </div>
            ) : uploadedFile ? (
              <div className="w-full relative rounded-lg overflow-hidden border border-slate-200">
                <img
                  src={uploadedFile}
                  alt="Evidence"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-[300px] object-contain"
                />
                {report && report.isFake && (
                  <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center border-4 border-red-500 border-dashed pointer-events-none">
                    <span className="bg-red-600 text-white text-xs font-black px-2 py-1 rounded shadow-lg tracking-wider">SUSPICIOUS RECEIPT DETECTED</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 w-full bg-slate-50 border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <FileImage className="w-10 h-10 mb-2 stroke-1" />
                <p className="text-xs">Select evidence on the left to initialize visual analysis canvas.</p>
              </div>
            )}
          </div>

          {/* Column 2: Forensic Output Report */}
          <div className="md:col-span-7 space-y-4">
            {report ? (
              <div className="space-y-4 animate-fade-in">
                {/* Result Status Header */}
                <div className={`p-4 rounded-xl border flex gap-3 items-start ${report.isFake ? "bg-rose-50 border-rose-200" : "bg-emerald-50 border-emerald-200"}`}>
                  <ShieldAlert className={`w-6 h-6 shrink-0 ${report.isFake ? "text-rose-600" : "text-emerald-600"}`} />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${report.isFake ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>
                        {report.isFake ? "SUSPICIOUS (HIGH RISK)" : "GENUINE (VERIFIED)"}
                      </span>
                      <span className="text-slate-400 text-[10px] font-medium">Engine: {activeEngine}</span>
                    </div>
                    <h4 className="font-black text-slate-900 text-sm">{report.primaryReason}</h4>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <span>Analysis Confidence:</span>
                      <strong className={`font-bold ${report.isFake ? "text-rose-600" : "text-emerald-600"}`}>{report.confidence}%</strong>
                      <span className="text-slate-300">|</span>
                      <span>Security Risk:</span>
                      <strong className={`font-bold ${report.isFake ? "text-rose-600" : "text-emerald-600"}`}>{report.confidenceLevel}</strong>
                    </div>
                  </div>
                </div>

                {/* Heuristic Fail Warnings Banner (if no API Key) */}
                {!apiKeyConfigured && (
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Rule-Based Heuristic Engine Fallback</p>
                      Visual OCR pixelation analysis was bypassed because the Machine Learning API credential is missing. For deep visual layout fraud inspection, please set your credentials.
                    </div>
                  </div>
                )}

                {/* Accordion List of Specific Fraud Indicators */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 font-extrabold text-slate-700 flex justify-between">
                    <span>FORENSIC FLAGGED INDICATORS</span>
                    <span>({report.fraudSignals.length})</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-[160px] overflow-y-auto">
                    {report.fraudSignals.map((sig, idx) => (
                      <div key={idx} className="p-3 hover:bg-slate-50 flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${sig.severity === 'HIGH' ? 'bg-red-500' : sig.severity === 'MEDIUM' ? 'bg-orange-500' : 'bg-yellow-400'}`} />
                            {sig.indicator}
                          </p>
                          <p className="text-slate-500 leading-relaxed text-[11px]">{sig.details}</p>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold ${sig.severity === 'HIGH' ? 'bg-red-50 text-red-700' : sig.severity === 'MEDIUM' ? 'bg-orange-50 text-orange-700' : 'bg-yellow-50 text-yellow-700'}`}>
                          {sig.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Extracted OCR Details Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 font-extrabold text-slate-700">
                    EXTRACTED TRANSACTION DATA (OCR)
                  </div>
                  <div className="p-3 grid grid-cols-2 gap-x-6 gap-y-2 text-[11px]">
                    <div className="border-b border-slate-100 pb-1">
                      <span className="text-slate-400 block font-medium">Extracted Sender:</span>
                      <strong className="text-slate-800 font-bold">{report.ocrDetails.extractedSender || "N/A"}</strong>
                    </div>
                    <div className="border-b border-slate-100 pb-1">
                      <span className="text-slate-400 block font-medium">Extracted Recipient:</span>
                      <strong className="text-slate-800 font-bold">{report.ocrDetails.recipientDetails || "N/A"}</strong>
                    </div>
                    <div className="border-b border-slate-100 pb-1">
                      <span className="text-slate-400 block font-medium">Extracted Amount:</span>
                      <strong className="text-indigo-600 font-extrabold">{report.ocrDetails.extractedAmount || "N/A"}</strong>
                    </div>
                    <div className="border-b border-slate-100 pb-1">
                      <span className="text-slate-400 block font-medium">Transaction Reference:</span>
                      <strong className="text-slate-700 font-mono text-[10px] font-bold">{report.ocrDetails.extractedRef || "N/A"}</strong>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block font-medium">Transaction Date:</span>
                      <strong className="text-slate-800 font-bold">{report.ocrDetails.extractedDate || "N/A"}</strong>
                    </div>
                  </div>
                </div>

                {/* Educational Takeaway for Undergraduate Project */}
                <div className="bg-indigo-950 text-indigo-200 p-4 rounded-xl border border-indigo-800 text-[11px] leading-relaxed">
                  <p className="font-extrabold text-white mb-1.5 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> Academic & Security Takeaway
                  </p>
                  {report.educationalTakeaway}
                </div>
              </div>
            ) : (
              <div className="h-full bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2 min-h-[350px]">
                {analyzing ? (
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Processing Multi-Modal Proofs</p>
                      <p className="text-xs text-slate-400">Evaluating image pixels, alignment layers, and reference checks...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Eye className="w-12 h-12 stroke-1" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Verification Report Board</p>
                      <p className="text-xs max-w-xs mx-auto">No report processed yet. Choose or upload a receipt above and click "Run AI & OCR Forensics" to initialize analysis.</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
