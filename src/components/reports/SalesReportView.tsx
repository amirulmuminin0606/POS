import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Download,
  Printer,
  Calendar,
  Filter,
  DollarSign,
  Receipt,
  RotateCcw,
  CreditCard,
} from 'lucide-react';
import { db } from '../../services/db';
import { exportToCsv, formatDate, formatDateTime, formatRupiah, printHtmlDocument } from '../../utils/formatters';

export const SalesReportView: React.FC = () => {
  const sales = db.getSales();
  const returns = db.getReturns();
  const customers = db.getCustomers();
  const salespeople = db.getSalespeople();
  const products = db.getProducts();
  const settings = db.getSettings();

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('ALL');
  const [selectedSalesId, setSelectedSalesId] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [selectedProductId, setSelectedProductId] = useState('ALL');

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (s.orderStatus === 'dibatalkan') return false;

      // Date range
      if (startDate && s.date.slice(0, 10) < startDate) return false;
      if (endDate && s.date.slice(0, 10) > endDate) return false;

      // Customer
      if (selectedCustomerId !== 'ALL' && s.customerId !== selectedCustomerId) return false;

      // Sales
      if (selectedSalesId !== 'ALL' && s.salesId !== selectedSalesId) return false;

      // Payment Status
      if (selectedStatus !== 'ALL' && s.paymentStatus !== selectedStatus) return false;

      // Method
      if (selectedMethod !== 'ALL' && s.paymentMethod !== selectedMethod) return false;

      // Product
      if (selectedProductId !== 'ALL') {
        const hasProd = s.items.some((i) => i.productId === selectedProductId);
        if (!hasProd) return false;
      }

      return true;
    });
  }, [sales, startDate, endDate, selectedCustomerId, selectedSalesId, selectedStatus, selectedMethod, selectedProductId]);

  // Aggregate Metrics
  const grossSalesTotal = useMemo(
    () => filteredSales.reduce((acc, s) => acc + s.subtotal, 0),
    [filteredSales]
  );
  const discountTotal = useMemo(
    () => filteredSales.reduce((acc, s) => acc + s.discount, 0),
    [filteredSales]
  );
  const netSalesTotal = useMemo(
    () => filteredSales.reduce((acc, s) => acc + s.grandTotal, 0),
    [filteredSales]
  );
  const paidReceivedTotal = useMemo(
    () => filteredSales.reduce((acc, s) => acc + s.paidAmount, 0),
    [filteredSales]
  );
  const receivablesTotal = useMemo(
    () => filteredSales.reduce((acc, s) => acc + s.balanceDue, 0),
    [filteredSales]
  );

  // Filtered returns matching sales
  const totalReturnsValue = useMemo(() => {
    const saleIds = new Set(filteredSales.map((s) => s.id));
    return returns
      .filter((r) => saleIds.has(r.saleId))
      .reduce((acc, r) => acc + r.totalRefund, 0);
  }, [returns, filteredSales]);

  // Sales by Rep breakdown
  const salesByRep = useMemo(() => {
    const map = new Map<string, { name: string; count: number; total: number }>();
    filteredSales.forEach((s) => {
      const repKey = s.salesId || 'Kasir / Tanpa Sales';
      const repName = s.salesName || 'Kasir Toko Langsung';
      const cur = map.get(repKey) || { name: repName, count: 0, total: 0 };
      cur.count += 1;
      cur.total += s.grandTotal;
      map.set(repKey, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredSales]);

  const handleExportCsv = () => {
    const headers = [
      'No. Faktur',
      'Tanggal & Waktu',
      'Nama Pelanggan',
      'Sales Rep',
      'Metode Bayar',
      'Status Pembayaran',
      'Subtotal',
      'Diskon Faktur',
      'PPN',
      'Grand Total',
      'Total Terbayar',
      'Sisa Piutang',
    ];
    const rows = filteredSales.map((s) => [
      s.invoiceNumber,
      formatDateTime(s.date),
      s.customerName,
      s.salesName || '-',
      s.paymentMethod.replace('_', ' '),
      s.paymentStatus.replace('_', ' '),
      s.subtotal,
      s.discount,
      s.tax,
      s.grandTotal,
      s.paidAmount,
      s.balanceDue,
    ]);
    exportToCsv(`laporan_penjualan_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const handlePrintPdf = () => {
    const html = `
      <style>
        .rpt { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; color: #0f172a; margin: 15px; }
        .bold { font-weight: bold; }
        .border-b { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
        th { background: #f8fafc; border-bottom: 2px solid #cbd5e1; padding: 6px; text-align: left; }
        td { padding: 6px; border-bottom: 1px solid #e2e8f0; }
        .text-right { text-align: right; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
      </style>
      <div class="rpt">
        <div class="border-b" style="display:flex; justify-content:space-between; align-items:flex-end;">
          <div>
            <h1 style="font-size:18px; font-weight:bold; margin-bottom:2px;">${settings.storeName}</h1>
            <div>${settings.storeAddress} · Telp: ${settings.storePhone}</div>
          </div>
          <div style="text-align:right;">
            <h2 style="font-size:16px; font-weight:bold; color:#0f766e;">LAPORAN REKAPITULASI PENJUALAN</h2>
            <div>Periode: ${startDate || 'Awal'} s/d ${endDate || 'Hari Ini'}</div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 15px; padding: 10px; background: #f8fafc; border-radius: 6px;">
          <div>
            <div style="color: #64748b; font-size: 10px;">TOTAL TRANSAKSI</div>
            <div class="bold font-mono" style="font-size: 14px;">${filteredSales.length} Nota</div>
          </div>
          <div>
            <div style="color: #64748b; font-size: 10px;">TOTAL OMZET BERSIH</div>
            <div class="bold font-mono" style="font-size: 14px; color: #0f766e;">${formatRupiah(netSalesTotal)}</div>
          </div>
          <div>
            <div style="color: #64748b; font-size: 10px;">KAS DITERIMA</div>
            <div class="bold font-mono" style="font-size: 14px; color: #16a34a;">${formatRupiah(paidReceivedTotal)}</div>
          </div>
          <div>
            <div style="color: #64748b; font-size: 10px;">TOTAL PIUTANG</div>
            <div class="bold font-mono" style="font-size: 14px; color: #dc2626;">${formatRupiah(receivablesTotal)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>No. Faktur</th>
              <th>Waktu</th>
              <th>Pelanggan</th>
              <th>Sales</th>
              <th>Metode</th>
              <th class="text-right">Total Faktur</th>
              <th class="text-right">Terbayar</th>
              <th class="text-right">Sisa Piutang</th>
            </tr>
          </thead>
          <tbody>
            ${filteredSales
              .map(
                (s) => `
              <tr>
                <td class="font-mono bold">${s.invoiceNumber}</td>
                <td>${formatDateTime(s.date)}</td>
                <td>${s.customerName}</td>
                <td>${s.salesName || '-'}</td>
                <td style="text-transform:uppercase;">${s.paymentMethod.replace('_', ' ')}</td>
                <td class="text-right font-mono bold">${formatRupiah(s.grandTotal)}</td>
                <td class="text-right font-mono" style="color:#16a34a;">${formatRupiah(s.paidAmount)}</td>
                <td class="text-right font-mono" style="color:#dc2626;">${s.balanceDue > 0 ? formatRupiah(s.balanceDue) : '-'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div style="margin-top:20px; padding:10px; background:#f1f5f9; border-radius:6px; display:flex; justify-content:space-between; font-size:12px; font-weight:bold;">
          <span>RINGKASAN AKHIR:</span>
          <div>
            <span>Omzet Kotor: <strong class="font-mono">${formatRupiah(grossSalesTotal)}</strong></span>
            <span style="margin:0 8px;">|</span>
            <span>Diskon: <strong class="font-mono">-${formatRupiah(discountTotal)}</strong></span>
            <span style="margin:0 8px;">|</span>
            <span>Retur: <strong class="font-mono" style="color:#dc2626;">-${formatRupiah(totalReturnsValue)}</strong></span>
          </div>
        </div>
      </div>
    `;

    printHtmlDocument(html, 'Laporan_Penjualan');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Laporan Rekapitulasi Penjualan</h1>
          <p className="text-xs text-slate-500 mt-1">
            Analisis omzet penjualan, piutang tertunggak, arus penerimaan kas, diskon, dan kinerja tim sales.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Ekspor Excel (.CSV)</span>
          </button>
          <button
            onClick={handlePrintPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] text-slate-500 font-medium">Jumlah Transaksi</div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-1">{filteredSales.length} Nota</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Sesuai filter aktif</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] text-slate-500 font-medium">Total Omzet Bersih</div>
          <div className="text-lg font-bold font-mono text-blue-700 mt-1">{formatRupiah(netSalesTotal)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Setelah diskon &amp; PPN</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] text-slate-500 font-medium">Total Pembayaran Masuk</div>
          <div className="text-lg font-bold font-mono text-emerald-700 mt-1">{formatRupiah(paidReceivedTotal)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Kas &amp; rekening bank</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] text-slate-500 font-medium">Total Piutang Belum Bayar</div>
          <div className="text-lg font-bold font-mono text-red-600 mt-1">{formatRupiah(receivablesTotal)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Saldo tertunggak</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] text-slate-500 font-medium">Diskon Diberikan</div>
          <div className="text-lg font-bold font-mono text-amber-700 mt-1">{formatRupiah(discountTotal)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Potongan penjualan</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] text-slate-500 font-medium">Total Retur Terkait</div>
          <div className="text-lg font-bold font-mono text-rose-700 mt-1">{formatRupiah(totalReturnsValue)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Pengembalian barang</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Pelanggan</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="ALL">Semua Pelanggan</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Tenaga Sales</label>
            <select
              value={selectedSalesId}
              onChange={(e) => setSelectedSalesId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="ALL">Semua Sales</option>
              {salespeople.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Status Bayar</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="ALL">Semua Status</option>
              <option value="lunas">Lunas</option>
              <option value="dibayar_sebagian">Dibayar Sebagian (DP)</option>
              <option value="belum_dibayar">Belum Dibayar (Piutang)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Metode Bayar</label>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="ALL">Semua Metode</option>
              <option value="tunai">Tunai</option>
              <option value="transfer_bca">Transfer BCA</option>
              <option value="transfer_mandiri">Transfer Mandiri</option>
              <option value="qris">QRIS</option>
              <option value="kartu_debit">Kartu Debit</option>
              <option value="kartu_kredit">Kartu Kredit</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">No. Faktur</th>
                <th className="py-3 px-4">Waktu Transaksi</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Sales</th>
                <th className="py-3 px-4">Metode</th>
                <th className="py-3 px-4 text-right">Nilai Faktur</th>
                <th className="py-3 px-4 text-right">Kas Diterima</th>
                <th className="py-3 px-4 text-right">Sisa Piutang</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Tidak ada transaksi penjualan pada kriteria filter ini.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{s.invoiceNumber}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{formatDateTime(s.date)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{s.customerName}</td>
                    <td className="py-3 px-4 text-slate-600">{s.salesName || '-'}</td>
                    <td className="py-3 px-4 uppercase text-slate-700">{s.paymentMethod.replace('_', ' ')}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(s.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-medium">
                      {formatRupiah(s.paidAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-red-600 font-bold">
                      {s.balanceDue > 0 ? formatRupiah(s.balanceDue) : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          s.paymentStatus === 'lunas'
                            ? 'bg-emerald-50 text-emerald-700'
                            : s.paymentStatus === 'dibayar_sebagian'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {s.paymentStatus.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
