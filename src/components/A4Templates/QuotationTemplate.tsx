import React from 'react';
import { DocumentModel } from '../../types';
import { getDocumentTypeInfo } from '../../utils/documentCalculations';
import { formatCurrency } from '../../utils/thaiBaht';
import { PromptPayBox } from './PromptPayBox';
import { Building, Phone, Mail, Globe, MapPin, Calendar, FileText, CheckCircle2, UserCheck } from 'lucide-react';

interface TemplateProps {
  document: DocumentModel;
}

export const QuotationTemplate: React.FC<TemplateProps> = ({ document }) => {
  const typeInfo = getDocumentTypeInfo(document.type);
  const isEn = document.language === 'en';
  const isBilingual = document.language === 'bilingual';

  const company = document.company || ({} as typeof document.company);
  const customer = document.customer || ({} as typeof document.customer);
  const items = Array.isArray(document.items) ? document.items : [];

  return (
    <div className="bg-white p-8 sm:p-10 font-['Sarabun',sans-serif] text-slate-800 text-sm leading-relaxed max-w-[210mm] w-full mx-auto shadow-sm print:shadow-none min-h-[297mm] print:min-h-0 flex flex-col justify-between print:p-6 print:m-0">
      <div>
        {/* Top Header Row */}
        <div className="flex justify-between items-start border-b-2 border-indigo-700 pb-3.5 mb-3.5">
          {/* Company Brand & Info (Left) */}
          <div className="w-7/12 pr-4">
            <div className="flex items-center gap-3.5 mb-2.5">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt="Company Logo"
                  className="h-16 max-h-20 w-auto max-w-[160px] object-contain rounded shrink-0"
                />
              ) : (
                <div className="w-14 h-14 bg-indigo-700 text-white rounded-xl flex items-center justify-center font-bold text-2xl shadow-xs shrink-0">
                  {(company.name || 'บ').charAt(0)}
                </div>
              )}
              <div>
                <h1 className="font-bold text-lg sm:text-xl text-slate-900 leading-snug">
                  {company.name || 'ชื่อสถานประกอบการ'}
                </h1>
                {company.nameEn && (
                  <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">{company.nameEn}</p>
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
                  เลขประจำตัวผู้เสียภาษี: <span className="font-mono font-bold text-slate-950">{company.taxId || '-'}</span>
                </span>
                <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs font-medium border border-slate-200">
                  {company.branchType === 'headquarters' ? 'สำนักงานใหญ่ (00000)' : `สาขาที่ ${company.branchNo || '-'}`}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-3.5 gap-y-0.5 text-slate-700 text-xs pt-0.5">
                {company.phone && <span>โทร: <strong className="font-medium text-slate-900">{company.phone}</strong></span>}
                {company.email && <span>อีเมล: <strong className="font-medium text-slate-900">{company.email}</strong></span>}
                {company.website && <span>เว็บไซต์: <strong className="font-medium text-slate-900">{company.website}</strong></span>}
              </div>
            </div>
          </div>

          {/* Document Title & Meta Box (Right) */}
          <div className="w-5/12 text-right pl-3">
            <div className="inline-block text-right mb-1">
              <span className="inline-block px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider mb-1 border border-indigo-100">
                {document.type === 'quotation' ? 'เอกสารเสนอราคา' : typeInfo.subtitleTh}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-indigo-700 tracking-tight leading-tight">
                {isEn ? typeInfo.titleEn : typeInfo.titleTh}
              </h2>
              <p className="text-xs font-bold text-slate-500 tracking-wider uppercase mt-0.5">
                {typeInfo.titleEn}
              </p>
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
                  <span className="text-slate-600 font-medium">
                    {document.type === 'quotation' ? 'กำหนดยืนราคาถึง:' : 'ครบกำหนด / Due Date:'}
                  </span>
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
          <div className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 border-b border-slate-200/80 pb-1">
            <Building className="w-3.5 h-3.5 text-indigo-600" />
            <span>ข้อมูลลูกค้า / ผู้รับการเสนอราคา (Customer Information)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-0.5">
            <div className="sm:col-span-7 space-y-0.5">
              <div className="flex items-baseline gap-2">
                <span className="text-slate-600 text-xs font-medium w-24 shrink-0">ชื่อลูกค้า/บริษัท:</span>
                <span className="font-bold text-sm sm:text-base text-slate-900 leading-snug">{customer.name || '-'}</span>
              </div>
              {customer.nameEn && (
                <div className="flex items-baseline gap-2">
                  <span className="text-slate-500 text-xs w-24 shrink-0">Company (EN):</span>
                  <span className="text-slate-700 text-xs sm:text-[13px] font-medium">{customer.nameEn}</span>
                </div>
              )}
              {customer.contactPerson && (
                <div className="flex items-baseline gap-2">
                  <span className="text-slate-600 text-xs font-medium w-24 shrink-0">เรียน / Attn:</span>
                  <span className="font-bold text-slate-800 text-xs sm:text-[13px]">{customer.contactPerson}</span>
                </div>
              )}
              <div className="flex items-start gap-2">
                <span className="text-slate-600 text-xs font-medium w-24 shrink-0 mt-0.5">ที่อยู่ / Address:</span>
                <span className="text-slate-700 text-xs sm:text-[13px] leading-relaxed">{customer.address || '-'}</span>
              </div>
            </div>

            <div className="sm:col-span-5 sm:pl-3.5 sm:border-l border-slate-200 space-y-1 text-xs sm:text-[13px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">เลขผู้เสียภาษี:</span>
                <span className="font-bold font-mono text-slate-950 text-xs sm:text-sm">{customer.taxId || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">สาขา:</span>
                <span className="font-medium text-slate-800">
                  {customer.branchType === 'headquarters'
                    ? 'สำนักงานใหญ่ (00000)'
                    : `สาขาที่ ${customer.branchNo || '-'}`}
                </span>
              </div>
              {customer.phone && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">เบอร์โทรศัพท์:</span>
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
        <div className="mb-4 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-indigo-700 text-white font-semibold">
                <th className="py-2 px-2.5 text-center w-10 border-r border-indigo-600">
                  ลำดับ<br /><span className="text-[9px] font-normal opacity-85">No.</span>
                </th>
                <th className="py-2 px-3 border-r border-indigo-600">
                  รายการสินค้า / รายละเอียดงานบริการ<br /><span className="text-[9px] font-normal opacity-85">Description</span>
                </th>
                <th className="py-2 px-2 text-center w-14 border-r border-indigo-600">
                  จำนวน<br /><span className="text-[9px] font-normal opacity-85">Qty</span>
                </th>
                <th className="py-2 px-2 text-center w-14 border-r border-indigo-600">
                  หน่วย<br /><span className="text-[9px] font-normal opacity-85">Unit</span>
                </th>
                <th className="py-2 px-2.5 text-right w-24 border-r border-indigo-600">
                  ราคา/หน่วย<br /><span className="text-[9px] font-normal opacity-85">Unit Price</span>
                </th>
                <th className="py-2 px-2 text-right w-20 border-r border-indigo-600">
                  ส่วนลด<br /><span className="text-[9px] font-normal opacity-85">Discount</span>
                </th>
                <th className="py-2 px-3 text-right w-28">
                  จำนวนเงิน (บาท)<br /><span className="text-[9px] font-normal opacity-85">Amount</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item, idx) => {
                const rawTotal = item.quantity * item.unitPrice;
                const discount = item.discountType === 'percent'
                  ? rawTotal * (item.discountValue / 100)
                  : item.discountValue;
                const itemTotal = rawTotal - discount;

                return (
                  <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                    <td className="py-2.5 px-2.5 text-center text-slate-500 border-r border-slate-200 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      {item.description && (
                        <div className="text-[11px] text-slate-500 whitespace-pre-line mt-0.5 leading-relaxed">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center border-r border-slate-200 font-mono font-medium text-slate-800">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-2 text-center border-r border-slate-200 text-slate-600">
                      {item.unit || 'ชิ้น'}
                    </td>
                    <td className="py-2.5 px-2.5 text-right border-r border-slate-200 font-mono">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-2.5 px-2 text-right border-r border-slate-200 font-mono text-slate-500">
                      {item.discountValue > 0
                        ? item.discountType === 'percent'
                          ? `${item.discountValue}%`
                          : formatCurrency(item.discountValue)
                        : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                      {formatCurrency(itemTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals & Thai Baht Text Block */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4 page-break-inside-avoid">
          {/* Thai Baht Text and Terms (Left) */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-2.5">
            <div className="bg-indigo-50/80 p-2.5 rounded-lg border border-indigo-100">
              <span className="text-[10px] text-indigo-700 font-semibold block uppercase">
                จำนวนเงินตัวอักษร / Amount in Words:
              </span>
              <span className="font-bold text-indigo-950 text-xs mt-0.5 block">
                ({document.thaiBahtText || 'ศูนย์บาทถ้วน'})
              </span>
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-1.5 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div className="font-bold text-slate-800 flex items-center gap-1 text-xs">
                <FileText className="w-3 h-3 text-indigo-600" />
                <span>เงื่อนไขการเสนอราคาและการชำระเงิน (Terms & Conditions):</span>
              </div>
              {document.paymentTerms && (
                <div className="text-slate-700">
                  <span className="font-semibold text-slate-900">• กำหนดการชำระเงิน: </span>
                  {document.paymentTerms}
                </div>
              )}
              {document.dueDate && (
                <div className="text-slate-700">
                  <span className="font-semibold text-slate-900">• กำหนดยืนราคา: </span>
                  ถึงวันที่ {document.dueDate} (30 วันนับจากวันที่ออกเอกสาร)
                </div>
              )}
              {document.termsAndConditions && (
                <div className="text-slate-600 whitespace-pre-line leading-relaxed pt-0.5">
                  {document.termsAndConditions}
                </div>
              )}
              {document.notes && (
                <div className="text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200/70 text-[10px] whitespace-pre-line mt-1">
                  <span className="font-bold block">หมายเหตุ / Remarks:</span>
                  {document.notes}
                </div>
              )}
            </div>
          </div>

          {/* Right Calculation Totals */}
          <div className="md:col-span-5 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
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

            <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-1.5 border-t-2 border-indigo-700 bg-indigo-50/50 -mx-3 px-3 py-1 rounded">
              <span>จำนวนเงินรวมทั้งสิ้น (Grand Total):</span>
              <span className="font-mono text-base text-indigo-700 font-black">
                ฿{formatCurrency(document.grandTotal)}
              </span>
            </div>

            {document.withholdingTaxRate > 0 && (
              <>
                <div className="flex justify-between text-amber-700 pt-1 text-[11px]">
                  <span>หักภาษี ณ ที่จ่าย {document.withholdingTaxRate}% (WHT):</span>
                  <span className="font-mono">-{formatCurrency(document.withholdingTaxAmount)} บาท</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-200 mt-1">
                  <span>ยอดชำระสุทธิ (Net Payment):</span>
                  <span className="font-mono text-sm">฿{formatCurrency(document.netPayment)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* PromptPay & Bank Transfer Block */}
        <div className="mb-4 page-break-inside-avoid">
          <PromptPayBox document={document} accentColor="#4338ca" />
        </div>
      </div>

      {/* Signature Section at bottom */}
      <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200 page-break-inside-avoid text-xs sm:text-sm">
        {/* Customer / Purchaser Approval Box */}
        <div className="flex flex-col justify-between p-3 rounded-lg bg-slate-50/60 border border-slate-300 min-h-[110px] text-center">
          <div className="text-xs text-slate-500 font-semibold text-left mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>ตกลงสั่งซื้อ / สั่งจ้างตามรายการข้างต้น (Customer Acceptance)</span>
          </div>

          <div className="h-10 flex items-center justify-center my-1">
            <span className="text-slate-300 text-sm">..................................................................</span>
          </div>

          <div>
            <div className="font-bold text-slate-800 text-xs sm:text-sm">
              ( .................................................................. )
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              ผู้อนุมัติสั่งซื้อ / ผู้มีอำนาจลงนาม (ประทับตราถ้ามี)
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              วันที่ / Date: _____ / _____ / _________
            </div>
          </div>
        </div>

        {/* Company Authorized Signer Box */}
        <div className="flex flex-col justify-between p-3 rounded-lg bg-slate-50/60 border border-slate-300 min-h-[110px] text-center relative">
          <div className="text-xs text-indigo-700 font-semibold text-left mb-1 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>ในนามผู้เสนอราคา (For & On Behalf of Company)</span>
          </div>

          {/* Stamp Overlay */}
          {document.showStamp && company.stampUrl && (
            <img
              src={company.stampUrl}
              alt="Company Stamp"
              className="absolute right-4 top-3 w-16 h-16 opacity-80 object-contain pointer-events-none"
            />
          )}

          {/* Signature Area */}
          <div className="h-10 flex items-center justify-center my-1">
            {document.showSignature && company.signatureUrl ? (
              <img
                src={company.signatureUrl}
                alt="Signature"
                className="max-h-10 w-auto object-contain"
              />
            ) : (
              <span className="text-slate-300 text-sm">..................................................................</span>
            )}
          </div>

          <div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm">
              ( {document.preparedByName || company.signatureName || 'ผู้มีอำนาจลงนาม'} )
            </div>
            <div className="text-[11px] text-slate-600 font-medium mt-0.5">
              {company.signaturePosition || 'กรรมการผู้จัดการ'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              วันที่ / Date: {document.issueDate}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
