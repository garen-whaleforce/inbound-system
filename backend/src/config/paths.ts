import path from 'path';

type PathConfig = {
  DATA_DIR: string;
  EXCEL_PATH: string;
  TEMPLATE_DIR: string;
  TEMPLATE_QE0204: string;
  TEMPLATE_OUTER_BOX: string;
  TEMPLATE_LABEL: string;
};

const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, '../../data');
const TEMPLATE_DIR = path.join(DATA_DIR, 'templates');

export const PATHS: PathConfig = {
  DATA_DIR,
  EXCEL_PATH: path.join(DATA_DIR, 'QE-02-01.xlsx'),
  TEMPLATE_DIR,
  TEMPLATE_QE0204: path.join(TEMPLATE_DIR, 'QE-02-04 樣品入庫歸還單(Rev01).docx'),
  TEMPLATE_OUTER_BOX: path.join(TEMPLATE_DIR, '外箱標誌.docx'),
  TEMPLATE_LABEL: path.join(TEMPLATE_DIR, '樣品小標籤.docx'),
};
