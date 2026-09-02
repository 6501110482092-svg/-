import { CompanyInfo } from '../types';

/**
 * Returns structured lines for displaying the company name on document headers.
 * Prioritizes explicit headerNameLine1, headerNameLine2, headerNameLine3.
 * Falls back to newline separation or full name.
 */
export function getCompanyHeaderLines(company?: CompanyInfo): string[] {
  if (!company) return ['ชื่อสถานประกอบการ'];

  // 1. Explicitly configured header lines
  if (company.headerNameLine1 && company.headerNameLine1.trim()) {
    const lines = [
      company.headerNameLine1.trim(),
      company.headerNameLine2?.trim(),
      company.headerNameLine3?.trim(),
    ].filter(Boolean) as string[];

    if (lines.length > 0) return lines;
  }

  const rawName = company.name || 'ชื่อสถานประกอบการ';

  // 2. Check if rawName already has newline characters
  if (rawName.includes('\n')) {
    const splitLines = rawName
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (splitLines.length > 0) return splitLines;
  }

  return [rawName];
}
