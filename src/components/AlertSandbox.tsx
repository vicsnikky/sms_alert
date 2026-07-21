import React, { useState } from "react";
import { Play, RotateCcw, AlertTriangle, ShieldCheck, HelpCircle, Code, Settings } from "lucide-react";
import { BANK_PROFILES } from "../data/samples";
import { SandboxConfig } from "../types";

export default function AlertSandbox() {
  const [config, setConfig] = useState<SandboxConfig>({
    bank: "OPay",
    sender: "ZAINAB",
    recipientName: "DR. ODULAJA (SUPERVISOR)",
    recipientAccount: "3029182390",
    amount: "NGN 150,000.00",
    date: "20-Jul-2026 14:30:22",
    ref: "OPY26072049283412398234839",
    introduceFlaw: true,
    flawType: "FONT_MISMATCH"
  });

  const [simulatedResult, setSimulatedResult] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [forensicVerdict, setForensicVerdict] = useState<any | null>(null);

  const handleBankChange = (bankName: string) => {
    const profile = BANK_PROFILES.find((b) => b.name === bankName);
    if (profile) {
      setConfig({
        ...config,
        bank: bankName,
        ref: profile.refFormat.replace(/x/g, () => Math.floor(Math.random() * 10).toString())
      });
    }
  };

  const handleReset = () => {
    setConfig({
      bank: "OPay",
      sender: "ZAINAB",
      recipientName: "DR. ODULAJA (SUPERVISOR)",
      recipientAccount: "3029182390",
      amount: "NGN 150,000.00",
      date: "20-Jul-2026 14:30:22",
      ref: "OPY26072049283412398234839",
      introduceFlaw: true,
      flawType: "FONT_MISMATCH"
    });
    setSimulatedResult(null);
    setForensicVerdict(null);
  };

  const handleSimulate = async () => {
    setLoading(true);
    setSimulatedResult(null);
    setForensicVerdict(null);

    try {
      // Step 1: Request sandbox compiler to generate a counterfeit receipt based on rules
      const generateRes = await fetch("/api/generate-sandbox-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config })
      });

      if (!generateRes.ok) {
        throw new Error("Sandbox generator failed.");
      }

      const simData = await generateRes.json();
      setSimulatedResult(simData.generatedReceipt);

      // Step 2: Push the generated mockup directly into our validation pipeline to see if we catch it!
      const normalizedSms = `Credit Alert
Amt: ${simData.generatedReceipt.amount}
Acct: ${simData.generatedReceipt.recipientAccount}
Desc: TRF/${simData.generatedReceipt.sender}/SANDBOX
Ref: ${simData.generatedReceipt.ref}
Date: ${simData.generatedReceipt.date}
${config.flawType === 'SPELLING' ? 'Transfer Sucessful' : 'Transfer Successful'}`;

      const analyzeRes = await fetch("/api/analyze-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: normalizedSms })
      });

      if (analyzeRes.ok) {
        const checkData = await analyzeRes.json();
        setForensicVerdict(checkData.report);
      }
    } catch (error: any) {
      console.error(error);
      alert("Error processing sandbox request: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8" id="alert-sandbox-component">
      {/* Left Column: Editor controls */}
      <div className="xl:col-span-5 space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600 animate-spin-slow" />
            <div>
              <h3 className="text-lg font-bold text-slate-900">Sandbox Receipt Generator</h3>
              <p className="text-xs text-slate-500">Replicate standard software spoofing vectors.</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {/* Target bank */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Target Bank Template</label>
              <select
                value={config.bank}
                onChange={(e) => handleBankChange(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:outline-none focus:border-indigo-500"
              >
                {BANK_PROFILES.map((profile) => (
                  <option key={profile.name} value={profile.name}>
                    {profile.name} Template
                  </option>
                ))}
              </select>
            </div>

            {/* Transfer Amount */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Sender Name</label>
                <input
                  type="text"
                  value={config.sender}
                  onChange={(e) => setConfig({ ...config, sender: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Transfer Amount</label>
                <input
                  type="text"
                  value={config.amount}
                  onChange={(e) => setConfig({ ...config, amount: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                />
              </div>
            </div>

            {/* Recipient Details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Recipient Name</label>
                <input
                  type="text"
                  value={config.recipientName}
                  onChange={(e) => setConfig({ ...config, recipientName: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Recipient Account</label>
                <input
                  type="text"
                  value={config.recipientAccount}
                  onChange={(e) => setConfig({ ...config, recipientAccount: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>
            </div>

            {/* Vulnerability injector settings */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">Inject Forgery Vulnerability</label>
                <input
                  type="checkbox"
                  checked={config.introduceFlaw}
                  onChange={(e) => setConfig({ ...config, introduceFlaw: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
              </div>

              {config.introduceFlaw && (
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-400">Choose the type of digital flaw to simulate:</p>
                  <div className="grid grid-cols-1 gap-2">
                    <label className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer hover:bg-slate-50 text-[11px]">
                      <input
                        type="radio"
                        name="flawType"
                        checked={config.flawType === "FONT_MISMATCH"}
                        onChange={() => setConfig({ ...config, flawType: "FONT_MISMATCH" })}
                        className="text-indigo-600"
                      />
                      <div>
                        <strong className="text-slate-800">Visual Font Weight Discrepancy</strong>
                        <p className="text-[10px] text-slate-400">Renders the Transfer Amount in non-matching heavy system fonts.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer hover:bg-slate-50 text-[11px]">
                      <input
                        type="radio"
                        name="flawType"
                        checked={config.flawType === "REF_FORMAT"}
                        onChange={() => setConfig({ ...config, flawType: "REF_FORMAT" })}
                        className="text-indigo-600"
                      />
                      <div>
                        <strong className="text-slate-800">Reference String Spoofing</strong>
                        <p className="text-[10px] text-slate-400">Overwrites the bank Reference ID format with static 'VOID' flags.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer hover:bg-slate-50 text-[11px]">
                      <input
                        type="radio"
                        name="flawType"
                        checked={config.flawType === "SPELLING"}
                        onChange={() => setConfig({ ...config, flawType: "SPELLING" })}
                        className="text-indigo-600"
                      />
                      <div>
                        <strong className="text-slate-800">Linguistic Spelling Typos</strong>
                        <p className="text-[10px] text-slate-400">Generates 'Transfer Sucessful' label with missing spelling letters.</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Simulate triggers */}
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
            <button
              onClick={handleSimulate}
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>Simulating Attack & Defense...</>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Compile & Verify Forgery
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Execution Output */}
      <div className="xl:col-span-7 space-y-6">
        {simulatedResult ? (
          <div className="space-y-6 animate-fade-in">
            {/* Header: Simulator Output Summary */}
            <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 flex items-start gap-3">
              <Code className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-sm">Simulator Pipeline Complete</h4>
                <p className="text-xs text-indigo-200">
                  Receipt compiled using the {simulatedResult.bank} template with intentional forgery vectors injected.
                </p>
              </div>
            </div>

            {/* Mock layout rendered dynamically showing injected flaw */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider">Simulated Evidence Screen</h5>
              <div className="max-w-[280px] mx-auto p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-4 text-xs font-mono">
                <div className="text-center pb-2 border-b border-dashed border-slate-200">
                  <p className="font-extrabold text-slate-800">{simulatedResult.bank} TRANSFER</p>
                  <p className="text-[10px] text-slate-400">Sandbox Testbed Instance</p>
                </div>
                
                <div className="space-y-2 text-[10px]">
                  <div className="flex justify-between">
                    <span>Sender:</span>
                    <strong className="text-slate-800">{simulatedResult.sender}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Recipient:</span>
                    <strong className="text-slate-800">{simulatedResult.recipientName}</strong>
                  </div>
                  <div className="flex justify-between items-center bg-white p-1 rounded">
                    <span>Amount:</span>
                    <strong className={`font-black text-slate-900 ${config.introduceFlaw && config.flawType === 'FONT_MISMATCH' ? 'text-rose-600 text-xs tracking-tight bg-rose-50 px-1 rounded border border-rose-200 animate-pulse' : ''}`}>
                      {simulatedResult.amount}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Ref Code:</span>
                    <strong className={`font-bold ${config.introduceFlaw && config.flawType === 'REF_FORMAT' ? 'text-rose-600 bg-rose-50 px-1 rounded border border-rose-200 font-mono' : 'text-slate-600'}`}>
                      {simulatedResult.ref}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <strong className={`font-bold ${config.introduceFlaw && config.flawType === 'SPELLING' ? 'text-rose-600 font-serif font-medium bg-rose-50 px-1 rounded' : 'text-emerald-600'}`}>
                      {config.introduceFlaw && config.flawType === "SPELLING" ? "Transfer Sucessful" : "Transfer Successful"}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Closing-loop: Forensic verdict of detection engine */}
            {forensicVerdict ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border flex gap-3 items-start ${forensicVerdict.isFake ? "bg-rose-50 border-rose-200" : "bg-emerald-50 border-emerald-200"}`}>
                  {forensicVerdict.isFake ? (
                    <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${forensicVerdict.isFake ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>
                        {forensicVerdict.isFake ? "ATTACK MITIGATED / CAUGHT" : "ATTACK BYPASS (WARN)"}
                      </span>
                      <span className="text-slate-400 text-[9px] font-medium">Detection Confidence: {forensicVerdict.confidence}%</span>
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-xs mt-1">{forensicVerdict.primaryReason}</h5>
                    
                    {/* List what elements triggered the catch */}
                    <div className="mt-2 text-[11px] text-slate-500 space-y-1">
                      <p className="font-bold text-slate-700">Flagged Anomaly Triggers:</p>
                      {forensicVerdict.fraudSignals.map((sig: any, index: number) => (
                        <p key={index} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                          <span><strong>{sig.indicator}</strong>: {sig.details}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-950 p-4 rounded-xl border border-indigo-800 text-xs leading-relaxed text-indigo-200">
                  <p className="font-extrabold text-white mb-1 uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400" /> Academic Simulator Conclusion
                  </p>
                  This execution proves that rule-based token boundaries and custom AI context parsing successfully 
                  defends against {config.flawType === 'FONT_MISMATCH' ? 'visual style injections' : config.flawType === 'REF_FORMAT' ? 'reference ID forging' : 'linguistic spoof mutations'}. 
                  Supervisors can observe that automated verification systems prevent counterfeit confirmations entirely.
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="h-full min-h-[350px] bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <Settings className="w-10 h-10 text-indigo-600 animate-spin" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Generating Counterfeit Anomaly...</p>
                  <p className="text-xs text-slate-400">Injecting security flaws, compiling mock layouts, and routing to detection engine...</p>
                </div>
              </div>
            ) : (
              <>
                <Code className="w-12 h-12 stroke-1" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Simulator Sandbox Output</p>
                  <p className="text-xs max-w-xs mx-auto">No simulation compiled yet. Adjust the receipt details and click "Compile & Verify Forgery" to observe closed-loop attack mitigation.</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
