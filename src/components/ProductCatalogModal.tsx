import React, { useState } from 'react';
import { ProductCatalogItem } from '../types';
import { formatCurrency } from '../utils/thaiBaht';
import { X, Package, Plus, Trash2, Edit2, Search, Check } from 'lucide-react';

interface ProductCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductCatalogItem[];
  onSaveProduct: (product: ProductCatalogItem) => void;
  onDeleteProduct: (id: string) => void;
  onSelectProduct?: (product: ProductCatalogItem) => void;
}

export const ProductCatalogModal: React.FC<ProductCatalogModalProps> = ({
  isOpen,
  onClose,
  products,
  onSaveProduct,
  onDeleteProduct,
  onSelectProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<ProductCatalogItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  if (!isOpen) return null;

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.code.toLowerCase().includes(term) ||
      (p.description && p.description.toLowerCase().includes(term))
    );
  });

  const emptyProduct: ProductCatalogItem = {
    id: `prod-${Date.now()}`,
    code: `ITEM-${String(products.length + 1).padStart(2, '0')}`,
    name: '',
    description: '',
    unit: 'ชิ้น',
    unitPrice: 0,
    isTaxable: true,
  };

  const handleStartAdd = () => {
    setEditingProduct(emptyProduct);
    setIsAddingNew(true);
  };

  const handleStartEdit = (product: ProductCatalogItem) => {
    setEditingProduct({ ...product });
    setIsAddingNew(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    onSaveProduct(editingProduct);
    setEditingProduct(null);
    setIsAddingNew(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">รายการสินค้าและบริการ (Product & Service Catalog)</h3>
              <p className="text-xs text-slate-500">บันทึกสินค้าหรือบริการที่ใช้บ่อย เพื่อเรียกใส่ใบเสนอราคาหรือใบแจ้งหนี้ได้ทันที</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {editingProduct ? (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h4 className="font-bold text-slate-800 text-sm">
                  {isAddingNew ? 'เพิ่มสินค้า / บริการใหม่' : 'แก้ไขรายการ'}
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  กลับไปหน้ารายการ
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">รหัสสินค้า / Item Code</label>
                  <input
                    type="text"
                    value={editingProduct.code}
                    onChange={(e) => setEditingProduct({ ...editingProduct, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="SRV-01"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    ชื่อสินค้า / บริการ *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="เช่น บริการพัฒนาเว็บไซต์องค์กร"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block font-semibold text-slate-700 mb-1">
                    คำอธิบาย / รายละเอียดเพิ่มเติม
                  </label>
                  <textarea
                    rows={2}
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="ระบุรายละเอียด หรือขอบเขตงาน..."
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ราคาต่อหน่วย (บาท) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editingProduct.unitPrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">หน่วยนับ</label>
                  <input
                    type="text"
                    value={editingProduct.unit}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    placeholder="ชิ้น, ชุด, งาน, เดือน, ชม."
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.isTaxable}
                      onChange={(e) => setEditingProduct({ ...editingProduct, isTaxable: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-semibold text-slate-700">คิดภาษีมูลค่าเพิ่ม (VAT 7%)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  บันทึกสินค้า
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ค้นหาชื่อสินค้า, รหัสสินค้า, รายละเอียด..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleStartAdd}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shadow-xs shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  เพิ่มสินค้าใหม่
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredProducts.map((prod) => (
                  <div
                    key={prod.id || prod.code}
                    className="p-4 border border-slate-200 rounded-xl bg-slate-50/60 hover:bg-white hover:border-amber-300 hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                          {prod.code}
                        </span>
                        <div className="text-right">
                          <span className="font-mono font-bold text-amber-700 text-sm">
                            ฿{formatCurrency(prod.unitPrice)}
                          </span>
                          <span className="text-slate-500 text-[11px]"> / {prod.unit}</span>
                        </div>
                      </div>

                      <div className="font-bold text-slate-900 text-sm mt-1.5">
                        {prod.name}
                      </div>

                      {prod.description && (
                        <div className="text-slate-500 mt-1 line-clamp-2">
                          {prod.description}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
                      {onSelectProduct ? (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectProduct(prod);
                            onClose();
                          }}
                          className="px-3 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded font-semibold text-xs"
                        >
                          + ใส่ในเอกสาร
                        </button>
                      ) : <div />}

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(prod)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => prod.id && onDeleteProduct(prod.id)}
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

              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>ไม่พบรายการสินค้าหรือบริการ</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
