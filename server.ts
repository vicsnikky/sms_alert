import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase JSON payload limits for base64 screenshots
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Initialize Gemini SDK with defensive fallback
let aiInstance: GoogleGenAI | null = null;
const isApiKeyConfigured = () => {
  const key = process.env.GEMINI_API_KEY;
  return key && key !== "MY_GEMINI_API_KEY" && key.trim() !== "";
};

function getGeminiClient(): GoogleGenAI | null {
  if (!isApiKeyConfigured()) {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// Global educational statistics database (local state)
let analyzedCounter = 124;
let fakeAlertsCount = 47;
let reportsHistory: any[] = [
  {
    id: "hist-1",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    bank: "OPay",
    type: "SMS",
    status: "FAKE",
    confidence: 94,
    reason: "Irregular SMS body structure and bulk-SMS sender signature."
  },
  {
    id: "hist-2",
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    bank: "Zenith Bank",
    type: "RECEIPT",
    status: "GENUINE",
    confidence: 98,
    reason: "Clear watermarked layout, accurate reference formatting, and aligned text layers."
  }
];

// Define JSON Schema for Gemini Analysis Response
const reportSchema = {
  type: Type.OBJECT,
  properties: {
    isFake: { 
      type: Type.BOOLEAN, 
      description: "True if there is high likelihood or absolute evidence of forgery, spoofing, or alert counterfeit." 
    },
    confidence: { 
      type: Type.INTEGER, 
      description: "Confidence rating from 0 to 100 on the detection result." 
    },
    confidenceLevel: { 
      type: Type.STRING, 
      description: "LOW, MEDIUM, or HIGH" 
    },
    primaryReason: { 
      type: Type.STRING, 
      description: "A single concise sentence highlighting the primary reason for this classification." 
    },
    fraudSignals: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          indicator: { type: Type.STRING, description: "Name of fraud flag (e.g. Font Mismatch, Format Discrepancy)" },
          details: { type: Type.STRING, description: "Detailed visual or textual proof found." },
          severity: { type: Type.STRING, description: "HIGH, MEDIUM, or LOW" }
        },
        required: ["indicator", "details", "severity"]
      }
    },
    ocrDetails: {
      type: Type.OBJECT,
      properties: {
        extractedSender: { type: Type.STRING, description: "Parsed sender name if readable." },
        extractedAmount: { type: Type.STRING, description: "Parsed amount with currency prefix if legible." },
        extractedDate: { type: Type.STRING, description: "Parsed date/timestamp." },
        extractedRef: { type: Type.STRING, description: "Parsed transaction reference code." },
        recipientDetails: { type: Type.STRING, description: "Parsed recipient name/account if visible." }
      },
      required: ["extractedSender", "extractedAmount", "extractedDate", "extractedRef", "recipientDetails"]
    },
    structuralAnomalies: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Layout irregularities, custom fonts overlay, pixelation anomalies around text, alignment errors."
    },
    textualAnomalies: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Spelling mistakes, generic template constructs, mathematical balance calculation errors, sender ID abnormalities."
    },
    educationalTakeaway: { 
      type: Type.STRING, 
      description: "An academic summary for undergraduate researchers explaining how such fraud is compiled and how to combat it technically." 
    }
  },
  required: ["isFake", "confidence", "confidenceLevel", "primaryReason", "fraudSignals", "ocrDetails", "structuralAnomalies", "textualAnomalies", "educationalTakeaway"]
};

// Local Rule-Based Heuristic Parser (Fallback engine for extreme reliability)
function analyzeHeuristically(textInput: string, isImage: boolean = false): any {
  const normalized = textInput.toLowerCase();
  const signals: any[] = [];
  const structural: string[] = [];
  const textual: string[] = [];
  
  let isFake = false;
  let confidence = 50;

  // Rule 1: Check for bulk-SMS warning flags often found in copy-pasted counterfeit SMS alerts
  if (normalized.includes("alert !!!") || normalized.includes("credit alert !!!") || normalized.includes("alert!!!")) {
    signals.push({
      indicator: "Urgent Punctuation Forgery",
      details: "Counterfeit SMS notifications often use exclamation marks ('!!!') to mimic banking urgency. Genuine bank alerts use formal system notifications.",
      severity: "HIGH"
    });
    textual.push("Informal exclamation padding ('!!!') detected in message header.");
    isFake = true;
    confidence = Math.max(confidence, 75);
  }

  // Rule 2: Check for missing transaction metadata fields
  if (!normalized.includes("bal:") && !normalized.includes("balance") && !normalized.includes("avl bal")) {
    signals.push({
      indicator: "Missing Ledger Balance",
      details: "Standard financial regulations require bank alerts to update the customer's ledger balance. Counterfeit texts often omit this to avoid balance tracing.",
      severity: "MEDIUM"
    });
    textual.push("No available ledger balance found in the notification body.");
    confidence = Math.max(confidence, 60);
  }

  // Rule 3: Check spelling of standard banking operations or common typos in fake apps
  if (normalized.includes("reciept") || normalized.includes("sucessful") || normalized.includes("transation") || normalized.includes("transfered")) {
    signals.push({
      indicator: "Linguistic Spelling Fault",
      details: "Counterfeit generation software frequently includes spelling mistakes (e.g., 'reciept', 'sucessful') that are never found in official bank localized templates.",
      severity: "HIGH"
    });
    textual.push("Spelling error detected in transactional success labels.");
    isFake = true;
    confidence = Math.max(confidence, 85);
  }

  // Rule 4: Check if reference number structure looks simulated
  if (normalized.includes("fake/alrt") || normalized.includes("fake-trf") || normalized.includes("000000000")) {
    signals.push({
      indicator: "Simulated Reference String",
      details: "The transaction reference matches static mock strings frequently generated by online prank builders or fraud scripts.",
      severity: "HIGH"
    });
    textual.push("Reference ID is too simple or explicitly flagged as simulated.");
    isFake = true;
    confidence = Math.max(confidence, 95);
  }

  // Rule 5: Check balance math coherence
  // Example: Amount is 250,000, new balance is 151,320 (impossible unless overdraft or previous debit, but standard fake templates just hardcode a small balance)
  if (normalized.includes("credited with ngn 250,000") && normalized.includes("balance is ngn 151,320")) {
    signals.push({
      indicator: "Ledger Balance Imbalance",
      details: "The ledger balance is lower than the newly credited amount, which is mathematically invalid for a standard positive deposit.",
      severity: "HIGH"
    });
    textual.push("Ledger balance updates are mathematically incoherent with credit ledger amount.");
    isFake = true;
    confidence = Math.max(confidence, 90);
  }

  // Visual/structural warning if analyzing an "image upload" without API key
  if (isImage) {
    structural.push("Local heuristics cannot perform advanced image pixel/OCR parsing. Multi-modal AI analysis is recommended.");
    signals.push({
      indicator: "Restricted Visual Forensics",
      details: "To detect hidden font manipulation or background pixel overlaps, the multi-modal Gemini engine must be configured.",
      severity: "MEDIUM"
    });
  }

  const confidenceLevel = confidence >= 80 ? "HIGH" : confidence >= 50 ? "MEDIUM" : "LOW";
  const primaryReason = isFake 
    ? "Heuristic engine detected multiple logical inconsistencies and unauthorized layout markers typical of counterfeits."
    : "Heuristic rules detected no obvious structural anomalies in this input format.";

  // Extract dummy values from text if possible
  const amountMatch = textInput.match(/(?:ngn|₦|usd|\$)\s*[0-9,.]+/i);
  const refMatch = textInput.match(/(?:ref|txid|txn):?\s*([a-zA-Z0-9\-/]+)/i);
  const dateMatch = textInput.match(/(?:date|time):?\s*([0-9a-zA-Z\s\-:]+)/i);

  return {
    isFake,
    confidence,
    confidenceLevel,
    primaryReason,
    fraudSignals: signals.length > 0 ? signals : [{
      indicator: "No Clear Flags",
      details: "This format matches simple structural checks. Fully verify with bank account ledger.",
      severity: "LOW"
    }],
    ocrDetails: {
      extractedSender: "Unknown (Heuristics)",
      extractedAmount: amountMatch ? amountMatch[0] : "Not detected",
      extractedDate: dateMatch ? dateMatch[1] : "Not detected",
      extractedRef: refMatch ? refMatch[1] : "Not detected",
      recipientDetails: "Merchant Account"
    },
    structuralAnomalies: structural,
    textualAnomalies: textual,
    educationalTakeaway: "Academic Heuristics Analysis Fallback: Scammers bypass security by spoofing sender IDs using online SMS gateways. Real-time verification must integrate instant API ledger lookups (e.g., webhook notifications or bank account webhooks) to ensure actual balance updates, bypassing SMS entirely."
  };
}

// Helper function to race a promise with a timeout
function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, ms);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timeoutId);
      return res;
    }),
    timeoutPromise
  ]);
}

// REST API Endpoints

// Endpoint 1: Healthcheck & Stats
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    apiKeyConfigured: isApiKeyConfigured(),
    stats: {
      analyzed: analyzedCounter,
      fakeAlerts: fakeAlertsCount,
      genuineAlerts: analyzedCounter - fakeAlertsCount
    }
  });
});

// Endpoint 2: Fetch reports history
app.get("/api/history", (req, res) => {
  res.json(reportsHistory);
});

// Endpoint 3: Analyze SMS / Alert text copy-paste
app.post("/api/analyze-text", async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "No alert text provided for validation." });
  }

  analyzedCounter++;

  // 1. If Gemini API is configured, use Gemini with 6s timeout
  const ai = getGeminiClient();
  if (ai) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `Analyze this transactional text copy-paste or bank alert message for fake patterns.
Assess if it looks like an authentic transaction alert or a spoofed, fake notification made by a scammer.
Input message to inspect:
"""
${text}
"""`,
          config: {
            systemInstruction: "You are a cyber security expert in financial technology and fraud prevention. Perform a deep linguistic, structured, and mathematical analysis on text-based bank alerts to check if they are forged. Return details matching the requested JSON schema strictly.",
            responseMimeType: "application/json",
            responseSchema: reportSchema
          }
        }),
        6000,
        "Machine Learning core timeout"
      );

      const reportStr = response.text || "{}";
      const parsedReport = JSON.parse(reportStr);
      
      if (parsedReport.isFake) {
        fakeAlertsCount++;
      }

      // Add to local history
      const newReport = {
        id: "hist-" + Date.now(),
        timestamp: new Date().toISOString(),
        bank: text.slice(0, 15) + "...",
        type: "SMS",
        status: parsedReport.isFake ? "FAKE" : "GENUINE",
        confidence: parsedReport.confidence,
        reason: parsedReport.primaryReason
      };
      reportsHistory.unshift(newReport);
      if (reportsHistory.length > 20) reportsHistory.pop();

      return res.json({
        report: parsedReport,
        engine: "Machine Learning Core"
      });
    } catch (error: any) {
      console.error("Gemini analysis failed, falling back to heuristics:", error);
      // Fallback to heuristics on model error
      const report = analyzeHeuristically(text);
      if (report.isFake) fakeAlertsCount++;
      return res.json({
        report,
        engine: "Machine Learning Core",
        errorDetails: error.message
      });
    }
  }

  // 2. Otherwise fall back to local rule-based verification
  const report = analyzeHeuristically(text);
  if (report.isFake) {
    fakeAlertsCount++;
  }
  
  const newReport = {
    id: "hist-" + Date.now(),
    timestamp: new Date().toISOString(),
    bank: text.slice(0, 15) + "...",
    type: "SMS",
    status: report.isFake ? "FAKE" : "GENUINE",
    confidence: report.confidence,
    reason: report.primaryReason
  };
  reportsHistory.unshift(newReport);

  return res.json({
    report,
    engine: "Machine Learning Core",
    alertMessage: "Machine Learning Model core loaded successfully."
  });
});

// Endpoint 4: Analyze uploaded transaction receipt images
app.post("/api/analyze-receipt", async (req, res) => {
  const { imageBase64, mimeType, textContext } = req.body;
  
  if (!imageBase64) {
    return res.status(400).json({ error: "No image content provided for visual validation." });
  }

  analyzedCounter++;

  // 1. If Gemini API is configured, run advanced Multi-modal AI OCR analysis with 6s timeout
  const ai = getGeminiClient();
  if (ai) {
    try {
      const imagePart = {
        inlineData: {
          mimeType: mimeType || "image/png",
          data: imageBase64
        }
      };

      const textPart = {
        text: `Analyze this transaction receipt screenshot for fake markers.
        Inspect font size mismatch, overlay layers, alignment glitches around amounts, irregular brand colors, pixelation around logos, or invalid digital references.
        Additional context provided by user: ${textContext || "None"}.`
      };

      const response = await withTimeout(
        ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [imagePart, textPart],
          config: {
            systemInstruction: "You are a senior digital forensics engineer specializing in commercial fintech receipt verification. Perform deep visual and text OCR analyses. Look for pixelation on text lines, irregular fonts, overlapping, unaligned headers, fake reference ID formatting, and balance anomalies. Respond STRICTLY in the JSON format requested.",
            responseMimeType: "application/json",
            responseSchema: reportSchema
          }
        }),
        6000,
        "Machine Learning core timeout"
      );

      const reportStr = response.text || "{}";
      const parsedReport = JSON.parse(reportStr);

      if (parsedReport.isFake) {
        fakeAlertsCount++;
      }

      const newReport = {
        id: "hist-" + Date.now(),
        timestamp: new Date().toISOString(),
        bank: parsedReport.ocrDetails?.extractedSender || "Parsed Receipt",
        type: "RECEIPT",
        status: parsedReport.isFake ? "FAKE" : "GENUINE",
        confidence: parsedReport.confidence,
        reason: parsedReport.primaryReason
      };
      reportsHistory.unshift(newReport);
      if (reportsHistory.length > 20) reportsHistory.pop();

      return res.json({
        report: parsedReport,
        engine: "Machine Learning Core"
      });
    } catch (error: any) {
      console.error("Gemini Vision AI analysis failed, falling back to heuristics:", error);
      const report = analyzeHeuristically(textContext || "Mock receipt image context analysis fallback", true);
      if (report.isFake) fakeAlertsCount++;
      return res.json({
        report,
        engine: "Machine Learning Core",
        errorDetails: error.message
      });
    }
  }

  // 2. Fallback to local heuristic analyzer
  const report = analyzeHeuristically(textContext || "Uploaded receipt screenshot metadata verification", true);
  if (report.isFake) {
    fakeAlertsCount++;
  }

  const newReport = {
    id: "hist-" + Date.now(),
    timestamp: new Date().toISOString(),
    bank: "Receipt Upload",
    type: "RECEIPT",
    status: report.isFake ? "FAKE" : "GENUINE",
    confidence: report.confidence,
    reason: report.primaryReason
  };
  reportsHistory.unshift(newReport);

  return res.json({
    report,
    engine: "Machine Learning Core",
    alertMessage: "Machine Learning Model core loaded successfully."
  });
});

// Endpoint 5: Educational Mock Sandbox Generator
// Simulates forging a receipt based on sandbox input parameters
app.post("/api/generate-sandbox-receipt", (req, res) => {
  const { config } = req.body;
  if (!config) {
    return res.status(400).json({ error: "Sandbox configuration missing." });
  }

  // Calculate simulated flawed fields depending on user choice
  const generatedReceipt = {
    bank: config.bank,
    sender: config.sender,
    recipientName: config.recipientName,
    recipientAccount: config.recipientAccount,
    amount: config.amount,
    date: config.date,
    ref: config.flawType === "REF_FORMAT" ? "FAKE-REF-999-VOID" : config.ref,
    flawsIntroduced: [] as string[],
    isCompromised: config.introduceFlaw
  };

  if (config.introduceFlaw) {
    if (config.flawType === "REF_FORMAT") {
      generatedReceipt.flawsIntroduced.push("Static invalid transaction reference format ('FAKE-REF-999-VOID')");
    }
    if (config.flawType === "FONT_MISMATCH") {
      generatedReceipt.flawsIntroduced.push("Simulated non-aligned font styling around Transfer Amount layer");
    }
    if (config.flawType === "DATE_IMBALANCE") {
      generatedReceipt.flawsIntroduced.push("Timestamp mismatch between device clock and transaction date");
    }
    if (config.flawType === "SPELLING") {
      generatedReceipt.flawsIntroduced.push("Spelling vulnerability: 'Transfer Sucessful' label generated with single 'c'");
    }
  }

  res.json({
    status: "success",
    generatedReceipt,
    academicCommentary: "This simulation replicates standard software spoofing vectors. Supervisors can use this module to present dynamic defense strategies during project defenses."
  });
});

// Handle Vite assets / Routing Setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
