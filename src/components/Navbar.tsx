import React, { useState } from 'react';
import { DocumentType, CompanyInfo } from '../types';
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
  Star,
  Check,
  Building,
} from 'lucide-react';

interface NavbarProps {
  onOpenCompanyProfile: () => void;
  onOpenCustomers: () => void;
  onOpenProducts: () => void;
  onCreateNewDoc: (type: DocumentType) => void;
  companies?: CompanyInfo[];
  activeCompany?: CompanyInfo;
  onSwitchActiveCompany?: (companyId: string) => void;
  companyName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCompanyProfile,
  onOpenCustomers,
  onOpenProducts,
  onCreateNewDoc,
  companies = [],
  activeCompany,
  onSwitchActiveCompany,
  companyName,
}) => {
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);

  const currentBranchLabel =
    activeCompany?.profileName ||
    (activeCompany?.branchType === 'headquarters'
      ? 'สำนักงานใหญ่'
      : `สาขา ${activeCompany?.branchNo || '00001'}`);

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
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-[200px] sm:max-w-sm">
                {companyName || 'ระบบออกใบเสนอราคา ใบวางบิล ใบแจ้งหนี้ ใบเสร็จรับเงิน'}
              </p>
            </div>
          </div>

          {/* Nav Controls */}
          <div className="flex items-center gap-2">
            {/* Branch Selector Dropdown */}
            {companies && companies.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-800 rounded-xl text-xs font-semibold transition-colors border border-slate-200/70"
                  title="คลิกเพื่อสลับสาขาที่กำลังใช้งาน"
                >
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="max-w-[130px] sm:max-w-[180px] truncate">
                    {currentBranchLabel}
                  </span>
                  {companies.length > 1 && (
                    <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                      {companies.length}
                    </span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 opacity-80" />
                </button>

                {showBranchDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowBranchDropdown(false)}
                    />
                    <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>สลับสาขาที่ต้องการออกเอกสาร</span>
                        <span className="text-indigo-600">{companies.length} สาขา</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                        {companies.map((comp) => {
                          const isCurrent = comp.id === activeCompany?.id;
                          return (
                            <button
                              key={comp.id}
                              type="button"
                              onClick={() => {
                                if (onSwitchActiveCompany && comp.id) {
                                  onSwitchActiveCompany(comp.id);
                                }
                                setShowBranchDropdown(false);
                              }}
                              className={`w-full px-3.5 py-2.5 text-left hover:bg-indigo-50/60 flex items-start justify-between gap-2 transition-colors ${
                                isCurrent ? 'bg-indigo-50/80' : ''
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 truncate">
                                    {comp.profileName || comp.name}
                                  </span>
                                  {comp.isDefault && (
                                    <Star className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                  {comp.branchType === 'headquarters'
                                    ? 'สำนักงานใหญ่ (00000)'
                                    : `สาขา: ${comp.branchNo || '00001'}`}{' '}
                                  • {comp.name}
                                </div>
                              </div>
                              {isCurrent && (
                                <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <div className="px-2 pt-2 mt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setShowBranchDropdown(false);
                            onOpenCompanyProfile();
                          }}
                          className="w-full py-1.5 px-3 text-center text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ เพิ่ม / จัดการข้อมูลสาขา</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

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
