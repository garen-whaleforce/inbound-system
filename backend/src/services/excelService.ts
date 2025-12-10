import fs from 'fs';
import ExcelJS, { Worksheet } from 'exceljs';
import { PATHS } from '../config/paths';
import { FormData, SampleItem } from '../types';

export class ValidationError extends Error {
  missingFields: string[];

  constructor(missingFields: string[]) {
    super(`缺少欄位: ${missingFields.join(', ')}`);
    this.missingFields = missingFields;
  }
}

type HeaderKey =
  | 'caseNo'
  | 'quoteNo'
  | 'customerName'
  | 'productName'
  | 'model'
  | 'sales'
  | 'inOperator'
  | 'inDate'
  | 'totalInQty'
  | 'sampleNo'
  | 'sampleName'
  | 'remark'
  | 'borrowDate'
  | 'borrower'
  | 'returnDate'
  | 'returnOperator'
  | 'outDate'
  | 'outQty';

const HEADER_MAP: Record<HeaderKey, string> = {
  caseNo: '樣品總編號',
  quoteNo: '報價單編號',
  customerName: '客戶名稱',
  productName: '品名',
  model: '型號',
  sales: '負責業務',
  inOperator: '樣品入庫人',
  inDate: '入庫日期',
  totalInQty: '入庫總數量',
  sampleNo: '樣品編號',
  sampleName: '樣品名稱',
  remark: '備註',
  borrowDate: '樣品借出日期',
  borrower: '借出人',
  returnDate: '樣品歸還日期',
  returnOperator: '歸還人',
  outDate: '出庫日期',
  outQty: '樣品出庫數',
};

const EXTRA_SAMPLES_MARK = '[ExtraSamples]:';

export function getColumnIndex(worksheet: Worksheet, headerName: string): number {
  const headerRow = worksheet.getRow(1);
  const cellCount = headerRow.cellCount || headerRow.actualCellCount;
  for (let i = 1; i <= Math.max(cellCount, 1); i += 1) {
    const value = headerRow.getCell(i).value;
    if (typeof value === 'string' && value.trim() === headerName) {
      return i;
    }
  }
  return -1;
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && (value as any).text) return String((value as any).text);
  if (typeof value === 'object' && (value as any).result) return String((value as any).result);
  return String(value);
}

function ensureHeaderRow(worksheet: Worksheet) {
  if (worksheet.rowCount === 0) {
    worksheet.addRow(Object.values(HEADER_MAP));
    return;
  }
  const headerRow = worksheet.getRow(1);
  const existingNames = new Set<string>();
  headerRow.eachCell((cell) => {
    if (typeof cell.value === 'string') {
      existingNames.add(cell.value.trim());
    }
  });

  let appendIndex = headerRow.cellCount;
  Object.values(HEADER_MAP).forEach((name) => {
    if (!existingNames.has(name)) {
      appendIndex += 1;
      headerRow.getCell(appendIndex).value = name;
    }
  });
  headerRow.commit();
}

async function ensureWorkbook(): Promise<ExcelJS.Workbook> {
  await fs.promises.mkdir(PATHS.DATA_DIR, { recursive: true });
  const workbook = new ExcelJS.Workbook();
  if (fs.existsSync(PATHS.EXCEL_PATH)) {
    await workbook.xlsx.readFile(PATHS.EXCEL_PATH);
  } else {
    const ws = workbook.addWorksheet('Sheet1');
    ws.addRow(Object.values(HEADER_MAP));
    await workbook.xlsx.writeFile(PATHS.EXCEL_PATH);
  }
  const worksheet = workbook.worksheets[0] || workbook.addWorksheet('Sheet1');
  ensureHeaderRow(worksheet);
  return workbook;
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function normalizeSampleItems(items: SampleItem[]): SampleItem[] {
  if (!items || items.length === 0) {
    return [
      {
        sampleNo: '',
        sampleName: '',
        remark: '',
      },
    ];
  }
  return items
    .slice(0, 10)
    .map((item) => ({
      sampleNo: item.sampleNo?.trim() || '',
      sampleName: item.sampleName?.trim() || '',
      remark: item.remark || '',
    }));
}

function buildRemark(mainRemark: string, extraSamples: SampleItem[]): string {
  const extras = extraSamples.filter(
    (i) => i.sampleNo || i.sampleName || i.remark,
  );
  if (extras.length === 0) {
    return mainRemark;
  }
  return `${mainRemark || ''}\n${EXTRA_SAMPLES_MARK}${JSON.stringify(extras)}`;
}

function parseRemark(raw: string): { remark: string; extraSamples: SampleItem[] } {
  if (!raw) return { remark: '', extraSamples: [] };
  const markerIndex = raw.indexOf(EXTRA_SAMPLES_MARK);
  if (markerIndex === -1) return { remark: raw, extraSamples: [] };
  const mainRemark = raw.slice(0, markerIndex).trim();
  const extrasText = raw.slice(markerIndex + EXTRA_SAMPLES_MARK.length).trim();
  try {
    const parsed = JSON.parse(extrasText);
    if (Array.isArray(parsed)) {
      return { remark: mainRemark, extraSamples: parsed as SampleItem[] };
    }
  } catch (err) {
    // ignore parse error, treat as main remark only
  }
  return { remark: mainRemark || raw, extraSamples: [] };
}

function getMissingFields(form: FormData): string[] {
  const missing: string[] = [];
  const requiredStringFields: (keyof FormData)[] = [
    'caseNo',
    'quoteNo',
    'customerName',
    'productName',
    'model',
    'sales',
    'inOperator',
    'inDate',
  ];
  requiredStringFields.forEach((key) => {
    const value = form[key];
    if (typeof value !== 'string' || value.trim() === '') {
      missing.push(String(key));
    }
  });

  if (form.totalInQty === null || form.totalInQty === undefined || Number.isNaN(form.totalInQty)) {
    missing.push('totalInQty');
  }

  const sampleItems = normalizeSampleItems(form.sampleItems);
  if (!sampleItems || sampleItems.length === 0) {
    missing.push('sampleItems');
  }

  sampleItems.forEach((item, index) => {
    if (!item.sampleNo || !item.sampleName) {
      missing.push(`sampleItems[${index}].sampleNo`);
      missing.push(`sampleItems[${index}].sampleName`);
    }
  });

  return Array.from(new Set(missing));
}

function applyToRow(row: ExcelJS.Row, worksheet: Worksheet, form: FormData) {
  const samples = normalizeSampleItems(form.sampleItems);
  const [primary, ...rest] = samples;
  const remarkValue = buildRemark(primary.remark, rest);

  const setter = (key: HeaderKey, value: string | number | null) => {
    const colIndex = getColumnIndex(worksheet, HEADER_MAP[key]);
    if (colIndex === -1) return;
    row.getCell(colIndex).value = value === null ? '' : value;
  };

  setter('caseNo', form.caseNo);
  setter('quoteNo', form.quoteNo);
  setter('customerName', form.customerName);
  setter('productName', form.productName);
  setter('model', form.model);
  setter('sales', form.sales);
  setter('inOperator', form.inOperator);
  setter('inDate', form.inDate);
  setter('totalInQty', form.totalInQty ?? null);
  setter('sampleNo', primary.sampleNo);
  setter('sampleName', primary.sampleName);
  setter('remark', remarkValue);
  setter('borrowDate', form.borrowDate || '');
  setter('borrower', form.borrower || '');
  setter('returnDate', form.returnDate || '');
  setter('returnOperator', form.returnOperator || '');
  setter('outDate', form.outDate || '');
  setter('outQty', form.outQty ?? null);
  row.commit();
}

function rowToFormData(row: ExcelJS.Row, worksheet: Worksheet): FormData {
  const getter = (key: HeaderKey) => {
    const colIndex = getColumnIndex(worksheet, HEADER_MAP[key]);
    if (colIndex === -1) return '';
    return cellToString(row.getCell(colIndex).value);
  };

  const primaryRemarkRaw = getter('remark');
  const { remark, extraSamples } = parseRemark(primaryRemarkRaw);

  const sampleItems: SampleItem[] = [
    {
      sampleNo: getter('sampleNo'),
      sampleName: getter('sampleName'),
      remark,
    },
    ...extraSamples,
  ].slice(0, 10);

  const outQty = parseNumber(getter('outQty'));
  const totalInQty = parseNumber(getter('totalInQty')) ?? 0;

  return {
    caseNo: getter('caseNo'),
    quoteNo: getter('quoteNo'),
    customerName: getter('customerName'),
    productName: getter('productName'),
    model: getter('model'),
    sales: getter('sales'),
    inOperator: getter('inOperator'),
    inDate: getter('inDate'),
    totalInQty,
    sampleItems,
    borrowDate: getter('borrowDate'),
    borrower: getter('borrower'),
    returnDate: getter('returnDate'),
    returnOperator: getter('returnOperator'),
    outDate: getter('outDate'),
    outQty,
  };
}

function mergeFormData(original: FormData, incoming: FormData): FormData {
  const merged: FormData = { ...original };
  const assign = (key: keyof FormData) => {
    const value = incoming[key];
    if (Array.isArray(value)) return;
    if (typeof value === 'string') {
      if (value.trim() !== '') {
        (merged as any)[key] = value;
      }
      return;
    }
    if (typeof value === 'number') {
      if (!Number.isNaN(value)) {
        (merged as any)[key] = value;
      }
      return;
    }
    if (value !== null && value !== undefined) {
      (merged as any)[key] = value;
    }
  };

  assign('caseNo');
  assign('quoteNo');
  assign('customerName');
  assign('productName');
  assign('model');
  assign('sales');
  assign('inOperator');
  assign('inDate');
  assign('totalInQty');
  assign('borrowDate');
  assign('borrower');
  assign('returnDate');
  assign('returnOperator');
  assign('outDate');
  assign('outQty');

  if (Array.isArray(incoming.sampleItems) && incoming.sampleItems.length > 0) {
    merged.sampleItems = normalizeSampleItems(incoming.sampleItems);
  }

  return merged;
}

function findRowIndex(
  worksheet: Worksheet,
  caseNo: string,
  customerName: string,
): number | null {
  const caseNoCol = getColumnIndex(worksheet, HEADER_MAP.caseNo);
  const customerNameCol = getColumnIndex(worksheet, HEADER_MAP.customerName);
  if (caseNoCol === -1 || customerNameCol === -1) return null;

  for (let i = 2; i <= worksheet.rowCount; i += 1) {
    const row = worksheet.getRow(i);
    const caseValue = cellToString(row.getCell(caseNoCol).value).trim();
    const customerValue = cellToString(row.getCell(customerNameCol).value).trim();
    if (caseValue === caseNo.trim() && customerValue === customerName.trim()) {
      return i;
    }
  }
  return null;
}

export async function readRow(
  caseNo: string,
  customerName: string,
): Promise<{ rowIndex: number; data: FormData } | null> {
  const workbook = await ensureWorkbook();
  const worksheet = workbook.worksheets[0];
  ensureHeaderRow(worksheet);
  const rowIndex = findRowIndex(worksheet, caseNo, customerName);
  if (rowIndex === null) return null;
  const row = worksheet.getRow(rowIndex);
  return { rowIndex, data: rowToFormData(row, worksheet) };
}

export async function addRow(data: FormData): Promise<{ rowIndex: number; data: FormData }> {
  const missing = getMissingFields(data);
  if (missing.length > 0) {
    throw new ValidationError(missing);
  }

  const workbook = await ensureWorkbook();
  const worksheet = workbook.worksheets[0];
  ensureHeaderRow(worksheet);

  const rowIndex = worksheet.rowCount + 1;
  const row = worksheet.getRow(rowIndex);
  applyToRow(row, worksheet, data);
  await workbook.xlsx.writeFile(PATHS.EXCEL_PATH);
  return { rowIndex, data };
}

export async function overwriteRow(data: FormData): Promise<{ rowIndex: number; data: FormData }> {
  const workbook = await ensureWorkbook();
  const worksheet = workbook.worksheets[0];
  ensureHeaderRow(worksheet);
  const rowIndex = findRowIndex(worksheet, data.caseNo, data.customerName);
  if (rowIndex === null) {
    throw new Error('Row not found');
  }
  const existing = rowToFormData(worksheet.getRow(rowIndex), worksheet);
  const merged = mergeFormData(existing, data);
  const missing = getMissingFields(merged);
  if (missing.length > 0) {
    throw new ValidationError(missing);
  }
  applyToRow(worksheet.getRow(rowIndex), worksheet, merged);
  await workbook.xlsx.writeFile(PATHS.EXCEL_PATH);
  return { rowIndex, data: merged };
}
