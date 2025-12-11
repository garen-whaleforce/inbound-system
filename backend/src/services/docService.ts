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
  col1?: LabelData;
  col2?: LabelData;
  col3?: LabelData;
  col4?: LabelData;
  col5?: LabelData;
  col6?: LabelData;
  col7?: LabelData;
  col8?: LabelData;
  col9?: LabelData;
  col10?: LabelData;
  col11?: LabelData;
  col12?: LabelData;
  col13?: LabelData;
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

export function buildLabelCodes(baseNo: string, qty: number): string[] {
  const result: string[] = [];
  const safeQty = Math.max(1, qty || 1);

  if (!baseNo) {
    return result;
  }

  const m = baseNo.match(/(\d+)$/);

  if (m) {
    const digits = m[1];
    const width = digits.length;
    const prefix = baseNo.slice(0, -width);
    let num = parseInt(digits, 10);

    for (let i = 0; i < safeQty; i += 1, num += 1) {
      const suffix = String(num).padStart(width, '0');
      result.push(prefix + suffix);
    }
  } else {
    for (let i = 1; i <= safeQty; i += 1) {
      const suffix = String(i).padStart(2, '0');
      result.push(`${baseNo}-${suffix}`);
    }
  }

  return result;
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

function buildLabelRows(labels: LabelData[]): LabelRow[] {
  const rows: LabelRow[] = [];
  for (let i = 0; i < labels.length; i += 13) {
    rows.push({
      col1: labels[i],
      col2: labels[i + 1],
      col3: labels[i + 2],
      col4: labels[i + 3],
      col5: labels[i + 4],
      col6: labels[i + 5],
      col7: labels[i + 6],
      col8: labels[i + 7],
      col9: labels[i + 8],
      col10: labels[i + 9],
      col11: labels[i + 10],
      col12: labels[i + 11],
      col13: labels[i + 12],
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
  const labelRows = buildLabelRows(labels);
  // eslint-disable-next-line no-console
  console.log('labelRows[0] =', JSON.stringify(labelRows[0], null, 2));
  const data = { labelRows };
  return renderTemplate(PATHS.TEMPLATE_LABEL, data);
}
