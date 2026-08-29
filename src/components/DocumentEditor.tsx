import React, { useState, useEffect } from 'react';
import {
  DocumentModel,
  DocumentType,
  DocumentItem,
  CompanyInfo,
  CustomerInfo,
  ProductCatalogItem,
  VatType,
  TemplateStyle,
} from '../types';
import {
  calculateDocumentTotals,
  getDocumentTypeInfo,
  generateDocumentNumber,
} from '../utils/documentCalculations';
import { formatCurrency } from '../utils/thaiBaht';
import { compressImageFile } from '../utils/storage';
import { CustomerModal } from './CustomerModal';
import { ProductCatalogModal } from './ProductCatalogModal';
import { SignaturePadModal } from './SignaturePadModal';
import {
  generateQRCodeDataUrl,
  formatPromptPayId,
  getPromptPayType,
  getPromptPayLabel,
} from '../utils/promptpay';
import {
  ArrowLeft,
  Save,
  Eye,
  Plus,
  Trash2,
  Users,
  Package,
  Building2,
  Calendar,
  CreditCard,
  Percent,
  CheckCircle,
  HelpCircle,
  FileText,
  Sparkles,
  PenTool,
  Upload,
  UserCheck,
  QrCode,
  Smartphone,
  Landmark,
  Check,
} from 'lucide-react';

interface DocumentEditorProps {
  initialDocument?: DocumentModel | null;
  defaultType?: DocumentType;
  companyInfo: CompanyInfo;
  customers: CustomerInfo[];
  products: ProductCatalogItem[];
  existingDocsCount: number;
  onSave: (doc: DocumentModel, viewImmediately?: boolean) => void;
  onCancel: () => void;
  onSaveCustomer: (cust: CustomerInfo) => void;
  onDeleteCustomer: (id: string) => void;
  onSaveProduct: (prod: ProductCatalogItem) => void;
  onDeleteProduct: (id: string) => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  initialDocument,
  defaultType = 'quotation',
  companyInfo,
  customers,
  products,
  existingDocsCount,
  onSave,
  onCancel,
  onSaveCustomer,
  onDeleteCustomer,
  onSaveProduct,
  onDeleteProduct,
}) => {
  const [docType, setDocType] = useState<DocumentType>(initialDocument?.type || defaultType);
  const [documentNumber, setDocumentNumber] = useState<string>(
    initialDocument?.documentNumber || generateDocumentNumber(initialDocument?.type || defaultType, existingDocsCount)
  );
  const [referenceNumber, setReferenceNumber] = useState<string>(initialDocument?.referenceNumber || '');
  const [issueDate, setIssueDate] = useState<string>(
    initialDocument?.issueDate || new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState<string>(() => {
    if (initialDocument?.dueDate) return initialDocument.dueDate;
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [paymentTerms, setPaymentTerms] = useState<string>(
    initialDocument?.paymentTerms || 'เครดิต 30 วัน'
  );

  // Customer State
  const [customer, setCustomer] = useState<CustomerInfo>(
    initialDocument?.customer ||
      customers[0] || {
        name: '',
        nameEn: '',
        contactPerson: '',
        taxId: '',
        branchType: 'headquarters',
        branchNo: '00000',
        address: '',
        phone: '',
        email: '',
      }
  );

  // Items State
  const [items, setItems] = useState<DocumentItem[]>(
    initialDocument?.items || [
      {
        id: `item-${Date.now()}`,
        name: '',
        description: '',
        quantity: 1,
        unit: 'ชิ้น',
        unitPrice: 0,
        discountType: 'amount',
        discountValue: 0,
        isTaxable: true,
        total: 0,
      },
    ]
  );

  // Financial & Tax State
  const [vatType, setVatType] = useState<VatType>(initialDocument?.vatType || 'excluded');
  const [vatRate, setVatRate] = useState<number>(initialDocument?.vatRate ?? 7);
  const [withholdingTaxRate, setWithholdingTaxRate] = useState<number>(
    initialDocument?.withholdingTaxRate ?? 3
  );

  // Notes & Terms
  const [notes, setNotes] = useState<string>(
    initialDocument?.notes ||
      'กรุณาตรวจสอบความถูกต้องของเอกสาร หากมีข้อแก้ไขกรุณาแจ้งให้ทราบภายใน 7 วันทำการ'
  );
  const [termsAndConditions, setTermsAndConditions] = useState<string>(
    initialDocument?.termsAndConditions ||
      '1. การชำระเงินโอนเข้าบัญชีธนาคารตามที่ระบุในเอกสาร\n2. กรณีหักภาษี ณ ที่จ่าย กรุณานำส่งหนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ)'
  );

  // Template & Settings
  const [templateStyle, setTemplateStyle] = useState<TemplateStyle>(
    initialDocument?.templateStyle || 'modern'
  );
  const [status, setStatus] = useState<DocumentModel['status']>(
    initialDocument?.status || 'pending'
  );
  const [showPromptPayQR, setShowPromptPayQR] = useState<boolean>(
    initialDocument?.showPromptPayQR ?? true
  );
  const [qrCodeSource, setQrCodeSource] = useState<'auto' | 'upload'>(() => {
    if (initialDocument?.qrCodeSource) return initialDocument.qrCodeSource;
    if (initialDocument?.customQrCodeUrl || companyInfo.qrCodeUrl) return 'upload';
    return 'auto';
  });
  const [customQrCodeUrl, setCustomQrCodeUrl] = useState<string | undefined>(
    initialDocument?.customQrCodeUrl || companyInfo.qrCodeUrl
  );
  const [promptPayId, setPromptPayId] = useState<string>(
    initialDocument?.promptPayId || companyInfo.promptPayId || companyInfo.phone || companyInfo.taxId || ''
  );
  const [promptPayAccountName, setPromptPayAccountName] = useState<string>(
    initialDocument?.promptPayAccountName || companyInfo.promptPayName || companyInfo.name || ''
  );
  const [promptPayAmountType, setPromptPayAmountType] = useState<'full' | 'open' | 'custom'>(
    initialDocument?.promptPayAmountType || 'full'
  );
  const [promptPayCustomAmount, setPromptPayCustomAmount] = useState<number>(
    initialDocument?.promptPayCustomAmount || 0
  );
  const [previewQrDataUrl, setPreviewQrDataUrl] = useState<string>('');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>(
    initialDocument?.selectedBankAccountId || companyInfo.bankAccounts[0]?.id || ''
  );
  const [showSignature, setShowSignature] = useState<boolean>(
    initialDocument?.showSignature ?? true
  );
  const [showStamp, setShowStamp] = useState<boolean>(initialDocument?.showStamp ?? true);
  const [preparedByName, setPreparedByName] = useState<string>(
    initialDocument?.preparedByName || companyInfo.signatureName || ''
  );
  const [signaturePosition, setSignaturePosition] = useState<string>(
    companyInfo.signaturePosition || 'กรรมการผู้จัดการ'
  );
  const [docSignatureUrl, setDocSignatureUrl] = useState<string | undefined>(
    initialDocument?.company?.signatureUrl || companyInfo.signatureUrl
  );
  const [docStampUrl, setDocStampUrl] = useState<string | undefined>(
    initialDocument?.company?.stampUrl || companyInfo.stampUrl
  );

  // Modals
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 500, 500, 0.85);
        setCustomQrCodeUrl(compressed);
        setQrCodeSource('upload');
      } catch (err) {
        console.error('Error compressing QR:', err);
      }
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 600, 300, 0.85);
        setDocSignatureUrl(compressed);
      } catch (err) {
        console.error('Error compressing signature:', err);
      }
    }
  };

  // Auto update doc number if type changes during new doc creation
  const handleTypeChange = (newType: DocumentType) => {
    setDocType(newType);
    if (!initialDocument) {
      setDocumentNumber(generateDocumentNumber(newType, existingDocsCount));
    }
  };

  // Item helpers
  const handleAddItem = () => {
    const newItem: DocumentItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: '',
      description: '',
      quantity: 1,
      unit: 'ชิ้น',
      unitPrice: 0,
      discountType: 'amount',
      discountValue: 0,
      isTaxable: true,
      total: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleUpdateItem = (index: number, field: keyof DocumentItem, value: any) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: value };

    // Recalculate total for this item
    const rawTotal = current.quantity * current.unitPrice;
    const discount =
      current.discountType === 'percent'
        ? rawTotal * (current.discountValue / 100)
        : current.discountValue;
    current.total = Math.max(0, rawTotal - discount);

    updated[index] = current;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddProductFromCatalog = (product: ProductCatalogItem) => {
    const newItem: DocumentItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      code: product.code,
      name: product.name,
      description: product.description || '',
      quantity: 1,
      unit: product.unit || 'ชิ้น',
      unitPrice: product.unitPrice || 0,
      discountType: 'amount',
      discountValue: 0,
      isTaxable: product.isTaxable !== false,
      total: product.unitPrice || 0,
    };

    // If first item is empty, replace it
    if (items.length === 1 && !items[0].name && items[0].unitPrice === 0) {
      setItems([newItem]);
    } else {
      setItems((prev) => [...prev, newItem]);
    }
  };

  // Live Totals Calculation
  const totals = calculateDocumentTotals(items, vatType, vatRate, withholdingTaxRate);

  // Calculate live amount for PromptPay preview
  const livePaymentAmount = totals.withholdingTaxAmount > 0 ? totals.netPayment : totals.grandTotal;
  const activePromptPayTarget = promptPayId.trim() || companyInfo.promptPayId || companyInfo.phone || companyInfo.taxId || '';

  let effectivePromptPayAmount: number | undefined;
  if (promptPayAmountType === 'open') {
    effectivePromptPayAmount = undefined;
  } else if (promptPayAmountType === 'custom') {
    effectivePromptPayAmount = Number(promptPayCustomAmount) || 0;
  } else {
    effectivePromptPayAmount = livePaymentAmount;
  }

  // Live PromptPay QR Generation Effect
  useEffect(() => {
    let isMounted = true;
    if (showPromptPayQR) {
      if (qrCodeSource === 'upload' && customQrCodeUrl) {
        setPreviewQrDataUrl(customQrCodeUrl);
      } else if (activePromptPayTarget) {
        generateQRCodeDataUrl(activePromptPayTarget, effectivePromptPayAmount).then((url) => {
          if (isMounted) {
            setPreviewQrDataUrl(url);
          }
        });
      } else {
        setPreviewQrDataUrl('');
      }
    } else {
      setPreviewQrDataUrl('');
    }
    return () => {
      isMounted = false;
    };
  }, [showPromptPayQR, qrCodeSource, customQrCodeUrl, activePromptPayTarget, effectivePromptPayAmount]);

  const handleSaveDocument = (viewImmediately: boolean = false) => {
    const doc: DocumentModel = {
      id: initialDocument?.id || `doc-${docType}-${Date.now()}`,
      type: docType,
      documentNumber,
      referenceNumber: referenceNumber || undefined,
      issueDate,
      dueDate,
      paymentTerms,
      company: {
        ...companyInfo,
        signatureUrl: docSignatureUrl,
        stampUrl: docStampUrl,
        signatureName: preparedByName,
        signaturePosition: signaturePosition,
      },
      customer,
      items,
      notes,
      termsAndConditions,
      vatType,
      vatRate,
      withholdingTaxRate,
      ...totals,
      status,
      templateStyle,
      language: initialDocument?.language || 'th',
      showPromptPayQR,
      qrCodeSource,
      customQrCodeUrl,
      promptPayId: activePromptPayTarget,
      promptPayAccountName: promptPayAccountName.trim() || companyInfo.promptPayName || companyInfo.name,
      promptPayAmountType,
      promptPayCustomAmount: promptPayAmountType === 'custom' ? Number(promptPayCustomAmount) || 0 : undefined,
      selectedBankAccountId,
      showSignature,
      showStamp,
      preparedByName,
      createdAt: initialDocument?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(doc, viewImmediately);
  };

  const currentTypeInfo = getDocumentTypeInfo(docType);

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      {/* Top Action Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 shadow-2xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ยกเลิก</span>
            </button>
            <div className="h-5 w-px bg-slate-200"></div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <span>{initialDocument ? 'แก้ไขเอกสาร' : 'สร้างเอกสารใหม่'}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${currentTypeInfo.badgeColor}`}>
                  {currentTypeInfo.titleTh}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSaveDocument(false)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกฉบับร่าง</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveDocument(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
            >
              <Eye className="w-4 h-4" />
              <span>บันทึก & ดูตัวอย่าง A4</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="max-w-6xl mx-auto px-4 mt-6 space-y-6 text-xs">
        {/* Section 1: Document Type Selector */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <label className="block font-bold text-slate-800 text-sm mb-3">
            เลือกประเภทเอกสารที่ต้องการออก (Document Type)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['quotation', 'billing', 'invoice', 'receipt'] as DocumentType[]).map((type) => {
              const info = getDocumentTypeInfo(type);
              const isSelected = docType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeChange(type)}
                  className={`p-3.5 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] font-bold text-slate-500 uppercase">
                      {info.prefix}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    )}
                  </div>
                  <div className="font-bold text-slate-900 text-xs">{info.titleTh}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5 line-clamp-1">
                    {info.titleEn}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Header Info & Customer Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Customer Selection Block */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-sm">ข้อมูลลูกค้า (Customer Details)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomerModal(true)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                <span>เลือกจากสมุดรายชื่อ</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ชื่อบริษัท / นิติบุคคล / บุคคลธรรมดา (ลูกค้า) *
                </label>
                <input
                  type="text"
                  required
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  placeholder="เช่น บริษัท ดิจิทัล โนวา โซลูชั่นส์ จำกัด"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ชื่อผู้ติดต่อ / แผนก
                  </label>
                  <input
                    type="text"
                    value={customer.contactPerson || ''}
                    onChange={(e) => setCustomer({ ...customer, contactPerson: e.target.value })}
                    placeholder="เช่น คุณกิตติศักดิ์ (จัดซื้อ)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    เลขประจำตัวผู้เสียภาษี 13 หลัก
                  </label>
                  <input
                    type="text"
                    maxLength={13}
                    value={customer.taxId}
                    onChange={(e) => setCustomer({ ...customer, taxId: e.target.value })}
                    placeholder="01055xxxxxxxxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">ประเภทสาขา</label>
                  <select
                    value={customer.branchType}
                    onChange={(e) => setCustomer({ ...customer, branchType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="headquarters">สำนักงานใหญ่ (00000)</option>
                    <option value="branch">สาขา</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">รหัสสาขา</label>
                  <input
                    type="text"
                    disabled={customer.branchType === 'headquarters'}
                    value={customer.branchType === 'headquarters' ? '00000' : customer.branchNo}
                    onChange={(e) => setCustomer({ ...customer, branchNo: e.target.value })}
                    placeholder="00001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    placeholder="02-xxx-xxxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ที่อยู่ลูกค้า (สำหรับออกเอกสาร) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  placeholder="เลขที่ อาคาร ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Document Meta (Dates, No, Terms) */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">ข้อมูลเอกสาร (Document Info)</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  เลขที่เอกสาร (Document No.) *
                </label>
                <input
                  type="text"
                  required
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  เลขอ้างอิง (Reference No.)
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="เช่น QT-202608-001 หรือ เลขที่ใบสั่งซื้อ PO"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">วันที่ออกเอกสาร</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {docType === 'quotation' ? 'ยืนราคาถึงวันที่' : 'วันครบกำหนดชำระ'}
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-rose-700 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">เงื่อนไขการชำระเงิน</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="เช่น เครดิต 30 วัน, มัดจำ 50% เมื่องานเริ่ม"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">สถานะเอกสาร</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="draft">ฉบับร่าง (Draft)</option>
                  <option value="pending">รอดำเนินการ (Pending)</option>
                  <option value="approved">อนุมัติแล้ว (Approved)</option>
                  <option value="paid">ชำระเงินแล้ว (Paid)</option>
                  <option value="overdue">เกินกำหนด (Overdue)</option>
                  <option value="cancelled">ยกเลิก (Cancelled)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Line Items Table */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">รายการสินค้า / บริการ (Line Items)</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowProductModal(true)}
                className="text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Package className="w-3.5 h-3.5" />
                <span>เลือกจากแคตตาล็อกสินค้า</span>
              </button>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มรายการ</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <th className="py-2.5 px-2 text-center w-10">#</th>
                  <th className="py-2.5 px-3">ชื่อรายการสินค้า / บริการ & รายละเอียด</th>
                  <th className="py-2.5 px-2 text-center w-20">จำนวน</th>
                  <th className="py-2.5 px-2 text-center w-20">หน่วย</th>
                  <th className="py-2.5 px-2 text-right w-28">ราคาต่อหน่วย</th>
                  <th className="py-2.5 px-2 text-right w-24">ส่วนลด</th>
                  <th className="py-2.5 px-3 text-right w-28">ยอดรวม (฿)</th>
                  <th className="py-2.5 px-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item, idx) => {
                  const rawTotal = item.quantity * item.unitPrice;
                  const discount =
                    item.discountType === 'percent'
                      ? rawTotal * (item.discountValue / 100)
                      : item.discountValue;
                  const itemTotal = Math.max(0, rawTotal - discount);

                  return (
                    <tr key={item.id || idx} className="align-top hover:bg-slate-50/50">
                      <td className="py-3 px-2 text-center text-slate-400 font-mono pt-4">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 space-y-1.5">
                        <input
                          type="text"
                          required
                          value={item.name}
                          onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                          placeholder="ชื่อสินค้าหรือบริการ *"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none font-medium"
                        />
                        <textarea
                          rows={1}
                          value={item.description || ''}
                          onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                          placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)..."
                          className="w-full px-2.5 py-1 text-[11px] border border-slate-200 rounded-lg text-slate-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          required
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-mono text-center"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleUpdateItem(idx, 'unit', e.target.value)}
                          placeholder="ชิ้น"
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-center"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleUpdateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg font-mono text-right"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.discountValue}
                            onChange={(e) =>
                              handleUpdateItem(idx, 'discountValue', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-1.5 py-1.5 border border-slate-300 rounded-lg font-mono text-right"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateItem(
                                idx,
                                'discountType',
                                item.discountType === 'percent' ? 'amount' : 'percent'
                              )
                            }
                            className="px-1.5 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 text-[10px] font-mono shrink-0"
                            title="สลับระหว่าง % หรือ บาท"
                          >
                            {item.discountType === 'percent' ? '%' : '฿'}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono pt-4">
                        ฿{formatCurrency(itemTotal)}
                      </td>
                      <td className="py-3 px-2 text-center pt-3.5">
                        <button
                          type="button"
                          disabled={items.length <= 1}
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded disabled:opacity-20"
                          title="ลบรายการนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Tax, Totals, and Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Notes & Terms */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              หมายเหตุและข้อตกลง (Notes & Terms)
            </h3>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                หมายเหตุท้ายเอกสาร (Remarks)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ระบุข้อความหมายเหตุเพิ่มเติม..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                เงื่อนไขและข้อตกลง (Terms & Conditions)
              </label>
              <textarea
                rows={3}
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                placeholder="ระบุเงื่อนไขการรับประกัน หรือการส่งมอบงาน..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Display / Signature Options */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">ผู้มีอำนาจลงนาม</label>
                <input
                  type="text"
                  value={preparedByName}
                  onChange={(e) => setPreparedByName(e.target.value)}
                  placeholder="ชื่อผู้เซ็นเอกสาร"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex flex-col justify-end space-y-2 pt-2 sm:pt-0">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSignature}
                    onChange={(e) => setShowSignature(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span className="font-semibold text-slate-700">แสดงลายเซ็นดิจิทัล</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showStamp}
                    onChange={(e) => setShowStamp(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span className="font-semibold text-slate-700">แสดงตรายางประทับ</span>
                </label>
              </div>
            </div>
          </div>

          {/* Tax Settings & Total Summary */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
                <Percent className="w-4 h-4 text-indigo-600" />
                การคำนวณภาษี & ยอดรวมสุทธิ
              </h3>

              {/* Tax Type selector */}
              <div className="space-y-3 pt-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ภาษีมูลค่าเพิ่ม (VAT Type)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setVatType('excluded')}
                      className={`p-2 rounded-lg border text-center font-medium ${
                        vatType === 'excluded'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      แยกนอก 7%
                    </button>
                    <button
                      type="button"
                      onClick={() => setVatType('included')}
                      className={`p-2 rounded-lg border text-center font-medium ${
                        vatType === 'included'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      รวมใน 7%
                    </button>
                    <button
                      type="button"
                      onClick={() => setVatType('none')}
                      className={`p-2 rounded-lg border text-center font-medium ${
                        vatType === 'none'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      ไม่มี VAT
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    ภาษีหัก ณ ที่จ่าย (Withholding Tax - WHT)
                  </label>
                  <select
                    value={withholdingTaxRate}
                    onChange={(e) => setWithholdingTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value={0}>ไม่มีการหัก ณ ที่จ่าย (0%)</option>
                    <option value={1}>หัก 1% (ค่าขนส่ง, บริการบางประเภท)</option>
                    <option value={2}>หัก 2% (ค่าโฆษณา)</option>
                    <option value={3}>หัก 3% (ค่าบริการทั่วไป, ค่าจ้างทำของ)</option>
                    <option value={5}>หัก 5% (ค่าเช่า, รางวัล)</option>
                    <option value={0.75}>หัก 0.75% (e-Withholding)</option>
                    <option value={1.5}>หัก 1.5% (e-Withholding)</option>
                  </select>
                </div>
              </div>

              {/* Financial Calculation summary */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>รวมเป็นเงิน (Subtotal):</span>
                  <span className="font-mono">฿{formatCurrency(totals.subtotal)}</span>
                </div>
                {totals.discountTotal > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>ส่วนลดรวม (Discount):</span>
                    <span className="font-mono">-฿{formatCurrency(totals.discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-700 font-medium">
                  <span>ยอดหลังหักส่วนลด:</span>
                  <span className="font-mono">฿{formatCurrency(totals.afterDiscount)}</span>
                </div>

                {vatType !== 'none' && (
                  <div className="flex justify-between text-slate-600">
                    <span>ภาษีมูลค่าเพิ่ม VAT {vatRate}%:</span>
                    <span className="font-mono">฿{formatCurrency(totals.vatAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-2 border-t border-slate-300">
                  <span>ยอดรวมทั้งสิ้น (Grand Total):</span>
                  <span className="font-mono text-base text-indigo-700">
                    ฿{formatCurrency(totals.grandTotal)}
                  </span>
                </div>

                {withholdingTaxRate > 0 && (
                  <>
                    <div className="flex justify-between text-amber-700 text-[11px] pt-1">
                      <span>หัก ณ ที่จ่าย {withholdingTaxRate}%:</span>
                      <span className="font-mono">-฿{formatCurrency(totals.withholdingTaxAmount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-800 bg-emerald-100/60 p-2 rounded-lg mt-1">
                      <span>ยอดชำระสุทธิ (Net to Pay):</span>
                      <span className="font-mono text-sm">฿{formatCurrency(totals.netPayment)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Thai Baht text */}
            <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 mt-3">
              <span className="text-[10px] text-indigo-600 font-bold block uppercase">
                จำนวนเงินตัวอักษรภาษาไทย
              </span>
              <span className="font-bold text-indigo-950 text-xs mt-0.5 block">
                ({totals.thaiBahtText})
              </span>
            </div>
          </div>
        </div>

        {/* Section 5: PromptPay & Bank Settings */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              ช่องทางการชำระเงินและสแกนจ่ายพร้อมเพย์ (Payment & PromptPay QR)
            </h3>
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors">
              <input
                type="checkbox"
                checked={showPromptPayQR}
                onChange={(e) => setShowPromptPayQR(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-semibold text-slate-700 text-xs flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                แสดง QR Code พร้อมเพย์ในเอกสาร
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left Column: Bank and PromptPay Settings */}
            <div className="lg:col-span-2 space-y-4">
              {/* Bank Account Selector */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-xs flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-slate-500" />
                  เลือกบัญชีธนาคารสำหรับพิมพ์ลงเอกสาร
                </label>
                <select
                  value={selectedBankAccountId}
                  onChange={(e) => setSelectedBankAccountId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs bg-slate-50/50"
                >
                  {companyInfo.bankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bankName} - {acc.accountNumber} ({acc.accountName}) {acc.branch ? `- สาขา ${acc.branch}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* PromptPay Settings Box */}
              {showPromptPayQR && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/50 to-blue-50/40 border border-indigo-100/80 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-indigo-600" />
                      <span>ตั้งค่า QR Code สำหรับสแกนรับเงิน (PromptPay / QR Code Configuration)</span>
                    </div>

                    {/* Mode Selector Tabs */}
                    <div className="flex p-0.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setQrCodeSource('auto')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                          qrCodeSource === 'auto'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>สร้างอัตโนมัติ</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setQrCodeSource('upload')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                          qrCodeSource === 'upload'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Upload className="w-3 h-3" />
                        <span>อัปโหลดรูป QR จริง</span>
                      </button>
                    </div>
                  </div>

                  {qrCodeSource === 'upload' ? (
                    /* Upload Real QR Mode */
                    <div className="space-y-4 bg-white p-3.5 rounded-xl border border-indigo-100">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5 text-indigo-600" />
                            อัปโหลดรูปภาพ QR Code สแกนจ่ายจริง (Bank / PromptPay QR Image)
                          </h5>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            อัปโหลดรูป QR จากแอปธนาคาร (เช่น K-Plus, SCB Easy, Krungthai NEXT, ฯลฯ) เพื่อให้ลูกค้าสแกนจ่ายได้ตรงจุด
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                        <div className="space-y-2">
                          <label className="block text-slate-700 font-semibold text-xs">
                            ไฟล์รูปภาพ QR Code
                          </label>
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors">
                              <Upload className="w-3.5 h-3.5" />
                              <span>{customQrCodeUrl ? 'เปลี่ยนรูป QR Code' : 'เลือกรูปภาพ QR Code'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleQrUpload}
                                className="hidden"
                              />
                            </label>

                            {customQrCodeUrl && (
                              <button
                                type="button"
                                onClick={() => setCustomQrCodeUrl(undefined)}
                                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>ลบรูป</span>
                              </button>
                            )}
                          </div>

                          {companyInfo.qrCodeUrl && customQrCodeUrl !== companyInfo.qrCodeUrl && (
                            <button
                              type="button"
                              onClick={() => setCustomQrCodeUrl(companyInfo.qrCodeUrl)}
                              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 mt-1 underline"
                            >
                              <span>⭐ ดึงรูป QR Code หลักของบริษัทที่บันทึกไว้มาใช้</span>
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1 text-xs">
                            ชื่อบัญชีผู้รับเงิน / ข้อความกำกับใต้รูป QR
                          </label>
                          <input
                            type="text"
                            value={promptPayAccountName}
                            onChange={(e) => setPromptPayAccountName(e.target.value)}
                            placeholder="เช่น บริษัท สยาม จำกัด หรือ นายสมชาย รุ่งเรือง"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">จะแสดงใต้รูป QR Code เพื่อให้ลูกค้าตรวจสอบชื่อก่อนโอน</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Auto Generation Mode */
                    <div className="space-y-4">
                      {/* Quick Preset Buttons */}
                      <div>
                        <span className="text-[11px] text-slate-500 font-medium block mb-1.5">
                          เลือกจากข้อมูลที่บันทึกไว้ หรือ พิมพ์เปลี่ยนใหม่ด้านล่าง:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {companyInfo.promptPayId && (
                            <button
                              type="button"
                              onClick={() => setPromptPayId(companyInfo.promptPayId || '')}
                              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                                promptPayId === companyInfo.promptPayId
                                  ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <span>⭐ พร้อมเพย์หลัก ({formatPromptPayId(companyInfo.promptPayId)})</span>
                            </button>
                          )}

                          {companyInfo.phone && (
                            <button
                              type="button"
                              onClick={() => setPromptPayId(companyInfo.phone.replace(/[^0-9]/g, ''))}
                              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                                promptPayId.replace(/[^0-9]/g, '') === companyInfo.phone.replace(/[^0-9]/g, '')
                                  ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <Smartphone className="w-3 h-3" />
                              <span>เบอร์โทรบริษัท ({companyInfo.phone})</span>
                            </button>
                          )}

                          {companyInfo.taxId && (
                            <button
                              type="button"
                              onClick={() => setPromptPayId(companyInfo.taxId)}
                              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                                promptPayId === companyInfo.taxId
                                  ? 'bg-indigo-600 text-white border-indigo-600 font-semibold shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <Building2 className="w-3 h-3" />
                              <span>เลขผู้เสียภาษี 13 หลัก ({companyInfo.taxId})</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* PromptPay Target ID & Account Name Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-700 font-semibold mb-1 text-xs">
                            เบอร์พร้อมเพย์ / เลขประจำตัวผู้เสียภาษี (PromptPay ID) *
                          </label>
                          <input
                            type="text"
                            value={promptPayId}
                            onChange={(e) => setPromptPayId(e.target.value)}
                            placeholder="เช่น 0812345678 หรือ 01055xxxxxxxx"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                          />
                          {promptPayId && (
                            <p className="text-[10px] text-slate-500 mt-1">
                              รูปแบบ: <span className="font-mono font-semibold text-slate-800">{formatPromptPayId(promptPayId)}</span>
                              {activePromptPayTarget && (
                                <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-100 text-indigo-800">
                                  {getPromptPayLabel(activePromptPayTarget)}
                                </span>
                              )}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-slate-700 font-semibold mb-1 text-xs">
                            ชื่อบัญชีผู้รับเงิน (Account Name)
                          </label>
                          <input
                            type="text"
                            value={promptPayAccountName}
                            onChange={(e) => setPromptPayAccountName(e.target.value)}
                            placeholder="เช่น บริษัท สยาม จำกัด หรือ นายสมชาย"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">จะแสดงใต้รูป QR Code เพื่อให้ผู้โอนตรวจสอบ</p>
                        </div>
                      </div>

                      {/* Amount Options for QR */}
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1.5 text-xs">
                          ยอดเงินที่ต้องการฝังใน QR Code (QR Amount Mode)
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <button
                            type="button"
                            onClick={() => setPromptPayAmountType('full')}
                            className={`p-2.5 rounded-lg border text-left transition-all ${
                              promptPayAmountType === 'full'
                                ? 'bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="font-semibold text-[11px] text-slate-800">ยอดเต็มสุทธิ</div>
                            <div className="font-bold text-xs text-indigo-700 mt-0.5">
                              ฿{formatCurrency(livePaymentAmount)}
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setPromptPayAmountType('custom');
                              setPromptPayCustomAmount(Math.round(livePaymentAmount * 0.5));
                            }}
                            className={`p-2.5 rounded-lg border text-left transition-all ${
                              promptPayAmountType === 'custom' && promptPayCustomAmount === Math.round(livePaymentAmount * 0.5)
                                ? 'bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="font-semibold text-[11px] text-slate-800">มัดจำ 50%</div>
                            <div className="font-bold text-xs text-indigo-700 mt-0.5">
                              ฿{formatCurrency(Math.round(livePaymentAmount * 0.5))}
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPromptPayAmountType('custom')}
                            className={`p-2.5 rounded-lg border text-left transition-all ${
                              promptPayAmountType === 'custom' && promptPayCustomAmount !== Math.round(livePaymentAmount * 0.5)
                                ? 'bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="font-semibold text-[11px] text-slate-800">กำหนดยอดเอง</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">ระบุยอดเงินที่ต้องการ</div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPromptPayAmountType('open')}
                            className={`p-2.5 rounded-lg border text-left transition-all ${
                              promptPayAmountType === 'open'
                                ? 'bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="font-semibold text-[11px] text-slate-800">ไม่ระบุยอดเงิน</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">ให้ลูกค้าระบุเอง</div>
                          </button>
                        </div>

                        {promptPayAmountType === 'custom' && (
                          <div className="mt-2.5 flex items-center gap-2">
                            <span className="text-xs text-slate-600 font-medium">ระบุยอดเงิน (บาท):</span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={promptPayCustomAmount || ''}
                              onChange={(e) => setPromptPayCustomAmount(parseFloat(e.target.value) || 0)}
                              className="w-40 px-3 py-1.5 border border-indigo-300 rounded-lg text-xs font-mono font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                              placeholder="0.00"
                            />
                            <span className="text-xs text-slate-500">บาท</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Live QR Code Preview */}
            {showPromptPayQR && (
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  ตัวอย่าง QR Code จริงในเอกสาร
                </span>

                {qrCodeSource === 'upload' ? (
                  customQrCodeUrl ? (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm w-full max-w-[200px] flex flex-col items-center space-y-2">
                      <div className="w-full bg-[#003B71] text-white py-1 px-2 rounded flex items-center justify-center gap-1 shadow-2xs">
                        <QrCode className="w-3 h-3 text-sky-200" />
                        <span className="font-bold text-[9px] tracking-wide">THAI QR PAYMENT</span>
                      </div>

                      <img
                        src={customQrCodeUrl}
                        alt="Custom Uploaded QR Preview"
                        className="w-36 h-36 object-contain rounded border border-slate-100 bg-white"
                      />

                      <div className="space-y-0.5 w-full">
                        <div className="text-xs font-bold text-slate-800 truncate" title={promptPayAccountName || companyInfo.name}>
                          {promptPayAccountName || companyInfo.name}
                        </div>
                        <div className="text-[10px] text-emerald-600 font-medium bg-emerald-50 py-0.5 px-1.5 rounded inline-block">
                          ✓ รูปภาพ QR จริงที่อัปโหลด
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-slate-400 text-xs flex flex-col items-center">
                      <div className="w-16 h-16 rounded-xl bg-slate-200 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 mb-2">
                        <QrCode className="w-8 h-8" />
                      </div>
                      <span className="font-medium text-slate-600">ยังไม่ได้อัปโหลดรูป QR Code</span>
                      <label className="cursor-pointer mt-2.5 inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white font-semibold text-xs rounded-lg hover:bg-indigo-700 transition-colors shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>อัปโหลดรูปภาพ</span>
                        <input type="file" accept="image/*" onChange={handleQrUpload} className="hidden" />
                      </label>
                    </div>
                  )
                ) : activePromptPayTarget && previewQrDataUrl ? (
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm w-full max-w-[200px] flex flex-col items-center space-y-2">
                    <div className="w-full bg-[#003B71] text-white py-1 px-2 rounded flex items-center justify-center gap-1 shadow-2xs">
                      <QrCode className="w-3 h-3 text-sky-200" />
                      <span className="font-bold text-[9px] tracking-wide">THAI QR PAYMENT</span>
                    </div>

                    <img
                      src={previewQrDataUrl}
                      alt="PromptPay Live Preview"
                      className="w-36 h-36 object-contain rounded"
                    />

                    <div className="space-y-0.5 w-full">
                      <div className="text-xs font-bold font-mono text-slate-800">
                        {formatPromptPayId(activePromptPayTarget)}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate" title={promptPayAccountName || companyInfo.name}>
                        {promptPayAccountName || companyInfo.name}
                      </div>
                      {effectivePromptPayAmount !== undefined ? (
                        <div className="text-xs font-bold text-indigo-700 bg-indigo-50 py-0.5 px-2 rounded mt-1">
                          ฿{formatCurrency(effectivePromptPayAmount)}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 mt-1">(ไม่ระบุยอดเงิน)</div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-slate-400 text-xs">
                    <QrCode className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                    <span>กรุณาระบุเบอร์พร้อมเพย์หรือเลขผู้เสียภาษีเพื่อสร้าง QR Code</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section 6: Signatures & Stamp */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            ลายเซ็นดิจิทัลและตรายางประทับ (Digital Signature & Official Stamp)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSignature}
                  onChange={(e) => setShowSignature(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600"
                />
                <span className="font-semibold text-slate-700">
                  แสดงลายเซ็นดิจิทัลในเอกสาร
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showStamp}
                  onChange={(e) => setShowStamp(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600"
                />
                <span className="font-semibold text-slate-700">
                  แสดงตรายางประทับบริษัทในเอกสาร
                </span>
              </label>

              <div className="pt-2">
                <label className="block text-slate-700 font-semibold mb-1">
                  ชื่อผู้ลงนาม / ผู้เสนอราคา
                </label>
                <input
                  type="text"
                  value={preparedByName}
                  onChange={(e) => setPreparedByName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="เช่น นายสมชาย รุ่งเรืองทรัพย์"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  ตำแหน่งผู้ลงนาม
                </label>
                <input
                  type="text"
                  value={signaturePosition}
                  onChange={(e) => setSignaturePosition(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="เช่น กรรมการผู้จัดการ / ผู้จัดการฝ่ายขาย"
                />
              </div>
            </div>

            {/* Signature Preview & Controls */}
            <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center">
              <span className="font-semibold text-slate-700 text-xs mb-2">รูปลายเซ็นที่ใช้งาน (Signature Preview)</span>
              
              {docSignatureUrl ? (
                <div className="relative mb-2.5 bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                  <img
                    src={docSignatureUrl}
                    alt="Document Signature"
                    className="h-16 w-auto max-w-[180px] object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setDocSignatureUrl(undefined)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs shadow-xs hover:bg-rose-600"
                    title="ลบลายเซ็นนี้"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-20 h-16 rounded-lg bg-slate-200 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 mb-2">
                  <PenTool className="w-6 h-6" />
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                <label className="cursor-pointer flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold text-xs py-1.5 px-3 rounded-lg bg-white border border-slate-200 shadow-2xs hover:bg-indigo-50/50 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>อัปโหลดรูป</span>
                  <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                </label>

                <button
                  type="button"
                  onClick={() => setShowSignaturePad(true)}
                  className="flex items-center gap-1 text-slate-700 hover:text-slate-900 font-semibold text-xs py-1.5 px-3 rounded-lg bg-white border border-slate-200 shadow-2xs hover:bg-slate-100 transition-colors"
                >
                  <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                  <span>วาด / ปรับแต่ง</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Floating Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => handleSaveDocument(true)}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all"
          >
            <Eye className="w-4 h-4" />
            <span>บันทึก & ดูตัวอย่าง A4 (Print Preview)</span>
          </button>
        </div>
      </div>

      {/* Signature Pad & Upload Modal */}
      <SignaturePadModal
        isOpen={showSignaturePad}
        onClose={() => setShowSignaturePad(false)}
        initialSignature={docSignatureUrl}
        onSave={(dataUrl) => setDocSignatureUrl(dataUrl)}
      />

      {/* Customer Directory Modal */}
      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        customers={customers}
        onSaveCustomer={onSaveCustomer}
        onDeleteCustomer={onDeleteCustomer}
        onSelectCustomer={(cust) => setCustomer(cust)}
      />

      {/* Product Catalog Modal */}
      <ProductCatalogModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        products={products}
        onSaveProduct={onSaveProduct}
        onDeleteProduct={onDeleteProduct}
        onSelectProduct={handleAddProductFromCatalog}
      />
    </div>
  );
};
