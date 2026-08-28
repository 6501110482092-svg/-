import QRCode from 'qrcode';

/**
 * Calculates CRC16-CCITT for EMVCo standard PromptPay QR Code
 */
function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xff;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Format field with 2-digit tag, 2-digit length, and value
 */
function formatTag(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

/**
 * Determine type of PromptPay ID
 */
export function getPromptPayType(raw: string): 'phone' | 'taxId' | 'citizenId' | 'eWallet' | 'unknown' {
  const clean = (raw || '').replace(/[^0-9]/g, '');
  if (clean.length === 10 && clean.startsWith('0')) {
    return 'phone';
  }
  if (clean.length === 13) {
    if (clean.startsWith('0')) return 'taxId';
    return 'citizenId';
  }
  if (clean.length === 15) {
    return 'eWallet';
  }
  return 'unknown';
}

/**
 * Get human-readable label for PromptPay type
 */
export function getPromptPayLabel(raw: string): string {
  const type = getPromptPayType(raw);
  switch (type) {
    case 'phone':
      return 'เบอร์โทรศัพท์มือถือ';
    case 'taxId':
      return 'เลขนิติบุคคล / ผู้เสียภาษี (13 หลัก)';
    case 'citizenId':
      return 'เลขบัตรประชาชน (13 หลัก)';
    case 'eWallet':
      return 'e-Wallet ID (15 หลัก)';
    default:
      return 'พร้อมเพย์ (PromptPay ID)';
  }
}

/**
 * Format PromptPay ID for display
 */
export function formatPromptPayId(raw: string): string {
  const clean = (raw || '').replace(/[^0-9]/g, '');
  if (clean.length === 10) {
    // 081-234-5678
    return clean.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  if (clean.length === 13) {
    // 0-1055-12345-67-8 or 1-2345-67890-12-3
    return clean.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5');
  }
  if (clean.length === 15) {
    return clean.replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, '$1-$2-$3-$4');
  }
  return raw;
}

/**
 * Generates an EMVCo-compliant Thai PromptPay payload string
 * Supports 10-digit mobile phone numbers (08xxxxxxxx), 13-digit Tax/Citizen IDs, and 15-digit e-Wallet
 */
export function generatePromptPayPayload(target: string, amount?: number): string {
  // Clean input
  const cleanTarget = target.replace(/[^0-9]/g, '');

  let targetFormatted = '';
  let subTag = '';

  if (cleanTarget.length === 10 && cleanTarget.startsWith('0')) {
    // Mobile number format: 0066 + 9 digits without leading 0
    targetFormatted = '0066' + cleanTarget.substring(1);
    subTag = '01';
  } else if (cleanTarget.length === 13) {
    // National ID or Tax ID
    targetFormatted = cleanTarget;
    subTag = '02';
  } else if (cleanTarget.length === 15) {
    // e-Wallet ID
    targetFormatted = cleanTarget;
    subTag = '03';
  } else if (cleanTarget.length >= 10) {
    targetFormatted = cleanTarget;
    subTag = '02';
  } else {
    // Fallback: simple text
    return cleanTarget;
  }

  // Tag 29: Merchant Account Information for PromptPay (AID: A000000677010111)
  const aid = formatTag('00', 'A000000677010111');
  const targetTag = formatTag(subTag, targetFormatted);
  const tag29Value = aid + targetTag;
  const tag29 = formatTag('29', tag29Value);

  // Core payload tags
  const tag00 = formatTag('00', '01'); // Format Indicator
  const tag01 = formatTag('01', amount && amount > 0 ? '12' : '11'); // 12 for dynamic (with amount), 11 for static
  const tag53 = formatTag('53', '764'); // Currency: THB (764)
  const tag58 = formatTag('58', 'TH'); // Country: Thailand

  let payload = tag00 + tag01 + tag29 + tag53;

  if (amount && amount > 0) {
    const formattedAmount = amount.toFixed(2);
    payload += formatTag('54', formattedAmount);
  }

  payload += tag58;
  payload += '6304'; // CRC tag header

  const checksum = crc16(payload);
  return payload + checksum;
}

/**
 * Generates a Data URL image from PromptPay payload
 */
export async function generateQRCodeDataUrl(target: string, amount?: number): Promise<string> {
  try {
    if (!target) return '';
    const payload = generatePromptPayPayload(target, amount);
    const dataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (error) {
    console.error('Failed to generate PromptPay QR:', error);
    return '';
  }
}
