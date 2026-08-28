import React, { useState } from 'react';
import { CustomerInfo } from '../types';
import { X, Users, Plus, Trash2, Edit2, Search, Check, Building, Phone, Mail } from 'lucide-react';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: CustomerInfo[];
  onSaveCustomer: (customer: CustomerInfo) => void;
  onDeleteCustomer: (id: string) => void;
  onSelectCustomer?: (customer: CustomerInfo) => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  customers,
  onSaveCustomer,
  onDeleteCustomer,
  onSelectCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<CustomerInfo | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  if (!isOpen) return null;

  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.taxId.includes(term) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(term))
    );
  });

  const emptyCustomer: CustomerInfo = {
    id: `cust-${Date.now()}`,
    name: '',
    nameEn: '',
    contactPerson: '',
    taxId: '',
    branchType: 'headquarters',
    branchNo: '00000',
    address: '',
    phone: '',
    email: '',
  };

  const handleStartAdd = () => {
    setEditingCustomer(emptyCustomer);
    setIsAddingNew(true);
  };

  const handleStartEdit = (customer: CustomerInfo) => {
    setEditingCustomer({ ...customer });
    setIsAddingNew(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    onSaveCustomer(editingCustomer);
    setEditingCustomer(null);
    setIsAddingNew(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">สมุดรายชื่อลูกค้า (Customer Directory)</h3>
              <p className="text-xs text-slate-500">จัดการข้อมูลลูกค้า เลขประจำตัวผู้เสียภาษี และที่อยู่ เพื่อความสะดวกในการออกเอกสาร</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {editingCustomer ? (
            /* Edit / Add Form */
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h4 className="font-bold text-slate-800 text-sm">
                  {isAddingNew ? 'เพิ่มข้อมูลลูกค้าใหม่' : 'แก้ไขข้อมูลลูกค้า'}
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  กลับไปหน้ารายการ
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    ชื่อบริษัท / นิติบุคคล / บุคคลธรรมดา (ลูกค้า) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCustomer.name}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="เช่น บริษัท เอบีซี โซลูชั่น จำกัด"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Customer Name (English)
                  </label>
                  <input
                    type="text"
                    value={editingCustomer.nameEn || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, nameEn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. ABC Solution Co., Ltd."
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ชื่อผู้ติดต่อ / แผนก
                  </label>
                  <input
                    type="text"
                    value={editingCustomer.contactPerson || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="เช่น คุณสมหญิง (จัดซื้อ)"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    เลขประจำตัวผู้เสียภาษี (13 หลัก)
                  </label>
                  <input
                    type="text"
                    maxLength={13}
                    value={editingCustomer.taxId}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, taxId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="01055xxxxxxxx"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">ประเภทสาขา</label>
                    <select
                      value={editingCustomer.branchType}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, branchType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="headquarters">สำนักงานใหญ่</option>
                      <option value="branch">สาขา</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">รหัสสาขา (5 หลัก)</label>
                    <input
                      type="text"
                      disabled={editingCustomer.branchType === 'headquarters'}
                      value={editingCustomer.branchType === 'headquarters' ? '00000' : editingCustomer.branchNo}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, branchNo: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
                      placeholder="00001"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={editingCustomer.phone}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="02-xxx-xxxx"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    ที่อยู่สำหรับออกใบกำกับภาษี *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={editingCustomer.address}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="ที่อยู่ตาม ภ.พ.20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">อีเมล</label>
                  <input
                    type="email"
                    value={editingCustomer.email}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="billing@customer.com"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  บันทึกข้อมูลลูกค้า
                </button>
              </div>
            </form>
          ) : (
            /* Customer List View */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ค้นหาตามชื่อลูกค้า, เลขผู้เสียภาษี, เบอร์โทร..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleStartAdd}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  เพิ่มลูกค้าใหม่
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredCustomers.map((cust) => (
                  <div
                    key={cust.id || cust.name}
                    className="p-4 border border-slate-200 rounded-xl bg-slate-50/60 hover:bg-white hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-slate-900 text-sm">
                          {cust.name}
                        </div>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono shrink-0">
                          {cust.branchType === 'headquarters' ? 'สำนักงานใหญ่' : `สาขา ${cust.branchNo}`}
                        </span>
                      </div>

                      {cust.contactPerson && (
                        <div className="text-slate-600 mt-0.5">
                          ผู้ติดต่อ: <span className="font-medium text-slate-800">{cust.contactPerson}</span>
                        </div>
                      )}

                      <div className="text-slate-500 mt-1 line-clamp-2">
                        {cust.address}
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-200 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
                        {cust.taxId && <span>Tax ID: <b className="font-mono">{cust.taxId}</b></span>}
                        {cust.phone && <span>โทร: {cust.phone}</span>}
                        {cust.email && <span>อีเมล: {cust.email}</span>}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
                      {onSelectCustomer ? (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectCustomer(cust);
                            onClose();
                          }}
                          className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-semibold text-xs"
                        >
                          เลือกรายนี้
                        </button>
                      ) : <div />}

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cust)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => cust.id && onDeleteCustomer(cust.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="ลบ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredCustomers.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>ไม่พบข้อมูลลูกค้า</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
