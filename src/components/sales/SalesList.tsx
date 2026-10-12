import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Printer,
  Edit2,
  Trash2,
  Eye,
  CreditCard,
  X,
  Barcode as BarcodeIcon,
  ShoppingBag,
  ArrowUpDown,
  FileText,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { db } from '../../services/db';
import { Customer, PaymentMethod, PaymentStatus, Product, Sale, SaleItem, Salesperson } from '../../types';
import { formatDateTime, formatRupiah, printHtmlDocument } from '../../utils/formatters';

interface SalesListProps {
  onRefreshData: () => void;
  onOpenCashierWithSale: (saleId: string) => void;
}

export const SalesList: React.FC<SalesListProps> = ({
  onRefreshData,
  onOpenCashierWithSale,
}) => {
  const sales = db.getSales();
  const products = db.getProducts();
  const customers = db.getCustomers();
  const salespeople = db.getSalespeople();
  const settings = db.getSettings();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'total' | 'invoice' | 'customer'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Form states for New Sale
  const [customerId, setCustomerId] = useState<string>(customers[0]?.id || '');
  const [salesId, setSalesId] = useState<string>('');
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [applyTax, setApplyTax] = useState<boolean>(false);
  const [paidInitial, setPaidInitial] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai');
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // USB Barcode Scanner Input field ref & value
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus barcode scanner input when add modal is opened
  useEffect(() => {
    if (showAddModal) {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    }
  }, [showAddModal]);

  // Handle USB HID Barcode Scanner KeyPress (Enter triggers submit)
  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    // Find product by barcode or SKU
    const product = products.find(
      (p) => p.isActive && (p.barcode === code || p.sku.toLowerCase() === code.toLowerCase())
    );

    if (!product) {
      alert(`Produk dengan Barcode / SKU "${code}" tidak ditemukan atau nonaktif!`);
      setBarcodeInput('');
      return;
    }

    // Add or increment in cart
    setCartItems((prev) => {
      const idx = prev.findIndex((item) => item.productId === product.id);
      if (idx !== -1) {
        const next = [...prev];
        const newQty = next[idx].quantity + 1;
        next[idx] = {
          ...next[idx],
          quantity: newQty,
          subtotal: newQty * next[idx].unitPrice - next[idx].discount,
        };
        return next;
      } else {
        const newItem: SaleItem = {
          productId: product.id,
          productSku: product.sku,
          productName: product.name,
          barcode: product.barcode,
          quantity: 1,
          unit: product.unit,
          unitPrice: product.sellingPrice,
          costPrice: product.costPrice,
          discount: 0,
          subtotal: product.sellingPrice,
        };
        return [...prev, newItem];
      }
    });

    setBarcodeInput('');
  };

  const handleUpdateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.productId !== productId));
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          return {
            ...item,
            quantity,
            subtotal: quantity * item.unitPrice - item.discount,
          };
        }
        return item;
      })
    );
  };

  const handleUpdateItemPrice = (productId: string, unitPrice: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          return {
            ...item,
            unitPrice,
            subtotal: item.quantity * unitPrice - item.discount,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Calculations for current cart
  const subtotalCart = useMemo(() => cartItems.reduce((acc, i) => acc + i.subtotal, 0), [cartItems]);
  const taxCart = useMemo(() => (applyTax ? Math.round(subtotalCart * (settings.ppnRate / 100)) : 0), [subtotalCart, applyTax, settings.ppnRate]);
  const grandTotalCart = Math.max(0, subtotalCart - discountAmount + taxCart);

  const handleCreateSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (cartItems.length === 0) {
      setFormError('Keranjang belanja masih kosong! Scan barcode atau pilih produk.');
      return;
    }

    const customer = customers.find((c) => c.id === customerId);
    const salesperson = salespeople.find((s) => s.id === salesId);

    const res = db.createSale({
      customerId,
      customerName: customer ? customer.name : 'Pelanggan Umum',
      salesId: salesperson?.id,
      salesName: salesperson?.name,
      items: cartItems,
      discount: discountAmount,
      tax: taxCart,
      subtotal: subtotalCart,
      grandTotal: grandTotalCart,
      paidAmount: paidInitial,
      paymentMethod,
      notes,
    });

    if (res.success && res.sale) {
      setShowAddModal(false);
      onRefreshData();
      alert(`Penjualan berhasil dibuat dengan nomor faktur: ${res.sale.invoiceNumber}`);
    } else {
      setFormError(res.error || 'Gagal menyimpan transaksi.');
    }
  };

  const handleCancelSale = (s: Sale) => {
    if (s.paymentStatus === 'lunas') {
      alert('Transaksi yang sudah lunas tidak dapat dibatalkan langsung. Silakan gunakan menu Retur Penjualan!');
      return;
    }

    const reason = prompt(`Masukkan alasan pembatalan transaksi ${s.invoiceNumber}:`);
    if (!reason) return;

    const res = db.cancelSale(s.id, reason);
    if (res.success) {
      onRefreshData();
      alert('Transaksi berhasil dibatalkan dan stok dikembalikan ke inventori.');
    } else {
      alert(res.error);
    }
  };

  // Print Invoice / Nota Penjualan
  const handlePrintInvoice = (sale: Sale) => {
    const customer = customers.find((c) => c.id === sale.customerId);
    const invoiceHtml = `
      <style>
        .inv-box { max-width: 800px; margin: auto; padding: 20px; font-size: 13px; line-height: 20px; font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; }
        .inv-table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; }
        .inv-table th { background: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 8px 12px; font-size: 11px; text-transform: uppercase; }
        .inv-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
        .bold { font-weight: bold; }
        .text-right { text-align: right; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
      </style>
      <div class="inv-box">
        <div style="display:flex; justify-content:space-between; border-bottom:2px solid #0f172a; padding-bottom:12px; margin-bottom:20px;">
          <div>
            <h1 style="font-size:22px; font-weight:bold; margin-bottom:4px; color:#0f172a;">${settings.storeName}</h1>
            <div>${settings.storeAddress}</div>
            <div>Telp: ${settings.storePhone}</div>
          </div>
          <div style="text-align:right;">
            <h2 style="font-size:18px; font-weight:bold; color:#2563eb; margin-bottom:4px;">FAKTUR PENJUALAN</h2>
            <div class="font-mono bold">No: ${sale.invoiceNumber}</div>
            <div>Tanggal: ${formatDateTime(sale.date)}</div>
            <div>Status: <strong style="text-transform:uppercase;">${sale.paymentStatus.replace('_', ' ')}</strong></div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; margin-bottom:20px; background:#f8fafc; padding:12px; border-radius:8px;">
          <div>
            <div style="font-size:11px; color:#64748b; font-weight:bold; text-transform:uppercase;">Kepada Yth:</div>
            <div style="font-size:14px; font-weight:bold;">${sale.customerName}</div>
            <div>Telp: ${customer?.phone || '-'}</div>
            <div>${customer?.address || ''}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px; color:#64748b; font-weight:bold; text-transform:uppercase;">Sales / Petugas:</div>
            <div style="font-weight:bold;">${sale.salesName || 'Kasir Toko'}</div>
            <div>Metode: ${sale.paymentMethod.replace('_', ' ').toUpperCase()}</div>
          </div>
        </div>

        <table class="inv-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Deskripsi Produk</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Harga Satuan</th>
              <th class="text-right">Diskon</th>
              <th class="text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            ${sale.items
              .map(
                (item, idx) => `
              <tr>
                <td style="width:30px;">${idx + 1}</td>
                <td>
                  <strong>${item.productName}</strong><br/>
                  <span style="font-size:11px; color:#64748b;" class="font-mono">SKU: ${item.productSku}</span>
                </td>
                <td class="text-right font-mono">${item.quantity} ${item.unit}</td>
                <td class="text-right font-mono">${formatRupiah(item.unitPrice)}</td>
                <td class="text-right font-mono">${item.discount > 0 ? formatRupiah(item.discount) : '-'}</td>
                <td class="text-right font-mono bold">${formatRupiah(item.subtotal)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div style="margin-top:20px; display:flex; justify-content:space-between;">
          <div style="max-width:320px;">
            <div style="font-size:11px; font-weight:bold; color:#64748b;">CATATAN:</div>
            <div style="font-size:12px; color:#475569;">${sale.notes || '-'}</div>
            <div style="margin-top:20px; font-size:11px; color:#64748b; border:1px dashed #cbd5e1; padding:8px; border-radius:4px;">
              ${settings.receiptFooter}
            </div>
          </div>

          <div style="width:280px;">
            <div style="display:flex; justify-content:space-between; padding:4px 0;">
              <span>Subtotal:</span>
              <span class="font-mono">${formatRupiah(sale.subtotal)}</span>
            </div>
            ${
              sale.discount > 0
                ? `<div style="display:flex; justify-content:space-between; padding:4px 0; color:#dc2626;">
                    <span>Diskon Faktur:</span>
                    <span class="font-mono">-${formatRupiah(sale.discount)}</span>
                  </div>`
                : ''
            }
            ${
              sale.tax > 0
                ? `<div style="display:flex; justify-content:space-between; padding:4px 0;">
                    <span>PPN (${settings.ppnRate}%):</span>
                    <span class="font-mono">+${formatRupiah(sale.tax)}</span>
                  </div>`
                : ''
            }
            <div style="display:flex; justify-content:space-between; padding:8px 0; border-top:2px solid #0f172a; font-size:15px; font-weight:bold; margin-top:4px;">
              <span>TOTAL AKHIR:</span>
              <span class="font-mono">${formatRupiah(sale.grandTotal)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:4px 0; color:#16a34a; font-weight:bold;">
              <span>Total Terbayar:</span>
              <span class="font-mono">${formatRupiah(sale.paidAmount)}</span>
            </div>
            ${
              sale.balanceDue > 0
                ? `<div style="display:flex; justify-content:space-between; padding:4px 0; color:#dc2626; font-weight:bold; border-top:1px dashed #cbd5e1; margin-top:4px;">
                    <span>Sisa Piutang:</span>
                    <span class="font-mono">${formatRupiah(sale.balanceDue)}</span>
                  </div>`
                : ''
            }
          </div>
        </div>

        <div style="margin-top:40px; display:flex; justify-content:space-between; text-align:center;">
          <div style="width:160px;">
            <div>Penerima / Pembeli</div>
            <div style="height:60px;"></div>
            <div style="border-top:1px solid #94a3b8; font-weight:bold;">( ${sale.customerName} )</div>
          </div>
          <div style="width:160px;">
            <div>Hormat Kami,</div>
            <div style="height:60px;"></div>
            <div style="border-top:1px solid #94a3b8; font-weight:bold;">( ${settings.storeName} )</div>
          </div>
        </div>
      </div>
    `;

    printHtmlDocument(invoiceHtml, `Faktur_${sale.invoiceNumber}`);
  };

  // Filtered & Sorted Sales
  const filteredSales = useMemo(() => {
    return sales
      .filter((s) => {
        // Query search
        const q = searchQuery.toLowerCase().trim();
        if (q) {
          const matchInvoice = s.invoiceNumber.toLowerCase().includes(q);
          const matchCustomer = s.customerName.toLowerCase().includes(q);
          if (!matchInvoice && !matchCustomer) return false;
        }

        // Status
        if (selectedStatus !== 'ALL' && s.paymentStatus !== selectedStatus) return false;

        // Salesperson
        if (selectedSalesperson !== 'ALL' && s.salesId !== selectedSalesperson) return false;

        // Date range
        if (startDate && s.date.slice(0, 10) < startDate) return false;
        if (endDate && s.date.slice(0, 10) > endDate) return false;

        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'date') cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
        else if (sortBy === 'total') cmp = a.grandTotal - b.grandTotal;
        else if (sortBy === 'invoice') cmp = a.invoiceNumber.localeCompare(b.invoiceNumber);
        else if (sortBy === 'customer') cmp = a.customerName.localeCompare(b.customerName);
        return sortOrder === 'asc' ? cmp : -cmp;
      });
  }, [sales, searchQuery, selectedStatus, selectedSalesperson, startDate, endDate, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredSales.length / pageSize) || 1;
  const paginatedSales = filteredSales.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Daftar Transaksi Penjualan</h1>
          <p className="text-xs text-slate-500 mt-1">
            Buat pesanan penjualan, kelola tagihan piutang, dan cetak invoice resmi nota penjualan.
          </p>
        </div>
        <button
          onClick={() => {
            setCartItems([]);
            setDiscountAmount(0);
            setPaidInitial(0);
            setNotes('');
            setFormError(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Transaksi Penjualan Baru</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari no faktur atau pelanggan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              aria-label="Filter Status Pembayaran"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">Semua Status Bayar</option>
              <option value="belum_dibayar">Belum Dibayar (Piutang)</option>
              <option value="dibayar_sebagian">Dibayar Sebagian (DP)</option>
              <option value="lunas">Lunas</option>
              <option value="dibatalkan">Dibatalkan</option>
            </select>
          </div>

          {/* Sales Filter */}
          <div>
            <select
              aria-label="Filter Tenaga Sales"
              value={selectedSalesperson}
              onChange={(e) => setSelectedSalesperson(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">Semua Sales</option>
              {salespeople.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Start */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              title="Dari Tanggal"
            />
          </div>

          {/* Date Range End */}
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              title="Sampai Tanggal"
            />
          </div>
        </div>

        {/* Counter and Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Total: <strong className="text-slate-900 font-mono">{filteredSales.length}</strong> transaksi ditemukan
          </div>

          <div className="flex items-center gap-2">
            <span>Urutkan:</span>
            <select
              aria-label="Urutkan Transaksi Berdasarkan"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-medium text-slate-800 border-none focus:outline-none cursor-pointer"
            >
              <option value="date">Tanggal Transaksi</option>
              <option value="total">Nominal Total</option>
              <option value="invoice">No. Faktur</option>
              <option value="customer">Nama Pelanggan</option>
            </select>
            <button
              onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
              className="p-1 hover:bg-slate-100 rounded text-slate-700 font-semibold flex items-center gap-1"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortOrder === 'desc' ? 'Terbaru / Tertinggi' : 'Terlama / Terendah'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">No. Faktur</th>
                <th className="py-3 px-4">Tanggal &amp; Waktu</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Sales</th>
                <th className="py-3 px-4 text-right">Total Tagihan</th>
                <th className="py-3 px-4 text-right">Terbayar</th>
                <th className="py-3 px-4 text-right">Sisa Piutang</th>
                <th className="py-3 px-4 text-center">Status Pembayaran</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Tidak ada transaksi penjualan yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      {s.invoiceNumber}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {formatDateTime(s.date)}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {s.customerName}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {s.salesName || '-'}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(s.grandTotal)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-emerald-700">
                      {formatRupiah(s.paidAmount)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold text-red-600">
                      {s.balanceDue > 0 ? formatRupiah(s.balanceDue) : '-'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          s.paymentStatus === 'lunas'
                            ? 'bg-emerald-50 text-emerald-700'
                            : s.paymentStatus === 'dibayar_sebagian'
                            ? 'bg-amber-50 text-amber-700'
                            : s.paymentStatus === 'dibatalkan'
                            ? 'bg-slate-100 text-slate-400 line-through'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {s.paymentStatus.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Quick Pay in Cashier if balance due */}
                        {s.balanceDue > 0 && s.paymentStatus !== 'dibatalkan' && (
                          <button
                            onClick={() => onOpenCashierWithSale(s.id)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                            title="Proses Bayar di Kasir"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Print Invoice */}
                        <button
                          onClick={() => handlePrintInvoice(s)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="Cetak Faktur Penjualan"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Detail Modal */}
                        <button
                          onClick={() => {
                            setSelectedSale(s);
                            setShowDetailModal(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="Lihat Detail Transaksi"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Cancel if unpaid */}
                        {s.paymentStatus === 'belum_dibayar' && (
                          <button
                            onClick={() => handleCancelSale(s)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Batalkan Transaksi Belum Lunas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Halaman <strong className="font-mono">{currentPage}</strong> dari{' '}
            <strong className="font-mono">{totalPages}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Tambah Penjualan Baru (Dengan USB Scanner Barcode) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Formulir Transaksi Penjualan Baru</h3>
                <p className="text-xs text-slate-500">Mendukung input pemindai barcode USB atau pencarian manual</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Customer & Sales Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pelanggan *</label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sales (Opsional)</label>
                  <select
                    value={salesId}
                    onChange={(e) => setSalesId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="">- Tidak ada sales (Kasir Langsung) -</option>
                    {salespeople.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* USB Barcode Scanner Entry Section */}
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                    <BarcodeIcon className="w-4 h-4 text-blue-600" />
                    <span>Scan Barcode USB HID / Input Kode Produk</span>
                  </div>
                  <span className="text-[11px] text-blue-700">Tekan Enter setelah scan</span>
                </div>

                <form onSubmit={handleBarcodeScan} className="flex gap-2">
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Arahkan barcode scanner ke produk, atau ketik SKU/Barcode..."
                    className="flex-1 px-3 py-2 text-xs bg-white border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
                  >
                    + Tambah Item
                  </button>
                </form>

                {/* Quick Add Dropdown for manual selection */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-500">Atau pilih langsung:</span>
                  <select
                    aria-label="Pilih Produk Manual"
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const prod = products.find((p) => p.id === e.target.value);
                      if (prod) {
                        setBarcodeInput(prod.barcode || prod.sku);
                        // Trigger immediate add
                        setTimeout(() => {
                          const event = { preventDefault: () => {} } as React.FormEvent;
                          handleBarcodeScan(event);
                        }, 50);
                      }
                      e.target.value = '';
                    }}
                    className="text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-700"
                  >
                    <option value="">-- Pilih dari Daftar Produk --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - Stok: {p.stock} ({formatRupiah(p.sellingPrice)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cart Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                      <th className="py-2.5 px-3">Produk</th>
                      <th className="py-2.5 px-3 text-center">Kuantitas</th>
                      <th className="py-2.5 px-3 text-right">Harga Jual</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                      <th className="py-2.5 px-3 text-center">Hapus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {cartItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Keranjang kosong. Scan barcode atau pilih produk di atas.
                        </td>
                      </tr>
                    ) : (
                      cartItems.map((item) => (
                        <tr key={item.productId} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">{item.productName}</div>
                            <div className="font-mono text-[11px] text-slate-500">
                              SKU: {item.productSku} · Barcode: {item.barcode || '-'}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItemQuantity(item.productId, parseInt(e.target.value, 10) || 1)
                              }
                              className="w-16 px-2 py-1 text-center font-mono border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
                            />
                            <span className="ml-1 text-[11px] text-slate-500">{item.unit}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleUpdateItemPrice(item.productId, parseFloat(e.target.value) || 0)
                              }
                              className="w-24 px-2 py-1 text-right font-mono border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {formatRupiah(item.subtotal)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.productId)}
                              className="p-1 text-red-500 hover:text-red-700 rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Financials & Payment summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Diskon Faktur (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="applyPpn"
                      checked={applyTax}
                      onChange={(e) => setApplyTax(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="applyPpn" className="text-xs text-slate-700">
                      Kenakan Pajak PPN {settings.ppnRate}%
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Penjualan</label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      placeholder="Informasi pengiriman, PO number..."
                    />
                  </div>
                </div>

                <div className="space-y-2 border-t sm:border-t-0 sm:border-l sm:border-slate-200 sm:pl-6 text-xs">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Subtotal Produk:</span>
                    <span className="font-mono">{formatRupiah(subtotalCart)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-red-600">
                    <span>Diskon Faktur:</span>
                    <span className="font-mono">-{formatRupiah(discountAmount)}</span>
                  </div>
                  {applyTax && (
                    <div className="flex justify-between py-1">
                      <span>PPN ({settings.ppnRate}%):</span>
                      <span className="font-mono">+{formatRupiah(taxCart)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                    <span>TOTAL TAGIHAN:</span>
                    <span className="font-mono">{formatRupiah(grandTotalCart)}</span>
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pembayaran Awal / Uang Muka (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={grandTotalCart}
                      value={paidInitial}
                      onChange={(e) => setPaidInitial(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono font-bold text-emerald-700"
                    />
                    <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                      <span>Sisa Piutang:</span>
                      <strong className="font-mono text-red-600">
                        {formatRupiah(Math.max(0, grandTotalCart - paidInitial))}
                      </strong>
                    </div>
                  </div>

                  {paidInitial > 0 && (
                    <div className="pt-1">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Metode Bayar</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      >
                        <option value="tunai">Tunai / Cash</option>
                        <option value="transfer_bca">Transfer Bank BCA</option>
                        <option value="transfer_mandiri">Transfer Bank Mandiri</option>
                        <option value="qris">QRIS Standar</option>
                        <option value="kartu_debit">Kartu Debit</option>
                        <option value="kartu_kredit">Kartu Kredit</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0 bg-white">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCreateSaleSubmit}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                Finalisasi &amp; Simpan Penjualan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detail Penjualan */}
      {showDetailModal && selectedSale && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Faktur Penjualan: {selectedSale.invoiceNumber}
                </h3>
                <div className="text-xs text-slate-500">{formatDateTime(selectedSale.date)}</div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Pelanggan:</span>
                  <div className="font-semibold text-slate-900">{selectedSale.customerName}</div>
                </div>
                <div>
                  <span className="text-slate-500">Sales:</span>
                  <div className="font-semibold text-slate-900">{selectedSale.salesName || '-'}</div>
                </div>
                <div>
                  <span className="text-slate-500">Status Pembayaran:</span>
                  <div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-0.5 ${
                        selectedSale.paymentStatus === 'lunas'
                          ? 'bg-emerald-50 text-emerald-700'
                          : selectedSale.paymentStatus === 'dibayar_sebagian'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {selectedSale.paymentStatus.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Metode Bayar:</span>
                  <div className="font-semibold uppercase">{selectedSale.paymentMethod.replace('_', ' ')}</div>
                </div>
              </div>

              {/* Items List */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                      <th className="py-2 px-3">Produk</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Harga</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {selectedSale.items.map((i, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3">
                          <div className="font-medium text-slate-900">{i.productName}</div>
                          <div className="font-mono text-[10px] text-slate-400">{i.productSku}</div>
                        </td>
                        <td className="py-2 px-3 text-center font-mono">
                          {i.quantity} {i.unit}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">{formatRupiah(i.unitPrice)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(i.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatRupiah(selectedSale.subtotal)}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Diskon:</span>
                    <span className="font-mono">-{formatRupiah(selectedSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="font-mono">{formatRupiah(selectedSale.grandTotal)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Terbayar:</span>
                  <span className="font-mono">{formatRupiah(selectedSale.paidAmount)}</span>
                </div>
                {selectedSale.balanceDue > 0 && (
                  <div className="flex justify-between font-bold text-red-600 border-t border-slate-200 pt-1">
                    <span>Sisa Piutang:</span>
                    <span className="font-mono">{formatRupiah(selectedSale.balanceDue)}</span>
                  </div>
                )}
              </div>

              {selectedSale.notes && (
                <div className="text-xs text-slate-600">
                  <strong>Catatan:</strong> {selectedSale.notes}
                </div>
              )}

              <div className="flex justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => handlePrintInvoice(selectedSale)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Faktur Nota</span>
                </button>

                <div className="flex gap-2">
                  {selectedSale.balanceDue > 0 && selectedSale.paymentStatus !== 'dibatalkan' && (
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        onOpenCashierWithSale(selectedSale.id);
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                    >
                      Buka di Kasir
                    </button>
                  )}
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
