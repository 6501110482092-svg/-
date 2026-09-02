/**
 * Converts a number to Thai Baht text (e.g. 1250.50 -> "หนึ่งพันสองร้อยห้าสิบบาทห้าสิบสตางค์")
 * Complies with official Thai accounting and taxation standards.
 */

const THAI_DIGITS = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
const THAI_POSITIONS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

function convertGroup(numberStr: string): string {
  let result = '';
  const len = numberStr.length;

  for (let i = 0; i < len; i++) {
    const digit = parseInt(numberStr[i], 10);
    const pos = len - i - 1;

    if (digit !== 0) {
      if (pos === 0 && digit === 1 && len > 1 && parseInt(numberStr[len - 2], 10) !== 0) {
        result += 'เอ็ด';
      } else if (pos === 1 && digit === 2) {
        result += 'ยี่สิบ';
      } else if (pos === 1 && digit === 1) {
        result += 'สิบ';
      } else {
        result += THAI_DIGITS[digit] + THAI_POSITIONS[pos];
      }
    }
  }

  return result;
}

export function formatThaiBahtText(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'ศูนย์บาทถ้วน';
  }

  // Handle negative amounts
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  if (absAmount === 0) {
    return 'ศูนย์บาทถ้วน';
  }

  // Round to 2 decimal places to prevent floating point inaccuracies
  const fixed = absAmount.toFixed(2);
  const parts = fixed.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  let bahtText = '';

  // Process millions if integer exceeds 6 digits
  if (integerPart.length > 6) {
    const millionGroups = [];
    let current = integerPart;
    while (current.length > 6) {
      millionGroups.unshift(current.slice(-6));
      current = current.slice(0, -6);
    }
    millionGroups.unshift(current);

    for (let g = 0; g < millionGroups.length; g++) {
      const groupText = convertGroup(millionGroups[g]);
      bahtText += groupText;
      if (g < millionGroups.length - 1 && groupText !== '') {
        bahtText += 'ล้าน';
      }
    }
  } else {
    bahtText = convertGroup(integerPart);
  }

  if (bahtText === '') {
    bahtText = 'ศูนย์';
  }

  bahtText += 'บาท';

  const satang = parseInt(decimalPart, 10);
  if (satang === 0) {
    bahtText += 'ถ้วน';
  } else {
    let satangText = '';
    const satangStr = decimalPart;
    const digit1 = parseInt(satangStr[0], 10);
    const digit2 = parseInt(satangStr[1], 10);

    if (digit1 > 0) {
      if (digit1 === 1) {
        satangText += 'สิบ';
      } else if (digit1 === 2) {
        satangText += 'ยี่สิบ';
      } else {
        satangText += THAI_DIGITS[digit1] + 'สิบ';
      }
    }

    if (digit2 > 0) {
      if (digit2 === 1 && digit1 > 0) {
        satangText += 'เอ็ด';
      } else {
        satangText += THAI_DIGITS[digit2];
      }
    }

    bahtText += satangText + 'สตางค์';
  }

  return (isNegative ? 'ลบ' : '') + bahtText;
}

export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0.00';
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
