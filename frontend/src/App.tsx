import React, { useState } from 'react';
import HeaderForm from './components/HeaderForm';
import SampleDetailsTable from './components/SampleDetailsTable';
import BorrowReturnForm from './components/BorrowReturnForm';
import ExcelPanel from './components/ExcelPanel';
import WordPanel from './components/WordPanel';
import type { FormData, SampleItem } from './types';
import './App.css';

const createInitialForm = (): FormData => ({
  caseNo: '',
  quoteNo: '',
  customerName: '',
  productName: '',
  model: '',
  sales: '',
  inOperator: '',
  inDate: '',
  totalInQty: 0,
  sampleItems: [{ sampleNo: '', sampleName: '', qty: 1, remark: '' }],
  borrowDate: '',
  borrower: '',
  returnDate: '',
  returnOperator: '',
  outDate: '',
  outQty: null,
});

const App: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(createInitialForm());

  const updateField = (key: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateSampleItems = (items: SampleItem[]) => {
    setFormData((prev) => ({ ...prev, sampleItems: items.slice(0, 10) }));
  };

  return (
    <div className="container">
      <h1 className="page-title">出入庫管理系統</h1>
      <HeaderForm formData={formData} onChange={updateField} />
      <SampleDetailsTable sampleItems={formData.sampleItems} onChange={updateSampleItems} />
      <BorrowReturnForm formData={formData} onChange={updateField} />
      <ExcelPanel formData={formData} setFormData={setFormData} />
      <WordPanel formData={formData} />
    </div>
  );
};

export default App;
