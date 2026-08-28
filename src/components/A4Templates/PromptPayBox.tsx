import React, { useEffect, useState } from 'react';
import { DocumentModel } from '../../types';
import { generateQRCodeDataUrl, formatPromptPayId, getPromptPayLabel } from '../../utils/promptpay';
import { formatCurrency } from '../../utils/thaiBaht';
import { QrCode, Building2, CheckCircle2, ShieldCheck } from 'lucide-react';

interface PromptPayBoxProps {
  document: DocumentModel;
  accentColor?: string;
}

export const PromptPayBox: React.FC<PromptPayBoxProps> = ({ document, accentColor = '#1e3a8a' }) => {
  const [generatedQrUrl, setGeneratedQrUrl] = useState<string>('');

  const company = document.company || ({} as typeof document.company);
  const target = document.promptPayId || company.promptPayId || company.phone || company.taxId || '';
  const bankAccounts = Array.isArray(company.bankAccounts) ? company.bankAccounts : [];
  const bankAccount = bankAccounts.find((b) => b.id === document.selectedBankAccountId) || bankAccounts[0];

  // Determine if we should display an uploaded QR image or auto-generated QR
  const uploadedQrUrl = document.customQrCodeUrl || company.qrCodeUrl;
  const isUploadMode = document.qrCodeSource === 'upload' ? Boolean(uploadedQrUrl) : Boolean(document.customQrCodeUrl);
  const activeQrImageUrl = isUploadMode && uploadedQrUrl ? uploadedQrUrl : generatedQrUrl;

  // Calculate actual amount to request
  let calculatedAmount: number | undefined;
  if (document.promptPayAmountType === 'open') {
    calculatedAmount = undefined;
  } else if (document.promptPayAmountType === 'custom' && typeof document.promptPayCustomAmount === 'number') {
    calculatedAmount = document.promptPayCustomAmount;
  } else {
    calculatedAmount = (document.withholdingTaxAmount || 0) > 0 ? (document.netPayment || 0) : (document.grandTotal || 0);
  }

  useEffect(() => {
    let isMounted = true;
    if (document.showPromptPayQR && !isUploadMode && target) {
      generateQRCodeDataUrl(target, calculatedAmount).then((url) => {
        if (isMounted) {
          setGeneratedQrUrl(url);
        }
      });
    } else {
      setGeneratedQrUrl('');
    }
    return () => {
      isMounted = false;
    };
  }, [target, document.showPromptPayQR, isUploadMode, calculatedAmount]);

  if (!document.showPromptPayQR && !bankAccount) {
    return null;
  }

  const accountOwnerName = document.promptPayAccountName || company.promptPayName || company.name || '';
  const formattedTarget = target ? formatPromptPayId(target) : '';
  const targetLabel = target ? getPromptPayLabel(target) : 'พร้อมเพย์';

  return (
    <div className="flex flex-col sm:flex-row items-stretch gap-2.5 p-2.5 bg-gradient-to-br from-slate-50 to-blue-50/20 rounded-lg border border-slate-200 text-xs page-break-inside-avoid">
      {document.showPromptPayQR && activeQrImageUrl && (
        <div className="flex flex-col items-center justify-between p-2 bg-white rounded-lg border border-slate-200 shrink-0 w-full sm:w-36 text-center">
          {/* Thai PromptPay Banner Header */}
          <div className="w-full bg-[#003B71] text-white py-0.5 px-1.5 rounded-t flex items-center justify-center gap-1 -mt-1 -mx-1 mb-1">
            <QrCode className="w-3 h-3 text-sky-200" />
            <span className="font-bold text-[9px] tracking-wide">THAI QR PAYMENT</span>
          </div>

          <div className="p-0.5 bg-white rounded flex items-center justify-center my-0.5">
            <img
              src={activeQrImageUrl}
              alt="Payment QR Code"
              className="w-20 h-20 sm:w-22 sm:h-22 object-contain rounded"
            />
          </div>

          <div className="w-full mt-0.5 space-y-0.5">
            {formattedTarget ? (
              <div className="text-[10px] font-bold text-slate-800 font-mono tracking-tight">
                {formattedTarget}
              </div>
            ) : null}
            {accountOwnerName && (
              <div className="text-[9px] text-slate-500 truncate max-w-[130px] mx-auto" title={accountOwnerName}>
                {accountOwnerName}
              </div>
            )}
            {calculatedAmount !== undefined ? (
              <div className="inline-block mt-0.5 px-1.5 py-0.2 bg-blue-50 text-blue-800 font-bold text-[10px] rounded border border-blue-200">
                ฿{formatCurrency(calculatedAmount)}
              </div>
            ) : (
              <div className="text-[8px] text-slate-400 font-medium">
                (ระบุยอดเงินตามใบแจ้ง)
              </div>
            )}
          </div>
        </div>
      )}

      {bankAccount && (
        <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0 space-y-1.5">
          <div>
            <div className="flex items-center gap-1 font-bold text-slate-800 text-[11px] mb-1">
              <Building2 className="w-3 h-3 text-blue-700" />
              <span>ช่องทางการชำระเงิน (Payment Information)</span>
            </div>

            <div className="space-y-1 text-slate-700 bg-white p-2 rounded-lg border border-slate-200 text-xs">
              <div className="flex items-baseline gap-2">
                <span className="text-slate-500 text-[10px] w-16 shrink-0">ธนาคาร:</span>
                <span className="font-bold text-slate-900 text-xs">
                  {bankAccount.bankName} {bankAccount.branch && <span className="font-normal text-slate-600 text-[11px]">({bankAccount.branch})</span>}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-slate-500 text-[10px] w-16 shrink-0">ชื่อบัญชี:</span>
                <span className="font-medium text-slate-800 text-xs">{bankAccount.accountName}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-slate-500 text-[10px] w-16 shrink-0">เลขที่บัญชี:</span>
                <span className="font-bold text-blue-900 tracking-wider font-mono text-xs bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                  {bankAccount.accountNumber}
                </span>
              </div>

              {document.showPromptPayQR && target && (
                <div className="flex items-baseline gap-2 pt-0.5 border-t border-slate-100">
                  <span className="text-slate-500 text-[10px] w-16 shrink-0">พร้อมเพย์:</span>
                  <span className="font-mono font-bold text-slate-800 text-xs">
                    {formattedTarget} <span className="font-sans font-normal text-slate-500 text-[10px]">({targetLabel})</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5 border-t border-slate-200/60">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>โอนเงินแล้ว กรุณาส่งสลิปหลักฐานการชำระเงินที่ {company.email || company.phone || '-'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
