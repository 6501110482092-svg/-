import React from 'react';
import { DocumentModel } from '../../types';
import { getDocumentTypeInfo, getDiscountDisplayText, getDocumentBahtText } from '../../utils/documentCalculations';
import { formatCurrency } from '../../utils/thaiBaht';
import { PromptPayBox } from './PromptPayBox';
import { getCompanyHeaderLines } from '../../utils/companyHeader';
import { Building, Phone, Mail, Globe, MapPin, Calendar, FileText, CheckCircle2, UserCheck } from 'lucide-react';

interface TemplateProps {
  document: DocumentModel;
}

export const QuotationTemplate: React.FC<TemplateProps> = ({ document }) => {
  const typeInfo = getDocumentTypeInfo(document.type);
  const isEn = document.language === 'en';
  const isBilingual = document.language === 'bilingual';

  const company = document.company || ({} as typeof document.company);
  const headerLines = getCompanyHeaderLines(company);
  const customer = document.customer || ({} as typeof document.customer);
  const items = Array.isArray(document.items) ? document.items : [];

  return (
    <div className="bg-white p-4 sm:p-5 font-['Sarabun',sans-serif] text-slate-800 text-xs leading-normal max-w-[210mm] w-full mx-auto shadow-sm print:shadow-none min-h-[280mm] print:min-h-0 flex flex-col justify-between print:p-0 print:m-0">
      <div>
        {/* Top Header Row */}
        <div className="flex justify-between items-start border-b-2 border-indigo-700 pb-2 mb-2 gap-3">
          {/* Company Brand & Info (Expansive Left Column) */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-start sm:items-center gap-2.5 mb-1">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt="Company Logo"
                  className="h-10 max-h-12 w-auto max-w-[110px] object-contain rounded shrink-0"
                />
              ) : (
                <div className="w-9 h-9 bg-indigo-700 text-white rounded-lg flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                  {(company.name || 'บ').charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-[13px] sm:text-[14px] text-slate-900 leading-snug tracking-tight">
                  <div className="space-y-0.5">
                    {headerLines.map((line, idx) => (
                      <div key={idx} className="leading-snug">{line}</div>
                    ))}
                  </div>
                </h1>
                {company.nameEn && (
                  <p className="text-[10px] text-slate-600 font-medium whitespace-pre-line leading-tight mt-0.5">{company.nameEn}</p>
                )}
              </div>
            </div>

            <div className="text-[11px] text-slate-700 space-y-0.2 mt-0.5 leading-snug">
              <div className="flex items-start gap-1">
                <MapPin className="w-2.5 h-2.5 text-slate-400 mt-0.5 shrink-0" />
                <span>{company.address || '-'}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 pt-0.2">
                <span className="font-medium text-slate-800">
                  เลขประจำตัวผู้เสียภาษี: <span className="font-mono font-bold text-slate-950">{company.taxId || '-'}</span>
                </span>
                <span className="bg-slate-100 text-slate-800 px-1 py-0.2 rounded text-[10px] font-medium border border-slate-200">
                  {company.branchType === 'headquarters' ? 'สำนักงานใหญ่' : `สาขาที่ ${company.branchNo || '-'}`}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-2 text-slate-700 text-[10px] pt-0.2">
                {company.phone && <span>โทร: <strong className="font-medium text-slate-900">{company.phone}</strong></span>}
                {company.email && <span>อีเมล: <strong className="font-medium text-slate-900">{company.email}</strong></span>}
                {company.website && <span>เว็บ: <strong className="font-medium text-slate-900">{company.website}</strong></span>}
              </div>
            </div>
          </div>

          {/* Document Title & Meta Box (Right - Compact) */}
          <div className="w-[185px] sm:w-[195px] shrink-0 text-right">
            <div className="inline-block text-right mb-0.5">
              <span className="inline-block px-1.5 py-0.2 bg-indigo-50 text-indigo-700 text-[9px] font-bold rounded uppercase tracking-wider mb-0.5 border border-indigo-100">
                {document.type === 'quotation' ? 'เอกสารเสนอราคา' : typeInfo.subtitleTh}
              </span>
              <h2 className="text-lg sm:text-xl font-black text-indigo-700 tracking-tight leading-tight">
                {isEn ? typeInfo.titleEn : typeInfo.titleTh}
              </h2>
              <p className="text-[9px] font-bold text-slate-500 tracking-wider uppercase">
                {typeInfo.titleEn}
              </p>
            </div>

            <div className="mt-0.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-[11px] text-left space-y-0.2 shadow-2xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">เลขที่เอกสาร / No:</span>
                <span className="font-bold text-slate-900 font-mono text-xs">{document.documentNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">วันที่ / Date:</span>
                <span className="font-semibold text-slate-800">{document.issueDate}</span>
              </div>
              {document.dueDate && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">
                    {document.type === 'quotation' ? 'กำหนดยืนราคาถึง:' : 'ครบกำหนด / Due Date:'}
                  </span>
                  <span className="font-bold text-rose-700">{document.dueDate}</span>
                </div>
              )}
              {document.referenceNumber && (
                <div className="flex justify-between items-center border-t border-slate-200/80 pt-0.2">
                  <span className="text-slate-600 font-medium">อ้างอิง / Ref:</span>
                  <span className="font-mono font-medium text-slate-800">{document.referenceNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Information Block */}
        <div className="bg-slate-50/80 p-2 rounded-lg border border-slate-200 mb-2 text-xs">
          <div className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider mb-1 flex items-center gap-1 border-b border-slate-200/80 pb-0.5">
            <Building className="w-2.5 h-2.5 text-indigo-600" />
            <span>ข้อมูลลูกค้า / ผู้รับการเสนอราคา (Customer Information)</span>
          </div>
          <div className="grid grid-cols-12 gap-2 pt-0.2">
            <div className="col-span-7 space-y-0.2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-slate-600 text-[11px] font-medium w-20 shrink-0">ชื่อลูกค้า:</span>
                <span className="font-bold text-xs text-slate-900 leading-tight">{customer.name || '-'}</span>
              </div>
              {customer.contactPerson && (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-slate-600 text-[10px] font-medium w-20 shrink-0">เรียน / Attn:</span>
                  <span className="font-bold text-slate-800 text-[11px]">{customer.contactPerson}</span>
                </div>
              )}
              <div className="flex items-start gap-1.5">
                <span className="text-slate-600 text-[10px] font-medium w-20 shrink-0 mt-0.2">ที่อยู่:</span>
                <span className="text-slate-700 text-[10px] leading-snug">{customer.address || '-'}</span>
              </div>
            </div>

            <div className="col-span-5 pl-2 border-l border-slate-200 space-y-0.2 text-[10px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">เลขผู้เสียภาษี:</span>
                <span className="font-bold font-mono text-slate-950 text-[11px]">{customer.taxId || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">สาขา:</span>
                <span className="font-medium text-slate-800">
                  {customer.branchType === 'headquarters'
                    ? 'สำนักงานใหญ่'
                    : `สาขาที่ ${customer.branchNo || '-'}`}
                </span>
              </div>
              {customer.phone && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">โทร:</span>
                  <span className="text-slate-900 font-bold">{customer.phone}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">อีเมล:</span>
                  <span className="text-slate-800">{customer.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-2 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-[11px] text-left border-collapse">
            <thead>
              <tr className="bg-indigo-700 text-white font-semibold text-[11px]">
                <th className="py-1 px-1.5 text-center w-8 border-r border-indigo-600">ลำดับ</th>
                <th className="py-1 px-2 border-r border-indigo-600">รายการสินค้า / รายละเอียด</th>
                <th className="py-1 px-1.5 text-center w-14 border-r border-indigo-600">จำนวน</th>
                <th className="py-1 px-1.5 text-center w-14 border-r border-indigo-600">หน่วย</th>
                <th className="py-1 px-2 text-right w-24 border-r border-indigo-600">ราคา/หน่วย</th>
                <th className="py-1 px-2 text-right w-28">จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px]">
              {items.map((item, idx) => {
                const itemTotal = item.quantity * item.unitPrice;

                return (
                  <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                    <td className="py-1 px-1.5 text-center text-slate-500 border-r border-slate-200 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-1 px-2 border-r border-slate-200">
                      <div className="font-bold text-slate-900 leading-snug">{item.name}</div>
                      {item.description && (
                        <div className="text-[10px] text-slate-500 whitespace-pre-line leading-tight">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="py-1 px-1.5 text-center border-r border-slate-200 font-mono font-medium text-slate-800">
                      {item.quantity}
                    </td>
                    <td className="py-1 px-1.5 text-center border-r border-slate-200 text-slate-600">
                      {item.unit || 'ชิ้น'}
                    </td>
                    <td className="py-1 px-2 text-right border-r border-slate-200 font-mono">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-1 px-2 text-right font-bold text-slate-900 font-mono">
                      {formatCurrency(itemTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals & Thai Baht Text Block */}
        <div className="grid grid-cols-12 gap-2 mb-2 page-break-inside-avoid">
          {/* Thai Baht Text and Terms (Left) */}
          <div className="col-span-7 flex flex-col justify-between space-y-1">
            <div className="bg-indigo-50/80 px-2 py-1 rounded border border-indigo-100">
              <span className="text-[9px] text-indigo-700 font-semibold block uppercase">
                จำนวนเงินตัวอักษร / Amount in Words:
              </span>
              <span className="font-bold text-indigo-950 text-xs mt-0.2 block">
                ({getDocumentBahtText(document)})
              </span>
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-0.5 text-[10px] bg-slate-50 p-1.5 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-800 flex items-center gap-1 text-[10px]">
                <FileText className="w-2.5 h-2.5 text-indigo-600" />
                <span>เงื่อนไขการเสนอราคา (Terms):</span>
              </div>
              {document.paymentTerms && (
                <div className="text-slate-700 leading-tight">
                  <span className="font-semibold text-slate-900">• กำหนดการชำระเงิน: </span>
                  {document.paymentTerms}
                </div>
              )}
              {document.dueDate && (
                <div className="text-slate-700 leading-tight">
                  <span className="font-semibold text-slate-900">• กำหนดยืนราคา: </span>
                  ถึงวันที่ {document.dueDate}
                </div>
              )}
              {document.termsAndConditions && (
                <div className="text-slate-600 whitespace-pre-line leading-tight text-[9px]">
                  {document.termsAndConditions}
                </div>
              )}
              {document.notes && (
                <div className="text-amber-800 bg-amber-50 p-1 rounded border border-amber-200/70 text-[10px] whitespace-pre-line">
                  <span className="font-bold">หมายเหตุ / Remarks: </span>
                  {document.notes}
                </div>
              )}
            </div>
          </div>

          {/* Right Calculation Totals */}
          <div className="col-span-5 bg-slate-50 p-2 rounded-lg border border-slate-200 text-[11px] space-y-0.5">
            <div className="flex justify-between text-slate-600">
              <span>รวมเป็นเงิน (Subtotal):</span>
              <span className="font-mono font-medium">{formatCurrency(document.subtotal)} บาท</span>
            </div>
            {document.discountTotal > 0 && (
              <div className="flex justify-between text-rose-600 font-medium">
                <span>{getDiscountDisplayText(document.discountLabel, document.overallDiscountType, document.overallDiscountValue)}</span>
                <span className="font-mono font-semibold">-{formatCurrency(document.discountTotal)} บาท</span>
              </div>
            )}
            <div className="flex justify-between text-slate-700 font-medium">
              <span>ยอดหลังหักส่วนลด (Net):</span>
              <span className="font-mono">{formatCurrency(document.afterDiscount)} บาท</span>
            </div>

            {document.vatType !== 'none' && (
              <div className="flex justify-between text-slate-600 pt-0.5 border-t border-slate-200">
                <span>
                  ภาษีมูลค่าเพิ่ม VAT {document.vatRate}%
                  {document.vatType === 'included' && ' (รวมในยอด)'}:
                </span>
                <span className="font-mono">{formatCurrency(document.vatAmount)} บาท</span>
              </div>
            )}

            <div className="flex justify-between items-center text-xs font-bold text-slate-900 pt-0.5 border-t-2 border-indigo-700 bg-indigo-50/50 -mx-2 px-2 py-0.5 rounded">
              <span>จำนวนเงินรวมทั้งสิ้น:</span>
              <span className="font-mono text-sm text-indigo-700 font-black">
                ฿{formatCurrency(document.grandTotal)}
              </span>
            </div>

            {document.withholdingTaxRate > 0 && (
              <>
                <div className="flex justify-between text-amber-700 pt-0.2 text-[10px]">
                  <span>หักภาษี ณ ที่จ่าย {document.withholdingTaxRate}% (WHT):</span>
                  <span className="font-mono">-{formatCurrency(document.withholdingTaxAmount)} บาท</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-0.5">
                  <span>ยอดชำระสุทธิ (Net Payment):</span>
                  <span className="font-mono text-xs">฿{formatCurrency(document.netPayment)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* PromptPay & Bank Transfer Block */}
        <div className="mb-2 page-break-inside-avoid">
          <PromptPayBox document={document} accentColor="#4338ca" />
        </div>
      </div>

      {/* Signature Section at bottom */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 page-break-inside-avoid text-xs">
        {/* Customer / Purchaser Approval Box */}
        <div className="flex flex-col items-center justify-end text-center p-2 rounded bg-slate-50/50 border border-slate-200 min-h-[68px]">
          <div className="h-6 w-full flex items-end justify-center pb-0.5">
            <div className="w-40 border-b border-slate-400"></div>
          </div>
          <div className="font-bold text-slate-800 text-[11px] mt-1">
            ผู้อนุมัติสั่งซื้อ / Customer Approval
          </div>
          <div className="text-[10px] text-slate-500">
            วันที่ / Date: _____ / _____ / _________
          </div>
        </div>

        {/* Company Authorized Signer Box */}
        <div className="flex flex-col items-center justify-end text-center p-2 rounded bg-slate-50/50 border border-slate-200 min-h-[68px] relative">
          {/* Stamp Overlay */}
          {document.showStamp && company.stampUrl && (
            <img
              src={company.stampUrl}
              alt="Company Stamp"
              className="absolute right-2 top-1 w-10 h-10 opacity-80 object-contain pointer-events-none"
            />
          )}

          {/* Signature Area */}
          <div className="h-6 w-full flex flex-col items-center justify-end pb-0.5">
            {document.showSignature && company.signatureUrl && (
              <img
                src={company.signatureUrl}
                alt="Signature"
                className="max-h-6 w-auto object-contain -mb-1"
              />
            )}
            <div className="w-40 border-b border-slate-400"></div>
          </div>

          <div className="font-bold text-slate-900 text-[11px] mt-1">
            {document.preparedByName || company.signatureName || 'ผู้มีอำนาจลงนาม / Authorized Signer'}
          </div>
          <div className="text-[10px] text-slate-600 font-medium">
            {company.signaturePosition || 'ในนาม ' + (company.name || 'บริษัท')}
          </div>
        </div>
      </div>
    </div>
  );
};
