import axios from 'axios';
import type { FormData as FormPayload } from './types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  withCredentials: false,
});

export async function fetchExcelRow(caseNo: string, customerName: string) {
  const res = await api.get('/excel/row', { params: { caseNo, customerName } });
  return res.data as { rowIndex: number; data: FormPayload };
}

export async function addExcelRow(form: FormPayload) {
  const res = await api.post('/excel/add', form);
  return res.data as { rowIndex: number; data: FormPayload };
}

export async function overwriteExcelRow(form: FormPayload) {
  const res = await api.post('/excel/overwrite', form);
  return res.data as { rowIndex: number; data: FormPayload };
}

export async function downloadExcel(): Promise<Blob> {
  const res = await api.get('/excel/download', { responseType: 'blob' });
  return res.data as Blob;
}

export async function uploadExcel(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post('/excel/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function downloadQe0204(form: FormPayload): Promise<Blob> {
  const res = await api.post('/docs/qe0204', form, { responseType: 'blob' });
  return res.data as Blob;
}

export async function downloadOuterBox(form: FormPayload): Promise<Blob> {
  const res = await api.post('/docs/outer-box', form, { responseType: 'blob' });
  return res.data as Blob;
}

export async function downloadLabels(form: FormPayload): Promise<Blob> {
  const res = await api.post('/docs/labels', form, { responseType: 'blob' });
  return res.data as Blob;
}
