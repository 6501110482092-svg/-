import React, { useState, useEffect } from 'react';
import { CompanyInfo, BankAccount } from '../types';
import { SignaturePadModal } from './SignaturePadModal';
import { compressImageFile } from '../utils/storage';
import {
  generateQRCodeDataUrl,
  formatPromptPayId,
  getPromptPayLabel,
} from '../utils/promptpay';
import {
  X,
  Building2,
  Plus,
  Trash2,
  Upload,
  PenTool,
  Check,
  Landmark,
  QrCode,
  Smartphone,
  CheckCircle,
  CheckCircle2,
  Eye,
  Star,
  Copy,
  Layers,
  MapPin,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface CompanyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: CompanyInfo[];
  activeCompanyId?: string;
  onSaveCompanies: (updatedCompanies: CompanyInfo[], newActiveCompanyId?: string) => void;
}

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({
  isOpen,
  onClose,
  companies,
  activeCompanyId,
  onSaveCompanies,
}) => {
  // Ensure we have at least one company
  const [profileList, setProfileList] = useState<CompanyInfo[]>(() => {
    if (companies && companies.length > 0) return companies;
    return [
      {
        id: 'company-hq',
        profileName: 'สำนักงานใหญ่',
        isDefault: true,
        name: '',
        taxId: '',
        branchType: 'headquarters',
        branchNo: '00000',
        address: '',
        phone: '',
        email: '',
        signatureName: '',
        signaturePosition: 'กรรมการผู้จัดการ',
        bankAccounts: [],
      },
    ];
  });

  const [selectedId, setSelectedId] = useState<string>(() => {
    if (activeCompanyId && companies.some((c) => c.id === activeCompanyId)) {
      return activeCompanyId;
    }
    return companies[0]?.id || 'company-hq';
  });

  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [promptPayQrUrl, setPromptPayQrUrl] = useState<string>('');

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (companies && companies.length > 0) {
        setProfileList(companies);
        if (activeCompanyId && companies.some((c) => c.id === activeCompanyId)) {
          setSelectedId(activeCompanyId);
        } else {
          const defaultComp = companies.find((c) => c.isDefault) || companies[0];
          setSelectedId(defaultComp.id || companies[0].id || 'company-hq');
        }
      }
    }
  }, [isOpen, companies, activeCompanyId]);

  // Find currently selected profile
  const currentProfile = profileList.find((p) => p.id === selectedId) || profileList[0];

  const activePromptPay =
    currentProfile?.promptPayId ||
    currentProfile?.phone?.replace(/[^0-9]/g, '') ||
    currentProfile?.taxId ||
    '';

  useEffect(() => {
    let isMounted = true;
    if (activePromptPay) {
      generateQRCodeDataUrl(activePromptPay, 100).then((url) => {
        if (isMounted) {
          setPromptPayQrUrl(url);
        }
      });
    } else {
      setPromptPayQrUrl('');
    }
    return () => {
      isMounted = false;
    };
  }, [activePromptPay]);

  if (!isOpen) return null;

  const handleUpdateCurrentProfile = (updates: Partial<CompanyInfo>) => {
    setProfileList((prev) =>
      prev.map((p) => (p.id === currentProfile.id ? { ...p, ...updates } : p))
    );
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    handleUpdateCurrentProfile({ [name]: value });
  };

  const handleAddNewBranch = () => {
    const newBranchNo = String(profileList.length).padStart(5, '0');
    const newId = `branch-${Date.now()}`;
    const newProfile: CompanyInfo = {
      id: newId,
      profileName: `สาขา ${profileList.length} (${newBranchNo})`,
      isDefault: false,
      name: currentProfile.name ? `${currentProfile.name} (สาขา ${profileList.length})` : '',
      nameEn: currentProfile.nameEn ? `${currentProfile.nameEn} (Branch ${profileList.length})` : '',
      taxId: currentProfile.taxId || '',
      branchType: 'branch',
      branchNo: newBranchNo,
      address: '',
      phone: currentProfile.phone || '',
      email: currentProfile.email || '',
      website: currentProfile.website || '',
      logoUrl: currentProfile.logoUrl || '',
      stampUrl: currentProfile.stampUrl || '',
      signatureUrl: currentProfile.signatureUrl || '',
      signatureName: currentProfile.signatureName || '',
      signaturePosition: currentProfile.signaturePosition || 'ผู้จัดการสาขา',
      promptPayId: currentProfile.promptPayId || '',
      promptPayName: currentProfile.promptPayName || '',
      promptPayType: currentProfile.promptPayType,
      showPaymentSlipNotice: currentProfile.showPaymentSlipNotice,
      paymentSlipNotice: currentProfile.paymentSlipNotice,
      bankAccounts: currentProfile.bankAccounts ? [...currentProfile.bankAccounts] : [],
    };

    setProfileList((prev) => [...prev, newProfile]);
    setSelectedId(newId);
  };

  const handleDuplicateBranch = (profile: CompanyInfo) => {
    const newId = `branch-${Date.now()}`;
    const duplicated: CompanyInfo = {
      ...profile,
      id: newId,
      profileName: `${profile.profileName || profile.name} (สำเนา)`,
      isDefault: false,
      branchType: 'branch',
      branchNo: String(profileList.length).padStart(5, '0'),
    };
    setProfileList((prev) => [...prev, duplicated]);
    setSelectedId(newId);
  };

  const handleDeleteBranch = (idToDelete: string) => {
    if (profileList.length <= 1) {
      alert('ต้องมีข้อมูลกิจการ/สาขาอย่างน้อย 1 สาขา');
      return;
    }
    const updated = profileList.filter((p) => p.id !== idToDelete);
    setProfileList(updated);
    if (selectedId === idToDelete) {
      setSelectedId(updated[0].id || 'company-hq');
    }
  };

  const handleSetDefaultBranch = (idToDefault: string) => {
    setProfileList((prev) =>
      prev.map((p) => ({
        ...p,
        isDefault: p.id === idToDefault,
      }))
    );
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 600, 600, 0.85);
        handleUpdateCurrentProfile({ logoUrl: compressed });
      } catch (err) {
        console.error('Error compressing logo:', err);
      }
    }
  };

  const handleStampUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 500, 500, 0.85);
        handleUpdateCurrentProfile({ stampUrl: compressed });
      } catch (err) {
        console.error('Error compressing stamp:', err);
      }
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 600, 300, 0.85);
        handleUpdateCurrentProfile({ signatureUrl: compressed });
      } catch (err) {
        console.error('Error compressing signature:', err);
      }
    }
  };

  const handleQrCodeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 500, 500, 0.85);
        handleUpdateCurrentProfile({ qrCodeUrl: compressed });
      } catch (err) {
        console.error('Error compressing QR:', err);
      }
    }
  };

  const handleAddBankAccount = () => {
    const newAccount: BankAccount = {
      id: `bank-${Date.now()}`,
      bankName: 'ธนาคารกสิกรไทย (KBANK)',
      accountName: currentProfile.name || '',
      accountNumber: '',
      branch: currentProfile.profileName || 'สำนักงานใหญ่',
      isDefault: (currentProfile.bankAccounts || []).length === 0,
    };
    handleUpdateCurrentProfile({
      bankAccounts: [...(currentProfile.bankAccounts || []), newAccount],
    });
  };

  const handleUpdateBankAccount = (index: number, field: keyof BankAccount, value: any) => {
    const updated = [...(currentProfile.bankAccounts || [])];
    updated[index] = { ...updated[index], [field]: value };
    handleUpdateCurrentProfile({ bankAccounts: updated });
  };

  const handleRemoveBankAccount = (index: number) => {
    const updated = (currentProfile.bankAccounts || []).filter((_, idx) => idx !== index);
    handleUpdateCurrentProfile({ bankAccounts: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCompanies(profileList, selectedId);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 text-base">
                    จัดการข้อมูลกิจการ & หลายสาขา (Company & Branch Profiles)
                  </h3>
                  <span className="bg-indigo-100 text-indigo-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {profileList.length} สาขา
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  เพิ่มและจัดการสาขาได้ไม่จำกัด เมื่อเปิดสร้างเอกสารสามารถเลือกสาขาที่ต้องการออกเอกสารได้ทันที
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Content Layout: Sidebar with branch list + Right edit form */}
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Left: Branch List Sidebar */}
            <div className="w-full md:w-72 bg-slate-50/80 border-r border-slate-200 p-4 flex flex-col justify-between shrink-0 overflow-y-auto max-h-[30vh] md:max-h-full">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    รายชื่อสาขา / กิจการ
                  </span>
                  <button
                    type="button"
                    onClick={handleAddNewBranch}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs hover:bg-indigo-50 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มสาขา</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {profileList.map((branch) => {
                    const isSelected = branch.id === currentProfile?.id;
                    return (
                      <div
                        key={branch.id}
                        onClick={() => setSelectedId(branch.id || '')}
                        className={`group relative p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-white border-indigo-600 shadow-xs ring-2 ring-indigo-500/20'
                            : 'bg-white/70 border-slate-200 hover:border-slate-300 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  branch.branchType === 'headquarters'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {branch.branchType === 'headquarters'
                                  ? 'สำนักงานใหญ่'
                                  : `สาขา ${branch.branchNo || '00001'}`}
                              </span>
                              {branch.isDefault && (
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                  <span>หลัก</span>
                                </span>
                              )}
                            </div>
                            <div className="font-bold text-slate-900 text-xs mt-1.5 truncate">
                              {branch.profileName || branch.name || 'ยังไม่ระบุชื่อ'}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                              Tax: {branch.taxId || '-'}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateBranch(branch);
                              }}
                              title="คัดลอกข้อมูลสาขานี้"
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {profileList.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteBranch(branch.id || '');
                                }}
                                title="ลบสาขานี้"
                                className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 space-y-1 hidden md:block">
                <div className="flex items-center gap-1 font-semibold text-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>บันทึกแยกลิสต์อิสระ</span>
                </div>
                <p>แต่ละสาขาสามารถมีที่อยู่ เลขสาขา บัญชีธนาคาร และลายเซ็นต่างกันได้</p>
              </div>
            </div>

            {/* Right: Branch Details Form */}
            <form onSubmit={handleSubmit} className="flex-1 p-6 overflow-y-auto space-y-6 text-xs">
              {/* Profile Top Controls */}
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-indigo-950 font-bold mb-1">
                    ชื่อเรียกสาขานี้ (Profile Alias / Tag) *
                  </label>
                  <input
                    type="text"
                    name="profileName"
                    required
                    value={currentProfile.profileName || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="เช่น สำนักงานใหญ่ (กรุงเทพฯ), สาขาพัทยา, สาขาภูเก็ต"
                  />
                </div>

                <div className="flex items-center gap-2 pt-4 sm:pt-0">
                  {currentProfile.isDefault ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-100 text-amber-900 rounded-lg font-bold text-xs border border-amber-300">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-600" />
                      <span>สาขาหลักเริ่มต้น</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetDefaultBranch(currentProfile.id || '')}
                      className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Star className="w-4 h-4 text-slate-400" />
                      <span>ตั้งเป็นสาขาหลัก</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Section 1: Basic Company Info */}
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  ข้อมูลบริษัท / นิติบุคคล
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-700 font-semibold">
                        ชื่อบริษัท / ชื่อร้านค้า (ภาษาไทย) *
                      </label>
                      <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-md border ${
                        (currentProfile.name || '').length > 45
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {(currentProfile.name || '').length}/45 ตัวอักษร
                      </span>
                    </div>
                    <input
                      type="text"
                      name="name"
                      required
                      value={currentProfile.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="เช่น บริษัท สยาม คลาวด์ เทคโนโลยี จำกัด"
                    />
                    {(currentProfile.name || '').length > 45 && !currentProfile.headerNameLine1 && (
                      <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
                        <span>💡 ชื่อค่อนข้างยาว (เกิน 45 ตัวอักษร) แนะนำให้ใช้กล่อง <strong>"จัดหน้า/ล็อกบรรทัดชื่อบนหัวเอกสาร"</strong> ด้านล่างเพื่อแบ่งบรรทัดไม่ให้ตกหล่น</span>
                      </p>
                    )}
                  </div>

                  {/* Fix Line Breaks on Document Header (จัดบรรทัดชื่อที่หัวกระดาษ) */}
                  <div className="sm:col-span-2 p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                          <span>จัดหน้า/ล็อกบรรทัดชื่อบนหัวเอกสาร (Fix Line Breaks on Header)</span>
                        </div>
                        <p className="text-[11px] text-indigo-700 mt-0.5">
                          กำหนดคำในบรรทัดที่ 1 และ 2 ป้องกันคำยาวแล้วตัดตกบรรทัดกลางคำบนหัวเอกสาร (รองรับได้ถึง 45 ตัวอักษร/บรรทัดบนกระดาษจริง)
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (!currentProfile.name) return;
                            handleUpdateCurrentProfile({
                              headerNameLine1: currentProfile.name,
                              headerNameLine2: '',
                              headerNameLine3: '',
                            });
                          }}
                          className="text-[10px] bg-white hover:bg-indigo-100 text-indigo-700 font-semibold px-2 py-1 rounded border border-indigo-200 transition-colors shadow-2xs"
                        >
                          ⚡ ดึงจากชื่อหลัก
                        </button>
                        {(currentProfile.headerNameLine1 || currentProfile.headerNameLine2 || currentProfile.headerNameLine3) && (
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateCurrentProfile({
                                headerNameLine1: '',
                                headerNameLine2: '',
                                headerNameLine3: '',
                              });
                            }}
                            className="text-[10px] bg-white hover:bg-rose-50 text-rose-600 font-medium px-2 py-1 rounded border border-rose-200 transition-colors"
                          >
                            ล้างการจัดบรรทัด
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Line 1 */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-semibold text-slate-700">
                            บรรทัดที่ 1 (Header Line 1)
                          </label>
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border transition-colors ${
                              (currentProfile.headerNameLine1 || '').length === 0
                                ? 'bg-slate-100 text-slate-400 border-slate-200'
                                : (currentProfile.headerNameLine1 || '').length <= 45
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : (currentProfile.headerNameLine1 || '').length <= 52
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                            title="ความยาวตัวอักษรที่แนะนำสำหรับ 1 บรรทัดบนกระดาษ (สูงสุด 45 ตัวอักษร)"
                          >
                            {(currentProfile.headerNameLine1 || '').length}/45
                            {(currentProfile.headerNameLine1 || '').length > 45 && ' (เกิน 45 ตัว)'}
                          </span>
                        </div>
                        <input
                          type="text"
                          name="headerNameLine1"
                          value={currentProfile.headerNameLine1 || ''}
                          onChange={handleChange}
                          placeholder={currentProfile.name || 'เช่น บีเค แล็บเฮลท์ สหคลินิก-หจก.บีเค แลบ เฮลท์'}
                          className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-xs font-medium ${
                            (currentProfile.headerNameLine1 || '').length > 45
                              ? 'border-amber-400 text-amber-950 bg-amber-50/20'
                              : 'border-indigo-300 text-slate-800'
                          }`}
                        />
                      </div>

                      {/* Line 2 */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-semibold text-slate-700">
                            บรรทัดที่ 2 (Header Line 2 - ถ้ามี)
                          </label>
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border transition-colors ${
                              (currentProfile.headerNameLine2 || '').length === 0
                                ? 'bg-slate-100 text-slate-400 border-slate-200'
                                : (currentProfile.headerNameLine2 || '').length <= 45
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : (currentProfile.headerNameLine2 || '').length <= 52
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                            title="ความยาวตัวอักษรที่แนะนำสำหรับ 1 บรรทัดบนกระดาษ (สูงสุด 45 ตัวอักษร)"
                          >
                            {(currentProfile.headerNameLine2 || '').length}/45
                            {(currentProfile.headerNameLine2 || '').length > 45 && ' (เกิน 45 ตัว)'}
                          </span>
                        </div>
                        <input
                          type="text"
                          name="headerNameLine2"
                          value={currentProfile.headerNameLine2 || ''}
                          onChange={handleChange}
                          placeholder="เช่น เซ็นเตอร์ คลินิกเทคนิคการแพทย์และกายภาพบำบัด"
                          className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-xs font-medium ${
                            (currentProfile.headerNameLine2 || '').length > 45
                              ? 'border-amber-400 text-amber-950 bg-amber-50/20'
                              : 'border-indigo-300 text-slate-800'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Live Header Name Preview */}
                    <div className="bg-white p-3 rounded-lg border border-indigo-100 flex items-start gap-2.5 text-xs">
                      <span className="text-[10px] text-slate-400 font-medium shrink-0 pt-0.5">พรีวิวหัวกระดาษ:</span>
                      <div className="flex-1 font-bold text-slate-900 leading-tight">
                        {currentProfile.headerNameLine1 ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-900">{currentProfile.headerNameLine1}</span>
                              <span className="text-[9px] text-slate-400 font-normal">({(currentProfile.headerNameLine1 || '').length} ตัวอักษร)</span>
                            </div>
                            {currentProfile.headerNameLine2 && (
                              <div className="flex items-center gap-2">
                                <span className="text-slate-900">{currentProfile.headerNameLine2}</span>
                                <span className="text-[9px] text-slate-400 font-normal">({(currentProfile.headerNameLine2 || '').length} ตัวอักษร)</span>
                              </div>
                            )}
                            {currentProfile.headerNameLine3 && (
                              <div className="flex items-center gap-2">
                                <span className="text-slate-900">{currentProfile.headerNameLine3}</span>
                                <span className="text-[9px] text-slate-400 font-normal">({(currentProfile.headerNameLine3 || '').length} ตัวอักษร)</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-700">{currentProfile.name || 'ชื่อสถานประกอบการ'}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">
                      Company Name (English)
                    </label>
                    <input
                      type="text"
                      name="nameEn"
                      value={currentProfile.nameEn || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="e.g. Siam Cloud Technology Co., Ltd."
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      เลขประจำตัวผู้เสียภาษี (13 หลัก) *
                    </label>
                    <input
                      type="text"
                      name="taxId"
                      required
                      maxLength={13}
                      value={currentProfile.taxId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="01055xxxxxxxx"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        ประเภทสาขา
                      </label>
                      <select
                        name="branchType"
                        value={currentProfile.branchType}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="headquarters">สำนักงานใหญ่</option>
                        <option value="branch">สาขา</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        รหัสสาขา (5 หลัก)
                      </label>
                      <input
                        type="text"
                        name="branchNo"
                        disabled={currentProfile.branchType === 'headquarters'}
                        value={
                          currentProfile.branchType === 'headquarters'
                            ? '00000'
                            : currentProfile.branchNo
                        }
                        onChange={handleChange}
                        maxLength={5}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100"
                        placeholder="00001"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">
                      ที่อยู่สาขานี้ (ภาษาไทย) *
                    </label>
                    <textarea
                      rows={2}
                      name="address"
                      required
                      value={currentProfile.address}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="เลขที่ อาคาร ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">
                      Address (English)
                    </label>
                    <textarea
                      rows={2}
                      name="addressEn"
                      value={currentProfile.addressEn || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Street address, City, Province, Postal Code"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      เบอร์โทรศัพท์ติดต่อ *
                    </label>
                    <input
                      type="text"
                      name="phone"
                      required
                      value={currentProfile.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="02-xxx-xxxx, 08x-xxx-xxxx"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">อีเมลติดต่อ *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={currentProfile.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="contact@company.co.th"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">เว็บไซต์</label>
                    <input
                      type="text"
                      name="website"
                      value={currentProfile.website || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="www.company.co.th"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Logo & Company Stamp */}
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  โลโก้บริษัท & ตรายางประทับ (Logo & Official Stamp)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Logo Upload */}
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                    <label className="block font-semibold text-slate-700">โลโก้บริษัท (Logo)</label>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-20 bg-white border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                        {currentProfile.logoUrl ? (
                          <img
                            src={currentProfile.logoUrl}
                            alt="Logo"
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Building2 className="w-8 h-8 text-slate-300" />
                        )}
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer shadow-2xs">
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                          <span>อัปโหลดรูปโลโก้</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                        {currentProfile.logoUrl && (
                          <button
                            type="button"
                            onClick={() => handleUpdateCurrentProfile({ logoUrl: undefined })}
                            className="block text-[11px] text-rose-600 hover:underline"
                          >
                            ลบรูปโลโก้
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stamp Upload */}
                  <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                    <label className="block font-semibold text-slate-700">
                      ตรายางประทับบริษัท (Stamp)
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-20 bg-white border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                        {currentProfile.stampUrl ? (
                          <img
                            src={currentProfile.stampUrl}
                            alt="Stamp"
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300 text-[10px]">
                            ตรายาง
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer shadow-2xs">
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                          <span>อัปโหลดตรายาง</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleStampUpload}
                            className="hidden"
                          />
                        </label>
                        {currentProfile.stampUrl && (
                          <button
                            type="button"
                            onClick={() => handleUpdateCurrentProfile({ stampUrl: undefined })}
                            className="block text-[11px] text-rose-600 hover:underline"
                          >
                            ลบตรายาง
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Bank Accounts */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    ข้อมูลบัญชีธนาคารสำหรับรับชำระเงิน
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddBankAccount}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มบัญชี</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(currentProfile.bankAccounts || []).length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-slate-400">
                      ยังไม่มีบัญชีธนาคาร กด "เพิ่มบัญชี" เพื่อระบุช่องทางรับเงินของสาขานี้
                    </div>
                  ) : (
                    currentProfile.bankAccounts.map((acc, index) => (
                      <div
                        key={acc.id || index}
                        className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2 relative"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <div className="sm:col-span-2">
                            <label className="block text-slate-600 text-[11px] font-semibold mb-1">
                              ธนาคาร
                            </label>
                            <input
                              type="text"
                              value={acc.bankName}
                              onChange={(e) =>
                                handleUpdateBankAccount(index, 'bankName', e.target.value)
                              }
                              placeholder="เช่น ธนาคารกสิกรไทย (KBANK)"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 text-[11px] font-semibold mb-1">
                              เลขที่บัญชี
                            </label>
                            <input
                              type="text"
                              value={acc.accountNumber}
                              onChange={(e) =>
                                handleUpdateBankAccount(index, 'accountNumber', e.target.value)
                              }
                              placeholder="123-4-56789-0"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 text-[11px] font-semibold mb-1">
                              ชื่อบัญชี
                            </label>
                            <input
                              type="text"
                              value={acc.accountName}
                              onChange={(e) =>
                                handleUpdateBankAccount(index, 'accountName', e.target.value)
                              }
                              placeholder="ชื่อบัญชี"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-medium"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                            <input
                              type="radio"
                              name="defaultBankAccount"
                              checked={acc.isDefault}
                              onChange={() => {
                                const updated = currentProfile.bankAccounts.map((b, i) => ({
                                  ...b,
                                  isDefault: i === index,
                                }));
                                handleUpdateCurrentProfile({ bankAccounts: updated });
                              }}
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-[11px] font-medium">ใช้เป็นบัญชีหลัก</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleRemoveBankAccount(index)}
                            className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ลบบัญชี</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Section 4: PromptPay QR Code */}
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  ระบบพร้อมเพย์ (PromptPay QR) ของสาขานี้
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        หมายเลขพร้อมเพย์ (PromptPay ID)
                      </label>
                      <input
                        type="text"
                        name="promptPayId"
                        value={currentProfile.promptPayId || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="เบอร์โทรศัพท์ 10 หลัก หรือ เลขประจำตัวผู้เสียภาษี 13 หลัก"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        ชื่อบัญชีพร้อมเพย์ (Account Name)
                      </label>
                      <input
                        type="text"
                        name="promptPayName"
                        value={currentProfile.promptPayName || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="เช่น บจก. สยาม คลาวด์ เทคโนโลยี (สาขาเชียงใหม่)"
                      />
                    </div>

                    {/* Custom QR Upload */}
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        หรืออัปโหลดรูป QR Code พร้อมเพย์/ธนาคารของสาขา
                      </label>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer shadow-2xs">
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>อัปโหลดรูป QR</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleQrCodeUpload}
                          className="hidden"
                        />
                      </label>
                      {currentProfile.qrCodeUrl && (
                        <button
                          type="button"
                          onClick={() => handleUpdateCurrentProfile({ qrCodeUrl: undefined })}
                          className="ml-2 text-[11px] text-rose-600 hover:underline"
                        >
                          ลบรูป QR
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl text-center">
                    <div className="w-28 h-28 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden mb-2">
                      {currentProfile.qrCodeUrl ? (
                        <img
                          src={currentProfile.qrCodeUrl}
                          alt="Custom QR"
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : promptPayQrUrl ? (
                        <img
                          src={promptPayQrUrl}
                          alt="PromptPay QR Preview"
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <QrCode className="w-12 h-12 text-slate-300" />
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-slate-700">
                      {currentProfile.promptPayName || currentProfile.name || 'ตัวอย่าง QR พร้อมเพย์'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatPromptPayId(activePromptPay) || 'ยังไม่ระบุเลขพร้อมเพย์'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 5: Authorized Signer & Stamp */}
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  ผู้มีอำนาจลงนาม & ลายมือชื่อ (Authorized Signature)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      ชื่อผู้มีอำนาจลงนามประจำสาขา
                    </label>
                    <input
                      type="text"
                      name="signatureName"
                      value={currentProfile.signatureName || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="เช่น นางสาวพิมพ์ชนก รัตนโกสินทร์"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">ตำแหน่ง</label>
                    <input
                      type="text"
                      name="signaturePosition"
                      value={currentProfile.signaturePosition || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="เช่น ผู้จัดการสาขา / กรรมการผู้จัดการ"
                    />
                  </div>

                  <div className="sm:col-span-2 p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                    <label className="block font-semibold text-slate-700">
                      รูปลายมือชื่อดิจิทัล (Digital Signature)
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-36 h-20 bg-white border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                        {currentProfile.signatureUrl ? (
                          <img
                            src={currentProfile.signatureUrl}
                            alt="Signature"
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <PenTool className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowSignaturePad(true)}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            <span>เซ็นสดบนหน้าจอ</span>
                          </button>
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer shadow-2xs">
                            <Upload className="w-3.5 h-3.5 text-slate-500" />
                            <span>อัปโหลดรูปลายเซ็น</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleSignatureUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                        {currentProfile.signatureUrl && (
                          <button
                            type="button"
                            onClick={() => handleUpdateCurrentProfile({ signatureUrl: undefined })}
                            className="block text-[11px] text-rose-600 hover:underline"
                          >
                            ลบลายเซ็น
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 6: Default Remarks & Terms */}
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  ข้อความหมายเหตุ & เงื่อนไขเริ่มต้นของสาขานี้ (Default Remarks & Terms)
                </h4>
                <div className="space-y-4 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                  <p className="text-xs text-slate-500">
                    ข้อความที่ตั้งไว้ที่นี่จะถูกดึงไปใส่ในเอกสารใหม่โดยอัตโนมัติเมื่อเลือกสาขานี้ (แต่ยังคงสามารถแก้ไขเพิ่มเติมในแต่ละใบได้ตามปกติ)
                  </p>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-xs">
                      หมายเหตุท้ายเอกสารเริ่มต้น (Default Remarks)
                    </label>
                    <textarea
                      rows={2}
                      name="defaultRemarks"
                      value={currentProfile.defaultRemarks || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-xs"
                      placeholder="เช่น กรุณาตรวจสอบความถูกต้องของเอกสาร หากมีข้อแก้ไขกรุณาแจ้งให้ทราบภายใน 7 วันทำการ"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-xs">
                      เงื่อนไขและข้อตกลงเริ่มต้น (Default Terms & Conditions)
                    </label>
                    <textarea
                      rows={3}
                      name="defaultTerms"
                      value={currentProfile.defaultTerms || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-xs"
                      placeholder="เช่น 1. การชำระเงินโอนเข้าบัญชีธนาคารตามที่ระบุในเอกสาร&#10;2. กรณีหักภาษี ณ ที่จ่าย กรุณานำส่งหนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ)"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-xs">
                      เงื่อนไขการชำระเงินเริ่มต้น (Default Payment Terms - ไม่บังคับ)
                    </label>
                    <input
                      type="text"
                      name="defaultPaymentTerms"
                      value={currentProfile.defaultPaymentTerms || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-xs"
                      placeholder="เช่น เครดิต 30 วัน, ชำระทันที, มัดจำ 50% (หรือเว้นว่างไว้หากต้องการเลือก/พิมพ์เองทุกครั้ง)"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>บันทึกข้อมูลทุกสาขา ({profileList.length} สาขา)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <SignaturePadModal
        isOpen={showSignaturePad}
        onClose={() => setShowSignaturePad(false)}
        onSave={(dataUrl) => handleUpdateCurrentProfile({ signatureUrl: dataUrl })}
      />
    </>
  );
};
