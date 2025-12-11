import React, { useState } from 'react';
import axios from 'axios';
import {
  addExcelRow,
  downloadExcel,
  fetchExcelRow,
  overwriteExcelRow,
  uploadExcel,
} from '../api';
import type { FormData, SampleItem } from '../types';

interface ExcelPanelProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
}

function getMissingFields(form: FormData): string[] {
  const missing: string[] = [];
  const requiredStrings: (keyof FormData)[] = [
    'caseNo',
    'quoteNo',
    'customerName',
    'productName',
    'model',
    'sales',
    'inOperator',
    'inDate',
  ];
  requiredStrings.forEach((key) => {
    const value = form[key];
    if (typeof value !== 'string' || value.trim() === '') missing.push(String(key));
  });
  if (form.totalInQty === null || form.totalInQty === undefined || Number.isNaN(form.totalInQty)) {
    missing.push('totalInQty');
  }
  const items: SampleItem[] = form.sampleItems || [];
  if (!items.length) missing.push('sampleItems');
  items.forEach((item, index) => {
    if (!item.sampleNo) missing.push(`sampleItems[${index}].sampleNo`);
    if (!item.sampleName) missing.push(`sampleItems[${index}].sampleName`);
    const qty = Number(item.qty);
    if (!Number.isFinite(qty) || qty < 1) missing.push(`sampleItems[${index}].qty`);
  });
  return missing;
}

const ExcelPanel: React.FC<ExcelPanelProps> = ({ formData, setFormData }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  const setStatus = (msg?: string, err?: string) => {
    setMessage(msg || '');
    setError(err || '');
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRead = async () => {
    setStatus();
    setLoading('read');
    try {
      const res = await fetchExcelRow(formData.caseNo, formData.customerName);
      setFormData(res.data);
      setStatus(`已讀取第 ${res.rowIndex} 列`, '');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setStatus('', '查無此樣品總編號 + 客戶名稱');
      } else if (axios.isAxiosError(err) && err.response?.data?.message) {
        setStatus('', err.response.data.message);
      } else {
        setStatus('', '讀取失敗');
      }
    } finally {
      setLoading(null);
    }
  };

  const handleAdd = async () => {
    const missing = getMissingFields(formData);
    if (missing.length) {
      setStatus('', `缺少必填欄位：${missing.join(', ')}`);
      return;
    }
    setLoading('add');
    setStatus();
    try {
      const res = await addExcelRow(formData);
      setStatus(`已新增到第 ${res.rowIndex} 列`, '');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.missingFields) {
        setStatus('', `缺少必填欄位：${err.response.data.missingFields.join(', ')}`);
      } else {
        setStatus('', '新增失敗');
      }
    } finally {
      setLoading(null);
    }
  };

  const handleOverwrite = async () => {
    const missing = getMissingFields(formData);
    if (missing.length) {
      setStatus('', `缺少必填欄位：${missing.join(', ')}`);
      return;
    }
    setLoading('overwrite');
    setStatus();
    try {
      const res = await overwriteExcelRow(formData);
      setFormData(res.data);
      setStatus(`已覆蓋第 ${res.rowIndex} 列`, '');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.missingFields) {
        setStatus('', `缺少必填欄位：${err.response.data.missingFields.join(', ')}`);
      } else if (axios.isAxiosError(err) && err.response?.status === 404) {
        setStatus('', '找不到要覆蓋的列');
      } else {
        setStatus('', '覆蓋失敗');
      }
    } finally {
      setLoading(null);
    }
  };

  const handleDownload = async () => {
    setLoading('download');
    setStatus();
    try {
      const blob = await downloadExcel();
      triggerDownload(blob, 'QE-02-01.xlsx');
      setStatus('Excel 已下載', '');
    } catch (err) {
      setStatus('', '下載失敗');
    } finally {
      setLoading(null);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading('upload');
    setStatus();
    try {
      await uploadExcel(file);
      setStatus('已覆蓋伺服器 Excel 檔', '');
    } catch (err) {
      setStatus('', '上傳失敗');
    } finally {
      setLoading(null);
      event.target.value = '';
    }
  };

  const busy = Boolean(loading);
  const uploadInputId = 'excel-upload';

  return (
    <div className="card">
      <h2>Excel</h2>
      <div className="button-row">
        <button
          type="button"
          onClick={handleRead}
          disabled={busy || !formData.caseNo || !formData.customerName}
        >
          讀取 Excel
        </button>
        <button type="button" onClick={handleAdd} disabled={busy}>
          新增
        </button>
        <button type="button" onClick={handleOverwrite} disabled={busy}>
          覆蓋
        </button>
        <button type="button" onClick={handleDownload} disabled={busy}>
          下載 Excel
        </button>
        <label className="upload-label" htmlFor={uploadInputId}>
          上傳 Excel
        </label>
        <input
          id={uploadInputId}
          type="file"
          accept=".xlsx"
          onChange={handleUpload}
          disabled={busy}
          style={{
            position: 'absolute',
            opacity: 0,
            width: 0,
            height: 0,
            pointerEvents: 'none',
          }}
        />
      </div>
      {loading && <p className="info">處理中...</p>}
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default ExcelPanel;
