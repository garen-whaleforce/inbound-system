import fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { PATHS } from '../config/paths';
import { FormData } from '../types';

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

export function generateLabelDoc(form: FormData): Buffer {
  const data = {
    labelCaseNo: form.caseNo,
    customerName: form.customerName,
    model: form.model,
    inDate: form.inDate,
  };
  return renderTemplate(PATHS.TEMPLATE_LABEL, data);
}
