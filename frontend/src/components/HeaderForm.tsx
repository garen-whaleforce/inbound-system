import React from 'react';
import type { FormData } from '../types';

interface HeaderFormProps {
  formData: FormData;
  onChange: (key: keyof FormData, value: any) => void;
}

const HeaderForm: React.FC<HeaderFormProps> = ({ formData, onChange }) => {
  return (
    <div className="card">
      <h2>基本資料</h2>
      <div className="grid">
        <label>
          樣品總編號*
          <input
            value={formData.caseNo}
            onChange={(e) => onChange('caseNo', e.target.value)}
          />
        </label>
        <label>
          報價單編號*
          <input
            value={formData.quoteNo}
            onChange={(e) => onChange('quoteNo', e.target.value)}
          />
        </label>
        <label>
          客戶名稱*
          <input
            value={formData.customerName}
            onChange={(e) => onChange('customerName', e.target.value)}
          />
        </label>
        <label>
          品名*
          <input
            value={formData.productName}
            onChange={(e) => onChange('productName', e.target.value)}
          />
        </label>
        <label>
          型號*
          <input value={formData.model} onChange={(e) => onChange('model', e.target.value)} />
        </label>
        <label>
          負責業務*
          <input value={formData.sales} onChange={(e) => onChange('sales', e.target.value)} />
        </label>
        <label>
          樣品入庫人*
          <input
            value={formData.inOperator}
            onChange={(e) => onChange('inOperator', e.target.value)}
          />
        </label>
        <label>
          入庫日期*
          <input
            type="date"
            value={formData.inDate}
            onChange={(e) => onChange('inDate', e.target.value)}
          />
        </label>
        <label>
          入庫總數量*
          <input
            type="number"
            min={0}
            value={formData.totalInQty}
            onChange={(e) => onChange('totalInQty', Number(e.target.value))}
          />
        </label>
      </div>
    </div>
  );
};

export default HeaderForm;
