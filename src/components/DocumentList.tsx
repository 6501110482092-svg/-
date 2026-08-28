import React, { useState } from 'react';
import { DocumentModel, DocumentType, DocumentStatus } from '../types';
import { getDocumentTypeInfo, getStatusInfo } from '../utils/documentCalculations';
import { formatCurrency } from '../utils/thaiBaht';
import {
  Search,
  Plus,
  Filter,
  FileText,
  Printer,
  Edit3,
  Copy,
  Trash2,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Upload,
  Calendar,
  Layers,
} from 'lucide-react';

interface DocumentListProps {
  documents: DocumentModel[];
  onView: (doc: DocumentModel) => void;
  onEdit: (doc: DocumentModel) => void;
  onConvert: (doc: DocumentModel) => void;
  onDuplicate: (doc: DocumentModel) => void;
  onDelete: (id: string) => void;
  onCreateNew: (type: DocumentType) => void;
  onUpdateStatus: (id: string, status: DocumentStatus) => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onView,
  onEdit,
  onConvert,
  onDuplicate,
  onDelete,
  onCreateNew,
  onUpdateStatus,
  onExportData,
  onImportData,
}) => {
  const [activeTab, setActiveTab] = useState<DocumentType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    // Tab filter
    if (activeTab !== 'all' && doc.type !== activeTab) {
      return false;
    }
    // Status filter
    if (statusFilter !== 'all' && doc.status !== statusFilter) {
      return false;
    }
    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchNo = (doc.documentNumber || '').toLowerCase().includes(term);
      const matchCustomer = (doc.customer?.name || '').toLowerCase().includes(term);
      const matchRef = (doc.referenceNumber || '').toLowerCase().includes(term);
      const matchDate = (doc.issueDate || '').includes(term);
      if (!matchNo && !matchCustomer && !matchRef && !matchDate) {
        return false;
      }
    }
    return true;
  });

  const getTabCounts = (type: DocumentType | 'all') => {
    if (type === 'all') return documents.length;
    return documents.filter((d) => d.type === type).length;
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-100 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>เอกสารทั้งหมด</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {getTabCounts('all')}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('quotation')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'quotation'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-amber-800 hover:bg-amber-50'
            }`}
          >
            <span>ใบเสนอราคา (QT)</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'quotation' ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {getTabCounts('quotation')}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'billing'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-sky-800 hover:bg-sky-50'
            }`}
          >
            <span>ใบวางบิล / ส่งของ (BN)</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'billing' ? 'bg-sky-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {getTabCounts('billing')}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('invoice')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'invoice'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-indigo-800 hover:bg-indigo-50'
            }`}
          >
            <span>ใบแจ้งหนี้ (IV)</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'invoice' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {getTabCounts('invoice')}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('receipt')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'receipt'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            <span>ใบเสร็จ / ใบกำกับภาษี (RC)</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'receipt' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {getTabCounts('receipt')}
            </span>
          </button>
        </div>

        {/* Search & Secondary Filter Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 text-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาเลขที่เอกสาร, ชื่อลูกค้า, เลขอ้างอิง..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Status dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="draft">ฉบับร่าง</option>
                <option value="pending">รอดำเนินการ</option>
                <option value="approved">อนุมัติแล้ว</option>
                <option value="paid">ชำระเงินแล้ว</option>
                <option value="overdue">เกินกำหนด</option>
                <option value="cancelled">ยกเลิก</option>
              </select>
            </div>

            {/* Export / Backup options */}
            <button
              onClick={onExportData}
              title="สำรองข้อมูลเป็นไฟล์ JSON"
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>

            <label
              title="นำเข้าไฟล์ข้อมูลสำรอง JSON"
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <input type="file" accept=".json" onChange={onImportData} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Document Items List */}
      {filteredDocs.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[760px]">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <th className="py-3 px-4">เลขที่เอกสาร & วันที่</th>
                  <th className="py-3 px-4">ลูกค้า (Customer)</th>
                  <th className="py-3 px-3 text-center">ประเภท</th>
                  <th className="py-3 px-3 text-center">สถานะ</th>
                  <th className="py-3 px-4 text-right">ยอดรวมทั้งสิ้น</th>
                  <th className="py-3 px-4 text-center w-36">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((doc) => {
                  const typeInfo = getDocumentTypeInfo(doc.type);
                  const statusInfo = getStatusInfo(doc.status);

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => onView(doc)}
                    >
                      {/* Document No & Date */}
                      <td className="py-3.5 px-4" onClick={(e) => { e.stopPropagation(); onView(doc); }}>
                        <div className="font-mono font-bold text-slate-900 text-sm hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                          <span>{doc.documentNumber}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>วันที่: {doc.issueDate}</span>
                          {doc.dueDate && (
                            <span className="text-slate-400">• ครบกำหนด: {doc.dueDate}</span>
                          )}
                        </div>
                        {doc.referenceNumber && (
                          <div className="text-[10px] text-indigo-600 font-mono mt-0.5">
                            อ้างอิง: {doc.referenceNumber}
                          </div>
                        )}
                      </td>

                      {/* Customer Name */}
                      <td className="py-3.5 px-4" onClick={(e) => { e.stopPropagation(); onView(doc); }}>
                        <div className="font-semibold text-slate-900 text-xs">
                          {doc.customer?.name || '-'}
                        </div>
                        {doc.customer?.contactPerson && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            ผู้ติดต่อ: {doc.customer.contactPerson}
                          </div>
                        )}
                        {doc.customer?.taxId && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Tax ID: {doc.customer.taxId}
                          </div>
                        )}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-3 text-center" onClick={(e) => { e.stopPropagation(); onView(doc); }}>
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full font-semibold text-[10px] border ${typeInfo.badgeColor}`}
                        >
                          {typeInfo.titleTh}
                        </span>
                      </td>

                      {/* Status Dropdown */}
                      <td
                        className="py-3.5 px-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={doc.status}
                          onChange={(e) => onUpdateStatus(doc.id, e.target.value as DocumentStatus)}
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none ${statusInfo.color}`}
                        >
                          <option value="draft">ฉบับร่าง</option>
                          <option value="pending">รอดำเนินการ</option>
                          <option value="approved">อนุมัติแล้ว</option>
                          <option value="paid">ชำระเงินแล้ว</option>
                          <option value="overdue">เกินกำหนด</option>
                          <option value="cancelled">ยกเลิก</option>
                        </select>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => { e.stopPropagation(); onView(doc); }}>
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          ฿{formatCurrency(doc.grandTotal)}
                        </div>
                        {doc.withholdingTaxAmount > 0 && (
                          <div className="text-[10px] text-amber-700 font-mono">
                            สุทธิ ฿{formatCurrency(doc.netPayment)}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400">
                          {doc.items.length} รายการ
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onView(doc)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="ดูตัวอย่าง / พิมพ์ A4"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onEdit(doc)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="แก้ไขเอกสาร"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onConvert(doc)}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="แปลงเป็นเอกสารประเภทอื่น"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDelete(doc.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="ลบเอกสาร"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-2xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">ไม่พบเอกสารในหมวดหมู่นี้</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              คุณสามารถเริ่มต้นสร้างเอกสารใหม่ เช่น ใบเสนอราคา ใบวางบิล ใบแจ้งหนี้ หรือใบเสร็จรับเงิน ได้ทันที
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={() => onCreateNew('quotation')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              + สร้างใบเสนอราคา
            </button>
            <button
              onClick={() => onCreateNew('billing')}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              + สร้างใบวางบิล
            </button>
            <button
              onClick={() => onCreateNew('invoice')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              + สร้างใบแจ้งหนี้
            </button>
            <button
              onClick={() => onCreateNew('receipt')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              + สร้างใบเสร็จรับเงิน
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
