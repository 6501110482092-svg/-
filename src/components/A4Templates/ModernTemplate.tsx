import React from 'react';
import { DocumentModel } from '../../types';
import { getDocumentTypeInfo } from '../../utils/documentCalculations';
import { formatCurrency } from '../../utils/thaiBaht';
import { PromptPayBox } from './PromptPayBox';
import { Building, Phone, Mail, Globe, MapPin, Calendar, FileText } from 'lucide-react';

interface TemplateProps {
  document: DocumentModel;
}

export const ModernTemplate: React.FC<TemplateProps> = ({ document }) => {
  const typeInfo = getDocumentTypeInfo(document.type);
  const isEn = document.language === 'en';
  const isBilingual = document.language === 'bilingual';

  const company = document.company || ({} as typeof document.company);
  const customer = document.customer || ({} as typeof document.customer);
  const items = Array.isArray(document.items) ? document.items : [];

  return (
    <div className="bg-white p-8 sm:p-10 font-['Sarabun',sans-serif] text-slate-800 text-sm leading-relaxed max-w-[210mm] w-full mx-auto shadow-sm print:shadow-none min-h-[297mm] print:min-h-0 print:p-6 print:m-0 print:max-w-full flex flex-col justify-between">
      <div>
        {/* Top Header Row */}
        <div className="flex justify-between items-start border-b-2 border-indigo-600 pb-3.5 mb-3.5">
          {/* Company Brand & Details */}
          <div className="w-7/12 pr-4">
            <div className="flex items-center gap-3.5 mb-2.5">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt="Company Logo"
                  className="h-16 max-h-20 w-auto max-w-[160px] object-contain rounded shrink-0"
                />
              ) : (
                <div className="w-14 h-14 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-2xl shadow-xs shrink-0">
                  {(company.name || 'บ').charAt(0)}
                </div>
              )}
              <div>
                <h1 className="font-bold text-lg sm:text-xl text-slate-900 leading-snug">
                  {company.name || 'ชื่อสถานประกอบการ'}
                </h1>
                {company.nameEn && (
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">{company.nameEn}</p>
                )}
              </div>
            </div>

            <div className="text-xs sm:text-[13px] text-slate-700 space-y-0.5 mt-1.5 leading-relaxed">
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span>{company.address || '-'}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-0.5 pt-0.5">
                <span className="font-medium text-slate-800">
                  เลขประจำตัวผู้เสียภาษี: <span className="font-mono text-slate-950 font-bold">{company.taxId || '-'}</span>
                </span>
                <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs font-medium border border-slate-200">
                  {company.branchType === 'headquarters' ? 'สำนักงานใหญ่' : `สาขาที่ ${company.branchNo || '-'}`}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-3.5 gap-y-0.5 text-slate-700 text-xs pt-0.5">
                {company.phone && <span>โทร: <strong className="font-medium text-slate-900">{company.phone}</strong></span>}
                {company.email && <span>อีเมล: <strong className="font-medium text-slate-900">{company.email}</strong></span>}
                {company.website && <span>เว็บ: <strong className="font-medium text-slate-900">{company.website}</strong></span>}
              </div>
            </div>
          </div>

          {/* Document Title & Meta */}
          <div className="w-5/12 text-right pl-3">
            <div className="inline-block text-right mb-1">
              <span className="inline-block px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider mb-1 border border-indigo-100">
                {typeInfo.subtitleTh}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-indigo-700 tracking-tight leading-tight">
                {isEn ? typeInfo.titleEn : typeInfo.titleTh}
              </h2>
              {isBilingual && (
                <p className="text-xs font-bold text-slate-500 tracking-wider uppercase mt-0.5">
                  {typeInfo.titleEn}
                </p>
              )}
            </div>

            <div className="mt-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs text-left space-y-1 shadow-2xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">เลขที่เอกสาร / No:</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{document.documentNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">วันที่ / Date:</span>
                <span className="font-semibold text-slate-800">{document.issueDate}</span>
              </div>
              {document.dueDate && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">ครบกำหนด / Due Date:</span>
                  <span className="font-bold text-rose-700">{document.dueDate}</span>
                </div>
              )}
              {document.referenceNumber && (
                <div className="flex justify-between items-center border-t border-slate-200/80 pt-1">
                  <span className="text-slate-600 font-medium">อ้างอิง / Ref:</span>
                  <span className="font-mono font-medium text-slate-800">{document.referenceNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Information Block */}
        <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200 mb-3.5 text-xs sm:text-[13px]">
          <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 pb-1 border-b border-slate-200/80">
            <Building className="w-3.5 h-3.5 text-indigo-600" />
            <span>ข้อมูลลูกค้า / Customer Info</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <div className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
                {customer.name || '-'}
              </div>
              {customer.contactPerson && (
                <div className="text-slate-800 font-medium text-xs sm:text-[13px]">
                  ผู้ติดต่อ: <span className="font-semibold">{customer.contactPerson}</span>
                </div>
              )}
              <div className="text-slate-700 text-xs sm:text-[13px] leading-relaxed mt-0.5">
                ที่อยู่: {customer.address || '-'}
              </div>
            </div>
            <div className="space-y-0.5 sm:pl-3.5 sm:border-l border-slate-200 text-xs sm:text-[13px]">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-medium">เลขประจำตัวผู้เสียภาษี:</span>
                <span className="font-bold font-mono text-slate-950 text-xs sm:text-sm">{customer.taxId || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-medium">สาขา:</span>
                <span className="font-medium text-slate-800">
                  {customer.branchType === 'headquarters'
                    ? 'สำนักงานใหญ่ (00000)'
                    : `สาขาที่ ${customer.branchNo || '-'}`}
                </span>
              </div>
              {(customer.phone || customer.email) && (
                <div className="text-slate-700 text-xs pt-0.5 flex flex-wrap gap-x-3.5">
                  {customer.phone && <span>โทร: <strong className="font-medium text-slate-900">{customer.phone}</strong></span>}
                  {customer.email && <span>อีเมล: <strong className="font-medium text-slate-900">{customer.email}</strong></span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-4 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-indigo-600 text-white font-semibold text-xs">
                <th className="py-2 px-2 text-center w-10 border-r border-indigo-500/40">ลำดับ<br/><span className="text-[10px] font-normal opacity-80">Item</span></th>
                <th className="py-2 px-3 border-r border-indigo-500/40">รายการสินค้า / บริการ<br/><span className="text-[10px] font-normal opacity-80">Description</span></th>
                <th className="py-2 px-2 text-center w-16 border-r border-indigo-500/40">จำนวน<br/><span className="text-[10px] font-normal opacity-80">Qty</span></th>
                <th className="py-2 px-2 text-center w-16 border-r border-indigo-500/40">หน่วย<br/><span className="text-[10px] font-normal opacity-80">Unit</span></th>
                <th className="py-2 px-2.5 text-right w-24 border-r border-indigo-500/40">ราคา/หน่วย<br/><span className="text-[10px] font-normal opacity-80">Unit Price</span></th>
                <th className="py-2 px-2 text-right w-20 border-r border-indigo-500/40">ส่วนลด<br/><span className="text-[10px] font-normal opacity-80">Discount</span></th>
                <th className="py-2 px-3 text-right w-28">จำนวนเงิน<br/><span className="text-[10px] font-normal opacity-80">Amount</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
              {items.map((item, idx) => {
                const rawTotal = item.quantity * item.unitPrice;
                const discount = item.discountType === 'percent'
                  ? rawTotal * (item.discountValue / 100)
                  : item.discountValue;
                const itemTotal = rawTotal - discount;

                return (
                  <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                    <td className="py-2 px-2 text-center text-slate-500 border-r border-slate-200 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      {item.description && (
                        <div className="text-xs text-slate-500 whitespace-pre-line mt-0.5">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-slate-200 font-mono">
                      {item.quantity}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-slate-200 text-slate-600">
                      {item.unit || 'ชิ้น'}
                    </td>
                    <td className="py-2 px-2.5 text-right border-r border-slate-200 font-mono">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-2 px-2 text-right border-r border-slate-200 font-mono text-slate-500">
                      {item.discountValue > 0
                        ? item.discountType === 'percent'
                          ? `${item.discountValue}%`
                          : formatCurrency(item.discountValue)
                        : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">
                      {formatCurrency(itemTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals & Thai Baht Text Block */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 page-break-inside-avoid">
          {/* Thai Baht Text and Notes */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-3">
            <div className="bg-indigo-50/80 p-3 rounded-lg border border-indigo-100">
              <span className="text-[11px] text-indigo-700 font-semibold block mb-0.5">
                จำนวนเงินตัวอักษร / Total in Words:
              </span>
              <span className="font-bold text-indigo-950 text-sm sm:text-base">
                ({document.thaiBahtText || 'ศูนย์บาทถ้วน'})
              </span>
            </div>

            {/* Terms & Notes */}
            <div className="space-y-1.5 text-xs">
              {document.paymentTerms && (
                <div className="text-slate-700">
                  <span className="font-semibold text-slate-900">เงื่อนไขการชำระเงิน: </span>
                  {document.paymentTerms}
                </div>
              )}
              {document.notes && (
                <div className="text-slate-600 bg-amber-50/70 p-2.5 rounded border border-amber-200/70 text-xs whitespace-pre-line">
                  <span className="font-bold text-amber-900 block mb-0.5">หมายเหตุ / Remarks:</span>
                  {document.notes}
                </div>
              )}
              {document.termsAndConditions && (
                <div className="text-slate-500 text-xs whitespace-pre-line">
                  <span className="font-semibold text-slate-700 block mb-0.5">ข้อตกลงและเงื่อนไข / Terms:</span>
                  {document.termsAndConditions}
                </div>
              )}
            </div>
          </div>

          {/* Right Calculation Totals */}
          <div className="md:col-span-5 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs sm:text-sm space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>รวมเป็นเงิน (Subtotal):</span>
              <span className="font-mono font-medium">{formatCurrency(document.subtotal)} บาท</span>
            </div>
            {document.discountTotal > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>ส่วนลดรวม (Discount):</span>
                <span className="font-mono font-medium">-{formatCurrency(document.discountTotal)} บาท</span>
              </div>
            )}
            <div className="flex justify-between text-slate-700 font-medium">
              <span>ยอดหลังหักส่วนลด (Net):</span>
              <span className="font-mono">{formatCurrency(document.afterDiscount)} บาท</span>
            </div>

            {document.vatType !== 'none' && (
              <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                <span>
                  ภาษีมูลค่าเพิ่ม VAT {document.vatRate}%
                  {document.vatType === 'included' && ' (รวมในยอด)'}:
                </span>
                <span className="font-mono">{formatCurrency(document.vatAmount)} บาท</span>
              </div>
            )}

            <div className="flex justify-between items-center font-bold text-slate-900 pt-1.5 border-t-2 border-indigo-600">
              <span className="text-sm">จำนวนเงินรวมทั้งสิ้น:</span>
              <span className="font-mono text-base sm:text-lg text-indigo-700">
                ฿{formatCurrency(document.grandTotal)}
              </span>
            </div>

            {document.withholdingTaxRate > 0 && (
              <>
                <div className="flex justify-between text-amber-700 pt-1 text-xs">
                  <span>หัก ณ ที่จ่าย {document.withholdingTaxRate}% (WHT):</span>
                  <span className="font-mono">-{formatCurrency(document.withholdingTaxAmount)} บาท</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-800 bg-emerald-50 px-2 py-1.5 rounded border border-emerald-200 mt-1">
                  <span>ยอดชำระสุทธิ (Net Payment):</span>
                  <span className="font-mono text-sm sm:text-base">฿{formatCurrency(document.netPayment)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* PromptPay & Bank Transfer Block */}
        <div className="mb-4 page-break-inside-avoid">
          <PromptPayBox document={document} accentColor="#4f46e5" />
        </div>
      </div>

      {/* Signature Section at bottom */}
      <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200 page-break-inside-avoid text-xs sm:text-sm">
        {/* Customer / Receiver Signature */}
        <div className="flex flex-col items-center justify-end text-center p-3 rounded bg-slate-50/50 border border-dashed border-slate-300 min-h-[110px]">
          <div className="h-10 flex items-center justify-center">
            <span className="text-slate-300 font-cursive text-sm">......................................................</span>
          </div>
          <div className="w-48 border-b border-slate-400 my-1"></div>
          <div className="font-bold text-slate-800 text-xs sm:text-sm">
            {document.type === 'quotation'
              ? 'ผู้อนุมัติสั่งซื้อ / Customer Approval'
              : document.type === 'billing'
              ? 'ผู้รับวางบิล / Received By'
              : 'ผู้รับบริการ / Customer'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            วันที่ / Date: _____ / _____ / _________
          </div>
        </div>

        {/* Company Authorized Signer */}
        <div className="flex flex-col items-center justify-end text-center p-3 rounded bg-slate-50/50 border border-dashed border-slate-300 min-h-[110px] relative">
          {document.showStamp && company.stampUrl && (
            <img
              src={company.stampUrl}
              alt="Company Stamp"
              className="absolute right-3 top-2 w-16 h-16 opacity-75 object-contain pointer-events-none"
            />
          )}

          <div className="h-10 flex items-center justify-center">
            {document.showSignature && company.signatureUrl ? (
              <img
                src={company.signatureUrl}
                alt="Signature"
                className="max-h-10 w-auto object-contain"
              />
            ) : (
              <span className="text-slate-300 text-sm">......................................................</span>
            )}
          </div>
          <div className="w-48 border-b border-slate-400 my-1"></div>
          <div className="font-bold text-slate-800 text-xs sm:text-sm">
            {document.preparedByName || company.signatureName || 'ผู้มีอำนาจลงนาม / Authorized Signer'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {company.signaturePosition || 'ในนาม ' + (company.name || 'บริษัท')}
          </div>
          <div className="text-[11px] text-slate-400">
            วันที่: {document.issueDate}
          </div>
        </div>
      </div>
    </div>
  );
};
