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
  // Persistence with LocalStorage
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
    const saved = localStorage.getItem('thai_docflow_company');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialCompanyInfo;
  });

  const [customers, setCustomers] = useState<CustomerInfo[]>(() => {
    const saved = localStorage.getItem('thai_docflow_customers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialCustomers;
  });

  const [products, setProducts] = useState<ProductCatalogItem[]>(() => {
    const saved = localStorage.getItem('thai_docflow_products');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialProductCatalog;
  });

  const [documents, setDocuments] = useState<DocumentModel[]>(() => {
    const saved = localStorage.getItem('thai_docflow_documents');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return createSampleDocuments();
  });

  // Save to LocalStorage on changes
  useEffect(() => {
    localStorage.setItem('thai_docflow_company', JSON.stringify(companyInfo));
  }, [companyInfo]);

  useEffect(() => {
    localStorage.setItem('thai_docflow_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('thai_docflow_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('thai_docflow_documents', JSON.stringify(documents));
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
  const [showResetConfirm, setShowResetConfirm] = useState(false);
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

  const handleResetSampleData = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmResetData = () => {
    setCompanyInfo(initialCompanyInfo);
    setCustomers(initialCustomers);
    setProducts(initialProductCatalog);
    setDocuments(createSampleDocuments());
    setViewMode('list');
    setShowResetConfirm(false);
    setToastMessage({ text: 'รีเซ็ตเป็นข้อมูลตัวอย่างเริ่มต้นสำเร็จ', type: 'success' });
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
        onResetSampleData={handleResetSampleData}
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
        onSave={(info) => setCompanyInfo(info)}
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

      {/* Reset Demo Data Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="รีเซ็ตเป็นข้อมูลตัวอย่างเริ่มต้น"
        message="คุณต้องการล้างข้อมูลปัจจุบันและโหลดข้อมูลตัวอย่างเริ่มต้น (ใบเสนอราคา, ใบวางบิล, ข้อมูลบริษัทตัวอย่าง) ใช่หรือไม่?"
        confirmText="ยืนยันรีเซ็ตข้อมูล"
        cancelText="ยกเลิก"
        type="warning"
        onConfirm={handleConfirmResetData}
        onCancel={() => setShowResetConfirm(false)}
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
