import React from 'react';
import { SampleItem } from '../types';

interface SampleDetailsTableProps {
  sampleItems: SampleItem[];
  onChange: (items: SampleItem[]) => void;
}

const MAX_ROWS = 10;

const SampleDetailsTable: React.FC<SampleDetailsTableProps> = ({ sampleItems, onChange }) => {
  const handleChange = (index: number, key: keyof SampleItem, value: string | number) => {
    const next = sampleItems.map((item, i) => (i === index ? { ...item, [key]: value } : item));
    onChange(next);
  };

  const handleQtyChange = (index: number, raw: string) => {
    const num = Number(raw);
    const safe = Number.isFinite(num) && num > 0 ? Math.floor(num) : 1;
    handleChange(index, 'qty', safe);
  };

  const addRow = () => {
    if (sampleItems.length >= MAX_ROWS) return;
    onChange([...sampleItems, { sampleNo: '', sampleName: '', qty: 1, remark: '' }]);
  };

  const removeRow = (index: number) => {
    if (sampleItems.length <= 1) return;
    onChange(sampleItems.filter((_, i) => i !== index));
  };

  return (
    <div className="card">
      <div className="header-with-action">
        <h2>樣品明細</h2>
        <button type="button" onClick={addRow} disabled={sampleItems.length >= MAX_ROWS}>
          新增列 (最多 10)
        </button>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>樣品編號*</th>
              <th>樣品名稱*</th>
              <th>數量*</th>
              <th>備註</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {sampleItems.map((item, index) => (
              <tr key={index}>
                <td>
                  <input
                    value={item.sampleNo}
                    onChange={(e) => handleChange(index, 'sampleNo', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    value={item.sampleName}
                    onChange={(e) => handleChange(index, 'sampleName', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={1}
                    value={item.qty ?? 1}
                    onChange={(e) => handleQtyChange(index, e.target.value)}
                  />
                </td>
                <td>
                  <input
                    value={item.remark}
                    onChange={(e) => handleChange(index, 'remark', e.target.value)}
                  />
                </td>
                <td>
                  <button type="button" onClick={() => removeRow(index)} disabled={sampleItems.length <= 1}>
                    刪除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SampleDetailsTable;
