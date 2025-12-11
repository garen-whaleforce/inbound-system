import fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { PATHS } from '../config/paths';
import { FormData } from '../types';

interface LabelData {
  labelCaseNo: string;
  customerName: string;
  model: string;
  inDate: string;
}

interface LabelRow {
  c1?: LabelData;
  c2?: LabelData;
  c3?: LabelData;
  c4?: LabelData;
  c5?: LabelData;
}

function renderTemplate(templatePath: string, data: Record<string, unknown>): Buffer {
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  const content = fs.readFileSync(templatePath);
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '[[', end: ']]' },
  });
  doc.render(data);
  return doc.getZip().generate({ type: 'nodebuffer' });
}

export function generateQe0204Doc(form: FormData): Buffer {
  const data = {
    inOperator: form.inOperator,
    inDate: form.inDate,
    returnOperator: form.returnOperator,
    returnDate: form.returnDate,
    customerName: form.customerName,
    caseNo: form.caseNo,
    totalInQty: form.totalInQty,
    samples: form.sampleItems.map((item) => ({
      sampleNo: item.sampleNo,
      sampleName: item.sampleName,
      remark: item.remark,
    })),
  };
  return renderTemplate(PATHS.TEMPLATE_QE0204, data);
}

export function generateOuterBoxDoc(form: FormData): Buffer {
  const data = {
    caseNo: form.caseNo,
    quoteNo: form.quoteNo,
    customerName: form.customerName,
    model: form.model,
    totalInQty: form.totalInQty,
    inDate: form.inDate,
  };
  return renderTemplate(PATHS.TEMPLATE_OUTER_BOX, data);
}

export function buildLabelCodes(sampleNo: string, qty: number): string[] {
  const match = sampleNo.match(/(\d+)$/);
  const count = qty && qty > 0 ? qty : 1;
  if (!match) {
    return Array.from({ length: count }, () => sampleNo);
  }
  const digits = match[1];
  const width = digits.length;
  const base = parseInt(digits, 10);
  const prefix = sampleNo.slice(0, sampleNo.length - width);

  const codes: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const value = base + i;
    const padded = String(value).padStart(width, '0');
    codes.push(`${prefix}${padded}`);
  }
  return codes;
}

export function buildLabelsFromForm(form: FormData): LabelData[] {
  const labels: LabelData[] = [];
  (form.sampleItems || []).forEach((item) => {
    const qty = item.qty && item.qty > 0 ? item.qty : 1;
    const codes = buildLabelCodes(item.sampleNo, qty);
    codes.forEach((code) => {
      labels.push({
        labelCaseNo: code,
        customerName: form.customerName,
        model: form.model,
        inDate: form.inDate,
      });
    });
  });
  return labels;
}

function buildLabelRows(labels: LabelData[], perRow = 5): LabelRow[] {
  const rows: LabelRow[] = [];
  for (let i = 0; i < labels.length; i += perRow) {
    rows.push({
      c1: labels[i],
      c2: labels[i + 1],
      c3: labels[i + 2],
      c4: labels[i + 3],
      c5: labels[i + 4],
    });
  }
  return rows;
}

export function generateLabelDoc(form: FormData): Buffer {
  const labels = buildLabelsFromForm(form);
  // debug log
  // eslint-disable-next-line no-console
  console.log('generateLabelDoc labels.length =', labels.length);
  // eslint-disable-next-line no-console
  if (labels.length > 0) console.log('generateLabelDoc labels[0] =', labels[0]);
  const labelRows = buildLabelRows(labels, 5);
  const data = { labelRows };
  return renderTemplate(PATHS.TEMPLATE_LABEL, data);
}
