import React from 'react';
import type { FormData } from '../types';

interface BorrowReturnFormProps {
  formData: FormData;
  onChange: (key: keyof FormData, value: any) => void;
}

const BorrowReturnForm: React.FC<BorrowReturnFormProps> = ({ formData, onChange }) => {
  return (
    <div className="card">
      <h2>借出 / 歸還 / 出庫</h2>
      <div className="grid">
        <label>
          樣品借出日期
          <input
            type="date"
            value={formData.borrowDate}
            onChange={(e) => onChange('borrowDate', e.target.value)}
          />
        </label>
        <label>
          借出人
          <input value={formData.borrower} onChange={(e) => onChange('borrower', e.target.value)} />
        </label>
        <label>
          樣品歸還日期
          <input
            type="date"
            value={formData.returnDate}
            onChange={(e) => onChange('returnDate', e.target.value)}
          />
        </label>
        <label>
          歸還人
          <input
            value={formData.returnOperator}
            onChange={(e) => onChange('returnOperator', e.target.value)}
          />
        </label>
        <label>
          出庫日期
          <input
            type="date"
            value={formData.outDate}
            onChange={(e) => onChange('outDate', e.target.value)}
          />
        </label>
        <label>
          樣品出庫數
          <input
            type="number"
            value={formData.outQty ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              onChange('outQty', val === '' ? null : Number(val));
            }}
          />
        </label>
      </div>
    </div>
  );
};

export default BorrowReturnForm;
