export type DocumentType = 'quotation' | 'billing' | 'invoice' | 'receipt';

export type DocumentStatus = 'draft' | 'pending' | 'approved' | 'paid' | 'overdue' | 'cancelled';

export type VatType = 'excluded' | 'included' | 'none';

export type TemplateStyle = 'modern' | 'quotation' | 'corporate' | 'classic' | 'minimal';

export type DocumentLanguage = 'th' | 'en' | 'bilingual';

export interface CompanyInfo {
  name: string;
  nameEn?: string;
  taxId: string;
  branchType: 'headquarters' | 'branch';
  branchNo: string;
  address: string;
  addressEn?: string;
  phone: string;
  email: string;
  website?: string;
  logoUrl?: string;
  stampUrl?: string;
  signatureUrl?: string;
  signatureName: string;
  signaturePosition: string;
  qrCodeUrl?: string; // Uploaded custom PromptPay or Bank QR Code image
  promptPayId?: string; // Phone, Tax ID, or Citizen ID
  promptPayName?: string; // PromptPay Account Name
  promptPayType?: 'phone' | 'taxId' | 'citizenId' | 'eWallet';
  bankAccounts: BankAccount[];
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch?: string;
  isDefault?: boolean;
}

export interface CustomerInfo {
  id?: string;
  name: string;
  nameEn?: string;
  contactPerson?: string;
  taxId: string;
  branchType: 'headquarters' | 'branch';
  branchNo: string;
  address: string;
  addressEn?: string;
  phone: string;
  email: string;
  notes?: string;
}

export interface DocumentItem {
  id: string;
  code?: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountType: 'percent' | 'amount';
  discountValue: number;
  isTaxable: boolean;
  total: number;
}

export interface DocumentModel {
  id: string;
  type: DocumentType;
  documentNumber: string;
  referenceNumber?: string; // e.g. Reference to Quotation or Invoice
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  paymentTerms?: string; // e.g., '30 วัน', 'ชำระทันที', '7 วัน'
  
  company: CompanyInfo;
  customer: CustomerInfo;
  items: DocumentItem[];
  
  notes?: string;
  termsAndConditions?: string;
  
  // Financial calculation fields
  subtotal: number;
  discountTotal: number;
  afterDiscount: number;
  vatType: VatType;
  vatRate: number; // e.g. 7
  vatAmount: number;
  withholdingTaxRate: number; // 0, 0.5, 0.75, 1, 1.5, 2, 3, 5%
  withholdingTaxAmount: number;
  grandTotal: number; // Total with VAT
  netPayment: number; // Total after Withholding Tax deduction
  thaiBahtText: string;
  
  status: DocumentStatus;
  templateStyle: TemplateStyle;
  language: DocumentLanguage;
  
  // Payment info display
  showPromptPayQR: boolean;
  qrCodeSource?: 'auto' | 'upload'; // Auto generated EMVCo or Uploaded custom image
  customQrCodeUrl?: string; // Uploaded custom QR code image
  promptPayId?: string;
  promptPayAccountName?: string;
  promptPayAmountType?: 'full' | 'open' | 'custom';
  promptPayCustomAmount?: number;
  selectedBankAccountId?: string;
  
  // Signatures
  showSignature: boolean;
  showStamp: boolean;
  preparedByName?: string;
  approvedByName?: string;
  receivedByName?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface ProductCatalogItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  unit: string;
  unitPrice: number;
  isTaxable: boolean;
}
