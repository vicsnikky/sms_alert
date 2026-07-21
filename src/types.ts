export interface FraudSignal {
  indicator: string;
  details: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
}

export interface OcrDetails {
  extractedSender: string;
  extractedAmount: string;
  extractedDate: string;
  extractedRef: string;
  recipientDetails: string;
}

export interface AnalysisReport {
  isFake: boolean;
  confidence: number;
  confidenceLevel: "LOW" | "MEDIUM" | "HIGH";
  primaryReason: string;
  fraudSignals: FraudSignal[];
  ocrDetails: OcrDetails;
  structuralAnomalies: string[];
  textualAnomalies: string[];
  educationalTakeaway: string;
}

export type AlertType = "RECEIPT_GENUINE" | "RECEIPT_FAKE" | "SMS_GENUINE" | "SMS_FAKE";

export interface SampleAlert {
  id: string;
  name: string;
  type: AlertType;
  bank: string;
  description: string;
  content?: string; // Text content for SMS types
  imageUrl?: string; // Reference image URL
  estimatedAmount?: string;
  estimatedDate?: string;
}

export interface SandboxConfig {
  bank: string;
  sender: string;
  recipientName: string;
  recipientAccount: string;
  amount: string;
  date: string;
  ref: string;
  introduceFlaw: boolean;
  flawType: "REF_FORMAT" | "FONT_MISMATCH" | "DATE_IMBALANCE" | "SPELLING" | "NONE";
}
