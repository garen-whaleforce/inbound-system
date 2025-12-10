import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { addRow, overwriteRow, readRow, ValidationError } from '../services/excelService';
import { PATHS } from '../config/paths';
import type { FormData } from '../types';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (file.originalname.endsWith('.xlsx')) {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx files are allowed'));
    }
  },
});

router.get('/row', async (req, res) => {
  const caseNo = String(req.query.caseNo || '').trim();
  const customerName = String(req.query.customerName || '').trim();

  if (!caseNo || !customerName) {
    return res.status(400).json({ message: 'caseNo 和 customerName 必填' });
  }

  try {
    const result = await readRow(caseNo, customerName);
    if (!result) {
      return res
        .status(404)
        .json({ message: '查無此樣品總編號 + 客戶名稱的資料' });
    }
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: '讀取失敗', error: String(err) });
  }
});

router.post('/add', async (req, res) => {
  try {
    const payload = req.body as FormData;
    const result = await addRow(payload);
    return res.json(result);
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ missingFields: err.missingFields, message: err.message });
    }
    return res.status(500).json({ message: '新增失敗', error: String(err) });
  }
});

router.post('/overwrite', async (req, res) => {
  const payload = req.body as FormData;
  if (!payload.caseNo || !payload.customerName) {
    return res.status(400).json({ message: 'caseNo 和 customerName 必填' });
  }
  try {
    const result = await overwriteRow(payload);
    return res.json(result);
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ missingFields: err.missingFields, message: err.message });
    }
    if ((err as Error).message === 'Row not found') {
      return res.status(404).json({ message: '找不到要覆蓋的列' });
    }
    return res.status(500).json({ message: '覆蓋失敗', error: String(err) });
  }
});

router.get('/download', async (_req, res) => {
  if (!fs.existsSync(PATHS.EXCEL_PATH)) {
    return res.status(404).json({ message: 'Excel 檔案不存在' });
  }
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="QE-02-01.xlsx"');
  return res.sendFile(path.resolve(PATHS.EXCEL_PATH));
});

router.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: '請提供 .xlsx 檔案' });
  }
  try {
    await fs.promises.mkdir(PATHS.DATA_DIR, { recursive: true });
    if (fs.existsSync(PATHS.EXCEL_PATH)) {
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      const backupName = `QE-02-01-backup-${timestamp}.xlsx`;
      await fs.promises.copyFile(PATHS.EXCEL_PATH, path.join(PATHS.DATA_DIR, backupName));
    }
    await fs.promises.writeFile(PATHS.EXCEL_PATH, file.buffer);
    return res.json({ message: '已覆蓋伺服器 Excel 檔' });
  } catch (err) {
    return res.status(500).json({ message: '上傳失敗', error: String(err) });
  }
});

export default router;
