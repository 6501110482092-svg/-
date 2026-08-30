import React from 'react';
import { DocumentModel } from '../../types';
import { getDocumentTypeInfo } from '../../utils/documentCalculations';
import { formatCurrency } from '../../utils/thaiBaht';
import { PromptPayBox } from './PromptPayBox';

interface TemplateProps {
  document: DocumentModel;
}

export const ClassicTemplate: React.FC<TemplateProps> = ({ document }) => {
  const typeInfo = getDocumentTypeInfo(document.type);
  const company = document.company || ({} as typeof document.company);
  const customer = document.customer || ({} as typeof document.customer);
  const items = Array.isArray(document.items) ? document.items : [];

  return (
    <div className="bg-white p-6 sm:p-8 md:p-10 font-['Sarabun',sans-serif] text-slate-900 text-xs sm:text-sm leading-normal max-w-[210mm] w-full mx-auto shadow-sm print:shadow-none min-h-[297mm] print:min-h-0 print:p-4 print:m-0 print:max-w-full flex flex-col justify-between border border-slate-300">
      <div>
        {/* Header with Title Centered */}
        <div className="text-center pb-3 border-b-2 border-slate-900 mb-3.5">
          {company.logoUrl && (
            <img
              src={company.logoUrl}
              alt="Company Logo"
              className="h-16 max-h-20 w-auto max-w-[160px] mx-auto object-contain mb-2"
            />
          )}
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">{company.name || 'ชื่อสถานประกอบการ'}</h1>
          {company.nameEn && <p className="text-xs sm:text-sm font-medium text-slate-600 mt-0.5">{company.nameEn}</p>}
          <p className="text-xs sm:text-sm text-slate-700 mt-0.5">{company.address || '-'}</p>
          <p className="text-xs sm:text-sm text-slate-800 mt-0.5">
            เลขประจำตัวผู้เสียภาษี <span className="font-mono font-bold text-slate-950">{company.taxId || '-'}</span> ({company.branchType === 'headquarters' ? 'สำนักงานใหญ่' : `สาขาที่ ${company.branchNo || '-'}`}) โทร: <strong className="text-slate-950">{company.phone || '-'}</strong>
          </p>

          <div className="mt-2.5 inline-block border-2 border-slate-900 px-6 py-1 bg-slate-50">
            <h2 className="text-xl sm:text-2xl font-black tracking-wide text-slate-950">{typeInfo.titleTh}</h2>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600">{typeInfo.titleEn}</div>
          </div>
        </div>

        {/* Info Grid with classic borders */}
        <div className="grid grid-cols-2 gap-0 border-2 border-slate-900 text-xs mb-3.5">
          <div className="p-2.5 border-r-2 border-slate-900 space-y-0.5">
            <div className="font-bold text-sm text-slate-950">ลูกค้า: {customer.name || '-'}</div>
            {customer.contactPerson && <div className="text-slate-800 font-medium">ผู้ติดต่อ: {customer.contactPerson}</div>}
            <div className="text-slate-700">ที่อยู่: {customer.address || '-'}</div>
            <div className="text-slate-800">เลขประจำตัวผู้เสียภาษี: <span className="font-mono font-bold text-slate-950">{customer.taxId || '-'}</span></div>
            <div className="text-slate-800">สาขา: {customer.branchType === 'headquarters' ? 'สำนักงานใหญ่' : `สาขาที่ ${customer.branchNo || '-'}`}</div>
          </div>

          <div className="p-2.5 space-y-1 bg-slate-50/70">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-700">เลขที่เอกสาร:</span>
              <span className="font-mono font-bold text-slate-950 text-sm">{document.documentNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-700">วันที่:</span>
              <span className="font-semibold text-slate-900">{document.issueDate}</span>
            </div>
            {document.dueDate && (
              <div className="flex justify-between items-center">
                <span className="text-slate-700">วันครบกำหนด:</span>
                <span className="font-bold text-rose-700">{document.dueDate}</span>
              </div>
            )}
            {document.referenceNumber && (
              <div className="flex justify-between items-center border-t border-slate-300 pt-0.5">
                <span className="text-slate-700">อ้างอิง:</span>
                <span className="font-mono font-medium text-slate-800">{document.referenceNumber}</span>
              </div>
            )}
            {document.paymentTerms && (
              <div className="flex justify-between items-center">
                <span className="text-slate-700">เงื่อนไข:</span>
                <span className="font-medium text-slate-800">{document.paymentTerms}</span>
              </div>
            )}
          </div>
        </div>

        {/* Table with sharp borders */}
        <table className="w-full text-xs border-collapse border border-slate-400 mb-4">
          <thead>
            <tr className="bg-slate-200 text-slate-900 border-b border-slate-400">
              <th className="py-2 px-2 text-center border-r border-slate-400 w-10">ลำดับ</th>
              <th className="py-2 px-3 text-left border-r border-slate-400">รายการ</th>
              <th className="py-2 px-2 text-center border-r border-slate-400 w-16">จำนวน</th>
              <th className="py-2 px-2 text-center border-r border-slate-400 w-16">หน่วย</th>
              <th className="py-2 px-2.5 text-right border-r border-slate-400 w-24">หน่วยละ</th>
              <th className="py-2 px-2 text-right border-r border-slate-400 w-16">ส่วนลด</th>
              <th className="py-2 px-2.5 text-right w-28">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const rawTotal = item.quantity * item.unitPrice;
              const discount = item.discountType === 'percent'
                ? rawTotal * (item.discountValue / 100)
                : item.discountValue;
              const itemTotal = rawTotal - discount;

              return (
                <tr key={item.id || idx} className="border-b border-slate-300">
                  <td className="py-2 px-2 text-center border-r border-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-2 px-3 border-r border-slate-400">
                    <div className="font-bold">{item.name}</div>
                    {item.description && <div className="text-[11px] text-slate-600">{item.description}</div>}
                  </td>
                  <td className="py-2 px-2 text-center border-r border-slate-400 font-mono">{item.quantity}</td>
                  <td className="py-2 px-2 text-center border-r border-slate-400">{item.unit || 'ชิ้น'}</td>
                  <td className="py-2 px-2.5 text-right border-r border-slate-400 font-mono">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-2 px-2 text-right border-r border-slate-400 font-mono text-slate-600">
                    {item.discountValue > 0 ? (item.discountType === 'percent' ? `${item.discountValue}%` : formatCurrency(item.discountValue)) : '-'}
                  </td>
                  <td className="py-2 px-2.5 text-right font-bold font-mono">{formatCurrency(itemTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals table */}
        <div className="grid grid-cols-12 border border-slate-400 text-xs mb-4">
          <div className="col-span-7 p-3 border-r border-slate-400 flex flex-col justify-between">
            <div>
              <div className="font-bold mb-1">จำนวนเงินตัวอักษร:</div>
              <div className="font-bold text-slate-900 bg-slate-100 p-2 border border-slate-300">
                {document.thaiBahtText}
              </div>
            </div>
            {document.notes && (
              <div className="text-[11px] text-slate-600 mt-2">
                <span className="font-bold">หมายเหตุ:</span> {document.notes}
              </div>
            )}
          </div>

          <div className="col-span-5 p-2.5 space-y-1">
            <div className="flex justify-between">
              <span>รวมเงิน:</span>
              <span className="font-mono">{formatCurrency(document.subtotal)}</span>
            </div>
            {document.discountTotal > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>หักส่วนลด:</span>
                <span className="font-mono">-{formatCurrency(document.discountTotal)}</span>
              </div>
            )}
            {document.vatType !== 'none' && (
              <div className="flex justify-between">
                <span>ภาษีมูลค่าเพิ่ม {document.vatRate}%:</span>
                <span className="font-mono">{formatCurrency(document.vatAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm border-t-2 border-slate-900 pt-1">
              <span>ยอดเงินรวมทั้งสิ้น:</span>
              <span className="font-mono">฿{formatCurrency(document.grandTotal)}</span>
            </div>
            {document.withholdingTaxRate > 0 && (
              <>
                <div className="flex justify-between text-amber-800 text-[11px]">
                  <span>หัก ณ ที่จ่าย {document.withholdingTaxRate}%:</span>
                  <span className="font-mono">-{formatCurrency(document.withholdingTaxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold bg-slate-200 p-1">
                  <span>ยอดสุทธิที่ต้องชำระ:</span>
                  <span className="font-mono">฿{formatCurrency(document.netPayment)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <PromptPayBox document={document} accentColor="#334155" />
      </div>

      {/* Signature */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-400 text-xs">
        <div className="text-center p-3 border border-slate-300">
          <div className="h-10"></div>
          <div className="w-36 border-b border-slate-500 mx-auto my-1"></div>
          <div className="font-bold">ผู้รับบริการ / ลูกค้า</div>
          <div className="text-[10px] text-slate-500">วันที่ ......./......./...........</div>
        </div>
        <div className="text-center p-3 border border-slate-300 relative">
          {document.showStamp && company.stampUrl && (
            <img src={company.stampUrl} alt="Stamp" className="absolute right-2 top-1 w-12 h-12 opacity-80" />
          )}
          <div className="h-10 flex items-center justify-center">
            {document.showSignature && company.signatureUrl && (
              <img src={company.signatureUrl} alt="Sig" className="max-h-8" />
            )}
          </div>
          <div className="w-36 border-b border-slate-500 mx-auto my-1"></div>
          <div className="font-bold">{document.preparedByName || company.signatureName || 'ผู้มีอำนาจลงนาม'}</div>
          <div className="text-[10px] text-slate-500">{company.name || 'บริษัท'}</div>
        </div>
      </div>
    </div>
  );
};
