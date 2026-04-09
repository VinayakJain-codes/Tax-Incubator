// lib/formulas.ts

export type FilingStatus = "Missing" | "Overdue" | "Due <30d" | "On Track";
export type LicenseStatus = "EXPIRED" | "RENEW <60d" | "Active" | null;
export type ReminderFlag = "OVERDUE" | "DUE SOON" | null;
export type RAG = "Red" | "Amber" | "Green" | null;

const FREQUENCY_MONTHS: Record<string, number> = {
  Monthly: 1,
  Quarterly: 3,
  "Semi-Annual": 6,
  Annual: 12,
};

/** Add N months to a date (mirrors Excel EDATE) */
export function edate(base: Date, months: number): Date {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
}

/** VAT / CT: Next Due Date */
export function getNextDueDate(
  lastFilingDate: string | Date | null,
  frequency: string | null
): Date | null {
  if (!lastFilingDate || !frequency) return null;
  const d = new Date(lastFilingDate);
  if (isNaN(d.getTime())) return null;
  const months = FREQUENCY_MONTHS[frequency];
  if (!months) return null;
  return edate(d, months);
}

/** Days between a date and today (negative = overdue) */
export function daysFromToday(date: string | Date | null): number | null {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - today.getTime()) / 86_400_000);
}

/** VAT / CT: Filing Status */
export function getFilingStatus(nextDueDate: Date | null): FilingStatus {
  if (!nextDueDate) return "Missing";
  const days = daysFromToday(nextDueDate);
  if (days === null) return "Missing";
  if (days < 0) return "Overdue";
  if (days <= 30) return "Due <30d";
  return "On Track";
}

/** VAT / CT: Reminder Flag */
export function getFilingReminderFlag(status: FilingStatus): ReminderFlag {
  if (status === "Overdue") return "OVERDUE";
  if (status === "Due <30d") return "DUE SOON";
  return null;
}

/** Licenses: Status */
export function getLicenseStatus(expiryDate: string | Date | null): LicenseStatus {
  if (!expiryDate) return null;
  const days = daysFromToday(expiryDate);
  if (days === null) return null;
  if (days < 0) return "EXPIRED";
  if (days <= 60) return "RENEW <60d";
  return "Active";
}

/** Licenses: Reminder Flag */
export function getLicenseReminderFlag(status: LicenseStatus): ReminderFlag {
  if (status === "EXPIRED") return "OVERDUE";
  if (status === "RENEW <60d") return "DUE SOON";
  return null;
}

/** Renewal Calendar: RAG status */
export function getRAG(dueDateOrExpiry: string | Date | null): RAG {
  if (!dueDateOrExpiry) return null;
  const days = daysFromToday(dueDateOrExpiry);
  if (days === null) return null;
  if (days < 0) return "Red";
  if (days <= 30) return "Amber";
  return "Green";
}

/** Renewal Calendar: Reminder Flag from RAG */
export function getCalendarReminderFlag(rag: RAG): ReminderFlag {
  if (rag === "Red") return "OVERDUE";
  if (rag === "Amber") return "DUE SOON";
  return null;
}

/** Entity Master: Regulatory Group + Risk Rating from jurisdiction */
export function getJurisdictionMeta(
  jurisdiction: string | null,
  params: Record<string, { regulatory_group: string; risk_rating: string }>
): { regulatory_group: string | null; risk_rating: string | null } {
  if (!jurisdiction) return { regulatory_group: null, risk_rating: null };
  return {
    regulatory_group: params[jurisdiction]?.regulatory_group ?? null,
    risk_rating: params[jurisdiction]?.risk_rating ?? null,
  };
}

export const STATUS_COLOURS = {
  // Filing Status
  "On Track":  "bg-green-100 text-green-800",
  "Due <30d":  "bg-amber-100 text-amber-800",
  "Overdue":   "bg-red-100 text-red-800",
  "Missing":   "bg-gray-100 text-gray-500",

  // License Status
  "Active":       "bg-green-100 text-green-800",
  "RENEW <60d":   "bg-amber-100 text-amber-800",
  "EXPIRED":      "bg-red-100 text-red-800",

  // RAG
  "Green":  "bg-green-500",
  "Amber":  "bg-amber-400",
  "Red":    "bg-red-500",

  // Reminder Flag
  "OVERDUE":   "bg-red-600 text-white",
  "DUE SOON":  "bg-amber-500 text-white",
} as const;
