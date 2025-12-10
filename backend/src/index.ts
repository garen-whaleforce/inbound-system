import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import excelRouter from './routes/excel';
import docsRouter from './routes/docs';
import { PATHS } from './config/paths';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/excel', excelRouter);
app.use('/api/docs', docsRouter);

app.use('/data', express.static(PATHS.DATA_DIR));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on port ${PORT}`);
});
