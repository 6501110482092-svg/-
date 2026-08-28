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
    <div className="bg-white p-5 sm:p-7 font-['Sarabun',sans-serif] text-slate-800 text-xs sm:text-xs leading-relaxed max-w-[210mm] w-full mx-auto shadow-sm print:shadow-none min-h-[285mm] print:min-h-0 print:p-3 print:m-0 print:max-w-full flex flex-col justify-between">
      <div>
        {/* Top Header Row */}
        <div className="flex justify-between items-start border-b-2 border-indigo-600 pb-3 mb-3">
          {/* Company Brand & Details */}
          <div className="w-7/12 pr-3">
            <div className="flex items-center gap-2.5 mb-1.5">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt="Company Logo"
                  className="h-11 w-auto max-w-[120px] object-contain rounded"
                />
              ) : (
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-sm">
                  {(company.name || 'บ').charAt(0)}
                </div>
              )}
              <div>
                <h1 className="font-bold text-base text-slate-900 leading-tight">
                  {company.name || 'ชื่อสถานประกอบการ'}
                </h1>
                {company.nameEn && (
                  <p className="text-[11px] text-slate-500 font-medium">{company.nameEn}</p>
                )}
              </div>
            </div>

            <div className="text-[11px] text-slate-600 space-y-0.5 mt-1">
              <div className="flex items-start gap-1">
                <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                <span>{company.address || '-'}</span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-0.5">
                <span className="font-medium text-slate-700">
                  เลขประจำตัวผู้เสียภาษี: <span className="font-mono text-slate-900 font-bold">{company.taxId || '-'}</span>
                </span>
                <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[10px]">
                  {company.branchType === 'headquarters' ? 'สำนักงานใหญ่' : `สาขาที่ ${company.branchNo || '-'}`}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-3 text-slate-500 text-[10px]">
                {company.phone && <span>โทร: {company.phone}</span>}
                {company.email && <span>อีเมล: {company.email}</span>}
                {company.website && <span>เว็บ: {company.website}</span>}
              </div>
            </div>
          </div>

          {/* Document Title & Meta */}
          <div className="w-5/12 text-right pl-2">
            <div className="inline-block text-right">
              <span className="inline-block px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-semibold rounded-full uppercase tracking-wider mb-1">
                {typeInfo.subtitleTh}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-indigo-700 tracking-tight">
                {isEn ? typeInfo.titleEn : typeInfo.titleTh}
              </h2>
              {isBilingual && (
                <p className="text-[10px] font-semibold text-slate-500 tracking-wider">
                  {typeInfo.titleEn}
                </p>
              )}
            </div>

            <div className="mt-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200/80 text-xs text-left space-y-0.5">
              <div className="flex justify-between">
                <span className="text-slate-500 text-[11px]">เลขที่เอกสาร / No:</span>
                <span className="font-bold text-slate-900 font-mono text-xs sm:text-sm">{document.documentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-[11px]">วันที่ / Date:</span>
                <span className="font-semibold text-slate-800 text-xs">{document.issueDate}</span>
              </div>
              {document.dueDate && (
                <div className="flex justify-between">
                  <span className="text-slate-500 text-[11px]">ครบกำหนด / Due Date:</span>
                  <span className="font-semibold text-rose-700 text-xs">{document.dueDate}</span>
                </div>
              )}
              {document.referenceNumber && (
                <div className="flex justify-between border-t border-slate-200/60 pt-0.5">
                  <span className="text-slate-500 text-[10px]">อ้างอิง / Ref:</span>
                  <span className="font-mono font-medium text-slate-700 text-xs">{document.referenceNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Information Block */}
        <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-200 mb-3 text-xs">
          <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Building className="w-3 h-3" />
            <span>ข้อมูลลูกค้า / Customer Info</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <div className="font-bold text-xs sm:text-sm text-slate-900 mb-0.5">
                {customer.name || '-'}
              </div>
              {customer.contactPerson && (
                <div className="text-slate-700 font-medium text-[11px]">
                  ผู้ติดต่อ: {customer.contactPerson}
                </div>
              )}
              <div className="text-slate-600 text-[11px] mt-0.5">
                ที่อยู่: {customer.address || '-'}
              </div>
            </div>
            <div className="space-y-0.5 sm:pl-3 sm:border-l border-slate-200 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">เลขประจำตัวผู้เสียภาษี:</span>
                <span className="font-bold font-mono text-slate-900">{customer.taxId || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">สาขา:</span>
                <span className="font-medium text-slate-800">
                  {customer.branchType === 'headquarters'
                    ? 'สำนักงานใหญ่ (00000)'
                    : `สาขาที่ ${customer.branchNo || '-'}`}
                </span>
              </div>
              {(customer.phone || customer.email) && (
                <div className="text-slate-600 text-[10px] pt-0.5">
                  {customer.phone && <span className="mr-2">โทร: {customer.phone}</span>}
                  {customer.email && <span>อีเมล: {customer.email}</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mb-3 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-indigo-600 text-white font-semibold text-[11px]">
                <th className="py-1.5 px-2 text-center w-10 border-r border-indigo-500/40">ลำดับ<br/><span className="text-[9px] font-normal opacity-80">Item</span></th>
                <th className="py-1.5 px-2.5 border-r border-indigo-500/40">รายการสินค้า / บริการ<br/><span className="text-[9px] font-normal opacity-80">Description</span></th>
                <th className="py-1.5 px-1.5 text-center w-14 border-r border-indigo-500/40">จำนวน<br/><span className="text-[9px] font-normal opacity-80">Qty</span></th>
                <th className="py-1.5 px-1.5 text-center w-14 border-r border-indigo-500/40">หน่วย<br/><span className="text-[9px] font-normal opacity-80">Unit</span></th>
                <th className="py-1.5 px-2 text-right w-22 border-r border-indigo-500/40">ราคา/หน่วย<br/><span className="text-[9px] font-normal opacity-80">Unit Price</span></th>
                <th className="py-1.5 px-1.5 text-right w-16 border-r border-indigo-500/40">ส่วนลด<br/><span className="text-[9px] font-normal opacity-80">Discount</span></th>
                <th className="py-1.5 px-2.5 text-right w-24">จำนวนเงิน<br/><span className="text-[9px] font-normal opacity-80">Amount</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {items.map((item, idx) => {
                const rawTotal = item.quantity * item.unitPrice;
                const discount = item.discountType === 'percent'
                  ? rawTotal * (item.discountValue / 100)
                  : item.discountValue;
                const itemTotal = rawTotal - discount;

                return (
                  <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                    <td className="py-1.5 px-2 text-center text-slate-500 border-r border-slate-200 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-1.5 px-2.5 border-r border-slate-200">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      {item.description && (
                        <div className="text-[10px] text-slate-500 whitespace-pre-line">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="py-1.5 px-1.5 text-center border-r border-slate-200 font-mono">
                      {item.quantity}
                    </td>
                    <td className="py-1.5 px-1.5 text-center border-r border-slate-200 text-slate-600 text-[11px]">
                      {item.unit || 'ชิ้น'}
                    </td>
                    <td className="py-1.5 px-2 text-right border-r border-slate-200 font-mono">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-1.5 px-1.5 text-right border-r border-slate-200 font-mono text-slate-500">
                      {item.discountValue > 0
                        ? item.discountType === 'percent'
                          ? `${item.discountValue}%`
                          : formatCurrency(item.discountValue)
                        : '-'}
                    </td>
                    <td className="py-1.5 px-2.5 text-right font-bold text-slate-900 font-mono">
                      {formatCurrency(itemTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals & Thai Baht Text Block */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3 page-break-inside-avoid">
          {/* Thai Baht Text and Notes */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-2">
            <div className="bg-indigo-50/80 p-2.5 rounded-lg border border-indigo-100">
              <span className="text-[10px] text-indigo-700 font-medium block">
                จำนวนเงินตัวอักษร / Total in Words:
              </span>
              <span className="font-bold text-indigo-950 text-xs sm:text-sm">
                ({document.thaiBahtText || 'ศูนย์บาทถ้วน'})
              </span>
            </div>

            {/* Terms & Notes */}
            <div className="space-y-1 text-xs">
              {document.paymentTerms && (
                <div className="text-slate-700 text-[11px]">
                  <span className="font-semibold text-slate-900">เงื่อนไขการชำระเงิน: </span>
                  {document.paymentTerms}
                </div>
              )}
              {document.notes && (
                <div className="text-slate-600 bg-amber-50/70 p-2 rounded border border-amber-200/70 text-[10px] whitespace-pre-line">
                  <span className="font-bold text-amber-900 block mb-0.5">หมายเหตุ / Remarks:</span>
                  {document.notes}
                </div>
              )}
              {document.termsAndConditions && (
                <div className="text-slate-500 text-[10px] whitespace-pre-line">
                  <span className="font-semibold text-slate-700 block mb-0.5">ข้อตกลงและเงื่อนไข / Terms:</span>
                  {document.termsAndConditions}
                </div>
              )}
            </div>
          </div>

          {/* Right Calculation Totals */}
          <div className="md:col-span-5 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
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
              <div className="flex justify-between text-slate-600 pt-0.5 border-t border-slate-200">
                <span>
                  ภาษีมูลค่าเพิ่ม VAT {document.vatRate}%
                  {document.vatType === 'included' && ' (รวมในยอด)'}:
                </span>
                <span className="font-mono">{formatCurrency(document.vatAmount)} บาท</span>
              </div>
            )}

            <div className="flex justify-between items-center text-xs sm:text-sm font-bold text-slate-900 pt-1 border-t-2 border-indigo-600">
              <span>จำนวนเงินรวมทั้งสิ้น:</span>
              <span className="font-mono text-sm sm:text-base text-indigo-700">
                ฿{formatCurrency(document.grandTotal)}
              </span>
            </div>

            {document.withholdingTaxRate > 0 && (
              <>
                <div className="flex justify-between text-amber-700 pt-0.5 text-[10px]">
                  <span>หัก ณ ที่จ่าย {document.withholdingTaxRate}% (WHT):</span>
                  <span className="font-mono">-{formatCurrency(document.withholdingTaxAmount)} บาท</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-800 bg-emerald-50 px-1.5 py-1 rounded border border-emerald-200 mt-0.5 text-xs">
                  <span>ยอดชำระสุทธิ (Net Payment):</span>
                  <span className="font-mono text-xs sm:text-sm">฿{formatCurrency(document.netPayment)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* PromptPay & Bank Transfer Block */}
        <div className="mb-3">
          <PromptPayBox document={document} accentColor="#4f46e5" />
        </div>
      </div>

      {/* Signature Section at bottom */}
      <div className="grid grid-cols-2 gap-4 pt-2.5 border-t border-slate-200 page-break-inside-avoid text-xs">
        {/* Customer / Receiver Signature */}
        <div className="flex flex-col items-center justify-end text-center p-2 rounded bg-slate-50/50 border border-dashed border-slate-300 min-h-[85px]">
          <div className="h-8 flex items-center justify-center">
            <span className="text-slate-300 font-cursive text-xs">......................................................</span>
          </div>
          <div className="w-40 border-b border-slate-400 my-0.5"></div>
          <div className="font-bold text-slate-800 text-[11px]">
            {document.type === 'quotation'
              ? 'ผู้อนุมัติสั่งซื้อ / Customer Approval'
              : document.type === 'billing'
              ? 'ผู้รับวางบิล / Received By'
              : 'ผู้รับบริการ / Customer'}
          </div>
          <div className="text-[10px] text-slate-500">
            วันที่ / Date: _____ / _____ / _________
          </div>
        </div>

        {/* Company Authorized Signer */}
        <div className="flex flex-col items-center justify-end text-center p-2 rounded bg-slate-50/50 border border-dashed border-slate-300 min-h-[85px] relative">
          {document.showStamp && company.stampUrl && (
            <img
              src={company.stampUrl}
              alt="Company Stamp"
              className="absolute right-2 top-1 w-14 h-14 opacity-75 object-contain pointer-events-none"
            />
          )}

          <div className="h-8 flex items-center justify-center">
            {document.showSignature && company.signatureUrl ? (
              <img
                src={company.signatureUrl}
                alt="Signature"
                className="max-h-8 w-auto object-contain"
              />
            ) : (
              <span className="text-slate-300 text-xs">......................................................</span>
            )}
          </div>
          <div className="w-40 border-b border-slate-400 my-0.5"></div>
          <div className="font-bold text-slate-800 text-[11px]">
            {document.preparedByName || company.signatureName || 'ผู้มีอำนาจลงนาม / Authorized Signer'}
          </div>
          <div className="text-[10px] text-slate-500">
            {company.signaturePosition || 'ในนาม ' + (company.name || 'บริษัท')}
          </div>
          <div className="text-[9px] text-slate-400">
            วันที่: {document.issueDate}
          </div>
        </div>
      </div>
    </div>
  );
};
