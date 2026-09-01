import { DocumentItem, DocumentType, VatType } from '../types';
import { formatThaiBahtText } from './thaiBaht';

export interface CalculationResult {
  subtotal: number;
  discountTotal: number;
  afterDiscount: number;
  vatAmount: number;
  withholdingTaxAmount: number;
  grandTotal: number;
  netPayment: number;
  thaiBahtText: string;
}

export function calculateDocumentTotals(
  items: DocumentItem[],
  vatType: VatType = 'excluded',
  vatRate: number = 7,
  withholdingTaxRate: number = 0
): CalculationResult {
  let subtotal = 0;
  let discountTotal = 0;
  let taxableSubtotal = 0;

  items.forEach((item) => {
    const rawItemTotal = item.quantity * item.unitPrice;
    let itemDiscount = 0;

    if (item.discountType === 'percent') {
      itemDiscount = rawItemTotal * (item.discountValue / 100);
    } else {
      itemDiscount = item.discountValue;
    }

    // Ensure discount doesn't exceed item total
    itemDiscount = Math.min(rawItemTotal, Math.max(0, itemDiscount));
    const finalItemTotal = rawItemTotal - itemDiscount;

    subtotal += rawItemTotal;
    discountTotal += itemDiscount;

    if (item.isTaxable !== false) {
      taxableSubtotal += finalItemTotal;
    }
  });

  const afterDiscount = Math.max(0, subtotal - discountTotal);
  let vatAmount = 0;
  let grandTotal = 0;

  if (vatType === 'excluded') {
    // Standard VAT added on top
    vatAmount = (taxableSubtotal * vatRate) / 100;
    grandTotal = afterDiscount + vatAmount;
  } else if (vatType === 'included') {
    // VAT is already inside the total (Price * 7 / 107)
    vatAmount = (taxableSubtotal * vatRate) / (100 + vatRate);
    grandTotal = afterDiscount;
  } else {
    // No VAT
    vatAmount = 0;
    grandTotal = afterDiscount;
  }

  // Withholding tax calculated on pre-vat base (afterDiscount)
  const withholdingTaxAmount = (afterDiscount * withholdingTaxRate) / 100;
  const netPayment = Math.max(0, grandTotal - withholdingTaxAmount);
  const thaiBahtText = formatThaiBahtText(grandTotal);

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discountTotal: Number(discountTotal.toFixed(2)),
    afterDiscount: Number(afterDiscount.toFixed(2)),
    vatAmount: Number(vatAmount.toFixed(2)),
    withholdingTaxAmount: Number(withholdingTaxAmount.toFixed(2)),
    grandTotal: Number(grandTotal.toFixed(2)),
    netPayment: Number(netPayment.toFixed(2)),
    thaiBahtText,
  };
}

export function getDocumentTypeInfo(type: DocumentType) {
  switch (type) {
    case 'quotation':
      return {
        prefix: 'QT',
        titleTh: 'ใบเสนอราคา',
        titleEn: 'QUOTATION',
        subtitleTh: 'ต้นฉบับ / Original',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        colorTheme: '#d97706',
        desc: 'เอกสารแสดงราคาและเงื่อนไขการให้บริการแก่ลูกค้าก่อนตกลงสั่งซื้อ',
      };
    case 'billing':
      return {
        prefix: 'BN',
        titleTh: 'ใบวางบิล / ใบแจ้งหนี้',
        titleEn: 'BILLING NOTE / INVOICE',
        subtitleTh: 'ต้นฉบับ / Original',
        badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
        colorTheme: '#0284c7',
        desc: 'เอกสารสรุปรายการหนี้และแจ้งยอดเพื่อเรียกเก็บเงินตามรอบบิล',
      };
    case 'invoice':
      return {
        prefix: 'IV',
        titleTh: 'ใบแจ้งหนี้',
        titleEn: 'INVOICE',
        subtitleTh: 'ต้นฉบับ / Original',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        colorTheme: '#4f46e5',
        desc: 'เอกสารเรียกเก็บเงินอย่างเป็นทางการเมื่อส่งมอบสินค้าหรืองานเสร็จสิ้น',
      };
    case 'receipt':
      return {
        prefix: 'RC',
        titleTh: 'ใบเสร็จรับเงิน / ใบกำกับภาษี',
        titleEn: 'RECEIPT / TAX INVOICE',
        subtitleTh: 'ต้นฉบับ (เอกสารออกเป็นชุด)',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        colorTheme: '#059669',
        desc: 'เอกสารหลักฐานการรับชำระเงินและภาษีมูลค่าเพิ่มที่ถูกต้องตามกฎหมาย',
      };
  }
}

export function generateDocumentNumber(type: DocumentType, existingCount: number = 0): string {
  const prefix = getDocumentTypeInfo(type).prefix;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const sequence = String(existingCount + 1).padStart(3, '0');
  return `${prefix}-${year}${month}-${sequence}`;
}

export function getStatusInfo(status: string) {
  switch (status) {
    case 'draft':
      return { label: 'ฉบับร่าง', color: 'bg-slate-100 text-slate-700 border-slate-300' };
    case 'pending':
      return { label: 'รอดำเนินการ', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'approved':
      return { label: 'อนุมัติแล้ว', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'paid':
      return { label: 'ชำระเงินแล้ว', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'overdue':
      return { label: 'เกินกำหนด', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    case 'cancelled':
      return { label: 'ยกเลิก', color: 'bg-zinc-100 text-zinc-500 border-zinc-300' };
    default:
      return { label: status, color: 'bg-slate-100 text-slate-700 border-slate-300' };
  }
}
