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
  initialCompanies,
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
  const [companies, setCompanies] = useState<CompanyInfo[]>(() => {
    const storedList = safeGetLocal('thai_docflow_companies', null);
    if (storedList && Array.isArray(storedList) && storedList.length > 0) {
      return storedList;
    }
    const legacySingle = safeGetLocal('thai_docflow_company', null);
    if (legacySingle && legacySingle.name) {
      return [
        {
          ...legacySingle,
          id: legacySingle.id || 'company-hq',
          profileName: legacySingle.profileName || 'สำนักงานใหญ่',
          isDefault: true,
        },
      ];
    }
    return initialCompanies;
  });

  const [activeCompanyId, setActiveCompanyId] = useState<string>(() => {
    const defaultComp = companies.find((c) => c.isDefault) || companies[0];
    return defaultComp?.id || 'company-hq';
  });

  const [customers, setCustomers] = useState<CustomerInfo[]>(() =>
    safeGetLocal('thai_docflow_customers', initialCustomers)
  );

  const [products, setProducts] = useState<ProductCatalogItem[]>(() =>
    safeGetLocal('thai_docflow_products', initialProductCatalog)
  );

  const [documents, setDocuments] = useState<DocumentModel[]>(() =>
    safeGetLocal('thai_docflow_documents', createSampleDocuments())
  );

  // Active Company / Branch reference
  const activeCompany =
    companies.find((c) => c.id === activeCompanyId) ||
    companies.find((c) => c.isDefault) ||
    companies[0] ||
    initialCompanyInfo;

  // Load from IndexedDB on startup (supports large storage for logos & signatures)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [savedCompanies, savedCustomers, savedProducts, savedDocs] = await Promise.all([
          getStoredItem('thai_docflow_companies', companies),
          getStoredItem('thai_docflow_customers', customers),
          getStoredItem('thai_docflow_products', products),
          getStoredItem('thai_docflow_documents', documents),
        ]);
        if (isMounted) {
          if (savedCompanies && Array.isArray(savedCompanies) && savedCompanies.length > 0) {
            setCompanies(savedCompanies);
          }
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
    setStoredItem('thai_docflow_companies', companies).catch(console.error);
  }, [companies]);

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

  // Auto hide toast after 3.5s
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

  // Document Handlers
  const handleStartCreateNew = (type: DocumentType = 'quotation') => {
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

  const handleSaveDocument = (savedDoc: DocumentModel, viewImmediately = true) => {
    setDocuments((prev) => {
      const existsIndex = prev.findIndex((d) => d.id === savedDoc.id);
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = savedDoc;
        return updated;
      }
      return [savedDoc, ...prev];
    });

    setToastMessage({
      text: `บันทึกเอกสาร ${savedDoc.documentNumber} เรียบร้อยแล้ว!`,
      type: 'success',
    });

    if (viewImmediately) {
      setSelectedDocId(savedDoc.id);
      setViewMode('preview');
    } else {
      setViewMode('list');
    }
  };

  const handleUpdateDocument = (updatedDoc: DocumentModel) => {
    setDocuments((prev) => prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)));
    setToastMessage({ text: `อัปเดตเอกสาร ${updatedDoc.documentNumber} สำเร็จ`, type: 'success' });
  };

  const handleUpdateStatus = (id: string, status: DocumentStatus) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status, updatedAt: new Date().toISOString() } : d))
    );
    setToastMessage({ text: 'อัปเดตสถานะเอกสารสำเร็จ', type: 'success' });
  };

  const handleDeleteDocument = (id: string) => {
    const docToDelete = documents.find((d) => d.id === id);
    if (docToDelete) {
      setDeleteTargetDoc(docToDelete);
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

  // Company / Multi-Branch Management
  const handleSaveCompanies = (updatedCompanies: CompanyInfo[], newActiveId?: string) => {
    setCompanies(updatedCompanies);
    if (newActiveId) {
      setActiveCompanyId(newActiveId);
    }
    setToastMessage({
      text: `บันทึกข้อมูลสาขา & กิจการ (${updatedCompanies.length} สาขา) สำเร็จ`,
      type: 'success',
    });
  };

  const handleSwitchActiveCompany = (compBranchId: string) => {
    setActiveCompanyId(compBranchId);
    const targetComp = companies.find((c) => c.id === compBranchId);
    if (targetComp) {
      setToastMessage({
        text: `สลับไปใช้ "${targetComp.profileName || targetComp.name}" เรียบร้อยแล้ว`,
        type: 'success',
      });
    }
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
      companies,
      activeCompanyId,
      companyInfo: activeCompany,
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
          if (parsed.companies && Array.isArray(parsed.companies)) {
            setCompanies(parsed.companies);
            if (parsed.activeCompanyId) setActiveCompanyId(parsed.activeCompanyId);
          } else if (parsed.companyInfo) {
            setCompanies([
              {
                ...parsed.companyInfo,
                id: parsed.companyInfo.id || 'company-hq',
                profileName: parsed.companyInfo.profileName || 'สำนักงานใหญ่',
                isDefault: true,
              },
            ]);
          }
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
        companyName={activeCompany.name}
        companies={companies}
        activeCompany={activeCompany}
        onSwitchActiveCompany={handleSwitchActiveCompany}
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
            companies={companies}
            companyInfo={activeCompany}
            customers={customers}
            products={products}
            existingDocsCount={documents.length}
            onSave={handleSaveDocument}
            onCancel={() => setViewMode('list')}
            onSaveCustomer={handleSaveCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onOpenCompanyModal={() => setShowCompanyModal(true)}
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
        companies={companies}
        activeCompanyId={activeCompanyId}
        onSaveCompanies={handleSaveCompanies}
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
