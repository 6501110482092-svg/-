import React from 'react';
import { DocumentModel } from '../../types';
import { getDocumentTypeInfo } from '../../utils/documentCalculations';
import { formatCurrency } from '../../utils/thaiBaht';
import { PromptPayBox } from './PromptPayBox';

interface TemplateProps {
  document: DocumentModel;
}

export const MinimalTemplate: React.FC<TemplateProps> = ({ document }) => {
  const typeInfo = getDocumentTypeInfo(document.type);
  const company = document.company || ({} as typeof document.company);
  const customer = document.customer || ({} as typeof document.customer);
  const items = Array.isArray(document.items) ? document.items : [];

  return (
    <div className="bg-white p-6 sm:p-8 md:p-10 font-['Sarabun',sans-serif] text-slate-700 text-xs leading-relaxed max-w-[210mm] w-full mx-auto shadow-sm print:shadow-none min-h-[297mm] print:min-h-0 print:p-4 print:m-0 print:max-w-full flex flex-col justify-between">
      <div>
        {/* Minimal Header */}
        <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-200">
          <div>
            {company.logoUrl ? (
              <img src={company.logoUrl} alt="Logo" className="h-10 w-auto mb-1.5" />
            ) : null}
            <h1 className="font-bold text-base sm:text-lg text-slate-950">{company.name || 'ชื่อสถานประกอบการ'}</h1>
            {company.nameEn && <p className="text-xs text-slate-500 font-medium">{company.nameEn}</p>}
            <p className="text-slate-600 text-xs max-w-sm mt-0.5">{company.address || '-'}</p>
            <p className="text-slate-700 text-xs mt-0.5">
              เลขผู้เสียภาษี: <span className="font-mono text-slate-950 font-bold">{company.taxId || '-'}</span> ({company.branchType === 'headquarters' ? 'สำนักงานใหญ่' : `สาขา ${company.branchNo || '-'}`})
            </p>
          </div>

          <div className="text-right">
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 mb-0.5">
              {typeInfo.titleTh}
            </div>
            <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
              {typeInfo.titleEn}
            </div>
            <div className="mt-2 text-slate-700 text-xs space-y-0.5 bg-slate-50 p-2 rounded-lg border border-slate-200 text-left">
              <div className="flex justify-between gap-3"><span className="text-slate-500">เลขที่:</span> <span className="font-mono font-bold text-slate-950">{document.documentNumber}</span></div>
              <div className="flex justify-between gap-3"><span className="text-slate-500">วันที่:</span> <span className="font-semibold text-slate-900">{document.issueDate}</span></div>
              {document.dueDate && <div className="flex justify-between gap-3"><span className="text-slate-500">ครบกำหนด:</span> <span className="text-rose-700 font-bold">{document.dueDate}</span></div>}
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-4 pb-3 border-b border-slate-200 grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-0.5">ลูกค้า / Bill To</div>
            <div className="font-bold text-slate-950 text-sm sm:text-base">{customer.name || '-'}</div>
            {customer.contactPerson && <div className="text-slate-800 font-medium text-xs">ผู้ติดต่อ: {customer.contactPerson}</div>}
            <div className="text-slate-700 text-xs mt-0.5">{customer.address || '-'}</div>
          </div>
          <div className="text-right sm:text-left sm:pl-6 space-y-0.5">
            <div className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-0.5">ข้อมูลภาษี / Tax Details</div>
            <div>เลขผู้เสียภาษี: <span className="font-mono font-bold text-slate-950 text-xs sm:text-sm">{customer.taxId || '-'}</span></div>
            <div>สาขา: <span className="text-slate-800">{customer.branchType === 'headquarters' ? 'สำนักงานใหญ่' : `สาขา ${customer.branchNo || '-'}`}</span></div>
            {customer.phone && <div className="text-slate-700">โทร: <strong className="text-slate-900">{customer.phone}</strong></div>}
          </div>
        </div>

        {/* Clean Line Items */}
        <table className="w-full text-xs text-left mb-6">
          <thead>
            <tr className="border-b border-slate-900 text-slate-900 font-bold">
              <th className="py-2 px-1 w-8">#</th>
              <th className="py-2 px-2">รายการ / Description</th>
              <th className="py-2 px-2 text-center w-12">จำนวน</th>
              <th className="py-2 px-2 text-center w-12">หน่วย</th>
              <th className="py-2 px-2 text-right w-20">ราคา</th>
              <th className="py-2 px-2 text-right w-16">ส่วนลด</th>
              <th className="py-2 px-2 text-right w-24">รวม</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => {
              const rawTotal = item.quantity * item.unitPrice;
              const discount = item.discountType === 'percent'
                ? rawTotal * (item.discountValue / 100)
                : item.discountValue;
              const itemTotal = rawTotal - discount;

              return (
                <tr key={item.id || idx}>
                  <td className="py-2.5 px-1 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-2.5 px-2">
                    <div className="font-medium text-slate-900">{item.name}</div>
                    {item.description && <div className="text-[11px] text-slate-400">{item.description}</div>}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono">{item.quantity}</td>
                  <td className="py-2.5 px-2 text-center text-slate-500">{item.unit || 'ชิ้น'}</td>
                  <td className="py-2.5 px-2 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-2.5 px-2 text-right font-mono text-slate-400">
                    {item.discountValue > 0 ? (item.discountType === 'percent' ? `${item.discountValue}%` : formatCurrency(item.discountValue)) : '-'}
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold text-slate-900 font-mono">
                    {formatCurrency(itemTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Minimal Totals */}
        <div className="grid grid-cols-12 gap-4 mb-6">
          <div className="col-span-7 space-y-2">
            <div className="p-2 bg-slate-50 rounded">
              <span className="text-[10px] text-slate-400 block font-semibold">จำนวนเงินตัวอักษร</span>
              <span className="font-bold text-slate-800">({document.thaiBahtText})</span>
            </div>
            {document.notes && <div className="text-[11px] text-slate-500">หมายเหตุ: {document.notes}</div>}
          </div>

          <div className="col-span-5 space-y-1 text-right">
            <div className="flex justify-between text-slate-500">
              <span>รวมเป็นเงิน:</span>
              <span className="font-mono">{formatCurrency(document.subtotal)} ฿</span>
            </div>
            {document.discountTotal > 0 && (
              <div className="flex justify-between text-rose-500">
                <span>ส่วนลด:</span>
                <span className="font-mono">-{formatCurrency(document.discountTotal)} ฿</span>
              </div>
            )}
            {document.vatType !== 'none' && (
              <div className="flex justify-between text-slate-500">
                <span>VAT {document.vatRate}%:</span>
                <span className="font-mono">{formatCurrency(document.vatAmount)} ฿</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base text-slate-900 border-t border-slate-900 pt-1.5 mt-1">
              <span>รวมทั้งสิ้น:</span>
              <span className="font-mono">฿{formatCurrency(document.grandTotal)}</span>
            </div>
            {document.withholdingTaxRate > 0 && (
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>หัก ณ ที่จ่าย {document.withholdingTaxRate}%:</span>
                <span className="font-mono">-{formatCurrency(document.withholdingTaxAmount)} ฿</span>
              </div>
            )}
          </div>
        </div>

        <PromptPayBox document={document} accentColor="#0f172a" />
      </div>

      {/* Footer Signatures */}
      <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-100 text-xs">
        <div className="text-center">
          <div className="h-8"></div>
          <div className="w-32 border-b border-slate-300 mx-auto my-1"></div>
          <div className="font-medium text-slate-700">ผู้รับเอกสาร</div>
        </div>
        <div className="text-center relative">
          {document.showStamp && company.stampUrl && (
            <img src={company.stampUrl} alt="Stamp" className="absolute right-4 top-0 w-12 h-12 opacity-60" />
          )}
          <div className="h-8 flex items-center justify-center">
            {document.showSignature && company.signatureUrl && (
              <img src={company.signatureUrl} alt="Sig" className="max-h-7" />
            )}
          </div>
          <div className="w-32 border-b border-slate-300 mx-auto my-1"></div>
          <div className="font-medium text-slate-800">{document.preparedByName || company.signatureName || 'ผู้มีอำนาจลงนาม'}</div>
        </div>
      </div>
    </div>
  );
};
