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
  getDiscountDisplayText,
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
  Edit3,
  RotateCcw,
} from 'lucide-react';

interface DocumentEditorProps {
  initialDocument?: DocumentModel | null;
  defaultType?: DocumentType;
  companies?: CompanyInfo[];
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
  onOpenCompanyModal?: () => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  initialDocument,
  defaultType = 'quotation',
  companies = [],
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
  onOpenCompanyModal,
}) => {
  // Active Issuer Company / Branch state
  const [currentCompany, setCurrentCompany] = useState<CompanyInfo>(() => {
    if (initialDocument?.company) {
      const matching =
        companies && companies.length > 0
          ? companies.find((c) => c.id === initialDocument.company.id) ||
            companies.find((c) => c.name === initialDocument.company.name)
          : companyInfo;
      return {
        ...initialDocument.company,
        headerNameLine1: initialDocument.company.headerNameLine1 || matching?.headerNameLine1,
        headerNameLine2: initialDocument.company.headerNameLine2 || matching?.headerNameLine2,
        headerNameLine3: initialDocument.company.headerNameLine3 || matching?.headerNameLine3,
      };
    }
    if (companies && companies.length > 0) {
      return companies.find((c) => c.id === companyInfo.id) || companyInfo || companies[0];
    }
    return companyInfo;
  });

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(() => {
    return (
      initialDocument?.company?.id ||
      companyInfo.id ||
      (companies && companies[0]?.id) ||
      'company-hq'
    );
  });

  // Sync currentCompany if companies list or active companyInfo updates externally (e.g. saved from CompanyProfileModal)
  useEffect(() => {
    if (companies && companies.length > 0) {
      const found =
        companies.find((c) => c.id === selectedCompanyId) ||
        companies.find((c) => c.id === currentCompany.id) ||
        companies.find((c) => c.name === currentCompany.name) ||
        companies.find((c) => c.id === companyInfo.id) ||
        companies[0];
      if (found) {
        setCurrentCompany(found);
      }
    } else if (companyInfo) {
      setCurrentCompany(companyInfo);
    }
  }, [companies, companyInfo, selectedCompanyId]);

  const [docType, setDocType] = useState<DocumentType>(initialDocument?.type || defaultType);
  const [documentNumber, setDocumentNumber] = useState<string>(
    initialDocument?.documentNumber || generateDocumentNumber(initialDocument?.type || defaultType, existingDocsCount)
  );
  const [referenceNumber, setReferenceNumber] = useState<string>(initialDocument?.referenceNumber || '');
  const [issueDate, setIssueDate] = useState<string>(
    initialDocument?.issueDate || new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState<string>(() => {
    if (initialDocument?.dueDate !== undefined) return initialDocument.dueDate;
    return ''; // Default to none / empty as requested
  });
  const [paymentTerms, setPaymentTerms] = useState<string>(() => {
    if (initialDocument?.paymentTerms !== undefined) return initialDocument.paymentTerms;
    return currentCompany.defaultPaymentTerms || '';
  });

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
  const [overallDiscountValue, setOverallDiscountValue] = useState<number>(
    initialDocument?.overallDiscountValue ?? initialDocument?.discountTotal ?? 0
  );
  const [overallDiscountType, setOverallDiscountType] = useState<'amount' | 'percent'>(
    initialDocument?.overallDiscountType || 'amount'
  );
  const [discountLabel, setDiscountLabel] = useState<string>(
    initialDocument?.discountLabel || ''
  );
  const [customThaiBahtText, setCustomThaiBahtText] = useState<string>(
    initialDocument?.customThaiBahtText || ''
  );
  const [isCustomBahtText, setIsCustomBahtText] = useState<boolean>(
    Boolean(initialDocument?.customThaiBahtText && initialDocument.customThaiBahtText.trim())
  );

  // Notes & Terms (Pulled from Branch defaults or initialDocument)
  const [notes, setNotes] = useState<string>(() => {
    if (initialDocument?.notes !== undefined) return initialDocument.notes;
    return currentCompany.defaultRemarks || '';
  });
  const [termsAndConditions, setTermsAndConditions] = useState<string>(() => {
    if (initialDocument?.termsAndConditions !== undefined) return initialDocument.termsAndConditions;
    return currentCompany.defaultTerms || '';
  });

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
    if (initialDocument?.customQrCodeUrl || currentCompany.qrCodeUrl) return 'upload';
    return 'auto';
  });
  const [customQrCodeUrl, setCustomQrCodeUrl] = useState<string | undefined>(
    initialDocument?.customQrCodeUrl || currentCompany.qrCodeUrl
  );
  const [promptPayId, setPromptPayId] = useState<string>(
    initialDocument?.promptPayId || currentCompany.promptPayId || currentCompany.phone || currentCompany.taxId || ''
  );
  const [promptPayAccountName, setPromptPayAccountName] = useState<string>(
    initialDocument?.promptPayAccountName || currentCompany.promptPayName || currentCompany.name || ''
  );
  const [promptPayAmountType, setPromptPayAmountType] = useState<'full' | 'open' | 'custom'>(
    initialDocument?.promptPayAmountType || 'full'
  );
  const [promptPayCustomAmount, setPromptPayCustomAmount] = useState<number>(
    initialDocument?.promptPayCustomAmount || 0
  );
  const [previewQrDataUrl, setPreviewQrDataUrl] = useState<string>('');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>(
    initialDocument?.selectedBankAccountId || currentCompany.bankAccounts?.[0]?.id || ''
  );
  const [showSignature, setShowSignature] = useState<boolean>(
    initialDocument?.showSignature ?? true
  );
  const [showStamp, setShowStamp] = useState<boolean>(initialDocument?.showStamp ?? true);
  const [preparedByName, setPreparedByName] = useState<string>(
    initialDocument?.preparedByName || currentCompany.signatureName || ''
  );
  const [signaturePosition, setSignaturePosition] = useState<string>(
    currentCompany.signaturePosition || 'กรรมการผู้จัดการ'
  );
  const [docSignatureUrl, setDocSignatureUrl] = useState<string | undefined>(
    initialDocument?.company?.signatureUrl || currentCompany.signatureUrl
  );
  const [docStampUrl, setDocStampUrl] = useState<string | undefined>(
    initialDocument?.company?.stampUrl || currentCompany.stampUrl
  );

  // Modals
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  // Switch issuer branch dynamically
  const handleSwitchIssuerBranch = (branchId: string) => {
    const list = (companies && companies.length > 0) ? companies : [companyInfo];
    const found = list.find((c) => c.id === branchId) || list[0];
    if (found) {
      const prevCompany = currentCompany;
      setSelectedCompanyId(found.id || branchId);
      setCurrentCompany(found);
      setDocSignatureUrl(found.signatureUrl);
      setDocStampUrl(found.stampUrl);
      setPreparedByName(found.signatureName || '');
      setSignaturePosition(found.signaturePosition || 'ผู้จัดการ');
      if (found.bankAccounts && found.bankAccounts.length > 0) {
        const defaultAcc = found.bankAccounts.find((b) => b.isDefault) || found.bankAccounts[0];
        setSelectedBankAccountId(defaultAcc.id);
      } else {
        setSelectedBankAccountId('');
      }
      const ppId = found.promptPayId || found.phone || found.taxId || '';
      setPromptPayId(ppId);
      setPromptPayAccountName(found.promptPayName || found.name || '');
      if (found.qrCodeUrl) {
        setCustomQrCodeUrl(found.qrCodeUrl);
        setQrCodeSource('upload');
      }

      // If remarks were matching previous company default or empty, switch to new branch default
      if (found.defaultRemarks !== undefined && (!notes || notes === prevCompany.defaultRemarks)) {
        setNotes(found.defaultRemarks || '');
      }
      // If terms were matching previous company default or empty, switch to new branch default
      if (found.defaultTerms !== undefined && (!termsAndConditions || termsAndConditions === prevCompany.defaultTerms)) {
        setTermsAndConditions(found.defaultTerms || '');
      }
      // If payment terms were matching previous company default or empty, switch to new branch default
      if (found.defaultPaymentTerms !== undefined && (!paymentTerms || paymentTerms === prevCompany.defaultPaymentTerms)) {
        setPaymentTerms(found.defaultPaymentTerms || '');
      }
    }
  };

  // Helper to force apply branch default remarks & terms
  const handleApplyBranchDefaults = () => {
    if (currentCompany.defaultRemarks !== undefined) {
      setNotes(currentCompany.defaultRemarks || '');
    }
    if (currentCompany.defaultTerms !== undefined) {
      setTermsAndConditions(currentCompany.defaultTerms || '');
    }
  };

  // Helper to set due date by offset days
  const handleSetDueDateDays = (days: number) => {
    if (days === 0) {
      setDueDate('');
      return;
    }
    const base = issueDate ? new Date(issueDate) : new Date();
    base.setDate(base.getDate() + days);
    setDueDate(base.toISOString().split('T')[0]);
  };

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
  const totals = calculateDocumentTotals(
    items,
    vatType,
    vatRate,
    withholdingTaxRate,
    overallDiscountValue,
    overallDiscountType
  );

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
        ...currentCompany,
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
      overallDiscountValue,
      overallDiscountType,
      discountLabel: discountLabel.trim() || undefined,
      ...totals,
      thaiBahtText: isCustomBahtText && customThaiBahtText.trim() ? customThaiBahtText.trim() : totals.thaiBahtText,
      customThaiBahtText: isCustomBahtText && customThaiBahtText.trim() ? customThaiBahtText.trim() : undefined,
      status,
      templateStyle,
      language: initialDocument?.language || 'th',
      showPromptPayQR,
      qrCodeSource,
      customQrCodeUrl,
      promptPayId: activePromptPayTarget,
      promptPayAccountName: promptPayAccountName.trim() || currentCompany.promptPayName || currentCompany.name,
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

        {/* Issuer Company & Branch Selector Card */}
        <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-2xs space-y-4 bg-linear-to-r from-indigo-50/40 via-white to-slate-50/40">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-indigo-100/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">
                    ข้อมูลผู้ออกเอกสาร / สาขา (Issuer & Branch)
                  </h3>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                    {currentCompany.branchType === 'headquarters'
                      ? 'สำนักงานใหญ่'
                      : `สาขา ${currentCompany.branchNo || '00001'}`}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  เลือกสาขาที่ต้องการใช้ออกเอกสารนี้ ระบบจะดึงข้อมูลที่อยู่ เลขสาขา บัญชีธนาคาร และลายเซ็นของสาขานั้นมาแสดงให้อัตโนมัติ
                </p>
              </div>
            </div>

            {/* Branch Selector Dropdown & Quick Actions */}
            <div className="flex items-center gap-2">
              <div className="relative min-w-[220px] sm:min-w-[280px]">
                <select
                  value={selectedCompanyId}
                  onChange={(e) => handleSwitchIssuerBranch(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs cursor-pointer"
                >
                  {((companies && companies.length > 0) ? companies : [companyInfo]).map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.profileName || comp.name} (
                      {comp.branchType === 'headquarters'
                        ? 'สำนักงานใหญ่ 00000'
                        : `สาขา ${comp.branchNo || '00001'}`}
                      )
                    </option>
                  ))}
                </select>
              </div>

              {onOpenCompanyModal && (
                <button
                  type="button"
                  onClick={onOpenCompanyModal}
                  className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors whitespace-nowrap"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>จัดการสาขา</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Branch Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-start gap-3 shadow-2xs">
              <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                {currentCompany.logoUrl ? (
                  <img
                    src={currentCompany.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Building2 className="w-6 h-6 text-slate-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                {currentCompany.headerNameLine1 ? (
                  <div className="font-bold text-slate-900 text-xs leading-snug">
                    <div className="text-indigo-950 font-bold">{currentCompany.headerNameLine1}</div>
                    {currentCompany.headerNameLine2 && (
                      <div className="text-slate-700 font-medium text-[11px] mt-0.5">{currentCompany.headerNameLine2}</div>
                    )}
                    {currentCompany.headerNameLine3 && (
                      <div className="text-slate-700 font-medium text-[11px]">{currentCompany.headerNameLine3}</div>
                    )}
                  </div>
                ) : (
                  <div className="font-bold text-slate-900 truncate">
                    {currentCompany.name || 'ไม่ระบุชื่อบริษัท'}
                  </div>
                )}
                <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                  เลขภาษี: {currentCompany.taxId || '-'}
                </div>
                <div className="text-[11px] text-indigo-600 font-semibold mt-0.5 truncate">
                  {currentCompany.branchType === 'headquarters'
                    ? 'สำนักงานใหญ่ (00000)'
                    : `รหัสสาขา: ${currentCompany.branchNo || '00001'}`}
                </div>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="text-[11px] text-slate-400 font-semibold mb-1">ที่อยู่และข้อมูลติดต่อสาขา</div>
              <div className="text-slate-700 text-[11px] line-clamp-2 leading-relaxed">
                {currentCompany.address || '-'}
              </div>
              <div className="text-slate-500 text-[11px] mt-1 truncate">
                📞 {currentCompany.phone || '-'} | ✉️ {currentCompany.email || '-'}
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between shadow-2xs">
              <div className="min-w-0 flex-1 pr-2">
                <div className="text-[11px] text-slate-400 font-semibold mb-1">การรับชำระ & ลายเซ็นสาขา</div>
                <div className="text-slate-800 font-medium text-[11px] truncate">
                  🏦 {currentCompany.bankAccounts?.[0]
                    ? `${currentCompany.bankAccounts[0].bankName} (${currentCompany.bankAccounts.length} บัญชี)`
                    : 'ยังไม่ระบุบัญชี'}
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5 truncate">
                  ✍️ {preparedByName || currentCompany.signatureName || 'ยังไม่ระบุชื่อผู้ลงนาม'}
                </div>
              </div>
              {docStampUrl && (
                <div className="w-10 h-10 border border-slate-200 rounded-lg overflow-hidden shrink-0 p-0.5 bg-slate-50">
                  <img
                    src={docStampUrl}
                    alt="Stamp"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-xs">วันที่ออกเอกสาร</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-semibold text-xs">
                      {docType === 'quotation' ? 'ยืนราคาถึงวันที่' : 'วันครบกำหนดชำระ'}
                    </label>
                    {dueDate ? (
                      <button
                        type="button"
                        onClick={() => setDueDate('')}
                        className="text-[10px] text-rose-600 hover:text-rose-800 font-medium underline"
                      >
                        ล้างวัน (ไม่มี)
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400">(ไม่มีกำหนด)</span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs font-medium ${
                      dueDate ? 'border-indigo-300 text-indigo-800 bg-indigo-50/20' : 'border-slate-300 text-slate-500'
                    }`}
                  />
                  {/* Quick Preset Due Date buttons */}
                  <div className="flex flex-wrap items-center gap-1 mt-1.5">
                    <span className="text-[10px] text-slate-400">ลัด:</span>
                    <button
                      type="button"
                      onClick={() => handleSetDueDateDays(0)}
                      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                        !dueDate ? 'bg-slate-200 text-slate-800 font-bold border-slate-300' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ไม่มี
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDueDateDays(7)}
                      className="text-[10px] px-1.5 py-0.5 rounded border bg-slate-50 text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors"
                    >
                      +7 วัน
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDueDateDays(15)}
                      className="text-[10px] px-1.5 py-0.5 rounded border bg-slate-50 text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors"
                    >
                      +15 วัน
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDueDateDays(30)}
                      className="text-[10px] px-1.5 py-0.5 rounded border bg-slate-50 text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors"
                    >
                      +30 วัน
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDueDateDays(60)}
                      className="text-[10px] px-1.5 py-0.5 rounded border bg-slate-50 text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors"
                    >
                      +60 วัน
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-semibold text-xs">เงื่อนไขการชำระเงิน</label>
                  {currentCompany.defaultPaymentTerms && (
                    <button
                      type="button"
                      onClick={() => setPaymentTerms(currentCompany.defaultPaymentTerms || '')}
                      className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5 font-medium"
                    >
                      <span>↺ ดึงค่าเริ่มต้นสาขา</span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="เช่น เครดิต 30 วัน, มัดจำ 50% เมื่องานเริ่ม (เว้นว่างได้)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                />
                {/* Quick Payment Term Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-slate-400">เลือกด่วน:</span>
                  <button
                    type="button"
                    onClick={() => setPaymentTerms('')}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                      !paymentTerms ? 'bg-slate-200 text-slate-800 font-bold border-slate-300' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    เว้นว่าง
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentTerms('เงินสด / โอนชำระทันที')}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                      paymentTerms === 'เงินสด / โอนชำระทันที' ? 'bg-indigo-600 text-white border-indigo-600 font-semibold' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-indigo-50'
                    }`}
                  >
                    ชำระทันที
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentTerms('เครดิต 7 วัน')}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                      paymentTerms === 'เครดิต 7 วัน' ? 'bg-indigo-600 text-white border-indigo-600 font-semibold' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-indigo-50'
                    }`}
                  >
                    เครดิต 7 วัน
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentTerms('เครดิต 15 วัน')}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                      paymentTerms === 'เครดิต 15 วัน' ? 'bg-indigo-600 text-white border-indigo-600 font-semibold' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-indigo-50'
                    }`}
                  >
                    เครดิต 15 วัน
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentTerms('เครดิต 30 วัน')}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                      paymentTerms === 'เครดิต 30 วัน' ? 'bg-indigo-600 text-white border-indigo-600 font-semibold' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-indigo-50'
                    }`}
                  >
                    เครดิต 30 วัน
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentTerms('มัดจำ 50% เมื่องานเริ่ม')}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                      paymentTerms === 'มัดจำ 50% เมื่องานเริ่ม' ? 'bg-indigo-600 text-white border-indigo-600 font-semibold' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-indigo-50'
                    }`}
                  >
                    มัดจำ 50%
                  </button>
                </div>
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
            <table className="w-full text-xs text-left min-w-[650px]">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <th className="py-2.5 px-2 text-center w-10">#</th>
                  <th className="py-2.5 px-3">ชื่อรายการสินค้า / บริการ & รายละเอียด</th>
                  <th className="py-2.5 px-2 text-center w-20">จำนวน</th>
                  <th className="py-2.5 px-2 text-center w-20">หน่วย</th>
                  <th className="py-2.5 px-2 text-right w-28">ราคาต่อหน่วย</th>
                  <th className="py-2.5 px-3 text-right w-28">ยอดรวม (฿)</th>
                  <th className="py-2.5 px-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item, idx) => {
                  const itemTotal = item.quantity * item.unitPrice;

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
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>หมายเหตุและเงื่อนไขข้อตกลง (Notes & Terms)</span>
              </h3>
              {(currentCompany.defaultRemarks || currentCompany.defaultTerms) && (
                <button
                  type="button"
                  onClick={handleApplyBranchDefaults}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                  title="รีเซ็ตข้อความเป็นค่าเริ่มต้นที่ตั้งไว้ในข้อมูลสาขานี้"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>↺ ดึงค่าเริ่มต้นจากสาขานี้</span>
                </button>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 font-semibold text-xs">
                  หมายเหตุท้ายเอกสาร (Remarks)
                </label>
                <div className="flex items-center gap-2">
                  {currentCompany.defaultRemarks && (
                    <button
                      type="button"
                      onClick={() => setNotes(currentCompany.defaultRemarks || '')}
                      className="text-[10px] text-indigo-600 hover:underline"
                    >
                      ใช้ค่าเริ่มต้นสาขา
                    </button>
                  )}
                  {notes && (
                    <button
                      type="button"
                      onClick={() => setNotes('')}
                      className="text-[10px] text-slate-400 hover:text-rose-600"
                    >
                      ล้างข้อความ
                    </button>
                  )}
                </div>
              </div>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ระบุข้อความหมายเหตุเพิ่มเติมสำหรับเอกสารใบนี้..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 font-semibold text-xs">
                  เงื่อนไขและข้อตกลง (Terms & Conditions)
                </label>
                <div className="flex items-center gap-2">
                  {currentCompany.defaultTerms && (
                    <button
                      type="button"
                      onClick={() => setTermsAndConditions(currentCompany.defaultTerms || '')}
                      className="text-[10px] text-indigo-600 hover:underline"
                    >
                      ใช้ค่าเริ่มต้นสาขา
                    </button>
                  )}
                  {termsAndConditions && (
                    <button
                      type="button"
                      onClick={() => setTermsAndConditions('')}
                      className="text-[10px] text-slate-400 hover:text-rose-600"
                    >
                      ล้างข้อความ
                    </button>
                  )}
                </div>
              </div>
              <textarea
                rows={3}
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                placeholder="ระบุเงื่อนไขการรับประกัน การส่งมอบงาน หรือข้อตกลงเพิ่มเติม..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
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
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex justify-between text-slate-600 text-xs">
                  <span>รวมเป็นเงิน (Subtotal):</span>
                  <span className="font-mono font-medium">฿{formatCurrency(totals.subtotal)}</span>
                </div>

                {/* Direct Discount Input */}
                <div className="py-1 border-y border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-slate-700 text-xs">
                    <span className="font-semibold text-slate-700">ส่วนลด (Discount):</span>
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={overallDiscountValue === 0 ? '' : overallDiscountValue}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setOverallDiscountValue(val);
                            if (overallDiscountType === 'percent' && (!discountLabel || discountLabel.startsWith('('))) {
                              setDiscountLabel(val > 0 ? `(${val}%)` : '');
                            }
                          }}
                          placeholder="0.00"
                          className="w-28 px-2.5 py-1 text-right font-mono font-bold text-rose-600 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextType = overallDiscountType === 'percent' ? 'amount' : 'percent';
                          setOverallDiscountType(nextType);
                          if (nextType === 'percent' && overallDiscountValue > 0 && !discountLabel) {
                            setDiscountLabel(`(${overallDiscountValue}%)`);
                          }
                        }}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-colors ${
                          overallDiscountType === 'percent'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                        }`}
                        title="สลับระหว่าง บาท (฿) หรือ เปอร์เซ็นต์ (%)"
                      >
                        {overallDiscountType === 'percent' ? '%' : '฿'}
                      </button>
                    </div>
                  </div>

                  {/* Custom Discount Label / Text */}
                  <div className="bg-rose-50/50 p-2.5 rounded-lg border border-rose-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-700">
                        ข้อความส่วนลดสีแดง (พิมพ์ระบุเองได้ทั้งหมด):
                      </label>
                      {discountLabel && (
                        <button
                          type="button"
                          onClick={() => setDiscountLabel('')}
                          className="text-[10px] text-slate-400 hover:text-rose-600 font-medium"
                        >
                          ล้างข้อความ
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={discountLabel}
                      onChange={(e) => setDiscountLabel(e.target.value)}
                      placeholder={
                        overallDiscountType === 'percent' && overallDiscountValue > 0
                          ? `เช่น (${overallDiscountValue}%), ส่วนลดพิเศษ ${overallDiscountValue}%, ลดพิเศษ`
                          : 'เช่น ส่วนลดพิเศษ, (ลดพิเศษ), ส่วนลดลูกค้าประจำ'
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-rose-200 rounded-lg text-xs text-rose-700 font-medium focus:ring-2 focus:ring-rose-400 focus:outline-none placeholder:text-rose-300"
                    />
                    {/* Quick Preset Buttons */}
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      <span className="text-[9px] text-slate-400">ปุ่มเลือกด่วน:</span>
                      {overallDiscountType === 'percent' && overallDiscountValue > 0 && (
                        <button
                          type="button"
                          onClick={() => setDiscountLabel(`(${overallDiscountValue}%)`)}
                          className="text-[9px] px-2 py-0.5 rounded-md bg-white hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium transition-colors"
                        >
                          ({overallDiscountValue}%)
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDiscountLabel('(ลดพิเศษ)')}
                        className="text-[9px] px-2 py-0.5 rounded-md bg-white hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium transition-colors"
                      >
                        (ลดพิเศษ)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountLabel('ส่วนลดพิเศษ')}
                        className="text-[9px] px-2 py-0.5 rounded-md bg-white hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium transition-colors"
                      >
                        ส่วนลดพิเศษ
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountLabel('(โปรโมชั่น)')}
                        className="text-[9px] px-2 py-0.5 rounded-md bg-white hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium transition-colors"
                      >
                        (โปรโมชั่น)
                      </button>
                    </div>
                  </div>
                </div>

                {totals.discountTotal > 0 && (
                  <div className="flex justify-between text-rose-600 text-xs font-medium">
                    <span>{getDiscountDisplayText(discountLabel, overallDiscountType, overallDiscountValue)}</span>
                    <span className="font-mono font-semibold">-฿{formatCurrency(totals.discountTotal)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-700 font-medium text-xs">
                  <span>ยอดหลังหักส่วนลด:</span>
                  <span className="font-mono">฿{formatCurrency(totals.afterDiscount)}</span>
                </div>

                {vatType !== 'none' && (
                  <div className="flex justify-between text-slate-600 text-xs">
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

            {/* Thai Baht Text Box & Custom Manual Override */}
            <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-indigo-700 font-bold block uppercase flex items-center gap-1">
                  <FileText className="w-3 h-3 text-indigo-600" />
                  จำนวนเงินตัวอักษรภาษาไทย / Total in Words
                </span>
                <div className="flex items-center gap-1.5">
                  {isCustomBahtText ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomBahtText(false);
                        setCustomThaiBahtText('');
                      }}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-100/70 hover:bg-indigo-200 transition-colors"
                      title="กลับไปใช้ข้อความตัวอักษรที่ระบบคำนวณอัตโนมัติ"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      ใช้ตามระบบคำนวณ
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomBahtText(true);
                        setCustomThaiBahtText(totals.thaiBahtText || '');
                      }}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 px-1.5 py-0.5 rounded bg-white hover:bg-indigo-100 border border-indigo-200 transition-colors"
                      title="เปิดช่องพิมพ์แก้ไขข้อความตัวอักษรเอง"
                    >
                      <Edit3 className="w-2.5 h-2.5" />
                      แก้ไขตัวอักษรเอง
                    </button>
                  )}
                </div>
              </div>

              {isCustomBahtText ? (
                <div className="space-y-1.5 bg-white p-2 rounded-lg border border-indigo-200 shadow-2xs">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-amber-700 font-medium">โหมดกำหนดเอง (พิมพ์ข้อความที่ต้องการ):</span>
                    <button
                      type="button"
                      onClick={() => setCustomThaiBahtText(totals.thaiBahtText || '')}
                      className="text-indigo-600 hover:underline text-[10px]"
                    >
                      คัดลอกจากระบบ ({totals.thaiBahtText})
                    </button>
                  </div>
                  <input
                    type="text"
                    value={customThaiBahtText}
                    onChange={(e) => setCustomThaiBahtText(e.target.value)}
                    placeholder={totals.thaiBahtText || 'ระบุจำนวนเงินตัวอักษร เช่น หนึ่งหมื่นบาทถ้วน'}
                    className="w-full px-2 py-1.5 text-xs font-bold text-indigo-950 bg-indigo-50/40 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <div className="text-[10px] text-slate-500 flex items-center justify-between">
                    <span>แสดงบนเอกสาร: <strong className="text-indigo-900">({customThaiBahtText.trim() || totals.thaiBahtText})</strong></span>
                  </div>
                </div>
              ) : (
                <div className="bg-white/80 px-2.5 py-1.5 rounded-lg border border-indigo-100/70">
                  <span className="font-bold text-indigo-950 text-xs block">
                    ({totals.thaiBahtText || 'ศูนย์บาทถ้วน'})
                  </span>
                </div>
              )}
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
