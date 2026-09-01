import React from 'react';
import { DocumentModel, DocumentType } from '../types';
import { formatCurrency } from '../utils/thaiBaht';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileCheck,
  Receipt,
  FileText,
  Plus,
} from 'lucide-react';

interface DashboardStatsProps {
  documents: DocumentModel[];
  onCreateNew: (type: DocumentType) => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ documents, onCreateNew }) => {
  // Financial metrics
  const totalRevenue = documents
    .filter((d) => d.type === 'receipt' || (d.type === 'invoice' && d.status === 'paid'))
    .reduce((acc, d) => acc + d.grandTotal, 0);

  const pendingAmount = documents
    .filter((d) => (d.type === 'invoice' || d.type === 'billing') && d.status === 'pending')
    .reduce((acc, d) => acc + d.grandTotal, 0);

  const quotationPipeline = documents
    .filter((d) => d.type === 'quotation')
    .reduce((acc, d) => acc + d.grandTotal, 0);

  const totalDocumentsCount = documents.length;

  return (
    <div className="space-y-6">
      {/* 4 Main Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              ยอดรับชำระแล้ว (Paid Revenue)
            </span>
            <div className="text-xl font-extrabold text-emerald-700 font-mono">
              ฿{formatCurrency(totalRevenue)}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>เงินเข้าบัญชีเรียบร้อย</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              ยอดรอเรียกเก็บ (Pending Invoices)
            </span>
            <div className="text-xl font-extrabold text-indigo-700 font-mono">
              ฿{formatCurrency(pendingAmount)}
            </div>
            <div className="text-[11px] text-indigo-600 font-medium flex items-center gap-1 mt-1">
              <Clock className="w-3.5 h-3.5" />
              <span>รอการชำระเงินตามดิว</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
        </div>

        {/* Quotation Pipeline */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              มูลค่าเสนอราคา (Quotations Pipeline)
            </span>
            <div className="text-xl font-extrabold text-amber-700 font-mono">
              ฿{formatCurrency(quotationPipeline)}
            </div>
            <div className="text-[11px] text-amber-600 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>โอกาสปิดการขาย</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Total Documents */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              เอกสารทั้งหมด (Total Documents)
            </span>
            <div className="text-xl font-extrabold text-slate-800 font-mono">
              {totalDocumentsCount} <span className="text-xs font-normal text-slate-500">ฉบับ</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-1">
              <FileCheck className="w-3.5 h-3.5" />
              <span>ระบบพร้อมพิมพ์ A4</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 4 Quick Action Cards to Create New Document */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Create Quotation */}
        <button
          onClick={() => onCreateNew('quotation')}
          className="p-4 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between group"
        >
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-100 block">
              QUOTATION
            </span>
            <span className="font-bold text-sm block mt-0.5">ออกใบเสนอราคา</span>
            <span className="text-[11px] text-amber-100 opacity-90">เสนอราคา & เงื่อนไขบริการ</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
        </button>

        {/* Create Billing Note */}
        <button
          onClick={() => onCreateNew('billing')}
          className="p-4 bg-linear-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white rounded-2xl shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between group"
        >
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-sky-100 block">
              BILLING NOTE
            </span>
            <span className="font-bold text-sm block mt-0.5">ออกใบวางบิล / แจ้งหนี้</span>
            <span className="text-[11px] text-sky-100 opacity-90">วางบิลตามรอบชำระเงิน</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
        </button>

        {/* Create Invoice */}
        <button
          onClick={() => onCreateNew('invoice')}
          className="p-4 bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between group"
        >
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-100 block">
              INVOICE
            </span>
            <span className="font-bold text-sm block mt-0.5">ออกใบแจ้งหนี้</span>
            <span className="text-[11px] text-indigo-100 opacity-90">เรียกเก็บเงินอย่างเป็นทางการ</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
        </button>

        {/* Create Receipt */}
        <button
          onClick={() => onCreateNew('receipt')}
          className="p-4 bg-linear-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-2xl shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between group"
        >
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-100 block">
              RECEIPT / TAX INVOICE
            </span>
            <span className="font-bold text-sm block mt-0.5">ออกใบเสร็จ / ใบกำกับภาษี</span>
            <span className="text-[11px] text-emerald-100 opacity-90">หลักฐานรับชำระและภาษี</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
        </button>
      </div>
    </div>
  );
};
