import React, { useState } from 'react';
import { DocumentModel, DocumentType } from '../types';
import { getDocumentTypeInfo, generateDocumentNumber, calculateDocumentTotals } from '../utils/documentCalculations';
import { X, ArrowRight, FileText, Check, Copy } from 'lucide-react';

interface ConvertDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceDoc: DocumentModel;
  existingDocsCount: number;
  onConvert: (newDoc: DocumentModel) => void;
}

export const ConvertDocumentModal: React.FC<ConvertDocumentModalProps> = ({
  isOpen,
  onClose,
  sourceDoc,
  existingDocsCount,
  onConvert,
}) => {
  const currentType = sourceDoc.type;
  
  // Available target types
  const targetOptions: DocumentType[] = (['quotation', 'billing', 'invoice', 'receipt'] as DocumentType[])
    .filter((t) => t !== currentType);

  const [selectedTarget, setSelectedTarget] = useState<DocumentType>(
    currentType === 'quotation' ? 'invoice' : currentType === 'billing' ? 'invoice' : 'receipt'
  );

  const [targetNumber, setTargetNumber] = useState<string>(
    generateDocumentNumber(
      currentType === 'quotation' ? 'invoice' : currentType === 'billing' ? 'invoice' : 'receipt',
      existingDocsCount
    )
  );

  if (!isOpen) return null;

  const handleSelectType = (type: DocumentType) => {
    setSelectedTarget(type);
    setTargetNumber(generateDocumentNumber(type, existingDocsCount));
  };

  const handleExecuteConvert = () => {
    const today = new Date().toISOString().split('T')[0];
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + 30);
    const dueDate = dueDateObj.toISOString().split('T')[0];

    const newDoc: DocumentModel = {
      ...sourceDoc,
      id: `doc-${selectedTarget}-${Date.now()}`,
      type: selectedTarget,
      documentNumber: targetNumber,
      referenceNumber: sourceDoc.documentNumber, // Link back to source
      issueDate: today,
      dueDate: selectedTarget === 'receipt' ? today : dueDate,
      status: selectedTarget === 'receipt' ? 'paid' : 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onConvert(newDoc);
    onClose();
  };

  const sourceTypeInfo = getDocumentTypeInfo(sourceDoc.type);
  const targetTypeInfo = getDocumentTypeInfo(selectedTarget);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Copy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">แปลงประเภทเอกสาร (Convert Document)</h3>
              <p className="text-[11px] text-slate-500">คัดลอกข้อมูลรายการและลูกค้า เพื่อสร้างเอกสารขั้นตอนถัดไป</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 text-xs space-y-5">
          {/* Transition Visualizer */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex-1 text-center">
              <span className="text-[10px] text-slate-400 block mb-0.5">เอกสารต้นทาง</span>
              <span className="font-bold text-slate-800 text-xs block">{sourceTypeInfo.titleTh}</span>
              <span className="font-mono text-[11px] text-indigo-600 font-semibold">{sourceDoc.documentNumber}</span>
            </div>

            <div className="px-3 text-slate-400">
              <ArrowRight className="w-5 h-5 text-indigo-600" />
            </div>

            <div className="flex-1 text-center">
              <span className="text-[10px] text-slate-400 block mb-0.5">เอกสารใหม่ปลายทาง</span>
              <span className="font-bold text-slate-800 text-xs block">{targetTypeInfo.titleTh}</span>
              <span className="font-mono text-[11px] text-emerald-600 font-semibold">{targetNumber}</span>
            </div>
          </div>

          {/* Select Target Document Type */}
          <div>
            <label className="block font-bold text-slate-700 mb-2">เลือกประเภทเอกสารที่ต้องการสร้างใหม่:</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {targetOptions.map((type) => {
                const info = getDocumentTypeInfo(type);
                const isSelected = selectedTarget === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleSelectType(type)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{info.titleTh}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{info.titleEn}</div>
                    </div>
                    {isSelected && (
                      <div className="mt-2 text-indigo-600 flex items-center gap-1 font-semibold text-[10px]">
                        <Check className="w-3.5 h-3.5" />
                        <span>เลือกแล้ว</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Document Number Input */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              เลขที่เอกสารใหม่ (New Document No.)
            </label>
            <input
              type="text"
              value={targetNumber}
              onChange={(e) => setTargetNumber(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              * ระบบจะเชื่อมโยงเลขอ้างอิง <span className="font-mono font-medium">{sourceDoc.documentNumber}</span> ให้อัตโนมัติ
            </p>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleExecuteConvert}
            className="flex items-center gap-1.5 px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>ยืนยันสร้างเอกสาร</span>
          </button>
        </div>
      </div>
    </div>
  );
};
