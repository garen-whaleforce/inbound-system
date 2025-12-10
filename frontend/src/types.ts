export interface SampleItem {
  sampleNo: string; // 樣品編號
  sampleName: string; // 樣品名稱
  remark: string; // 備註
}

export interface FormData {
  caseNo: string; // 樣品總編號
  quoteNo: string; // 報價單編號
  customerName: string; // 客戶名稱
  productName: string; // 品名
  model: string; // 型號
  sales: string; // 負責業務
  inOperator: string; // 樣品入庫人
  inDate: string; // 入庫日期（ISO 字串，如 2025-12-01）
  totalInQty: number; // 入庫總數量

  sampleItems: SampleItem[]; // 最多 10 筆（在 UI 限制）

  borrowDate: string; // 樣品借出日期（可為空字串）
  borrower: string; // 借出人
  returnDate: string; // 樣品歸還日期
  returnOperator: string; // 歸還人
  outDate: string; // 出庫日期
  outQty: number | null; // 樣品出庫數
}
