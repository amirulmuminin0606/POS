import React, { useState } from 'react';
import {
  TrendingUp,
  Receipt,
  Package,
  Boxes,
  AlertTriangle,
  XCircle,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { db } from '../../services/db';
import { formatDate, formatDateTime, formatNumber, formatRupiah } from '../../utils/formatters';

interface DashboardViewProps {
  onNavigate: (menu: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [chartPeriod, setChartPeriod] = useState<'harian' | 'bulanan' | 'tahunan'>('harian');

  const products = db.getProducts();
  const sales = db.getSales();
  const movements = db.getStockMovements();
  const analytics = db.getSmartStockAnalytics();

  // Metrics
  const todayStr = new Date().toISOString().slice(0, 10);
  const salesToday = sales.filter((s) => s.date.slice(0, 10) === todayStr && s.orderStatus !== 'dibatalkan');
  const revenueToday = salesToday.reduce((sum, s) => sum + s.grandTotal, 0);
  const transactionsTodayCount = salesToday.length;

  const activeProductsCount = products.filter((p) => p.isActive).length;
  const totalStockUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStockItems = products.filter((p) => p.isActive && p.stock > 0 && p.stock <= p.minStock);
  const outOfStockItems = products.filter((p) => p.isActive && p.stock === 0);
  const totalReceivables = sales
    .filter((s) => s.paymentStatus === 'belum_dibayar' || s.paymentStatus === 'dibayar_sebagian')
    .reduce((sum, s) => sum + s.balanceDue, 0);

  // Sales chart calculations based on actual sales
  const salesChartData = React.useMemo(() => {
    if (chartPeriod === 'harian') {
      // Last 7 days
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayIso = d.toISOString().slice(0, 10);
        const dayName = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'numeric' });
        const daySales = sales.filter((s) => s.date.slice(0, 10) === dayIso && s.orderStatus !== 'dibatalkan');
        const total = daySales.reduce((acc, s) => acc + s.grandTotal, 0);
        days.push({ label: dayName, total, count: daySales.length });
      }
      return days;
    } else if (chartPeriod === 'bulanan') {
      // Last 6 months
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const monthPrefix = `${y}-${m}`;
        const monthName = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
        const monthSales = sales.filter((s) => s.date.startsWith(monthPrefix) && s.orderStatus !== 'dibatalkan');
        const total = monthSales.reduce((acc, s) => acc + s.grandTotal, 0);
        months.push({ label: monthName, total, count: monthSales.length });
      }
      return months;
    } else {
      // Last 3 years
      const years = [];
      const curYear = new Date().getFullYear();
      for (let y = curYear - 2; y <= curYear; y++) {
        const yearSales = sales.filter((s) => s.date.startsWith(String(y)) && s.orderStatus !== 'dibatalkan');
        const total = yearSales.reduce((acc, s) => acc + s.grandTotal, 0);
        years.push({ label: String(y), total, count: yearSales.length });
      }
      return years;
    }
  }, [sales, chartPeriod]);

  const maxChartValue = Math.max(...salesChartData.map((d) => d.total), 100000);

  // Top products
  const topProducts = analytics.fastMoving.slice(0, 5);

  // Recent transactions
  const recentSales = sales.slice(0, 5);

  // Recent stock movements
  const recentMovements = movements.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Ringkasan Operasional POS &amp; Inventori</h1>
          <p className="text-xs text-slate-500 mt-1">
            Data real-time disinkronkan dengan mutasi persediaan, kasir, dan kartu stok.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('sales-cashier')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            <span>Buka Kasir POS</span>
          </button>
          <button
            onClick={() => onNavigate('inventory-in')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Boxes className="w-4 h-4 text-blue-600" />
            <span>+ Item Masuk</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* 1. Penjualan Hari Ini */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Penjualan Hari Ini</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-base lg:text-lg font-bold text-slate-900 font-mono tabular-nums leading-tight">
            {formatRupiah(revenueToday)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {transactionsTodayCount} transaksi selesai
          </div>
        </div>

        {/* 2. Total Transaksi Hari Ini */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Transaksi Hari Ini</span>
            <Receipt className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-base lg:text-lg font-bold text-slate-900 font-mono tabular-nums leading-tight">
            {transactionsTodayCount} Nota
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Kasir &amp; faktur penjualan
          </div>
        </div>

        {/* 3. Produk Aktif */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Produk Aktif</span>
            <Package className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-base lg:text-lg font-bold text-slate-900 font-mono tabular-nums leading-tight">
            {activeProductsCount} SKU
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Total master item
          </div>
        </div>

        {/* 4. Total Unit Stok */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Unit Stok</span>
            <Boxes className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-base lg:text-lg font-bold text-slate-900 font-mono tabular-nums leading-tight">
            {formatNumber(totalStockUnits)} Unit
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Fisik di seluruh rak
          </div>
        </div>

        {/* 5. Stok Menipis */}
        <div
          onClick={() => onNavigate('smart-stock')}
          className="bg-white p-4 rounded-xl border border-amber-200 hover:border-amber-400 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-medium">Stok Menipis</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-base lg:text-lg font-bold text-amber-600 font-mono tabular-nums leading-tight">
            {lowStockItems.length} Produk
          </div>
          <div className="text-[11px] text-amber-700 mt-1">
            &le; batas minimum stok
          </div>
        </div>

        {/* 6. Stok Habis */}
        <div
          onClick={() => onNavigate('smart-stock')}
          className="bg-white p-4 rounded-xl border border-red-200 hover:border-red-400 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-red-700 mb-2">
            <span className="text-xs font-medium">Stok Habis (0)</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-base lg:text-lg font-bold text-red-600 font-mono tabular-nums leading-tight">
            {outOfStockItems.length} Produk
          </div>
          <div className="text-[11px] text-red-700 mt-1">
            Harus segera reorder
          </div>
        </div>

        {/* 7. Total Piutang Pelanggan */}
        <div
          onClick={() => onNavigate('sales-list')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Piutang Pelanggan</span>
            <CreditCard className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-base lg:text-lg font-bold text-rose-700 font-mono tabular-nums leading-tight">
            {formatRupiah(totalReceivables)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Saldo belum terbayar
          </div>
        </div>
      </div>

      {/* Main Grid: Chart & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Tren Penjualan Toko</h3>
                <p className="text-xs text-slate-500 mt-0.5">Grafik omzet aktual berdasarkan transaksi penjualan</p>
              </div>

              {/* Segmented Period Tabs (Permitted interactive buttons) */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setChartPeriod('harian')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    chartPeriod === 'harian'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  7 Hari
                </button>
                <button
                  onClick={() => setChartPeriod('bulanan')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    chartPeriod === 'bulanan'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  6 Bulan
                </button>
                <button
                  onClick={() => setChartPeriod('tahunan')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    chartPeriod === 'tahunan'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tahunan
                </button>
              </div>
            </div>

            {/* Bar Chart Visualization */}
            <div className="h-56 flex items-end gap-3 pt-6 border-b border-slate-100 px-2">
              {salesChartData.map((data, idx) => {
                const heightPercent = maxChartValue > 0 ? Math.max(8, (data.total / maxChartValue) * 100) : 8;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="text-[10px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity mb-1 whitespace-nowrap">
                      {formatRupiah(data.total)}
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[42px] rounded-t-md transition-all duration-300 ${
                        data.total > 0
                          ? 'bg-blue-600 group-hover:bg-blue-700'
                          : 'bg-slate-200 group-hover:bg-slate-300'
                      }`}
                    />
                    <div className="text-[11px] font-medium text-slate-600 mt-2 truncate w-full text-center">
                      {data.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs text-slate-500">
            <div>
              Total Penjualan Periode Terpilih:{' '}
              <strong className="text-slate-900 font-mono">
                {formatRupiah(salesChartData.reduce((acc, d) => acc + d.total, 0))}
              </strong>
            </div>
            <button
              onClick={() => onNavigate('reports-sales')}
              className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Laporan Lengkap</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Peringatan Stok Minimum & Kritis */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">Peringatan Stok Kritis</h3>
              </div>
              <span className="text-xs text-slate-500">{lowStockItems.length + outOfStockItems.length} Item</span>
            </div>

            <div className="space-y-3">
              {[...outOfStockItems, ...lowStockItems].slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-900 line-clamp-1">{p.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                      <span className="font-mono">{p.sku}</span>
                      <span>·</span>
                      <span>Rak: {p.rackLocation}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-bold font-mono ${p.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                      {p.stock === 0 ? 'HABIS' : `${p.stock} ${p.unit}`}
                    </div>
                    <div className="text-[10px] text-slate-400">Min: {p.minStock}</div>
                  </div>
                </div>
              ))}

              {lowStockItems.length === 0 && outOfStockItems.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  Semua stok produk saat ini dalam kondisi aman.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => onNavigate('smart-stock')}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analisis Estimasi Restock (Stok Pintar)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Best Sellers, Recent Sales, Recent Stock Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Produk Terlaris (Fast Moving) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Produk Terlaris (30 Hari)</h3>
            <span className="text-xs text-slate-400">Volume Terbanyak</span>
          </div>
          <div className="divide-y divide-slate-100">
            {topProducts.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">Belum ada riwayat penjualan produk.</div>
            ) : (
              topProducts.map((item, idx) => (
                <div key={item.product.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 text-slate-400 font-mono font-medium">{idx + 1}.</span>
                    <div>
                      <div className="font-medium text-slate-900 line-clamp-1">{item.product.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{item.product.sku}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900 font-mono">
                      {item.totalSold30d} {item.product.unit}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {formatRupiah(item.revenue30d)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Transaksi Penjualan Terbaru */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Transaksi Terbaru</h3>
            <button
              onClick={() => onNavigate('sales-list')}
              className="text-xs text-blue-600 hover:underline"
            >
              Lihat Semua
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentSales.map((sale) => (
              <div key={sale.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-mono font-medium text-blue-600">{sale.invoiceNumber}</div>
                  <div className="text-[11px] text-slate-500 truncate max-w-[150px]">{sale.customerName}</div>
                  <div className="text-[10px] text-slate-400">{formatDateTime(sale.date)}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-900 font-mono">{formatRupiah(sale.grandTotal)}</div>
                  <div className="text-[10px] mt-0.5">
                    {sale.paymentStatus === 'lunas' && (
                      <span className="text-emerald-700 font-medium">Lunas</span>
                    )}
                    {sale.paymentStatus === 'dibayar_sebagian' && (
                      <span className="text-amber-700 font-medium">DP / Sebagian</span>
                    )}
                    {sale.paymentStatus === 'belum_dibayar' && (
                      <span className="text-red-600 font-medium">Belum Bayar</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Riwayat Mutasi Stok Terbaru (Kartu Stok Snapshot) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Mutasi Stok Terakhir</h3>
            <button
              onClick={() => onNavigate('master-stock-card')}
              className="text-xs text-blue-600 hover:underline"
            >
              Kartu Stok
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentMovements.map((m) => (
              <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-medium text-slate-900 line-clamp-1">{m.productName}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <span className="capitalize">{m.movementType.replace('_', ' ')}</span>
                    <span>·</span>
                    <span className="font-mono">{m.referenceNumber}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`font-semibold font-mono ${
                      m.direction === 'masuk' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {m.direction === 'masuk' ? `+${m.quantity}` : `-${m.quantity}`}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Sisa: {m.finalStock}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
