/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  DocumentModel,
  DocumentType,
  DocumentStatus,
  CompanyInfo,
  CustomerInfo,
  ProductCatalogItem,
} from './types';
import {
  initialCompanyInfo,
  initialCustomers,
  initialProductCatalog,
  createSampleDocuments,
} from './utils/sampleData';
import { safeGetLocal, getStoredItem, setStoredItem } from './utils/storage';
import { Navbar } from './components/Navbar';
import { DashboardStats } from './components/DashboardStats';
import { DocumentList } from './components/DocumentList';
import { DocumentEditor } from './components/DocumentEditor';
import { DocumentPreview } from './components/DocumentPreview';
import { CompanyProfileModal } from './components/CompanyProfileModal';
import { CustomerModal } from './components/CustomerModal';
import { ProductCatalogModal } from './components/ProductCatalogModal';
import { ConvertDocumentModal } from './components/ConvertDocumentModal';
import { ConfirmModal } from './components/ConfirmModal';

export default function App() {
  // Persistence with Safe IndexedDB + LocalStorage
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() =>
    safeGetLocal('thai_docflow_company', initialCompanyInfo)
  );

  const [customers, setCustomers] = useState<CustomerInfo[]>(() =>
    safeGetLocal('thai_docflow_customers', initialCustomers)
  );

  const [products, setProducts] = useState<ProductCatalogItem[]>(() =>
    safeGetLocal('thai_docflow_products', initialProductCatalog)
  );

  const [documents, setDocuments] = useState<DocumentModel[]>(() =>
    safeGetLocal('thai_docflow_documents', createSampleDocuments())
  );

  // Load from IndexedDB on startup (supports large storage for logos & signatures)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [savedCompany, savedCustomers, savedProducts, savedDocs] = await Promise.all([
          getStoredItem('thai_docflow_company', companyInfo),
          getStoredItem('thai_docflow_customers', customers),
          getStoredItem('thai_docflow_products', products),
          getStoredItem('thai_docflow_documents', documents),
        ]);
        if (isMounted) {
          if (savedCompany) setCompanyInfo(savedCompany);
          if (savedCustomers) setCustomers(savedCustomers);
          if (savedProducts) setProducts(savedProducts);
          if (savedDocs && Array.isArray(savedDocs)) setDocuments(savedDocs);
        }
      } catch (err) {
        console.warn('Error hydrating from persistent storage:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save to Safe Storage on changes without throwing QuotaExceededError
  useEffect(() => {
    setStoredItem('thai_docflow_company', companyInfo).catch(console.error);
  }, [companyInfo]);

  useEffect(() => {
    setStoredItem('thai_docflow_customers', customers).catch(console.error);
  }, [customers]);

  useEffect(() => {
    setStoredItem('thai_docflow_products', products).catch(console.error);
  }, [products]);

  useEffect(() => {
    setStoredItem('thai_docflow_documents', documents).catch(console.error);
  }, [documents]);

  // Views & Active State
  const [viewMode, setViewMode] = useState<'list' | 'editor' | 'preview'>('list');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocumentModel | null>(null);
  const [newDocType, setNewDocType] = useState<DocumentType>('quotation');

  // Modals & Dialogs
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [convertDoc, setConvertDoc] = useState<DocumentModel | null>(null);
  const [deleteTargetDoc, setDeleteTargetDoc] = useState<DocumentModel | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Auto hide toast after 3s
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Active document object
  const activeDocument = documents.find((d) => d.id === selectedDocId) || documents[0];

  // Navigation handlers
  const handleStartCreateNew = (type: DocumentType) => {
    setEditingDoc(null);
    setNewDocType(type);
    setViewMode('editor');
  };

  const handleStartEdit = (doc: DocumentModel) => {
    setEditingDoc(doc);
    setViewMode('editor');
  };

  const handleViewDoc = (doc: DocumentModel) => {
    setSelectedDocId(doc.id);
    setViewMode('preview');
  };

  const handleSaveDocument = (doc: DocumentModel, viewImmediately: boolean = false) => {
    setDocuments((prev) => {
      const idx = prev.findIndex((d) => d.id === doc.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = doc;
        return updated;
      }
      return [doc, ...prev];
    });

    setToastMessage({ text: `บันทึกเอกสาร ${doc.documentNumber} สำเร็จ`, type: 'success' });

    if (viewImmediately) {
      setSelectedDocId(doc.id);
      setViewMode('preview');
    } else {
      setViewMode('list');
    }
  };

  const handleUpdateStatus = (id: string, newStatus: DocumentStatus) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: newStatus, updatedAt: new Date().toISOString() } : d))
    );
  };

  const handleUpdateDocument = (updatedDoc: DocumentModel) => {
    setDocuments((prev) => prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)));
  };

  const handleDeleteDocument = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (doc) {
      setDeleteTargetDoc(doc);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteTargetDoc) {
      const targetId = deleteTargetDoc.id;
      const targetNum = deleteTargetDoc.documentNumber;
      setDocuments((prev) => prev.filter((d) => d.id !== targetId));
      if (selectedDocId === targetId) {
        setViewMode('list');
      }
      setDeleteTargetDoc(null);
      setToastMessage({ text: `ลบเอกสาร ${targetNum} เรียบร้อยแล้ว`, type: 'success' });
    }
  };

  const handleDuplicateDocument = (doc: DocumentModel) => {
    const newDoc: DocumentModel = {
      ...doc,
      id: `doc-${doc.type}-${Date.now()}`,
      documentNumber: `${doc.documentNumber}-COPY`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDocuments((prev) => [newDoc, ...prev]);
    setToastMessage({ text: `คัดลอกเอกสาร ${doc.documentNumber} สำเร็จ`, type: 'success' });
  };

  // Customer Management
  const handleSaveCustomer = (cust: CustomerInfo) => {
    setCustomers((prev) => {
      const idx = prev.findIndex((c) => c.id === cust.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = cust;
        return updated;
      }
      return [...prev, cust];
    });
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  // Product Management
  const handleSaveProduct = (prod: ProductCatalogItem) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === prod.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = prod;
        return updated;
      }
      return [...prev, prod];
    });
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Export / Backup
  const handleExportData = () => {
    const data = {
      companyInfo,
      customers,
      products,
      documents,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thai-documents-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToastMessage({ text: 'ส่งออกไฟล์สำรองข้อมูล JSON สำเร็จ', type: 'success' });
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.companyInfo) setCompanyInfo(parsed.companyInfo);
          if (parsed.customers) setCustomers(parsed.customers);
          if (parsed.products) setProducts(parsed.products);
          if (parsed.documents) setDocuments(parsed.documents);
          setToastMessage({ text: 'นำเข้าข้อมูลทั้งหมดสำเร็จเรียบร้อยแล้ว!', type: 'success' });
        } catch (err) {
          setToastMessage({ text: 'ไฟล์ข้อมูลไม่ถูกต้อง กรุณาเลือกไฟล์ JSON ที่สำรองไว้', type: 'error' });
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-['Prompt',sans-serif] flex flex-col">
      {/* Top Navigation */}
      <Navbar
        companyName={companyInfo.name}
        onOpenCompanyProfile={() => setShowCompanyModal(true)}
        onOpenCustomers={() => setShowCustomerModal(true)}
        onOpenProducts={() => setShowProductModal(true)}
        onCreateNewDoc={handleStartCreateNew}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {viewMode === 'editor' && (
          <DocumentEditor
            initialDocument={editingDoc}
            defaultType={newDocType}
            companyInfo={companyInfo}
            customers={customers}
            products={products}
            existingDocsCount={documents.length}
            onSave={handleSaveDocument}
            onCancel={() => setViewMode('list')}
            onSaveCustomer={handleSaveCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

        {viewMode === 'preview' && (
          activeDocument ? (
            <DocumentPreview
              document={activeDocument}
              onBack={() => setViewMode('list')}
              onEdit={handleStartEdit}
              onConvert={(doc) => setConvertDoc(doc)}
              onDelete={handleDeleteDocument}
              onUpdateStatus={handleUpdateStatus}
              onUpdateDocument={handleUpdateDocument}
            />
          ) : (
            <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
              <p className="text-slate-700 font-semibold text-sm">ไม่พบเอกสารที่ต้องการดูตัวอย่าง</p>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                กลับสู่หน้ารายการเอกสาร
              </button>
            </div>
          )
        )}

        {viewMode === 'list' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Dashboard Overview Cards */}
            <DashboardStats
              documents={documents}
              onCreateNew={handleStartCreateNew}
            />

            {/* Document Manager & Filterable Table */}
            <DocumentList
              documents={documents}
              onView={handleViewDoc}
              onEdit={handleStartEdit}
              onConvert={(doc) => setConvertDoc(doc)}
              onDuplicate={handleDuplicateDocument}
              onDelete={handleDeleteDocument}
              onCreateNew={handleStartCreateNew}
              onUpdateStatus={handleUpdateStatus}
              onExportData={handleExportData}
              onImportData={handleImportData}
            />
          </div>
        )}
      </main>

      {/* Global Modals */}
      <CompanyProfileModal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        companyInfo={companyInfo}
        onSave={(info) => {
          setCompanyInfo(info);
          setDocuments((prev) =>
            prev.map((d) => ({
              ...d,
              company: {
                ...d.company,
                ...info,
                signatureUrl: d.company.signatureUrl || info.signatureUrl,
                stampUrl: d.company.stampUrl || info.stampUrl,
              },
            }))
          );
          setToastMessage({ text: 'บันทึกข้อมูลกิจการเรียบร้อยแล้ว', type: 'success' });
        }}
      />

      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        customers={customers}
        onSaveCustomer={handleSaveCustomer}
        onDeleteCustomer={handleDeleteCustomer}
      />

      <ProductCatalogModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        products={products}
        onSaveProduct={handleSaveProduct}
        onDeleteProduct={handleDeleteProduct}
      />

      {convertDoc && (
        <ConvertDocumentModal
          isOpen={Boolean(convertDoc)}
          onClose={() => setConvertDoc(null)}
          sourceDoc={convertDoc}
          existingDocsCount={documents.length}
          onConvert={(newDoc) => {
            setDocuments((prev) => [newDoc, ...prev]);
            setSelectedDocId(newDoc.id);
            setViewMode('preview');
          }}
        />
      )}

      {/* Delete Document Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetDoc)}
        title="ยืนยันการลบเอกสาร"
        message={
          deleteTargetDoc
            ? `คุณต้องการลบเอกสารเลขที่ "${deleteTargetDoc.documentNumber}" (${deleteTargetDoc.customer?.name || 'ไม่ระบุลูกค้า'}) ใช่หรือไม่? การกระทำนี้จะไม่สามารถเรียกคืนข้อมูลได้`
            : ''
        }
        confirmText="ลบเอกสารนี้"
        cancelText="ยกเลิก"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetDoc(null)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 ${
              toastMessage.type === 'success'
                ? 'bg-slate-900 text-white border-slate-800'
                : 'bg-rose-600 text-white border-rose-700'
            }`}
          >
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
