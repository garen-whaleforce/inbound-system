import React, { useState } from 'react';
import axios from 'axios';
import { downloadLabels, downloadOuterBox, downloadQe0204 } from '../api';
import type { FormData } from '../types';

interface WordPanelProps {
  formData: FormData;
}

const WordPanel: React.FC<WordPanelProps> = ({ formData }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const checkMissing = (fields: (keyof FormData)[]) => {
    const missing: string[] = [];
    fields.forEach((key) => {
      const value = formData[key];
      if (typeof value === 'string') {
        if (!value.trim()) missing.push(String(key));
      } else if (value === null || value === undefined) {
        missing.push(String(key));
      }
    });
    return missing;
  };

  const handleDownload = async (
    action: 'qe0204' | 'outer' | 'labels',
    fields: (keyof FormData)[],
    downloader: (form: FormData) => Promise<Blob>,
    filename: string,
  ) => {
    const missing = checkMissing(fields);
    if (missing.length) {
      setError(`缺少必填欄位：${missing.join(', ')}`);
      setMessage('');
      return;
    }
    setLoading(action);
    setError('');
    setMessage('');
    try {
      const blob = await downloader(formData);
      triggerDownload(blob, filename);
      setMessage('已產生並下載');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('下載失敗');
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="card">
      <h2>Word 產出</h2>
      <div className="button-row">
        <button
          type="button"
          disabled={loading === 'qe0204'}
          onClick={() =>
            handleDownload(
              'qe0204',
              ['caseNo', 'customerName', 'inOperator', 'inDate', 'totalInQty'],
              downloadQe0204,
              `QE-02-04_${formData.caseNo || 'unknown'}_${formData.inDate || 'date'}.docx`,
            )
          }
        >
          下載 QE-02-04 入庫/歸還單
        </button>
        <button
          type="button"
          disabled={loading === 'outer'}
          onClick={() =>
            handleDownload(
              'outer',
              ['caseNo', 'quoteNo', 'customerName', 'model', 'totalInQty', 'inDate'],
              downloadOuterBox,
              `外箱標誌_${formData.caseNo || 'unknown'}_${formData.inDate || 'date'}.docx`,
            )
          }
        >
          下載外箱標誌
        </button>
        <button
          type="button"
          disabled={loading === 'labels'}
          onClick={() =>
            handleDownload(
              'labels',
              ['caseNo', 'customerName', 'model', 'inDate'],
              downloadLabels,
              `樣品小標籤_${formData.caseNo || 'unknown'}_${formData.inDate || 'date'}.docx`,
            )
          }
        >
          下載樣品小標籤
        </button>
      </div>
      {loading && <p className="info">處理中...</p>}
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default WordPanel;
