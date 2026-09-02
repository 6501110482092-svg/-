import React from 'react';
import { DocumentModel } from '../../types';
import { getDocumentTypeInfo } from '../../utils/documentCalculations';
import { formatCurrency } from '../../utils/thaiBaht';
import { PromptPayBox } from './PromptPayBox';
import { MapPin } from 'lucide-react';

interface TemplateProps {
  document: DocumentModel;
}

export const CorporateTemplate: React.FC<TemplateProps> = ({ document }) => {
  const typeInfo = getDocumentTypeInfo(document.type);
  const company = document.company || ({} as typeof document.company);
  const customer = document.customer || ({} as typeof document.customer);
  const items = Array.isArray(document.items) ? document.items : [];

  return (
    <div className="bg-white p-5 sm:p-7 font-['Sarabun',sans-serif] text-slate-800 text-xs leading-relaxed max-w-[210mm] w-full mx-auto shadow-sm print:shadow-none min-h-[285mm] print:min-h-0 print:p-3 print:m-0 print:max-w-full flex flex-col justify-between border-t-8 border-slate-800">
      <div>
        {/* Header Block */}
        <div className="flex justify-between items-start pb-3 border-b-2 border-slate-800 mb-3 gap-3">
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-start sm:items-center gap-3 mb-2">
              {company.logoUrl && (
                <img
                  src={company.logoUrl}
                  alt="Company Logo"
                  className="h-14 max-h-16 w-auto max-w-[130px] object-contain shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-[14px] sm:text-[15px] text-slate-950 uppercase tracking-tight leading-snug">
                  {company.headerNameLine1 ? (
                    <div className="space-y-0.5">
                      <div className="leading-snug">{company.headerNameLine1}</div>
                      {company.headerNameLine2 && <div className="leading-snug">{company.headerNameLine2}</div>}
                      {company.headerNameLine3 && <div className="leading-snug">{company.headerNameLine3}</div>}
                    </div>
                  ) : (
                    <span className="whitespace-pre-line leading-snug">{company.name || 'ชื่อสถานประกอบการ'}</span>
                  )}
                </h1>
                {company.nameEn && (
                  <p className="text-[11px] text-slate-600 font-medium whitespace-pre-line leading-tight mt-0.5">{company.nameEn}</p>
                )}
              </div>
            </div>
            <div className="text-xs text-slate-700 space-y-0.5">
              <p>{company.address || '-'}</p>
              <p className="text-slate-800 font-medium">
                เลขประจำตัวผู้เสียภาษี: <span className="font-mono font-bold text-slate-950">{company.taxId || '-'}</span> ({company.branchType === 'headquarters' ? 'สำนักงานใหญ่' : `สาขา ${company.branchNo || '-'}`})
              </p>
              <p className="text-xs text-slate-600">
                โทร: <strong className="font-medium text-slate-900">{company.phone || '-'}</strong> | อีเมล: <strong className="font-medium text-slate-900">{company.email || '-'}</strong>
              </p>
            </div>
          </div>

          <div className="w-[195px] sm:w-[210px] shrink-0 text-right pl-3 border-l border-slate-300">
            <div className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-tight">
              {typeInfo.titleTh}
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              {typeInfo.titleEn}
            </div>
            <div className="text-[10px] bg-slate-100 text-slate-800 inline-block px-2 py-0.5 rounded font-semibold border border-slate-200 mb-1.5">
              {typeInfo.subtitleTh}
            </div>

            <div className="text-xs space-y-0.5 text-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 text-xs">เลขที่ / No: </span>
                <span className="font-bold font-mono text-slate-950 text-sm">{document.documentNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 text-xs">วันที่ / Date: </span>
                <span className="font-semibold text-xs">{document.issueDate}</span>
              </div>
              {document.dueDate && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 text-xs">ครบกำหนด: </span>
                  <span className="font-bold text-rose-700 text-xs">{document.dueDate}</span>
                </div>
              )}
              {document.referenceNumber && (
                <div className="flex justify-between items-center border-t border-slate-200 pt-0.5">
                  <span className="text-slate-600 text-xs">อ้างอิง / Ref: </span>
                  <span className="font-mono text-xs">{document.referenceNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Info Box */}
        <div className="border border-slate-300 rounded-lg p-3 mb-3.5 text-xs bg-slate-50/60">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-950 text-sm block">
                ชื่อลูกค้า / Customer: {customer.name || '-'}
              </span>
              {customer.contactPerson && (
                <div className="text-slate-800 font-medium text-xs">ผู้ติดต่อ: {customer.contactPerson}</div>
              )}
              <div className="text-slate-700 text-xs leading-normal">ที่อยู่: {customer.address || '-'}</div>
            </div>
            <div className="space-y-0.5 text-left sm:pl-3 sm:border-l border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">เลขประจำตัวผู้เสียภาษี: </span>
                <span className="font-mono font-bold text-slate-950 text-xs sm:text-sm">{customer.taxId || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">สาขา: </span>
                <span className="font-medium text-slate-800">
                  {customer.branchType === 'headquarters'
                    ? 'สำนักงานใหญ่ (00000)'
                    : `สาขาที่ ${customer.branchNo || '-'}`}
                </span>
              </div>
              <div className="text-xs text-slate-700 pt-0.5">
                โทร: <strong className="font-medium text-slate-900">{customer.phone || '-'}</strong> | อีเมล: <strong className="font-medium text-slate-900">{customer.email || '-'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-4">
          <table className="w-full text-xs text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="py-2 px-2.5 text-center w-12 border-r border-slate-700">ลำดับ</th>
                <th className="py-2 px-3 border-r border-slate-700">รายการ / Description</th>
                <th className="py-2 px-2 text-center w-16 border-r border-slate-700">จำนวน</th>
                <th className="py-2 px-2 text-center w-14 border-r border-slate-700">หน่วย</th>
                <th className="py-2 px-2.5 text-right w-28 border-r border-slate-700">ราคา/หน่วย</th>
                <th className="py-2 px-2.5 text-right w-32">จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {items.map((item, idx) => {
                const itemTotal = item.quantity * item.unitPrice;

                return (
                  <tr key={item.id || idx} className="border-b border-slate-200">
                    <td className="py-2 px-2.5 text-center border-r border-slate-300 font-mono">{idx + 1}</td>
                    <td className="py-2 px-3 border-r border-slate-300">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      {item.description && (
                        <div className="text-[11px] text-slate-500">{item.description}</div>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-slate-300 font-mono">{item.quantity}</td>
                    <td className="py-2 px-2 text-center border-r border-slate-300 text-slate-600">{item.unit || 'ชิ้น'}</td>
                    <td className="py-2 px-2.5 text-right border-r border-slate-300 font-mono">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2 px-2.5 text-right font-bold text-slate-900 font-mono">
                      {formatCurrency(itemTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Calculation & Thai Baht Block */}
        <div className="grid grid-cols-12 gap-3 mb-4 page-break-inside-avoid text-xs">
          <div className="col-span-7 flex flex-col justify-between space-y-2">
            <div className="border border-slate-300 bg-slate-100 p-2.5 rounded">
              <div className="text-[10px] text-slate-500 font-bold uppercase">จำนวนเงินตัวอักษร</div>
              <div className="font-bold text-slate-900 text-sm">{document.thaiBahtText}</div>
            </div>

            <div className="space-y-1 text-slate-600 text-[11px]">
              {document.paymentTerms && (
                <div><span className="font-bold text-slate-800">เงื่อนไขชำระเงิน:</span> {document.paymentTerms}</div>
              )}
              {document.notes && (
                <div><span className="font-bold text-slate-800">หมายเหตุ:</span> {document.notes}</div>
              )}
            </div>
          </div>

          <div className="col-span-5 border border-slate-300 rounded p-3 bg-slate-50/70 space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>รวมมูลค่าสินค้า:</span>
              <span className="font-mono">{formatCurrency(document.subtotal)} บาท</span>
            </div>
            {document.discountTotal > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>
                  ส่วนลด
                  {document.discountLabel
                    ? document.discountLabel.startsWith('(') || document.discountLabel.startsWith(' ')
                      ? document.discountLabel
                      : ` (${document.discountLabel})`
                    : document.overallDiscountType === 'percent' && document.overallDiscountValue
                    ? ` (${document.overallDiscountValue}%)`
                    : ''}
                  :
                </span>
                <span className="font-mono">-{formatCurrency(document.discountTotal)} บาท</span>
              </div>
            )}
            <div className="flex justify-between font-medium">
              <span>ยอดสุทธิก่อนภาษี:</span>
              <span className="font-mono">{formatCurrency(document.afterDiscount)} บาท</span>
            </div>
            {document.vatType !== 'none' && (
              <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1">
                <span>ภาษีมูลค่าเพิ่ม VAT {document.vatRate}%:</span>
                <span className="font-mono">{formatCurrency(document.vatAmount)} บาท</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-slate-900 border-t-2 border-slate-800 pt-1">
              <span>จำนวนเงินรวมทั้งสิ้น:</span>
              <span className="font-mono text-base">฿{formatCurrency(document.grandTotal)}</span>
            </div>
            {document.withholdingTaxRate > 0 && (
              <>
                <div className="flex justify-between text-[11px] text-amber-700">
                  <span>หัก ณ ที่จ่าย {document.withholdingTaxRate}%:</span>
                  <span className="font-mono">-{formatCurrency(document.withholdingTaxAmount)} บาท</span>
                </div>
                <div className="flex justify-between font-bold bg-slate-200 p-1.5 rounded text-slate-900">
                  <span>ยอดจ่ายสุทธิ:</span>
                  <span className="font-mono">฿{formatCurrency(document.netPayment)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mb-2">
          <PromptPayBox document={document} accentColor="#0f172a" />
        </div>
      </div>

      {/* Signature Section */}
      <div className="grid grid-cols-2 gap-4 pt-2.5 border-t border-slate-300 page-break-inside-avoid text-xs">
        <div className="text-center p-2 border border-slate-300 rounded bg-slate-50/50">
          <div className="h-7"></div>
          <div className="w-36 border-b border-slate-400 mx-auto my-1"></div>
          <div className="font-bold text-slate-800 text-[11px]">ผู้สั่งซื้อ / ผู้รับบริการ</div>
          <div className="text-[9px] text-slate-500">วันที่ ......./......./...........</div>
        </div>
        <div className="text-center p-2 border border-slate-300 rounded bg-slate-50/50 relative">
          {document.showStamp && company.stampUrl && (
            <img
              src={company.stampUrl}
              alt="Stamp"
              className="absolute right-2 top-1 w-12 h-12 opacity-75 object-contain pointer-events-none"
            />
          )}
          <div className="h-7 flex items-center justify-center">
            {document.showSignature && company.signatureUrl ? (
              <img
                src={company.signatureUrl}
                alt="Signature"
                className="max-h-7 w-auto object-contain"
              />
            ) : null}
          </div>
          <div className="w-36 border-b border-slate-400 mx-auto my-1"></div>
          <div className="font-bold text-slate-800 text-[11px]">
            {document.preparedByName || company.signatureName || 'ผู้มีอำนาจลงนาม'}
          </div>
          <div className="text-[9px] text-slate-500">{company.signaturePosition || company.name || 'บริษัท'}</div>
        </div>
      </div>
    </div>
  );
};
