import express from 'express';
import {
  generateLabelDoc,
  generateOuterBoxDoc,
  generateQe0204Doc,
} from '../services/docService';
import { FormData } from '../types';

const router = express.Router();

function buildAttachment(filename: string) {
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${encoded}"; filename*=UTF-8''${encoded}`;
}

router.post('/qe0204', (req, res) => {
  try {
    const payload = req.body as FormData;
    const buffer = generateQe0204Doc(payload);
    const filename = `QE-02-04_${payload.caseNo || 'unknown'}_${payload.inDate || 'date'}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', buildAttachment(filename));
    return res.send(buffer);
  } catch (err) {
    return res.status(500).json({ message: '產生文件失敗', error: String(err) });
  }
});

router.post('/outer-box', (req, res) => {
  try {
    const payload = req.body as FormData;
    const buffer = generateOuterBoxDoc(payload);
    const filename = `外箱標誌_${payload.caseNo || 'unknown'}_${payload.inDate || 'date'}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', buildAttachment(filename));
    return res.send(buffer);
  } catch (err) {
    return res.status(500).json({ message: '產生文件失敗', error: String(err) });
  }
});

router.post('/labels', (req, res) => {
  try {
    const payload = req.body as FormData;
    const buffer = generateLabelDoc(payload);
    const filename = `樣品小標籤_${payload.caseNo || 'unknown'}_${payload.inDate || 'date'}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', buildAttachment(filename));
    return res.send(buffer);
  } catch (err) {
    return res.status(500).json({ message: '產生文件失敗', error: String(err) });
  }
});

export default router;
