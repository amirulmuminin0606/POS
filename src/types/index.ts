export type Role = 'admin' | 'kasir' | 'gudang' | 'supervisor';

export interface User {
  id: string;
  name: string;
  username: string;
  role: Role;
  email: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Unit {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  categoryId: string;
  categoryName: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  rackLocation: string;
  isActive: boolean;
  description: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  notes: string;
  createdAt: string;
}

export interface Salesperson {
  id: string;
  name: string;
  phone: string;
  address: string;
  isActive: boolean;
  notes: string;
  createdAt: string;
}

export type PaymentStatus = 'belum_dibayar' | 'dibayar_sebagian' | 'lunas' | 'dibatalkan';
export type OrderStatus = 'draft' | 'diproses' | 'selesai' | 'dibatalkan';
export type PaymentMethod = 'tunai' | 'transfer_bca' | 'transfer_mandiri' | 'qris' | 'kartu_debit' | 'kartu_kredit';

export interface SaleItem {
  productId: string;
  productSku: string;
  productName: string;
  barcode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  costPrice: number;
  discount: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  salesId?: string;
  salesName?: string;
  items: SaleItem[];
  discount: number;
  tax: number;
  subtotal: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  notes: string;
  stockDeducted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  saleId: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  tenderedAmount: number;
  changeAmount: number;
  cashierName: string;
  notes: string;
  createdAt: string;
}

export type ReturnCondition = 'layak_jual' | 'rusak_karantina';
export type ReturnAction = 'pengembalian_dana' | 'kredit_pelanggan' | 'ganti_barang';

export interface SaleReturnItem {
  productId: string;
  productSku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  reason: string;
  condition: ReturnCondition;
  stockRestored: boolean;
}

export interface SaleReturn {
  id: string;
  returnNumber: string;
  saleId: string;
  invoiceNumber: string;
  date: string;
  items: SaleReturnItem[];
  totalRefund: number;
  refundAction: ReturnAction;
  notes: string;
  processedBy: string;
  createdAt: string;
}

export type StockMovementType =
  | 'stok_awal'
  | 'item_masuk'
  | 'item_keluar'
  | 'penjualan'
  | 'retur_penjualan'
  | 'penyesuaian_opname'
  | 'pembatalan';

export type MovementDirection = 'masuk' | 'keluar';

export interface StockMovement {
  id: string;
  date: string;
  referenceNumber: string;
  productId: string;
  productSku: string;
  productName: string;
  barcode: string;
  movementType: StockMovementType;
  direction: MovementDirection;
  initialStock: number;
  quantity: number;
  finalStock: number;
  notes: string;
  performedBy: string;
  createdAt: string;
}

export interface StockReceiptItem {
  productId: string;
  productSku: string;
  productName: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export interface StockReceipt {
  id: string;
  receiptNumber: string;
  date: string;
  supplier: string;
  referenceDoc: string;
  items: StockReceiptItem[];
  totalCost: number;
  notes: string;
  createdBy: string;
  createdAt: string;
}

export interface StockIssueItem {
  productId: string;
  productSku: string;
  productName: string;
  quantity: number;
}

export interface StockIssue {
  id: string;
  issueNumber: string;
  date: string;
  reason: string;
  referenceDoc: string;
  items: StockIssueItem[];
  notes: string;
  createdBy: string;
  createdAt: string;
}

export interface StocktakeItem {
  productId: string;
  productSku: string;
  productName: string;
  barcode: string;
  rackLocation: string;
  systemStock: number;
  physicalStock: number;
  difference: number;
  notes: string;
}

export interface Stocktake {
  id: string;
  sessionNumber: string;
  date: string;
  status: 'draft' | 'difinalisasi';
  items: StocktakeItem[];
  notes: string;
  finalizedBy?: string;
  finalizedAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PAYMENT' | 'RETURN' | 'STOCK_IN' | 'STOCK_OUT' | 'STOCKTAKE' | 'SYSTEM';
  module: string;
  details: string;
}

export interface AppSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  receiptFooter: string;
  ppnRate: number;
  allowNegativeStock: boolean;
  defaultThermalWidth: number;
  defaultThermalHeight: number;
  leadTimeDays: number;
  safetyStockPercent: number;
}
