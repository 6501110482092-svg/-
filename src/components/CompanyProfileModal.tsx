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
} from 'lucide-react';

interface CompanyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyInfo: CompanyInfo;
  onSave: (info: CompanyInfo) => void;
}

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({
  isOpen,
  onClose,
  companyInfo,
  onSave,
}) => {
  const [formData, setFormData] = useState<CompanyInfo>(companyInfo);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [promptPayQrUrl, setPromptPayQrUrl] = useState<string>('');

  const activePromptPay = formData.promptPayId || formData.phone?.replace(/[^0-9]/g, '') || formData.taxId || '';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 600, 600, 0.85);
        setFormData((prev) => ({ ...prev, logoUrl: compressed }));
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
        setFormData((prev) => ({ ...prev, stampUrl: compressed }));
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
        setFormData((prev) => ({ ...prev, signatureUrl: compressed }));
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
        setFormData((prev) => ({ ...prev, qrCodeUrl: compressed }));
      } catch (err) {
        console.error('Error compressing QR:', err);
      }
    }
  };

  const handleAddBankAccount = () => {
    const newAccount: BankAccount = {
      id: `bank-${Date.now()}`,
      bankName: 'ธนาคารกสิกรไทย (KBANK)',
      accountName: formData.name,
      accountNumber: '',
      branch: 'สำนักงานใหญ่',
      isDefault: formData.bankAccounts.length === 0,
    };
    setFormData((prev) => ({
      ...prev,
      bankAccounts: [...prev.bankAccounts, newAccount],
    }));
  };

  const handleUpdateBankAccount = (index: number, field: keyof BankAccount, value: any) => {
    const updated = [...formData.bankAccounts];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, bankAccounts: updated }));
  };

  const handleRemoveBankAccount = (index: number) => {
    const updated = formData.bankAccounts.filter((_, idx) => idx !== index);
    setFormData((prev) => ({ ...prev, bankAccounts: updated }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">ตั้งค่าข้อมูลกิจการ / บริษัทของคุณ</h3>
                <p className="text-xs text-slate-500">ข้อมูลนี้จะถูกนำไปแสดงบนหัวเอกสาร ใบเสนอราคา ใบแจ้งหนี้ และใบเสร็จรับเงิน</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            {/* Section 1: Basic Company Info */}
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                ข้อมูลบริษัท / ผู้ประกอบการ
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    ชื่อบริษัท / ชื่อร้านค้า (ภาษาไทย) *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="เช่น บริษัท สยาม คลาวด์ เทคโนโลยี จำกัด"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Company Name (English)
                  </label>
                  <input
                    type="text"
                    name="nameEn"
                    value={formData.nameEn || ''}
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
                    value={formData.taxId}
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
                      value={formData.branchType}
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
                      disabled={formData.branchType === 'headquarters'}
                      value={formData.branchType === 'headquarters' ? '00000' : formData.branchNo}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100"
                      placeholder="00001"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    ที่อยู่จดทะเบียนตามภาษีมูลค่าเพิ่ม *
                  </label>
                  <textarea
                    name="address"
                    required
                    rows={2}
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="เลขที่ อาคาร ซอย ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="02-xxx-xxxx, 08x-xxx-xxxx"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">อีเมลติดต่อ</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="contact@example.com"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">เว็บไซต์ (ถ้ามี)</label>
                  <input
                    type="text"
                    name="website"
                    value={formData.website || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="www.example.com"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Bank Accounts & PromptPay */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              {/* PromptPay Box */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/60 to-blue-50/40 border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-indigo-600" />
                    บัญชีพร้อมเพย์หลักของกิจการ (Default PromptPay)
                  </h4>
                  {activePromptPay && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800">
                      {getPromptPayLabel(activePromptPay)}
                    </span>
                  )}
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">ปุ่มลัดเลือกข้อมูล:</span>
                  {formData.phone && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, promptPayId: prev.phone.replace(/[^0-9]/g, '') }))}
                      className="text-xs px-2 py-1 rounded bg-white hover:bg-indigo-50 text-slate-700 border border-slate-200 flex items-center gap-1 transition-colors"
                    >
                      <Smartphone className="w-3 h-3 text-indigo-600" />
                      <span>ใช้เบอร์โทร ({formData.phone})</span>
                    </button>
                  )}
                  {formData.taxId && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, promptPayId: prev.taxId }))}
                      className="text-xs px-2 py-1 rounded bg-white hover:bg-indigo-50 text-slate-700 border border-slate-200 flex items-center gap-1 transition-colors"
                    >
                      <Building2 className="w-3 h-3 text-indigo-600" />
                      <span>ใช้เลขผู้เสียภาษี 13 หลัก ({formData.taxId})</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                  <div className="sm:col-span-2 space-y-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        เบอร์พร้อมเพย์ หรือ เลขประจำตัวผู้เสียภาษี (PromptPay ID)
                      </label>
                      <input
                        type="text"
                        name="promptPayId"
                        value={formData.promptPayId || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-xs"
                        placeholder="เช่น 0812345678 หรือ 01055xxxxxxxx"
                      />
                      {activePromptPay && (
                        <div className="mt-1 text-[11px] text-slate-600">
                          รูปแบบ: <span className="font-mono font-bold text-slate-900">{formatPromptPayId(activePromptPay)}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        ชื่อบัญชีผู้รับเงินพร้อมเพย์ (Account Name)
                      </label>
                      <input
                        type="text"
                        name="promptPayName"
                        value={formData.promptPayName || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-xs"
                        placeholder={formData.name || 'ชื่อเจ้าของบัญชี หรือ ชื่อบริษัท'}
                      />
                      <p className="text-[10px] text-slate-400 mt-1">เว้นว่างไว้จะใช้ชื่อบริษัทอัตโนมัติ</p>
                    </div>

                    {/* Custom QR Code Upload in PromptPay Section */}
                    <div className="pt-2 border-t border-indigo-100 flex items-center justify-between gap-3">
                      <div>
                        <span className="font-semibold text-slate-700 text-xs block">หรือ อัปโหลดรูปภาพ QR Code พร้อมเพย์ / ธนาคารจริง</span>
                        <span className="text-[11px] text-slate-500">แคปเจอร์ภาพ QR จากแอปธนาคารของคุณ (เช่น K-Plus, SCB Easy, Krungthai)</span>
                      </div>
                      <label className="cursor-pointer shrink-0 flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold text-xs py-1.5 px-3 rounded-lg bg-white border border-indigo-200 shadow-2xs hover:bg-indigo-50 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{formData.qrCodeUrl ? 'เปลี่ยนรูป QR' : 'อัปโหลดรูป QR'}</span>
                        <input type="file" accept="image/*" onChange={handleQrCodeUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  {/* QR Preview Card */}
                  <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Eye className="w-3 h-3 text-indigo-600" />
                      {formData.qrCodeUrl ? 'รูป QR ที่อัปโหลด' : 'ตัวอย่างสแกน'}
                    </span>
                    {formData.qrCodeUrl ? (
                      <div className="relative group my-0.5">
                        <img
                          src={formData.qrCodeUrl}
                          alt="Uploaded QR Preview"
                          className="w-28 h-28 object-contain rounded border border-slate-200 bg-white p-1"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, qrCodeUrl: undefined }))}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs shadow-xs hover:bg-rose-600 transition-colors"
                          title="ลบรูป QR นี้"
                        >
                          ×
                        </button>
                        <span className="inline-block mt-1 text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          ✓ ใช้รูปที่อัปโหลด
                        </span>
                      </div>
                    ) : promptPayQrUrl ? (
                      <>
                        <div className="w-full bg-[#003B71] text-white py-0.5 px-1.5 rounded text-[8px] font-bold mb-1">
                          THAI QR PAYMENT
                        </div>
                        <img
                          src={promptPayQrUrl}
                          alt="PromptPay QR Preview"
                          className="w-24 h-24 object-contain rounded"
                        />
                        <div className="text-[10px] font-bold font-mono text-slate-800 mt-1">
                          {formatPromptPayId(activePromptPay)}
                        </div>
                      </>
                    ) : (
                      <div className="py-4 text-slate-400 text-[10px]">
                        <QrCode className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                        <span>กรอกเบอร์ หรือ อัปโหลดรูป QR</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bank Accounts List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-indigo-600" />
                    บัญชีธนาคารสำหรับรับโอนเงิน
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddBankAccount}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    เพิ่มบัญชีธนาคาร
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.bankAccounts.map((account, idx) => (
                    <div
                      key={account.id || idx}
                      className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/60 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
                    >
                      <div className="sm:col-span-1">
                        <label className="block text-slate-600 font-medium mb-1">ชื่อธนาคาร</label>
                        <input
                          type="text"
                          value={account.bankName}
                          onChange={(e) => handleUpdateBankAccount(idx, 'bankName', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                          placeholder="เช่น ธ.กสิกรไทย"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <label className="block text-slate-600 font-medium mb-1">ชื่อบัญชี</label>
                        <input
                          type="text"
                          value={account.accountName}
                          onChange={(e) => handleUpdateBankAccount(idx, 'accountName', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                          placeholder="ชื่อบัญชี"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <label className="block text-slate-600 font-medium mb-1">เลขที่บัญชี</label>
                        <input
                          type="text"
                          value={account.accountNumber}
                          onChange={(e) => handleUpdateBankAccount(idx, 'accountNumber', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono bg-white"
                          placeholder="xxx-x-xxxxx-x"
                        />
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveBankAccount(idx)}
                          disabled={formData.bankAccounts.length === 1}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                          title="ลบบัญชีนี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Slip Notice Configuration */}
                <div className="mt-4 p-4 border border-emerald-200 bg-emerald-50/40 rounded-xl">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800 text-xs sm:text-sm">
                          ข้อความแจ้งส่งสลิป / แจ้งโอนเงิน (Payment Slip Notice)
                        </span>
                        <p className="text-[11px] text-slate-500">
                          ข้อความที่จะแสดงอยู่ใต้บัญชีธนาคารในเอกสาร A4 สามารถแก้ไข พิมพ์ใหม่ หรือปิดไม่ให้แสดงได้
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={formData.showPaymentSlipNotice !== false}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            showPaymentSlipNotice: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {formData.showPaymentSlipNotice !== false ? (
                    <div className="mt-3 space-y-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          พิมพ์ข้อความแจ้งส่งสลิป (กำหนดเองได้อิสระ)
                        </label>
                        <input
                          type="text"
                          name="paymentSlipNotice"
                          value={
                            formData.paymentSlipNotice !== undefined
                              ? formData.paymentSlipNotice
                              : `โอนเงินแล้ว กรุณาส่งสลิปหลักฐานการชำระเงินที่ ${formData.email || formData.phone || '-'}`
                          }
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              paymentSlipNotice: e.target.value,
                            }))
                          }
                          placeholder="เช่น โอนเงินแล้ว กรุณาส่งสลิปหลักฐานการชำระเงินที่ Line: @mycompany หรือ 034-270100"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      {/* Quick Presets / Actions */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-slate-500 font-medium mr-1">ข้อความด่วน:</span>
                        {formData.phone && (
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                paymentSlipNotice: `โอนเงินแล้ว กรุณาส่งสลิปหลักฐานการชำระเงินที่ ${formData.phone}`,
                              }))
                            }
                            className="text-[10px] px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-700 transition-colors"
                          >
                            เบอร์โทร ({formData.phone})
                          </button>
                        )}
                        {formData.email && (
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                paymentSlipNotice: `โอนเงินแล้ว กรุณาส่งสลิปหลักฐานการชำระเงินที่ ${formData.email}`,
                              }))
                            }
                            className="text-[10px] px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-700 transition-colors"
                          >
                            อีเมล ({formData.email})
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              paymentSlipNotice: 'โอนเงินแล้ว กรุณาส่งสลิปหลักฐานที่ LINE ID: @',
                            }))
                          }
                          className="text-[10px] px-2 py-0.5 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 rounded font-medium transition-colors"
                        >
                          + ระบุ LINE ID
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              paymentSlipNotice: '',
                            }))
                          }
                          className="text-[10px] px-2 py-0.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 rounded transition-colors ml-auto"
                        >
                          ล้างข้อความ (ไม่ให้แสดง)
                        </button>
                      </div>

                      {/* Preview banner */}
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2 mt-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">ตัวอย่างในเอกสาร:</span>
                        {formData.paymentSlipNotice?.trim() ? (
                          <div className="flex items-center gap-1.5 text-slate-800 font-medium truncate">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{formData.paymentSlipNotice}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">
                            (เว้นว่างไว้ = จะไม่แสดงข้อความนี้ในเอกสาร)
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-slate-500 bg-white/70 p-2 rounded-lg border border-slate-200">
                      ✕ ปิดการแสดงผลข้อความแจ้งส่งสลิปในเอกสาร A4 ทุกใบ
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Logo, Signature, Stamp & QR Code */}
            <div className="pt-4 border-t border-slate-200">
              <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                โลโก้ ลายเซ็น ตรายาง และรูปภาพ QR Code (Logo, Signature, Stamp & QR)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Logo Box */}
                <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-between text-center">
                  <span className="font-semibold text-slate-700 mb-1">โลโก้บริษัท (Logo)</span>
                  {formData.logoUrl ? (
                    <div className="relative my-2">
                      <img
                        src={formData.logoUrl}
                        alt="Logo Preview"
                        className="h-16 w-auto max-w-[130px] object-contain rounded border border-slate-200 bg-white p-1"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, logoUrl: undefined }))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs shadow-xs"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-slate-200 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 my-2">
                      <Building2 className="w-6 h-6" />
                    </div>
                  )}
                  <label className="cursor-pointer flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold text-xs py-1 px-2.5 rounded bg-white border border-slate-200 shadow-2xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{formData.logoUrl ? 'เปลี่ยนโลโก้' : 'อัปโหลดโลโก้'}</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>

                {/* Signature Box */}
                <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-between text-center">
                  <span className="font-semibold text-slate-700 mb-1">ลายเซ็น (Signature)</span>
                  {formData.signatureUrl ? (
                    <div className="relative my-2">
                      <img
                        src={formData.signatureUrl}
                        alt="Signature Preview"
                        className="h-16 w-auto max-w-[130px] object-contain rounded border border-slate-200 bg-white p-1"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, signatureUrl: undefined }))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs shadow-xs hover:bg-rose-600"
                        title="ลบลายเซ็น"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-slate-200 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 my-2">
                      <PenTool className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1 w-full max-w-[150px]">
                    <label className="cursor-pointer flex items-center justify-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold text-xs py-1 px-2 rounded bg-white border border-slate-200 shadow-2xs hover:bg-indigo-50/50 transition-colors">
                      <Upload className="w-3 h-3" />
                      <span>{formData.signatureUrl ? 'เปลี่ยนรูป' : 'อัปโหลดรูป'}</span>
                      <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowSignaturePad(true)}
                      className="flex items-center justify-center gap-1 text-slate-700 hover:text-slate-900 font-medium text-[10px] py-0.5 px-1 rounded hover:bg-slate-100 transition-colors"
                    >
                      <PenTool className="w-3 h-3 text-indigo-600" />
                      <span>วาดลายเซ็น</span>
                    </button>
                  </div>
                </div>

                {/* Stamp Box */}
                <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-between text-center">
                  <span className="font-semibold text-slate-700 mb-1">ตรายางประทับ (Stamp)</span>
                  {formData.stampUrl ? (
                    <div className="relative my-2">
                      <img
                        src={formData.stampUrl}
                        alt="Stamp Preview"
                        className="h-16 w-auto max-w-[130px] object-contain rounded border border-slate-200 bg-white p-1"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, stampUrl: undefined }))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs shadow-xs"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-slate-200 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 my-2">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                  )}
                  <label className="cursor-pointer flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold text-xs py-1 px-2.5 rounded bg-white border border-slate-200 shadow-2xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{formData.stampUrl ? 'เปลี่ยนตรายาง' : 'อัปโหลดตรายาง'}</span>
                    <input type="file" accept="image/*" onChange={handleStampUpload} className="hidden" />
                  </label>
                </div>

                {/* QR Code Box */}
                <div className="p-3 border border-indigo-200 rounded-xl bg-indigo-50/40 flex flex-col items-center justify-between text-center">
                  <span className="font-semibold text-indigo-950 mb-1 flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                    รูปภาพ QR สแกนจ่าย
                  </span>
                  {formData.qrCodeUrl ? (
                    <div className="relative my-2">
                      <img
                        src={formData.qrCodeUrl}
                        alt="QR Preview"
                        className="h-16 w-auto max-w-[130px] object-contain rounded border border-indigo-200 bg-white p-1"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, qrCodeUrl: undefined }))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs shadow-xs"
                        title="ลบรูป QR"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-indigo-100/70 border-2 border-dashed border-indigo-300 flex items-center justify-center text-indigo-400 my-2">
                      <QrCode className="w-6 h-6" />
                    </div>
                  )}
                  <label className="cursor-pointer flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold text-xs py-1 px-2.5 rounded bg-white border border-indigo-200 shadow-2xs hover:bg-indigo-50 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{formData.qrCodeUrl ? 'เปลี่ยนรูป QR' : 'อัปโหลดรูป QR'}</span>
                    <input type="file" accept="image/*" onChange={handleQrCodeUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ชื่อผู้มีอำนาจลงนาม</label>
                  <input
                    type="text"
                    name="signatureName"
                    value={formData.signatureName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="เช่น นายสมชาย รุ่งเรืองทรัพย์"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ตำแหน่ง</label>
                  <input
                    type="text"
                    name="signaturePosition"
                    value={formData.signaturePosition}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="เช่น กรรมการผู้จัดการ"
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
                <span>บันทึกข้อมูลกิจการ</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <SignaturePadModal
        isOpen={showSignaturePad}
        onClose={() => setShowSignaturePad(false)}
        onSave={(dataUrl) => setFormData((prev) => ({ ...prev, signatureUrl: dataUrl }))}
      />
    </>
  );
};
