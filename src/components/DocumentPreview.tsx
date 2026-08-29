import React, { useState } from 'react';
import { DocumentModel, TemplateStyle, DocumentLanguage } from '../types';
import { ModernTemplate } from './A4Templates/ModernTemplate';
import { QuotationTemplate } from './A4Templates/QuotationTemplate';
import { CorporateTemplate } from './A4Templates/CorporateTemplate';
import { ClassicTemplate } from './A4Templates/ClassicTemplate';
import { MinimalTemplate } from './A4Templates/MinimalTemplate';
import { getDocumentTypeInfo, getStatusInfo } from '../utils/documentCalculations';
import { generateQRCodeDataUrl, formatPromptPayId } from '../utils/promptpay';
import { exportDocumentToPdf, printDocumentDirectly } from '../utils/pdfExport';
import {
  Printer,
  ArrowLeft,
  Edit3,
  Copy,
  Layers,
  Globe,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle,
  FileCheck,
  Send,
  Download,
  QrCode,
  Check,
  Trash2,
  FileDown,
  Loader2,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';

interface DocumentPreviewProps {
  document: DocumentModel;
  onBack: () => void;
  onEdit: (doc: DocumentModel) => void;
  onConvert: (doc: DocumentModel) => void;
  onDelete?: (id: string) => void;
  onUpdateStatus: (id: string, status: DocumentModel['status']) => void;
  onUpdateDocument: (doc: DocumentModel) => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  onBack,
  onEdit,
  onConvert,
  onDelete,
  onUpdateStatus,
  onUpdateDocument,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [copiedPromptPay, setCopiedPromptPay] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [pdfStatusText, setPdfStatusText] = useState<string>('');
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<boolean>(false);

  const typeInfo = getDocumentTypeInfo(document.type);
  const statusInfo = getStatusInfo(document.status);

  const promptPayTarget = document.promptPayId || document.company.promptPayId || document.company.taxId || '';

  const handleCopyPromptPay = () => {
    if (!promptPayTarget) return;
    navigator.clipboard.writeText(promptPayTarget.replace(/[^0-9]/g, ''));
    setCopiedPromptPay(true);
    setTimeout(() => setCopiedPromptPay(false), 2500);
  };

  const handleDownloadQr = async () => {
    if (!promptPayTarget) return;
    let amount: number | undefined;
    if (document.promptPayAmountType === 'open') {
      amount = undefined;
    } else if (document.promptPayAmountType === 'custom' && typeof document.promptPayCustomAmount === 'number') {
      amount = document.promptPayCustomAmount;
    } else {
      amount = (document.withholdingTaxAmount || 0) > 0 ? (document.netPayment || 0) : (document.grandTotal || 0);
    }

    const dataUrl = await generateQRCodeDataUrl(promptPayTarget, amount);
    if (!dataUrl) return;

    const link = window.document.createElement('a');
    link.href = dataUrl;
    link.download = `PromptPay-QR-${document.documentNumber || 'payment'}.png`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const handleDirectPrint = async () => {
    setIsPrinting(true);
    try {
      await printDocumentDirectly('printable-document');
    } catch (err) {
      console.error(err);
      window.print();
    } finally {
      setTimeout(() => setIsPrinting(false), 1000);
    }
  };

  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    setExportError(null);
    setPdfStatusText('กำลังเตรียมข้อมูลเอกสาร...');

    try {
      const filename = `${typeInfo.titleTh}_${document.documentNumber || 'document'}`;
      await exportDocumentToPdf('printable-document', filename, (msg) => {
        setPdfStatusText(msg);
      });
      setPdfStatusText('ดาวน์โหลดไฟล์ PDF สำเร็จ!');
      setTimeout(() => {
        setIsExportingPdf(false);
        setPdfStatusText('');
      }, 2000);
    } catch (error) {
      console.error('PDF Export Error:', error);
      setExportError('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF กรุณาลองใหม่อีกครั้ง');
      setIsExportingPdf(false);
      setPdfStatusText('');
    }
  };

  const handleTemplateChange = (template: TemplateStyle) => {
    onUpdateDocument({ ...document, templateStyle: template });
  };

  const handleLanguageChange = (lang: DocumentLanguage) => {
    onUpdateDocument({ ...document, language: lang });
  };

  const renderTemplate = () => {
    switch (document.templateStyle) {
      case 'quotation':
        return <QuotationTemplate document={document} />;
      case 'corporate':
        return <CorporateTemplate document={document} />;
      case 'classic':
        return <ClassicTemplate document={document} />;
      case 'minimal':
        return <MinimalTemplate document={document} />;
      case 'modern':
      default:
        if (document.type === 'quotation') {
          return <QuotationTemplate document={document} />;
        }
        return <ModernTemplate document={document} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Toolbar (Hidden when printing) */}
      <div className="no-print sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Back & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับหน้ารายการ</span>
            </button>
            <div className="h-5 w-px bg-slate-200"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900 text-sm">{document.documentNumber}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${typeInfo.badgeColor}`}>
                  {typeInfo.titleTh}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Template & Language Selector */}
          <div className="flex items-center gap-2">
            {/* Template Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <span className="text-[11px] text-slate-500 font-semibold px-2 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                แบบ:
              </span>
              <button
                onClick={() => handleTemplateChange('modern')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  document.templateStyle === 'modern' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Modern
              </button>
              <button
                onClick={() => handleTemplateChange('corporate')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  document.templateStyle === 'corporate' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Corporate
              </button>
              <button
                onClick={() => handleTemplateChange('classic')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  document.templateStyle === 'classic' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Classic
              </button>
              <button
                onClick={() => handleTemplateChange('minimal')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  document.templateStyle === 'minimal' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Minimal
              </button>
            </div>

            {/* Language Toggle */}
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <span className="text-[11px] text-slate-500 font-semibold px-1.5 flex items-center gap-1">
                <Globe className="w-3 h-3" />
              </span>
              <button
                onClick={() => handleLanguageChange('th')}
                className={`px-2 py-1 rounded text-xs font-medium ${
                  document.language === 'th' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                ไทย
              </button>
              <button
                onClick={() => handleLanguageChange('bilingual')}
                className={`px-2 py-1 rounded text-xs font-medium ${
                  document.language === 'bilingual' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                TH/EN
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setZoomLevel((prev) => Math.max(60, prev - 10))}
                className="p-1 text-slate-600 hover:text-slate-900 rounded"
                title="ย่อ"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 font-mono text-[11px] text-slate-600">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((prev) => Math.min(130, prev + 10))}
                className="p-1 text-slate-600 hover:text-slate-900 rounded"
                title="ขยาย"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {document.showPromptPayQR && promptPayTarget && (
              <>
                <button
                  onClick={handleCopyPromptPay}
                  className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
                  title={`คัดลอกเบอร์/เลข ${formatPromptPayId(promptPayTarget)}`}
                >
                  {copiedPromptPay ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPromptPay ? 'คัดลอกแล้ว!' : 'คัดลอกพร้อมเพย์'}</span>
                </button>

                <button
                  onClick={handleDownloadQr}
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                  title="ดาวน์โหลดรูป QR Code พร้อมเพย์"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>บันทึกรูป QR</span>
                </button>
              </>
            )}

            <button
              onClick={() => onEdit(document)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>แก้ไข</span>
            </button>

            <button
              onClick={() => onConvert(document)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors"
              title="แปลงเอกสารเป็นขั้นตอนถัดไป"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>แปลงเอกสาร</span>
            </button>

            {onDelete && (
              <button
                onClick={() => onDelete(document.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold transition-colors"
                title="ลบเอกสารนี้"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ลบ</span>
              </button>
            )}

            {/* Consolidated Print / Save PDF Primary Action */}
            <div className="relative inline-flex items-stretch rounded-lg shadow-xs">
              <button
                type="button"
                onClick={handleDirectPrint}
                disabled={isPrinting || isExportingPdf}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-l-lg text-xs font-semibold transition-all cursor-pointer border-r border-indigo-500/60"
                title="พิมพ์เอกสารขนาด A4 หรือบันทึกเป็น PDF"
              >
                {isPrinting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4" />
                )}
                <span>{isPrinting ? 'กำลังเตรียมพิมพ์...' : 'พิมพ์เอกสาร / บันทึก PDF'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowActionMenu((prev) => !prev)}
                className="px-2 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-r-lg text-xs transition-colors cursor-pointer flex items-center justify-center"
                title="ตัวเลือกเพิ่มเติม"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showActionMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Action Dropdown Menu */}
              {showActionMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowActionMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 text-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setShowActionMenu(false);
                        handleDirectPrint();
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-indigo-50 text-slate-800 flex items-center gap-2.5 font-medium cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-indigo-600" />
                      <div>
                        <div className="font-semibold text-slate-900">พิมพ์เอกสาร (Print A4)</div>
                        <div className="text-[10px] text-slate-500">เปิดหน้าต่างพิมพ์หรือบันทึก PDF</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowActionMenu(false);
                        handleExportPdf();
                      }}
                      disabled={isExportingPdf}
                      className="w-full px-3.5 py-2 text-left hover:bg-rose-50 text-slate-800 flex items-center gap-2.5 font-medium cursor-pointer border-t border-slate-100"
                    >
                      <FileDown className="w-4 h-4 text-rose-600" />
                      <div>
                        <div className="font-semibold text-slate-900">ดาวน์โหลด PDF โดยตรง</div>
                        <div className="text-[10px] text-slate-500">บันทึกเป็นไฟล์ .pdf ทันที</div>
                      </div>
                    </button>

                    {document.showPromptPayQR && promptPayTarget && (
                      <>
                        <div className="border-t border-slate-100 my-1" />
                        <button
                          type="button"
                          onClick={() => {
                            setShowActionMenu(false);
                            handleDownloadQr();
                          }}
                          className="w-full px-3.5 py-2 text-left hover:bg-blue-50 text-slate-800 flex items-center gap-2.5 font-medium cursor-pointer"
                        >
                          <Download className="w-4 h-4 text-blue-600" />
                          <div>
                            <div className="font-semibold text-slate-900">บันทึกรูป QR พร้อมเพย์</div>
                            <div className="text-[10px] text-slate-500">ดาวน์โหลดภาพ QR Code (.png)</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowActionMenu(false);
                            handleCopyPromptPay();
                          }}
                          className="w-full px-3.5 py-2 text-left hover:bg-emerald-50 text-slate-800 flex items-center gap-2.5 font-medium cursor-pointer"
                        >
                          {copiedPromptPay ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-emerald-600" />}
                          <div>
                            <div className="font-semibold text-slate-900">คัดลอกเบอร์พร้อมเพย์</div>
                            <div className="text-[10px] text-slate-500">{formatPromptPayId(promptPayTarget)}</div>
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Export progress / error alert */}
      {isExportingPdf && (
        <div className="no-print bg-indigo-50 border-b border-indigo-100 px-4 py-2 text-center text-xs font-medium text-indigo-800 flex items-center justify-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
          <span>{pdfStatusText || 'กำลังประมวลผลไฟล์ PDF คุณภาพสูง...'}</span>
        </div>
      )}

      {exportError && (
        <div className="no-print bg-rose-50 border-b border-rose-100 px-4 py-2 text-center text-xs font-medium text-rose-800 flex items-center justify-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>{exportError}</span>
          <button
            onClick={() => setExportError(null)}
            className="underline ml-2 text-[11px] text-rose-700 hover:text-rose-900"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Main Preview Container */}
      <div className="flex-1 p-4 sm:p-8 flex justify-center items-start overflow-auto">
        <div
          id="printable-document"
          className="a4-document-container transition-transform origin-top bg-white rounded-xl shadow-xl border border-slate-200/80 overflow-hidden"
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            width: '210mm',
            minHeight: '297mm',
          }}
        >
          {renderTemplate()}
        </div>
      </div>

      {/* Bottom Status bar for quick actions */}
      <div className="no-print bg-white border-t border-slate-200 py-2.5 px-4 sticky bottom-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">เปลี่ยนสถานะ:</span>
            {(['draft', 'pending', 'approved', 'paid', 'cancelled'] as DocumentModel['status'][]).map((st) => {
              const info = getStatusInfo(st);
              const isCurrent = document.status === st;
              return (
                <button
                  key={st}
                  onClick={() => onUpdateStatus(document.id, st)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                    isCurrent
                      ? `${info.color} ring-2 ring-indigo-400 ring-offset-1`
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {info.label}
                </button>
              );
            })}
          </div>

          <div className="text-slate-500 text-[11px] flex items-center gap-2">
            <span>
              สร้างเมื่อ:{' '}
              {document.createdAt
                ? (() => {
                    try {
                      return new Date(document.createdAt).toLocaleDateString('th-TH');
                    } catch {
                      return document.issueDate || '-';
                    }
                  })()
                : document.issueDate || '-'}
            </span>
            <span>•</span>
            <span className="text-slate-700 font-medium">
              💡 กด <b>"บันทึก PDF"</b> เพื่อรับไฟล์ PDF ลงเครื่องทันที หรือกด <b>"พิมพ์เอกสาร"</b> สำหรับกระดาษ A4 แบบเต็มหน้า
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

