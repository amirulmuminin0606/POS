import {
  AppSettings,
  AuditLog,
  Category,
  Customer,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Product,
  Sale,
  SaleItem,
  SaleReturn,
  SaleReturnItem,
  Salesperson,
  StockIssue,
  StockMovement,
  StockReceipt,
  Stocktake,
  StocktakeItem,
  Unit,
  User,
} from '../types';

const STORAGE_KEYS = {
  USERS: 'ketoko_users',
  ACTIVE_USER: 'ketoko_active_user',
  CATEGORIES: 'ketoko_categories',
  UNITS: 'ketoko_units',
  PRODUCTS: 'ketoko_products',
  CUSTOMERS: 'ketoko_customers',
  SALESPEOPLE: 'ketoko_salespeople',
  SALES: 'ketoko_sales',
  PAYMENTS: 'ketoko_payments',
  RETURNS: 'ketoko_returns',
  STOCK_MOVEMENTS: 'ketoko_stock_movements',
  STOCK_RECEIPTS: 'ketoko_stock_receipts',
  STOCK_ISSUES: 'ketoko_stock_issues',
  STOCKTAKES: 'ketoko_stocktakes',
  AUDIT_LOGS: 'ketoko_audit_logs',
  APP_SETTINGS: 'ketoko_settings',
  INITIALIZED: 'ketoko_db_init_v2',
};

export const DEFAULT_SETTINGS: AppSettings = {
  storeName: 'Ketoko Retail & Grosir Mart',
  storeAddress: 'Jl. Merdeka Barat No. 88, Gambir, Jakarta Pusat',
  storePhone: '(021) 5367-8900 / 0812-9876-5432',
  receiptFooter: 'Terima kasih atas kunjungan Anda!\nBarang yang sudah dibeli dapat ditukar maks 3 hari dengan menyertakan struk.',
  ppnRate: 11,
  allowNegativeStock: false,
  defaultThermalWidth: 33,
  defaultThermalHeight: 15,
  leadTimeDays: 3,
  safetyStockPercent: 20,
};

export const INITIAL_USERS: User[] = [
  { id: 'usr-1', name: 'Ahmad Fauzi (Administrator)', username: 'admin', role: 'admin', email: 'admin@ketoko.id' },
  { id: 'usr-2', name: 'Siti Rahmawati (Kasir)', username: 'kasir', role: 'kasir', email: 'kasir@ketoko.id' },
  { id: 'usr-3', name: 'Joko Prabowo (Petugas Gudang)', username: 'gudang', role: 'gudang', email: 'gudang@ketoko.id' },
  { id: 'usr-4', name: 'Dewi Lestari (Supervisor)', username: 'supervisor', role: 'supervisor', email: 'supervisor@ketoko.id' },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Sembako & Beras' },
  { id: 'cat-2', name: 'Minuman Kemasan' },
  { id: 'cat-3', name: 'Makanan Ringan' },
  { id: 'cat-4', name: 'Perawatan Tubuh' },
  { id: 'cat-5', name: 'Kebutuhan Rumah Tangga' },
  { id: 'cat-6', name: 'Bumbu & Dapur' },
];

export const INITIAL_UNITS: Unit[] = [
  { id: 'unt-1', name: 'Pcs' },
  { id: 'unt-2', name: 'Box' },
  { id: 'unt-3', name: 'Dus' },
  { id: 'unt-4', name: 'Botol' },
  { id: 'unt-5', name: 'Pack' },
  { id: 'unt-6', name: 'Kg' },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'CUST-001',
    name: 'Toko Barokah Sejahtera',
    phone: '0812-3456-7890',
    address: 'Jl. Raya Kebon Jeruk No. 12',
    city: 'Jakarta Barat',
    province: 'DKI Jakarta',
    postalCode: '11530',
    notes: 'Pelanggan grosir mingguan. Diskon khusus volume.',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'CUST-002',
    name: 'Warung Bu Sulastri',
    phone: '0857-1122-3344',
    address: 'Jl. Melati Indah Blok C4 No. 5',
    city: 'Tangerang Selatan',
    province: 'Banten',
    postalCode: '15412',
    notes: 'Warung kelontong langganan.',
    createdAt: '2026-09-05T09:30:00.000Z',
  },
  {
    id: 'CUST-003',
    name: 'Hendra Kusuma',
    phone: '0813-8899-7766',
    address: 'Komplek Permata Hijau Residence A2',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postalCode: '12210',
    notes: 'Konsumen retail personal.',
    createdAt: '2026-09-12T14:15:00.000Z',
  },
  {
    id: 'CUST-004',
    name: 'Kantin Berkah Bahagia',
    phone: '0878-5544-3322',
    address: 'Kawasan Industri Pulogadung Blok F-10',
    city: 'Jakarta Timur',
    province: 'DKI Jakarta',
    postalCode: '13920',
    notes: 'Kantin pabrik, pembayaran termin tempo 7 hari.',
    createdAt: '2026-09-20T11:00:00.000Z',
  },
];

export const INITIAL_SALESPEOPLE: Salesperson[] = [
  {
    id: 'SLS-001',
    name: 'Budi Santoso',
    phone: '0812-9988-7711',
    address: 'Jl. Cempaka Putih Tengah No. 24',
    isActive: true,
    notes: 'Area Jakarta Pusat & Utara',
    createdAt: '2026-08-01T08:00:00.000Z',
  },
  {
    id: 'SLS-002',
    name: 'Siti Rahma',
    phone: '0856-4433-2211',
    address: 'Jl. Pejaten Barat No. 5',
    isActive: true,
    notes: 'Area Jakarta Selatan & Timur',
    createdAt: '2026-08-15T08:00:00.000Z',
  },
  {
    id: 'SLS-003',
    name: 'Andi Pratama',
    phone: '0819-3322-1100',
    address: 'Jl. Serpong Raya No. 8',
    isActive: true,
    notes: 'Area Tangerang & Banten',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'PRD-001',
    sku: 'SKU-BERAS-01',
    barcode: '8999999195047',
    name: 'Beras Pandan Wangi Premium 5 Kg',
    categoryId: 'cat-1',
    categoryName: 'Sembako & Beras',
    unit: 'Pack',
    costPrice: 68000,
    sellingPrice: 78000,
    stock: 45,
    minStock: 15,
    rackLocation: 'RAK-A1',
    isActive: true,
    description: 'Beras pulen harum pandan kualitas super 5kg.',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'PRD-002',
    sku: 'SKU-MINYAK-01',
    barcode: '8992761111018',
    name: 'Minyak Goreng Bimoli Pouch 2 Liter',
    categoryId: 'cat-1',
    categoryName: 'Sembako & Beras',
    unit: 'Pcs',
    costPrice: 32000,
    sellingPrice: 37500,
    stock: 12,
    minStock: 20, // Low stock warning!
    rackLocation: 'RAK-A2',
    isActive: true,
    description: 'Minyak kelapa sawit murni 2x penyaringan 2L.',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'PRD-003',
    sku: 'SKU-GULA-01',
    barcode: '8991001234567',
    name: 'Gula Pasir Gulaku Putih 1 Kg',
    categoryId: 'cat-1',
    categoryName: 'Sembako & Beras',
    unit: 'Kg',
    costPrice: 15000,
    sellingPrice: 18000,
    stock: 0, // Out of stock!
    minStock: 10,
    rackLocation: 'RAK-A3',
    isActive: true,
    description: 'Gula tebu kristal putih bersih 1 kg.',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'PRD-004',
    sku: 'SKU-INDOMIE-01',
    barcode: '089686010924',
    name: 'Indomie Goreng Original 85g (Dus 40 Pcs)',
    categoryId: 'cat-3',
    categoryName: 'Makanan Ringan',
    unit: 'Dus',
    costPrice: 112000,
    sellingPrice: 125000,
    stock: 28,
    minStock: 8,
    rackLocation: 'RAK-B1',
    isActive: true,
    description: 'Mi instan goreng favorit nusantara 1 dus isi 40 pcs.',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'PRD-005',
    sku: 'SKU-KOPI-01',
    barcode: '8992696404414',
    name: 'Kopi Kapal Api Spesial Mix 10 x 24g',
    categoryId: 'cat-2',
    categoryName: 'Minuman Kemasan',
    unit: 'Pack',
    costPrice: 12500,
    sellingPrice: 15000,
    stock: 50,
    minStock: 15,
    rackLocation: 'RAK-B2',
    isActive: true,
    description: 'Kopi bubuk instan plus gula mantap.',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'PRD-006',
    sku: 'SKU-TEH-01',
    barcode: '8992745330015',
    name: 'Teh Botol Sosro Kotak 250ml',
    categoryId: 'cat-2',
    categoryName: 'Minuman Kemasan',
    unit: 'Pcs',
    costPrice: 3200,
    sellingPrice: 4500,
    stock: 96,
    minStock: 24,
    rackLocation: 'RAK-B3',
    isActive: true,
    description: 'Teh melati manis segar dalam kemasan tetra pak.',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'PRD-007',
    sku: 'SKU-SUSU-01',
    barcode: '8998009010419',
    name: 'Susu Ultra Milk Full Cream 1000ml',
    categoryId: 'cat-2',
    categoryName: 'Minuman Kemasan',
    unit: 'Pcs',
    costPrice: 17500,
    sellingPrice: 21500,
    stock: 8, // Low stock!
    minStock: 15,
    rackLocation: 'RAK-B4',
    isActive: true,
    description: 'Susu sapi segar UHT tinggi kalsium.',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'PRD-008',
    sku: 'SKU-SABUN-01',
    barcode: '8999999002222',
    name: 'Sabun Lifebuoy Total 10 Batang 85g',
    categoryId: 'cat-4',
    categoryName: 'Perawatan Tubuh',
    unit: 'Pcs',
    costPrice: 3800,
    sellingPrice: 5000,
    stock: 75,
    minStock: 20,
    rackLocation: 'RAK-C1',
    isActive: true,
    description: 'Sabun mandi antibakteri perlindungan kuman.',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'PRD-009',
    sku: 'SKU-SHAMPO-01',
    barcode: '4902430742111',
    name: 'Shampoo Pantene Anti Ketombe 160ml',
    categoryId: 'cat-4',
    categoryName: 'Perawatan Tubuh',
    unit: 'Botol',
    costPrice: 22000,
    sellingPrice: 27500,
    stock: 22,
    minStock: 10,
    rackLocation: 'RAK-C2',
    isActive: true,
    description: 'Shampo formula pro-vitamin bersihkan ketombe.',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'PRD-010',
    sku: 'SKU-SUNLIGHT-01',
    barcode: '8999999710325',
    name: 'Sunlight Jeruk Nipis Pencuci Piring 650ml',
    categoryId: 'cat-5',
    categoryName: 'Kebutuhan Rumah Tangga',
    unit: 'Pcs',
    costPrice: 12000,
    sellingPrice: 15500,
    stock: 35,
    minStock: 12,
    rackLocation: 'RAK-C3',
    isActive: true,
    description: 'Sabun cuci piring ekstrak jeruk nipis hilangkan lemak.',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'PRD-011',
    sku: 'SKU-KECAP-01',
    barcode: '8999999551102',
    name: 'Kecap Manis Bango Refill 520ml',
    categoryId: 'cat-6',
    categoryName: 'Bumbu & Dapur',
    unit: 'Pcs',
    costPrice: 20000,
    sellingPrice: 24500,
    stock: 40,
    minStock: 15,
    rackLocation: 'RAK-D1',
    isActive: true,
    description: 'Kecap manis dari kedelai hitam mallika berkualitas.',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'PRD-012',
    sku: 'SKU-SAUS-01',
    barcode: '8992761222035',
    name: 'Saus Sambal ABC Botol 335ml',
    categoryId: 'cat-6',
    categoryName: 'Bumbu & Dapur',
    unit: 'Botol',
    costPrice: 14000,
    sellingPrice: 17500,
    stock: 18,
    minStock: 10,
    rackLocation: 'RAK-D2',
    isActive: true,
    description: 'Saus cabai asli pedas nikmat.',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-10-10T00:00:00.000Z',
  },
];

class DatabaseService {
  constructor() {
    this.initDatabase();
  }

  private initDatabase() {
    const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!isInit) {
      this.resetToDemoData();
    }
  }

  public resetToDemoData() {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(INITIAL_USERS[0]));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(INITIAL_UNITS));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
    localStorage.setItem(STORAGE_KEYS.SALESPEOPLE, JSON.stringify(INITIAL_SALESPEOPLE));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(DEFAULT_SETTINGS));

    // Seed Initial Stock Movements for each product
    const initialMovements: StockMovement[] = INITIAL_PRODUCTS.map((prd, idx) => ({
      id: `MOV-INIT-${String(idx + 1).padStart(3, '0')}`,
      date: '2026-09-01T00:00:00.000Z',
      referenceNumber: 'SALDO-AWAL-2026',
      productId: prd.id,
      productSku: prd.sku,
      productName: prd.name,
      barcode: prd.barcode,
      movementType: 'stok_awal',
      direction: 'masuk',
      initialStock: 0,
      quantity: prd.stock + 15, // original initial stock
      finalStock: prd.stock + 15,
      notes: 'Saldo awal inventori sistem',
      performedBy: 'Ahmad Fauzi (Admin)',
      createdAt: '2026-09-01T00:00:00.000Z',
    }));

    // Seed Sample Sales
    const sampleSales: Sale[] = [
      {
        id: 'SL-20261010-001',
        invoiceNumber: 'INV-20261010-001',
        date: '2026-10-10T09:30:00.000Z',
        customerId: 'CUST-001',
        customerName: 'Toko Barokah Sejahtera',
        salesId: 'SLS-001',
        salesName: 'Budi Santoso',
        items: [
          {
            productId: 'PRD-001',
            productSku: 'SKU-BERAS-01',
            productName: 'Beras Pandan Wangi Premium 5 Kg',
            barcode: '8999999195047',
            quantity: 5,
            unit: 'Pack',
            unitPrice: 78000,
            costPrice: 68000,
            discount: 0,
            subtotal: 390000,
          },
          {
            productId: 'PRD-004',
            productSku: 'SKU-INDOMIE-01',
            productName: 'Indomie Goreng Original 85g (Dus 40 Pcs)',
            barcode: '089686010924',
            quantity: 2,
            unit: 'Dus',
            unitPrice: 125000,
            costPrice: 112000,
            discount: 10000,
            subtotal: 240000,
          },
        ],
        discount: 10000,
        tax: 0,
        subtotal: 630000,
        grandTotal: 630000,
        paidAmount: 630000,
        balanceDue: 0,
        paymentMethod: 'transfer_bca',
        paymentStatus: 'lunas',
        orderStatus: 'selesai',
        notes: 'Pengiriman via armada toko.',
        stockDeducted: true,
        createdAt: '2026-10-10T09:30:00.000Z',
        updatedAt: '2026-10-10T09:35:00.000Z',
      },
      {
        id: 'SL-20261011-002',
        invoiceNumber: 'INV-20261011-002',
        date: '2026-10-11T11:15:00.000Z',
        customerId: 'CUST-004',
        customerName: 'Kantin Berkah Bahagia',
        salesId: 'SLS-002',
        salesName: 'Siti Rahma',
        items: [
          {
            productId: 'PRD-002',
            productSku: 'SKU-MINYAK-01',
            productName: 'Minyak Goreng Bimoli Pouch 2 Liter',
            barcode: '8992761111018',
            quantity: 4,
            unit: 'Pcs',
            unitPrice: 37500,
            costPrice: 32000,
            discount: 0,
            subtotal: 150000,
          },
          {
            productId: 'PRD-006',
            productSku: 'SKU-TEH-01',
            productName: 'Teh Botol Sosro Kotak 250ml',
            barcode: '8992745330015',
            quantity: 24,
            unit: 'Pcs',
            unitPrice: 4500,
            costPrice: 3200,
            discount: 8000,
            subtotal: 100000,
          },
        ],
        discount: 8000,
        tax: 0,
        subtotal: 250000,
        grandTotal: 250000,
        paidAmount: 100000, // Partial payment
        balanceDue: 150000,
        paymentMethod: 'tunai',
        paymentStatus: 'dibayar_sebagian',
        orderStatus: 'diproses',
        notes: 'DP 100rb, sisa pelunasan saat kirim minggu depan.',
        stockDeducted: true,
        createdAt: '2026-10-11T11:15:00.000Z',
        updatedAt: '2026-10-11T11:20:00.000Z',
      },
      {
        id: 'SL-20261011-003',
        invoiceNumber: 'INV-20261011-003',
        date: '2026-10-11T14:40:00.000Z',
        customerId: 'CUST-002',
        customerName: 'Warung Bu Sulastri',
        salesId: 'SLS-001',
        salesName: 'Budi Santoso',
        items: [
          {
            productId: 'PRD-005',
            productSku: 'SKU-KOPI-01',
            productName: 'Kopi Kapal Api Spesial Mix 10 x 24g',
            barcode: '8992696404414',
            quantity: 5,
            unit: 'Pack',
            unitPrice: 15000,
            costPrice: 12500,
            discount: 0,
            subtotal: 75000,
          },
        ],
        discount: 0,
        tax: 0,
        subtotal: 75000,
        grandTotal: 75000,
        paidAmount: 0, // Unpaid
        balanceDue: 75000,
        paymentMethod: 'tunai',
        paymentStatus: 'belum_dibayar',
        orderStatus: 'draft',
        notes: 'Pesanan telepon, menunggu konfirmasi kasir.',
        stockDeducted: true,
        createdAt: '2026-10-11T14:40:00.000Z',
        updatedAt: '2026-10-11T14:40:00.000Z',
      },
    ];

    // Seed Sample Payments
    const samplePayments: Payment[] = [
      {
        id: 'PAY-20261010-001',
        paymentNumber: 'PAY-20261010-001',
        saleId: 'SL-20261010-001',
        invoiceNumber: 'INV-20261010-001',
        date: '2026-10-10T09:35:00.000Z',
        amount: 630000,
        method: 'transfer_bca',
        tenderedAmount: 630000,
        changeAmount: 0,
        cashierName: 'Siti Rahmawati (Kasir)',
        notes: 'Transfer Bank BCA ref: 994821',
        createdAt: '2026-10-10T09:35:00.000Z',
      },
      {
        id: 'PAY-20261011-002',
        paymentNumber: 'PAY-20261011-002',
        saleId: 'SL-20261011-002',
        invoiceNumber: 'INV-20261011-002',
        date: '2026-10-11T11:20:00.000Z',
        amount: 100000,
        method: 'tunai',
        tenderedAmount: 100000,
        changeAmount: 0,
        cashierName: 'Siti Rahmawati (Kasir)',
        notes: 'Uang muka tunai',
        createdAt: '2026-10-11T11:20:00.000Z',
      },
    ];

    // Seed Stock Movements from Sample Sales
    const saleMovements: StockMovement[] = [
      {
        id: 'MOV-SL-001',
        date: '2026-10-10T09:30:00.000Z',
        referenceNumber: 'INV-20261010-001',
        productId: 'PRD-001',
        productSku: 'SKU-BERAS-01',
        productName: 'Beras Pandan Wangi Premium 5 Kg',
        barcode: '8999999195047',
        movementType: 'penjualan',
        direction: 'keluar',
        initialStock: 50,
        quantity: 5,
        finalStock: 45,
        notes: 'Penjualan ke Toko Barokah Sejahtera',
        performedBy: 'Siti Rahmawati (Kasir)',
        createdAt: '2026-10-10T09:30:00.000Z',
      },
      {
        id: 'MOV-SL-002',
        date: '2026-10-10T09:30:00.000Z',
        referenceNumber: 'INV-20261010-001',
        productId: 'PRD-004',
        productSku: 'SKU-INDOMIE-01',
        productName: 'Indomie Goreng Original 85g (Dus 40 Pcs)',
        barcode: '089686010924',
        movementType: 'penjualan',
        direction: 'keluar',
        initialStock: 30,
        quantity: 2,
        finalStock: 28,
        notes: 'Penjualan ke Toko Barokah Sejahtera',
        performedBy: 'Siti Rahmawati (Kasir)',
        createdAt: '2026-10-10T09:30:00.000Z',
      },
      {
        id: 'MOV-SL-003',
        date: '2026-10-11T11:15:00.000Z',
        referenceNumber: 'INV-20261011-002',
        productId: 'PRD-002',
        productSku: 'SKU-MINYAK-01',
        productName: 'Minyak Goreng Bimoli Pouch 2 Liter',
        barcode: '8992761111018',
        movementType: 'penjualan',
        direction: 'keluar',
        initialStock: 16,
        quantity: 4,
        finalStock: 12,
        notes: 'Penjualan ke Kantin Berkah Bahagia',
        performedBy: 'Siti Rahmawati (Kasir)',
        createdAt: '2026-10-11T11:15:00.000Z',
      },
    ];

    const sampleReceipts: StockReceipt[] = [
      {
        id: 'RCP-20261008-001',
        receiptNumber: 'RCV-20261008-001',
        date: '2026-10-08T10:00:00.000Z',
        supplier: 'PT Indofood Sukses Makmur Tbk',
        referenceDoc: 'SJ-IND-8849',
        items: [
          {
            productId: 'PRD-004',
            productSku: 'SKU-INDOMIE-01',
            productName: 'Indomie Goreng Original 85g (Dus 40 Pcs)',
            quantity: 20,
            unitCost: 112000,
            subtotal: 2240000,
          },
        ],
        totalCost: 2240000,
        notes: 'Penerimaan rutin pasokan mi instan mingguan',
        createdBy: 'Joko Prabowo (Gudang)',
        createdAt: '2026-10-08T10:00:00.000Z',
      },
    ];

    const sampleAuditLogs: AuditLog[] = [
      {
        id: 'LOG-001',
        timestamp: '2026-10-10T09:30:00.000Z',
        userId: 'usr-2',
        userName: 'Siti Rahmawati',
        userRole: 'kasir',
        action: 'CREATE',
        module: 'Penjualan',
        details: 'Membuat penjualan baru INV-20261010-001 senilai Rp 630.000',
      },
      {
        id: 'LOG-002',
        timestamp: '2026-10-10T09:35:00.000Z',
        userId: 'usr-2',
        userName: 'Siti Rahmawati',
        userRole: 'kasir',
        action: 'PAYMENT',
        module: 'Kasir',
        details: 'Menerima pembayaran lunas INV-20261010-001 via Transfer BCA',
      },
      {
        id: 'LOG-003',
        timestamp: '2026-10-11T11:15:00.000Z',
        userId: 'usr-2',
        userName: 'Siti Rahmawati',
        userRole: 'kasir',
        action: 'CREATE',
        module: 'Penjualan',
        details: 'Membuat penjualan INV-20261011-002 senilai Rp 250.000',
      },
    ];

    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sampleSales));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(samplePayments));
    localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify([...initialMovements, ...saleMovements]));
    localStorage.setItem(STORAGE_KEYS.STOCK_RECEIPTS, JSON.stringify(sampleReceipts));
    localStorage.setItem(STORAGE_KEYS.STOCK_ISSUES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.STOCKTAKES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(sampleAuditLogs));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }

  // --- Generic Helpers ---
  private getTable<T>(key: string): T[] {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  }

  private setTable<T>(key: string, data: T[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // --- Active User & Roles ---
  public getUsers(): User[] {
    return this.getTable<User>(STORAGE_KEYS.USERS);
  }

  public getActiveUser(): User {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
    if (raw) return JSON.parse(raw);
    return INITIAL_USERS[0];
  }

  public setActiveUser(user: User) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(user));
    this.logAudit('UPDATE', 'Pengguna', `Beralih ke akun pengguna ${user.name} (${user.role})`);
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLog[] {
    const logs = this.getTable<AuditLog>(STORAGE_KEYS.AUDIT_LOGS);
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public logAudit(
    action: AuditLog['action'],
    module: string,
    details: string,
    customUser?: User
  ) {
    const user = customUser || this.getActiveUser();
    const newLog: AuditLog = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      module,
      details,
    };
    const logs = this.getAuditLogs();
    logs.unshift(newLog);
    if (logs.length > 500) logs.pop(); // keep last 500
    this.setTable(STORAGE_KEYS.AUDIT_LOGS, logs);
  }

  // --- App Settings ---
  public getSettings(): AppSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
    return raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
  }

  public updateSettings(settings: AppSettings) {
    localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(settings));
    this.logAudit('UPDATE', 'Pengaturan', 'Memperbarui konfigurasi sistem aplikasi.');
  }

  // --- Categories & Units ---
  public getCategories(): Category[] {
    return this.getTable<Category>(STORAGE_KEYS.CATEGORIES);
  }

  public addCategory(name: string): Category {
    const categories = this.getCategories();
    const newCat: Category = { id: `cat-${Date.now()}`, name };
    categories.push(newCat);
    this.setTable(STORAGE_KEYS.CATEGORIES, categories);
    this.logAudit('CREATE', 'Kategori', `Menambahkan kategori: ${name}`);
    return newCat;
  }

  public getUnits(): Unit[] {
    return this.getTable<Unit>(STORAGE_KEYS.UNITS);
  }

  public addUnit(name: string): Unit {
    const units = this.getUnits();
    const newUnit: Unit = { id: `unt-${Date.now()}`, name };
    units.push(newUnit);
    this.setTable(STORAGE_KEYS.UNITS, units);
    this.logAudit('CREATE', 'Satuan', `Menambahkan satuan: ${name}`);
    return newUnit;
  }

  // --- Products ---
  public getProducts(): Product[] {
    return this.getTable<Product>(STORAGE_KEYS.PRODUCTS);
  }

  public getProductById(id: string): Product | undefined {
    return this.getProducts().find((p) => p.id === id);
  }

  public createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): { success: boolean; product?: Product; error?: string } {
    const products = this.getProducts();

    // Validate SKU uniqueness
    if (data.sku && products.some((p) => p.sku.trim().toLowerCase() === data.sku.trim().toLowerCase())) {
      return { success: false, error: `SKU '${data.sku}' sudah digunakan oleh produk lain!` };
    }

    // Validate Barcode uniqueness
    if (data.barcode && products.some((p) => p.barcode.trim() === data.barcode.trim())) {
      return { success: false, error: `Barcode '${data.barcode}' sudah digunakan oleh produk lain!` };
    }

    const newId = `PRD-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...data,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };

    products.push(newProduct);
    this.setTable(STORAGE_KEYS.PRODUCTS, products);

    // Record initial stock if > 0
    if (newProduct.stock > 0) {
      this.recordStockMovement({
        referenceNumber: 'PRODUK-BARU',
        productId: newProduct.id,
        productSku: newProduct.sku,
        productName: newProduct.name,
        barcode: newProduct.barcode,
        movementType: 'stok_awal',
        direction: 'masuk',
        initialStock: 0,
        quantity: newProduct.stock,
        finalStock: newProduct.stock,
        notes: 'Stok awal saat pendaftaran item',
      });
    }

    this.logAudit('CREATE', 'Produk', `Menambahkan produk baru: ${newProduct.name} (${newProduct.sku})`);
    return { success: true, product: newProduct };
  }

  public updateProduct(id: string, updates: Partial<Product>): { success: boolean; error?: string } {
    const products = this.getProducts();
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return { success: false, error: 'Produk tidak ditemukan.' };

    const current = products[idx];

    // Validate SKU uniqueness if modified
    if (updates.sku && updates.sku.trim().toLowerCase() !== current.sku.trim().toLowerCase()) {
      if (products.some((p) => p.id !== id && p.sku.trim().toLowerCase() === updates.sku!.trim().toLowerCase())) {
        return { success: false, error: `SKU '${updates.sku}' sudah digunakan.` };
      }
    }

    // Validate Barcode uniqueness if modified
    if (updates.barcode && updates.barcode.trim() !== current.barcode.trim()) {
      if (products.some((p) => p.id !== id && p.barcode.trim() === updates.barcode!.trim())) {
        return { success: false, error: `Barcode '${updates.barcode}' sudah digunakan.` };
      }
    }

    // Business rule: Stock cannot be changed directly via basic product edit form!
    // Stock modifications MUST go through inventory transactions or stock opname.
    const safeUpdates = { ...updates };
    delete safeUpdates.stock;
    delete safeUpdates.id;

    products[idx] = {
      ...current,
      ...safeUpdates,
      updatedAt: new Date().toISOString(),
    };

    this.setTable(STORAGE_KEYS.PRODUCTS, products);
    this.logAudit('UPDATE', 'Produk', `Memperbarui data produk: ${current.name} (${current.sku})`);
    return { success: true };
  }

  public duplicateProduct(id: string): { success: boolean; product?: Product; error?: string } {
    const source = this.getProductById(id);
    if (!source) return { success: false, error: 'Produk sumber tidak ditemukan.' };

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newSku = `${source.sku}-DUP${randomSuffix}`;
    const newBarcode = source.barcode ? `${source.barcode.slice(0, 10)}${randomSuffix}` : '';

    return this.createProduct({
      ...source,
      name: `${source.name} (Salinan)`,
      sku: newSku,
      barcode: newBarcode,
      stock: 0, // Reset stock to 0 according to business rule!
      description: source.description ? `${source.description} (Duplikat)` : '',
    });
  }

  public deleteProduct(id: string): { success: boolean; error?: string } {
    const products = this.getProducts();
    const product = products.find((p) => p.id === id);
    if (!product) return { success: false, error: 'Produk tidak ditemukan.' };

    // Check transaction relations!
    const sales = this.getSales();
    const usedInSales = sales.some((s) => s.items.some((item) => item.productId === id));
    if (usedInSales) {
      return {
        success: false,
        error: `Produk '${product.name}' tidak boleh dihapus karena sudah memiliki riwayat transaksi penjualan. Silakan nonaktifkan (arsip) produk ini agar data riwayat tetap aman.`,
      };
    }

    const receipts = this.getStockReceipts();
    const usedInReceipts = receipts.some((r) => r.items.some((item) => item.productId === id));
    if (usedInReceipts) {
      return {
        success: false,
        error: `Produk '${product.name}' tidak boleh dihapus karena telah terdaftar di riwayat penerimaan item masuk. Silakan nonaktifkan produk.`,
      };
    }

    const filtered = products.filter((p) => p.id !== id);
    this.setTable(STORAGE_KEYS.PRODUCTS, filtered);
    this.logAudit('DELETE', 'Produk', `Menghapus produk: ${product.name} (${product.sku})`);
    return { success: true };
  }

  // --- Customers ---
  public getCustomers(): Customer[] {
    return this.getTable<Customer>(STORAGE_KEYS.CUSTOMERS);
  }

  public createCustomer(data: Omit<Customer, 'id' | 'createdAt'>): Customer {
    const customers = this.getCustomers();
    const newCust: Customer = {
      ...data,
      id: `CUST-${String(customers.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    };
    customers.push(newCust);
    this.setTable(STORAGE_KEYS.CUSTOMERS, customers);
    this.logAudit('CREATE', 'Pelanggan', `Menambahkan pelanggan: ${newCust.name}`);
    return newCust;
  }

  public updateCustomer(id: string, updates: Partial<Customer>): { success: boolean } {
    const customers = this.getCustomers();
    const idx = customers.findIndex((c) => c.id === id);
    if (idx === -1) return { success: false };
    customers[idx] = { ...customers[idx], ...updates };
    this.setTable(STORAGE_KEYS.CUSTOMERS, customers);
    this.logAudit('UPDATE', 'Pelanggan', `Memperbarui pelanggan: ${customers[idx].name}`);
    return { success: true };
  }

  public deleteCustomer(id: string): { success: boolean; error?: string } {
    const sales = this.getSales();
    if (sales.some((s) => s.customerId === id)) {
      return { success: false, error: 'Pelanggan tidak dapat dihapus karena memiliki riwayat transaksi penjualan.' };
    }
    const customers = this.getCustomers().filter((c) => c.id !== id);
    this.setTable(STORAGE_KEYS.CUSTOMERS, customers);
    this.logAudit('DELETE', 'Pelanggan', `Menghapus pelanggan ID: ${id}`);
    return { success: true };
  }

  // --- Salespeople ---
  public getSalespeople(): Salesperson[] {
    return this.getTable<Salesperson>(STORAGE_KEYS.SALESPEOPLE);
  }

  public createSalesperson(data: Omit<Salesperson, 'id' | 'createdAt'>): Salesperson {
    const list = this.getSalespeople();
    const newItem: Salesperson = {
      ...data,
      id: `SLS-${String(list.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    };
    list.push(newItem);
    this.setTable(STORAGE_KEYS.SALESPEOPLE, list);
    this.logAudit('CREATE', 'Sales', `Menambahkan sales baru: ${newItem.name}`);
    return newItem;
  }

  public updateSalesperson(id: string, updates: Partial<Salesperson>): { success: boolean } {
    const list = this.getSalespeople();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return { success: false };
    list[idx] = { ...list[idx], ...updates };
    this.setTable(STORAGE_KEYS.SALESPEOPLE, list);
    this.logAudit('UPDATE', 'Sales', `Memperbarui sales: ${list[idx].name}`);
    return { success: true };
  }

  public deleteSalesperson(id: string): { success: boolean; error?: string } {
    const sales = this.getSales();
    if (sales.some((s) => s.salesId === id)) {
      return { success: false, error: 'Sales tidak dapat dihapus karena terikat transaksi. Silakan nonaktifkan statusnya.' };
    }
    const list = this.getSalespeople().filter((s) => s.id !== id);
    this.setTable(STORAGE_KEYS.SALESPEOPLE, list);
    this.logAudit('DELETE', 'Sales', `Menghapus sales ID: ${id}`);
    return { success: true };
  }

  // --- Stock Movements & Ledger (Kartu Stok) ---
  public getStockMovements(): StockMovement[] {
    const movements = this.getTable<StockMovement>(STORAGE_KEYS.STOCK_MOVEMENTS);
    return movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public recordStockMovement(data: Omit<StockMovement, 'id' | 'date' | 'createdAt' | 'performedBy'>): StockMovement {
    const movements = this.getTable<StockMovement>(STORAGE_KEYS.STOCK_MOVEMENTS);
    const user = this.getActiveUser();
    const now = new Date().toISOString();
    const movement: StockMovement = {
      ...data,
      id: `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: now,
      performedBy: user.name,
      createdAt: now,
    };
    movements.push(movement);
    this.setTable(STORAGE_KEYS.STOCK_MOVEMENTS, movements);
    return movement;
  }

  // --- Sales Transactions ---
  public getSales(): Sale[] {
    const sales = this.getTable<Sale>(STORAGE_KEYS.SALES);
    return sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public createSale(saleData: {
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
    paymentMethod: PaymentMethod;
    notes: string;
    tenderedAmount?: number;
  }): { success: boolean; sale?: Sale; error?: string } {
    const products = this.getProducts();
    const settings = this.getSettings();

    // 1. Validate items and stock availability
    for (const item of saleData.items) {
      const p = products.find((prod) => prod.id === item.productId);
      if (!p) {
        return { success: false, error: `Produk '${item.productName}' tidak ditemukan.` };
      }
      if (!settings.allowNegativeStock && p.stock < item.quantity) {
        return {
          success: false,
          error: `Stok produk '${p.name}' tidak mencukupi! Tersedia: ${p.stock} ${p.unit}, diminta: ${item.quantity} ${item.unit}.`,
        };
      }
    }

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const currentSalesToday = this.getSales().filter((s) => s.invoiceNumber.includes(todayStr));
    const nextSeq = String(currentSalesToday.length + 1).padStart(3, '0');
    const invoiceNumber = `INV-${todayStr}-${nextSeq}`;

    const paid = saleData.paidAmount || 0;
    const balanceDue = Math.max(0, saleData.grandTotal - paid);
    let paymentStatus: PaymentStatus = 'belum_dibayar';
    if (paid >= saleData.grandTotal) {
      paymentStatus = 'lunas';
    } else if (paid > 0) {
      paymentStatus = 'dibayar_sebagian';
    }

    const now = new Date().toISOString();
    const newSale: Sale = {
      id: `SL-${Date.now()}`,
      invoiceNumber,
      date: now,
      customerId: saleData.customerId,
      customerName: saleData.customerName,
      salesId: saleData.salesId,
      salesName: saleData.salesName,
      items: saleData.items,
      discount: saleData.discount,
      tax: saleData.tax,
      subtotal: saleData.subtotal,
      grandTotal: saleData.grandTotal,
      paidAmount: paid,
      balanceDue,
      paymentMethod: saleData.paymentMethod,
      paymentStatus,
      orderStatus: paymentStatus === 'lunas' ? 'selesai' : 'diproses',
      notes: saleData.notes,
      stockDeducted: true, // Deducted exactly once upon finalization
      createdAt: now,
      updatedAt: now,
    };

    // 2. Atomically deduct product stock and record stock movements
    for (const item of saleData.items) {
      const pIdx = products.findIndex((prod) => prod.id === item.productId);
      if (pIdx !== -1) {
        const initial = products[pIdx].stock;
        const final = initial - item.quantity;
        products[pIdx].stock = final;
        products[pIdx].updatedAt = now;

        this.recordStockMovement({
          referenceNumber: invoiceNumber,
          productId: products[pIdx].id,
          productSku: products[pIdx].sku,
          productName: products[pIdx].name,
          barcode: products[pIdx].barcode,
          movementType: 'penjualan',
          direction: 'keluar',
          initialStock: initial,
          quantity: item.quantity,
          finalStock: final,
          notes: `Penjualan no. ${invoiceNumber} (${saleData.customerName})`,
        });
      }
    }
    this.setTable(STORAGE_KEYS.PRODUCTS, products);

    // 3. Save Sale
    const sales = this.getTable<Sale>(STORAGE_KEYS.SALES);
    sales.push(newSale);
    this.setTable(STORAGE_KEYS.SALES, sales);

    // 4. Record Initial Payment if paid > 0
    if (paid > 0) {
      const tendered = saleData.tenderedAmount !== undefined ? saleData.tenderedAmount : paid;
      const change = Math.max(0, tendered - paid);
      this.recordPayment({
        saleId: newSale.id,
        invoiceNumber: newSale.invoiceNumber,
        amount: paid,
        method: newSale.paymentMethod,
        tenderedAmount: tendered,
        changeAmount: change,
        notes: paymentStatus === 'lunas' ? 'Pembayaran lunas langsung saat transaksi' : 'Pembayaran uang muka / DP',
      });
    }

    this.logAudit('CREATE', 'Penjualan', `Membuat transaksi penjualan ${invoiceNumber} senilai Rp ${saleData.grandTotal.toLocaleString('id-ID')}`);
    return { success: true, sale: newSale };
  }

  public cancelSale(saleId: string, reason: string): { success: boolean; error?: string } {
    const sales = this.getSales();
    const idx = sales.findIndex((s) => s.id === saleId);
    if (idx === -1) return { success: false, error: 'Transaksi tidak ditemukan.' };

    const sale = sales[idx];
    if (sale.paymentStatus === 'lunas') {
      return {
        success: false,
        error: 'Transaksi yang sudah lunas tidak boleh dibatalkan secara langsung! Silakan gunakan fitur Retur Penjualan.',
      };
    }

    // Restore stock if previously deducted
    if (sale.stockDeducted) {
      const products = this.getProducts();
      const now = new Date().toISOString();

      for (const item of sale.items) {
        const pIdx = products.findIndex((p) => p.id === item.productId);
        if (pIdx !== -1) {
          const init = products[pIdx].stock;
          const fin = init + item.quantity;
          products[pIdx].stock = fin;
          products[pIdx].updatedAt = now;

          this.recordStockMovement({
            referenceNumber: `BATAL-${sale.invoiceNumber}`,
            productId: products[pIdx].id,
            productSku: products[pIdx].sku,
            productName: products[pIdx].name,
            barcode: products[pIdx].barcode,
            movementType: 'pembatalan',
            direction: 'masuk',
            initialStock: init,
            quantity: item.quantity,
            finalStock: fin,
            notes: `Pembatalan transaksi ${sale.invoiceNumber}. Alasan: ${reason}`,
          });
        }
      }
      this.setTable(STORAGE_KEYS.PRODUCTS, products);
    }

    sales[idx].paymentStatus = 'dibatalkan';
    sales[idx].orderStatus = 'dibatalkan';
    sales[idx].notes = `${sales[idx].notes || ''} [Dibatalkan: ${reason}]`.trim();
    sales[idx].updatedAt = new Date().toISOString();
    this.setTable(STORAGE_KEYS.SALES, sales);

    this.logAudit('DELETE', 'Penjualan', `Membatalkan transaksi ${sale.invoiceNumber}. Alasan: ${reason}`);
    return { success: true };
  }

  // --- Payments ---
  public getPayments(): Payment[] {
    const payments = this.getTable<Payment>(STORAGE_KEYS.PAYMENTS);
    return payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public recordPayment(data: {
    saleId: string;
    invoiceNumber: string;
    amount: number;
    method: PaymentMethod;
    tenderedAmount: number;
    changeAmount: number;
    notes: string;
  }): { success: boolean; payment?: Payment; error?: string } {
    const sales = this.getSales();
    const sIdx = sales.findIndex((s) => s.id === data.saleId);
    if (sIdx === -1) return { success: false, error: 'Transaksi tidak ditemukan.' };

    const sale = sales[sIdx];
    if (sale.paymentStatus === 'lunas') {
      return { success: false, error: 'Transaksi ini sudah lunas sebelumnya.' };
    }

    const remainingDue = sale.balanceDue;
    if (data.amount <= 0) {
      return { success: false, error: 'Nominal pembayaran harus lebih dari Rp 0.' };
    }
    if (data.amount > remainingDue) {
      return {
        success: false,
        error: `Nominal pembayaran (Rp ${data.amount.toLocaleString('id-ID')}) melebihi sisa tagihan (Rp ${remainingDue.toLocaleString('id-ID')}).`,
      };
    }

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const paymentSeq = String(this.getPayments().length + 1).padStart(3, '0');
    const paymentNumber = `PAY-${todayStr}-${paymentSeq}`;
    const user = this.getActiveUser();
    const now = new Date().toISOString();

    const newPayment: Payment = {
      id: `PAY-${Date.now()}`,
      paymentNumber,
      saleId: data.saleId,
      invoiceNumber: data.invoiceNumber,
      date: now,
      amount: data.amount,
      method: data.method,
      tenderedAmount: data.tenderedAmount,
      changeAmount: data.changeAmount,
      cashierName: user.name,
      notes: data.notes,
      createdAt: now,
    };

    // Update sale status (STOCKS ARE NEVER TOUCHED HERE TO PREVENT DOUBLE-DEDUCTION)
    const newPaidTotal = sale.paidAmount + data.amount;
    const newBalanceDue = Math.max(0, sale.grandTotal - newPaidTotal);
    sales[sIdx].paidAmount = newPaidTotal;
    sales[sIdx].balanceDue = newBalanceDue;
    sales[sIdx].paymentStatus = newBalanceDue === 0 ? 'lunas' : 'dibayar_sebagian';
    if (newBalanceDue === 0) {
      sales[sIdx].orderStatus = 'selesai';
    }
    sales[sIdx].updatedAt = now;

    // Save payment and sale
    const payments = this.getTable<Payment>(STORAGE_KEYS.PAYMENTS);
    payments.push(newPayment);
    this.setTable(STORAGE_KEYS.PAYMENTS, payments);
    this.setTable(STORAGE_KEYS.SALES, sales);

    this.logAudit('PAYMENT', 'Kasir', `Menerima pembayaran ${paymentNumber} untuk ${data.invoiceNumber} sebesar Rp ${data.amount.toLocaleString('id-ID')} via ${data.method}`);
    return { success: true, payment: newPayment };
  }

  // --- Sales Returns ---
  public getReturns(): SaleReturn[] {
    const returns = this.getTable<SaleReturn>(STORAGE_KEYS.RETURNS);
    return returns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public createReturn(data: {
    saleId: string;
    invoiceNumber: string;
    items: SaleReturnItem[];
    totalRefund: number;
    refundAction: SaleReturn['refundAction'];
    notes: string;
  }): { success: boolean; returnDoc?: SaleReturn; error?: string } {
    const sales = this.getSales();
    const sale = sales.find((s) => s.id === data.saleId);
    if (!sale) return { success: false, error: 'Transaksi penjualan asli tidak ditemukan.' };

    const products = this.getProducts();
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const retSeq = String(this.getReturns().length + 1).padStart(3, '0');
    const returnNumber = `RET-${todayStr}-${retSeq}`;
    const user = this.getActiveUser();
    const now = new Date().toISOString();

    // Process stock restoration for items in good condition ('layak_jual')
    for (const item of data.items) {
      if (item.condition === 'layak_jual') {
        const pIdx = products.findIndex((p) => p.id === item.productId);
        if (pIdx !== -1) {
          const init = products[pIdx].stock;
          const fin = init + item.quantity;
          products[pIdx].stock = fin;
          products[pIdx].updatedAt = now;

          this.recordStockMovement({
            referenceNumber: returnNumber,
            productId: products[pIdx].id,
            productSku: products[pIdx].sku,
            productName: products[pIdx].name,
            barcode: products[pIdx].barcode,
            movementType: 'retur_penjualan',
            direction: 'masuk',
            initialStock: init,
            quantity: item.quantity,
            finalStock: fin,
            notes: `Retur penjualan ${sale.invoiceNumber} (Kondisi Layak Jual - masuk kembali ke inventori)`,
          });
          item.stockRestored = true;
        }
      } else {
        item.stockRestored = false;
        // Quarantined items do not re-enter sellable stock
      }
    }
    this.setTable(STORAGE_KEYS.PRODUCTS, products);

    const newReturn: SaleReturn = {
      id: `RET-${Date.now()}`,
      returnNumber,
      saleId: data.saleId,
      invoiceNumber: data.invoiceNumber,
      date: now,
      items: data.items,
      totalRefund: data.totalRefund,
      refundAction: data.refundAction,
      notes: data.notes,
      processedBy: user.name,
      createdAt: now,
    };

    const returns = this.getTable<SaleReturn>(STORAGE_KEYS.RETURNS);
    returns.push(newReturn);
    this.setTable(STORAGE_KEYS.RETURNS, returns);

    this.logAudit('RETURN', 'Retur Penjualan', `Membuat retur ${returnNumber} untuk invoice ${data.invoiceNumber} senilai Rp ${data.totalRefund.toLocaleString('id-ID')}`);
    return { success: true, returnDoc: newReturn };
  }

  // --- Stock In (Penerimaan Item Masuk) ---
  public getStockReceipts(): StockReceipt[] {
    const receipts = this.getTable<StockReceipt>(STORAGE_KEYS.STOCK_RECEIPTS);
    return receipts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public createStockReceipt(data: {
    supplier: string;
    referenceDoc: string;
    items: { productId: string; quantity: number; unitCost: number }[];
    notes: string;
  }): { success: boolean; receipt?: StockReceipt; error?: string } {
    if (!data.items || data.items.length === 0) {
      return { success: false, error: 'Daftar item masuk tidak boleh kosong.' };
    }

    const products = this.getProducts();
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seq = String(this.getStockReceipts().length + 1).padStart(3, '0');
    const receiptNumber = `RCV-${todayStr}-${seq}`;
    const user = this.getActiveUser();
    const now = new Date().toISOString();

    let totalCost = 0;
    const receiptItems = [];

    for (const item of data.items) {
      const pIdx = products.findIndex((p) => p.id === item.productId);
      if (pIdx === -1) continue;

      const p = products[pIdx];
      const subtotal = item.quantity * item.unitCost;
      totalCost += subtotal;

      const initStock = p.stock;
      const finStock = initStock + item.quantity;
      products[pIdx].stock = finStock;
      if (item.unitCost > 0) {
        products[pIdx].costPrice = item.unitCost; // Optionally update cost price
      }
      products[pIdx].updatedAt = now;

      receiptItems.push({
        productId: p.id,
        productSku: p.sku,
        productName: p.name,
        quantity: item.quantity,
        unitCost: item.unitCost,
        subtotal,
      });

      this.recordStockMovement({
        referenceNumber: receiptNumber,
        productId: p.id,
        productSku: p.sku,
        productName: p.name,
        barcode: p.barcode,
        movementType: 'item_masuk',
        direction: 'masuk',
        initialStock: initStock,
        quantity: item.quantity,
        finalStock: finStock,
        notes: `Penerimaan dari ${data.supplier || 'Pemasok'} (Ref: ${data.referenceDoc || '-'})`,
      });
    }

    this.setTable(STORAGE_KEYS.PRODUCTS, products);

    const newReceipt: StockReceipt = {
      id: `RCV-${Date.now()}`,
      receiptNumber,
      date: now,
      supplier: data.supplier,
      referenceDoc: data.referenceDoc,
      items: receiptItems,
      totalCost,
      notes: data.notes,
      createdBy: user.name,
      createdAt: now,
    };

    const list = this.getTable<StockReceipt>(STORAGE_KEYS.STOCK_RECEIPTS);
    list.push(newReceipt);
    this.setTable(STORAGE_KEYS.STOCK_RECEIPTS, list);

    this.logAudit('STOCK_IN', 'Item Masuk', `Penerimaan barang ${receiptNumber} (${data.supplier}) senilai Rp ${totalCost.toLocaleString('id-ID')}`);
    return { success: true, receipt: newReceipt };
  }

  // --- Stock Out (Item Keluar) ---
  public getStockIssues(): StockIssue[] {
    const issues = this.getTable<StockIssue>(STORAGE_KEYS.STOCK_ISSUES);
    return issues.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public createStockIssue(data: {
    reason: string;
    referenceDoc: string;
    items: { productId: string; quantity: number }[];
    notes: string;
  }): { success: boolean; issue?: StockIssue; error?: string } {
    if (!data.items || data.items.length === 0) {
      return { success: false, error: 'Daftar item keluar tidak boleh kosong.' };
    }

    const products = this.getProducts();
    const settings = this.getSettings();

    // Check negative stock prevention
    for (const item of data.items) {
      const p = products.find((prod) => prod.id === item.productId);
      if (!p) continue;
      if (!settings.allowNegativeStock && p.stock < item.quantity) {
        return {
          success: false,
          error: `Stok produk '${p.name}' tidak mencukupi untuk dikeluarkan! Tersedia: ${p.stock}, diminta: ${item.quantity}.`,
        };
      }
    }

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seq = String(this.getStockIssues().length + 1).padStart(3, '0');
    const issueNumber = `ISS-${todayStr}-${seq}`;
    const user = this.getActiveUser();
    const now = new Date().toISOString();

    const issueItems = [];

    for (const item of data.items) {
      const pIdx = products.findIndex((p) => p.id === item.productId);
      if (pIdx === -1) continue;

      const p = products[pIdx];
      const initStock = p.stock;
      const finStock = initStock - item.quantity;
      products[pIdx].stock = finStock;
      products[pIdx].updatedAt = now;

      issueItems.push({
        productId: p.id,
        productSku: p.sku,
        productName: p.name,
        quantity: item.quantity,
      });

      this.recordStockMovement({
        referenceNumber: issueNumber,
        productId: p.id,
        productSku: p.sku,
        productName: p.name,
        barcode: p.barcode,
        movementType: 'item_keluar',
        direction: 'keluar',
        initialStock: initStock,
        quantity: item.quantity,
        finalStock: finStock,
        notes: `Pengeluaran barang: ${data.reason} (Ref: ${data.referenceDoc || '-'})`,
      });
    }

    this.setTable(STORAGE_KEYS.PRODUCTS, products);

    const newIssue: StockIssue = {
      id: `ISS-${Date.now()}`,
      issueNumber,
      date: now,
      reason: data.reason,
      referenceDoc: data.referenceDoc,
      items: issueItems,
      notes: data.notes,
      createdBy: user.name,
      createdAt: now,
    };

    const list = this.getTable<StockIssue>(STORAGE_KEYS.STOCK_ISSUES);
    list.push(newIssue);
    this.setTable(STORAGE_KEYS.STOCK_ISSUES, list);

    this.logAudit('STOCK_OUT', 'Item Keluar', `Pengeluaran barang ${issueNumber} (${data.reason})`);
    return { success: true, issue: newIssue };
  }

  // --- Stock Opname (Stoktake) ---
  public getStocktakes(): Stocktake[] {
    const list = this.getTable<Stocktake>(STORAGE_KEYS.STOCKTAKES);
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public saveStocktakeDraft(data: {
    items: StocktakeItem[];
    notes: string;
  }): { success: boolean; stocktake?: Stocktake; error?: string } {
    const list = this.getTable<Stocktake>(STORAGE_KEYS.STOCKTAKES);
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seq = String(list.length + 1).padStart(3, '0');
    const sessionNumber = `OPN-${todayStr}-${seq}`;
    const now = new Date().toISOString();

    const stocktake: Stocktake = {
      id: `OPN-${Date.now()}`,
      sessionNumber,
      date: now,
      status: 'draft',
      items: data.items,
      notes: data.notes,
      createdAt: now,
    };

    list.push(stocktake);
    this.setTable(STORAGE_KEYS.STOCKTAKES, list);
    this.logAudit('STOCKTAKE', 'Stok Opname', `Menyimpan draft sesi stok opname ${sessionNumber}`);
    return { success: true, stocktake };
  }

  public finalizeStocktake(id: string): { success: boolean; stocktake?: Stocktake; error?: string } {
    const list = this.getStocktakes();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return { success: false, error: 'Sesi stok opname tidak ditemukan.' };

    const session = list[idx];
    if (session.status === 'difinalisasi') {
      return { success: false, error: 'Sesi stok opname ini sudah difinalisasi sebelumnya.' };
    }

    const user = this.getActiveUser();
    if (user.role !== 'admin' && user.role !== 'supervisor') {
      return { success: false, error: 'Hanya Administrator atau Supervisor yang berhak memfinalisasi hasil stok opname.' };
    }

    const products = this.getProducts();
    const now = new Date().toISOString();

    // Apply adjustments and write stock movement records
    for (const item of session.items) {
      const pIdx = products.findIndex((p) => p.id === item.productId);
      if (pIdx !== -1) {
        const curSystemStock = products[pIdx].stock;
        const diff = item.physicalStock - curSystemStock;

        if (diff !== 0) {
          products[pIdx].stock = item.physicalStock;
          products[pIdx].updatedAt = now;

          this.recordStockMovement({
            referenceNumber: session.sessionNumber,
            productId: products[pIdx].id,
            productSku: products[pIdx].sku,
            productName: products[pIdx].name,
            barcode: products[pIdx].barcode,
            movementType: 'penyesuaian_opname',
            direction: diff > 0 ? 'masuk' : 'keluar',
            initialStock: curSystemStock,
            quantity: Math.abs(diff),
            finalStock: item.physicalStock,
            notes: `Penyesuaian Opname ${session.sessionNumber}. Selisih: ${diff > 0 ? '+' : ''}${diff}. Keterangan: ${item.notes || '-'}`,
          });
        }
      }
    }

    this.setTable(STORAGE_KEYS.PRODUCTS, products);

    session.status = 'difinalisasi';
    session.finalizedBy = user.name;
    session.finalizedAt = now;
    list[idx] = session;
    this.setTable(STORAGE_KEYS.STOCKTAKES, list);

    this.logAudit('STOCKTAKE', 'Stok Opname', `Memfinalisasi penyesuaian stok opname ${session.sessionNumber}`);
    return { success: true, stocktake: session };
  }

  // --- Smart Stock Analytics & Insights ---
  public getSmartStockAnalytics(leadTimeDays = 3, safetyStockPercent = 20) {
    const products = this.getProducts();
    const movements = this.getStockMovements();
    const sales = this.getSales();

    // 1. Calculate sales velocity over last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const productSalesMap = new Map<string, { totalSold: number; revenue: number; lastSaleDate?: string }>();

    for (const s of sales) {
      if (s.orderStatus === 'dibatalkan') continue;
      const saleDate = new Date(s.date);
      if (saleDate >= thirtyDaysAgo) {
        for (const item of s.items) {
          const cur = productSalesMap.get(item.productId) || { totalSold: 0, revenue: 0 };
          cur.totalSold += item.quantity;
          cur.revenue += item.subtotal;
          if (!cur.lastSaleDate || new Date(s.date) > new Date(cur.lastSaleDate)) {
            cur.lastSaleDate = s.date;
          }
          productSalesMap.set(item.productId, cur);
        }
      }
    }

    const items = products.map((prod) => {
      const soldData = productSalesMap.get(prod.id) || { totalSold: 0, revenue: 0 };
      const dailyVelocity = soldData.totalSold / 30; // average units per day
      const daysOfInventory = dailyVelocity > 0 ? Math.round(prod.stock / dailyVelocity) : (prod.stock > 0 ? 999 : 0);

      // Lead time demand
      const leadTimeDemand = dailyVelocity * leadTimeDays;
      // Safety stock
      const safetyStock = Math.ceil(leadTimeDemand * (safetyStockPercent / 100));
      // Reorder Point (ROP)
      const reorderPoint = Math.max(prod.minStock, Math.ceil(leadTimeDemand + safetyStock));
      // Needs reorder if current stock <= ROP
      const needsRestock = prod.stock <= reorderPoint;
      // Recommended Order Qty (ROQ) to bring back up to optimal buffer (e.g. 14 days supply + buffer)
      const targetOptimalStock = Math.max(prod.minStock * 2, Math.ceil(dailyVelocity * 14 + safetyStock));
      const recommendedOrderQty = needsRestock ? Math.max(0, targetOptimalStock - prod.stock) : 0;

      const isDeadStock = soldData.totalSold === 0 && prod.stock > 0;
      const isCritical = prod.stock === 0 || prod.stock <= prod.minStock;

      return {
        product: prod,
        totalSold30d: soldData.totalSold,
        revenue30d: soldData.revenue,
        lastSaleDate: soldData.lastSaleDate,
        dailyVelocity,
        daysOfInventory,
        reorderPoint,
        safetyStock,
        needsRestock,
        recommendedOrderQty,
        isDeadStock,
        isCritical,
      };
    });

    const lowStockCount = items.filter((i) => i.product.stock > 0 && i.product.stock <= i.product.minStock).length;
    const outOfStockCount = items.filter((i) => i.product.stock === 0).length;
    const deadStockCount = items.filter((i) => i.isDeadStock).length;
    const restockNeededCount = items.filter((i) => i.needsRestock).length;

    // Fast moving (top sellers)
    const fastMoving = [...items].filter((i) => i.totalSold30d > 0).sort((a, b) => b.totalSold30d - a.totalSold30d);
    // Dead stock
    const deadStock = items.filter((i) => i.isDeadStock);

    return {
      items,
      lowStockCount,
      outOfStockCount,
      deadStockCount,
      restockNeededCount,
      fastMoving,
      deadStock,
    };
  }

  // --- Database Backup & Restore ---
  public exportDatabaseJson(): string {
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      settings: this.getSettings(),
      users: this.getUsers(),
      categories: this.getCategories(),
      units: this.getUnits(),
      products: this.getProducts(),
      customers: this.getCustomers(),
      salespeople: this.getSalespeople(),
      sales: this.getSales(),
      payments: this.getPayments(),
      returns: this.getReturns(),
      stockMovements: this.getStockMovements(),
      stockReceipts: this.getStockReceipts(),
      stockIssues: this.getStockIssues(),
      stocktakes: this.getStocktakes(),
      auditLogs: this.getAuditLogs(),
    };
    return JSON.stringify(backup, null, 2);
  }

  public importDatabaseJson(jsonString: string): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.products || !Array.isArray(parsed.products)) {
        return { success: false, error: 'Format berkas cadangan tidak valid (tabel produk tidak ditemukan).' };
      }

      if (parsed.settings) localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(parsed.settings));
      if (parsed.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(parsed.users));
      if (parsed.categories) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(parsed.categories));
      if (parsed.units) localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(parsed.units));
      if (parsed.products) localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(parsed.products));
      if (parsed.customers) localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(parsed.customers));
      if (parsed.salespeople) localStorage.setItem(STORAGE_KEYS.SALESPEOPLE, JSON.stringify(parsed.salespeople));
      if (parsed.sales) localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(parsed.sales));
      if (parsed.payments) localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(parsed.payments));
      if (parsed.returns) localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(parsed.returns));
      if (parsed.stockMovements) localStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify(parsed.stockMovements));
      if (parsed.stockReceipts) localStorage.setItem(STORAGE_KEYS.STOCK_RECEIPTS, JSON.stringify(parsed.stockReceipts));
      if (parsed.stockIssues) localStorage.setItem(STORAGE_KEYS.STOCK_ISSUES, JSON.stringify(parsed.stockIssues));
      if (parsed.stocktakes) localStorage.setItem(STORAGE_KEYS.STOCKTAKES, JSON.stringify(parsed.stocktakes));
      if (parsed.auditLogs) localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(parsed.auditLogs));

      this.logAudit('SYSTEM', 'Database', 'Memulihkan database dari berkas cadangan JSON.');
      return { success: true };
    } catch (e: any) {
      return { success: false, error: `Gagal memproses data JSON: ${e.message}` };
    }
  }
}

export const db = new DatabaseService();
