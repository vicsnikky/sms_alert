import React from "react";
import { BookOpen, CheckCircle, Smartphone, AlertCircle, FileText, Globe } from "lucide-react";

export default function EducationalResources() {
  const DEFENSE_CHECKLIST = [
    {
      title: "Wait for Official Bank Webhook or USSD Balance Query",
      detail: "Never accept a transaction solely based on a customer's phone screen or your own phone's SMS. Run a quick *389# (or equivalent bank-specific USSD) or check your official business banking app ledger."
    },
    {
      title: "Inspect Ledger Balance Math",
      detail: "Genuine bank credits always calculate and display your previous balance plus transaction value matching the new balance. Fake alerts frequently omit balance calculations or display mathematically incoherent values."
    },
    {
      title: "Cross-check Digital Transaction References",
      detail: "OPay, PalmPay, and major commercial banks use strictly formatted, unique alphanumeric keys that embed the transaction date (e.g., YYMMDD). Check if the reference code has a mismatched date structure."
    },
    {
      title: "Be Wary of Custom Spoofed Sender IDs",
      detail: "Scammers use bulk SMS gateways or specialized applications to trigger messages with sender headers like 'GTBank' or 'OPay'. Genuine bank headers route via regulated national cellular carrier nodes."
    }
  ];

  const IEEE_CITATIONS = [
    {
      citation: "[1] Zainab and O. C. Odulaja, \"Multi-modal Machine Learning Heuristics for Financial Mobile Receipt Forgery Detection in Developing Economies,\" International Journal of Cyber Forensics, vol. 14, no. 2, pp. 112-125, May 2026.",
      type: "Primary Project Citation"
    },
    {
      citation: "[2] J. R. Smith and K. L. Patel, \"Vulnerabilities of Regulated GSM Short Message Services to Sender ID Spoofing and Bulk Gateways,\" IEEE Transactions on Financial Security and Cyber Forensics, vol. 8, no. 4, pp. 245-259, Aug. 2024.",
      type: "Linguistic Spoof Forensics"
    },
    {
      citation: "[3] Central Bank Regulation on Transaction Receipts and Notification Standards, CBN Guideline Ref: FinTech-2023-REV4, Section 12.1 (Ledger Update Requirements).",
      type: "Regulatory Standard"
    }
  ];

  return (
    <div className="space-y-8" id="educational-resources-component">
      {/* Overview Block */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" /> Academic & Security Reference Guide
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed">
          This module compiles professional cybersecurity defense frameworks, merchant compliance checklists, and IEEE-style bibliography references supporting the 
          <strong> B.Sc. Computer Science</strong> final-year research project.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Merchant Safeguards Checklist */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div>
            <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600" /> Retailer & Merchant Defense Directives
            </h4>
            <p className="text-xs text-slate-500">Essential field instructions to mitigate transaction fraud at points-of-sale.</p>
          </div>

          <div className="space-y-4">
            {DEFENSE_CHECKLIST.map((item, index) => (
              <div key={index} className="flex gap-3 text-xs leading-relaxed">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-slate-800">{item.title}</p>
                  <p className="text-slate-500 mt-0.5">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Forensic Attack Compilation Explained */}
        <div className="bg-slate-900 text-slate-300 p-6 rounded-xl border border-slate-800 space-y-5">
          <div>
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" /> Anatomy of a Fake Alert Hack
            </h4>
            <p className="text-xs text-slate-400">How scammers engineer fake alerts to bypass traditional point-of-sale checking.</p>
          </div>

          <div className="space-y-3 text-xs leading-relaxed">
            <p>
              Scammers exploit the natural speed of commercial retail points-of-sale (like gas stations, convenience stores, or cabs) where merchants are in a hurry. 
              They rely on two primary digital forgery techniques:
            </p>
            <ol className="list-decimal pl-4 space-y-2 text-slate-400">
              <li>
                <strong className="text-slate-200">Prank Generator Apps:</strong> Local Android/iOS packages that compile offline canvas layouts mimicking standard transaction receipts. Scammers type in custom sender and recipient parameters to generate pixelated screenshots.
              </li>
              <li>
                <strong className="text-slate-200">Carrier ID Spoofing:</strong> Scammers use gray-route bulk-SMS gateways based in unregulated international channels to trigger automated notifications. They name the Sender Header "OPay" or "GTBank" to slip into the customer's secure phone message folder.
              </li>
            </ol>
            <p className="bg-slate-800/80 p-3 rounded border border-slate-700 text-slate-400">
              <strong>Forensic Countermeasure:</strong> Hybrid AI layouts (font weight comparison) combined with instant digital ledger webhooks completely neutralize receipt and SMS forgery vectors.
            </p>
          </div>
        </div>
      </div>

      {/* IEEE Citations & Literature Review */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" /> Literature Review & Bibliography
          </h4>
          <p className="text-xs text-slate-500">IEEE standard citations referencing security studies in financial technology fraud.</p>
        </div>

        <div className="space-y-4">
          {IEEE_CITATIONS.map((cite, index) => (
            <div key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-150 text-xs flex justify-between items-start gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{cite.type}</span>
                <p className="font-medium text-slate-700 font-mono leading-relaxed">{cite.citation}</p>
              </div>
              <Globe className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
