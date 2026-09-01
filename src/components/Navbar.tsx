import React, { useState } from 'react';
import { DocumentType } from '../types';
import {
  Receipt,
  FileSpreadsheet,
  Users,
  Package,
  Building2,
  Plus,
  ChevronDown,
  Sparkles,
  Layers,
} from 'lucide-react';

interface NavbarProps {
  onOpenCompanyProfile: () => void;
  onOpenCustomers: () => void;
  onOpenProducts: () => void;
  onCreateNewDoc: (type: DocumentType) => void;
  companyName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCompanyProfile,
  onOpenCustomers,
  onOpenProducts,
  onCreateNewDoc,
  companyName,
}) => {
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);

  return (
    <header className="no-print bg-white border-b border-slate-200/80 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-slate-900 text-base tracking-tight leading-none">
                  DocFlow Thailand
                </h1>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                  ระบบเอกสารธุรกิจไทย
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-[240px] sm:max-w-md">
                {companyName || 'ระบบออกใบเสนอราคา ใบวางบิล ใบแจ้งหนี้ ใบเสร็จรับเงิน'}
              </p>
            </div>
          </div>

          {/* Nav Controls */}
          <div className="flex items-center gap-2">
            {/* Quick Menu items */}
            <div className="hidden md:flex items-center gap-1 text-xs">
              <button
                onClick={onOpenCustomers}
                className="px-3 py-2 text-slate-700 hover:text-indigo-600 hover:bg-slate-50 rounded-xl font-medium flex items-center gap-1.5 transition-colors"
              >
                <Users className="w-4 h-4 text-slate-500" />
                <span>สมุดลูกค้า</span>
              </button>

              <button
                onClick={onOpenProducts}
                className="px-3 py-2 text-slate-700 hover:text-indigo-600 hover:bg-slate-50 rounded-xl font-medium flex items-center gap-1.5 transition-colors"
              >
                <Package className="w-4 h-4 text-slate-500" />
                <span>สินค้า & บริการ</span>
              </button>

              <button
                onClick={onOpenCompanyProfile}
                className="px-3 py-2 text-slate-700 hover:text-indigo-600 hover:bg-slate-50 rounded-xl font-medium flex items-center gap-1.5 transition-colors"
              >
                <Building2 className="w-4 h-4 text-slate-500" />
                <span>ข้อมูลกิจการ</span>
              </button>
            </div>

            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

            {/* Create New Document Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>สร้างเอกสารใหม่</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              {showCreateDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowCreateDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      เลือกประเภทเอกสาร
                    </div>
                    <button
                      onClick={() => {
                        onCreateNewDoc('quotation');
                        setShowCreateDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-amber-50 flex items-center justify-between text-slate-800"
                    >
                      <div className="font-semibold">ใบเสนอราคา</div>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-mono px-1.5 py-0.2 rounded font-bold">QT</span>
                    </button>
                    <button
                      onClick={() => {
                        onCreateNewDoc('billing');
                        setShowCreateDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-sky-50 flex items-center justify-between text-slate-800"
                    >
                      <div className="font-semibold">ใบวางบิล / แจ้งหนี้</div>
                      <span className="text-[10px] bg-sky-100 text-sky-800 font-mono px-1.5 py-0.2 rounded font-bold">BN</span>
                    </button>
                    <button
                      onClick={() => {
                        onCreateNewDoc('invoice');
                        setShowCreateDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-indigo-50 flex items-center justify-between text-slate-800"
                    >
                      <div className="font-semibold">ใบแจ้งหนี้</div>
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 font-mono px-1.5 py-0.2 rounded font-bold">IV</span>
                    </button>
                    <button
                      onClick={() => {
                        onCreateNewDoc('receipt');
                        setShowCreateDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-emerald-50 flex items-center justify-between text-slate-800"
                    >
                      <div className="font-semibold">ใบเสร็จ / ใบกำกับภาษี</div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-1.5 py-0.2 rounded font-bold">RC</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
