import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: string | number | null, currency: string = 'USD'): string {
  if (!amount) return currency === 'USD' ? '$0' : currency === 'EUR' ? '€0' : '£0';
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, "")) : amount;
  if (isNaN(num)) return currency === 'USD' ? '$0' : currency === 'EUR' ? '€0' : '£0';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(date: Date | string | null): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function calculateDaysUntil(date: Date | string): number {
  const target = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function calculateHealthScore(
  daysUntilRenewal: number,
  premiumChangePercent: number,
  emailDeliveryRate: number
): { score: number; status: 'healthy' | 'warning' | 'at-risk' } {
  let score = 100;

  if (daysUntilRenewal <= 30) score -= 30;
  else if (daysUntilRenewal <= 60) score -= 15;
  else if (daysUntilRenewal <= 90) score -= 5;

  if (premiumChangePercent > 20) score -= 25;
  else if (premiumChangePercent > 15) score -= 15;
  else if (premiumChangePercent > 10) score -= 5;

  if (emailDeliveryRate < 0.8) score -= 15;
  else if (emailDeliveryRate < 0.9) score -= 5;

  score = Math.max(0, Math.min(100, score));

  let status: 'healthy' | 'warning' | 'at-risk';
  if (score >= 70) status = 'healthy';
  else if (score >= 40) status = 'warning';
  else status = 'at-risk';

  return { score, status };
}

export const POLICY_TYPES = [
  'Commercial Auto',
  'General Liability',
  'Property & Fire',
  'D&O Liability',
  'Workers Compensation',
  'Umbrella',
  'Professional Liability',
  'Inland Marine',
  'Cyber Liability',
  'Health',
  'Life',
  'Auto',
  'Home',
] as const;

export const CARRIERS = [
  'State Farm',
  'Allstate',
  'Liberty Mutual',
  'Progressive',
  'Travelers',
  'Chubb',
  'The Hartford',
  'AIG',
  'Nationwide',
  'USAA',
  'Geico',
  'Other',
] as const;
