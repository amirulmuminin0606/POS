import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  Filter,
  Download,
  Calendar,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import { db } from '../../services/db';
import { StockMovement, StockMovementType } from '../../types';
import { exportToCsv, formatDateTime } from '../../utils/formatters';

interface StockCardProps {
  initialProductId?: string;
  onRefreshData: () => void;
}

export const StockCard: React.FC<StockCardProps> = ({ initialProductId, onRefreshData }) => {
  const movements = db.getStockMovements();
  const products = db.getProducts();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>(initialProductId || 'ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedDirection, setSelectedDirection] = useState<'ALL' | 'masuk' | 'keluar'>('ALL');

  // Month & Year Filter
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState<string>('ALL'); // 'ALL' or '2026', etc.
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL'); // 'ALL' or '01'..'12'
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Month names
  const months = [
    { value: '01', name: 'Januari' },
    { value: '02', name: 'Februari' },
    { value: '03', name: 'Maret' },
    { value: '04', name: 'April' },
    { value: '05', name: 'Mei' },
    { value: '06', name: 'Juni' },
    { value: '07', name: 'Juli' },
    { value: '08', name: 'Agustus' },
    { value: '09', name: 'September' },
    { value: '10', name: 'Oktober' },
    { value: '11', name: 'November' },
    { value: '12', name: 'Desember' },
  ];

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return movements
      .filter((m) => {
        // Product specific
        if (selectedProduct !== 'ALL' && m.productId !== selectedProduct) return false;

        // Search query
        const q = searchQuery.toLowerCase().trim();
        if (q) {
          const matches =
            m.productName.toLowerCase().includes(q) ||
            m.productSku.toLowerCase().includes(q) ||
            (m.barcode && m.barcode.includes(q)) ||
            m.referenceNumber.toLowerCase().includes(q) ||
            m.notes.toLowerCase().includes(q);
          if (!matches) return false;
        }

        // Type
        if (selectedType !== 'ALL' && m.movementType !== selectedType) return false;

        // Direction
        if (selectedDirection !== 'ALL' && m.direction !== selectedDirection) return false;

        // Year & Month
        const mDate = new Date(m.date);
        const y = String(mDate.getFullYear());
        const mon = String(mDate.getMonth() + 1).padStart(2, '0');

        if (selectedYear !== 'ALL' && y !== selectedYear) return false;
        if (selectedMonth !== 'ALL' && mon !== selectedMonth) return false;

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [movements, selectedProduct, searchQuery, selectedType, selectedDirection, selectedYear, selectedMonth, sortOrder]);

  const handleExportCsv = () => {
    const headers = [
      'Waktu & Tanggal',
      'No. Referensi',
      'SKU / Kode',
      'Barcode',
      'Nama Produk',
      'Jenis Mutasi',
      'Arah',
      'Stok Awal',
      'Jumlah Masuk',
      'Jumlah Keluar',
      'Stok Akhir',
      'Keterangan',
      'Petugas',
    ];

    const rows = filteredMovements.map((m) => [
      formatDateTime(m.date),
      m.referenceNumber,
      m.productSku,
      m.barcode || '-',
      m.productName,
      m.movementType.replace('_', ' '),
      m.direction,
      m.initialStock,
      m.direction === 'masuk' ? m.quantity : 0,
      m.direction === 'keluar' ? m.quantity : 0,
      m.finalStock,
      m.notes,
      m.performedBy,
    ]);

    exportToCsv(`kartu_stok_mutasi_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const getMovementLabel = (type: StockMovementType) => {
    switch (type) {
      case 'stok_awal':
        return 'Stok Awal';
      case 'item_masuk':
        return 'Item Masuk';
      case 'item_keluar':
        return 'Item Keluar';
      case 'penjualan':
        return 'Penjualan';
      case 'retur_penjualan':
        return 'Retur Penjualan';
      case 'penyesuaian_opname':
        return 'Penyesuaian Opname';
      case 'pembatalan':
        return 'Pembatalan Transaksi';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Kartu Stok (Audit Mutasi Persediaan)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Lacak seluruh pergerakan persediaan barang, stok masuk, stok keluar, rekonsiliasi, dan pengguna yang memproses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Ekspor Kartu Stok</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari SKU, nama, referensi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Product Selector */}
          <div>
            <select
              aria-label="Pilih Produk"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">Semua Produk</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          {/* Transaction Type Filter */}
          <div>
            <select
              aria-label="Filter Jenis Transaksi"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">Semua Jenis Transaksi</option>
              <option value="stok_awal">Stok Awal</option>
              <option value="item_masuk">Item Masuk (Penerimaan)</option>
              <option value="item_keluar">Item Keluar (Pengeluaran)</option>
              <option value="penjualan">Penjualan</option>
              <option value="retur_penjualan">Retur Penjualan</option>
              <option value="penyesuaian_opname">Penyesuaian Opname</option>
              <option value="pembatalan">Pembatalan Transaksi</option>
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <select
              aria-label="Filter Bulan"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">Semua Bulan</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  Bulan: {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <select
              aria-label="Filter Tahun"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">Semua Tahun</option>
              <option value="2026">Tahun 2026</option>
              <option value="2025">Tahun 2025</option>
              <option value="2024">Tahun 2024</option>
            </select>
          </div>
        </div>

        {/* Direction & Sort Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setSelectedDirection('ALL')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                selectedDirection === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
              }`}
            >
              Semua Arah
            </button>
            <button
              onClick={() => setSelectedDirection('masuk')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                selectedDirection === 'masuk' ? 'bg-white text-emerald-700 shadow-2xs font-semibold' : 'text-slate-600'
              }`}
            >
              Hanya Masuk (+)
            </button>
            <button
              onClick={() => setSelectedDirection('keluar')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                selectedDirection === 'keluar' ? 'bg-white text-red-700 shadow-2xs font-semibold' : 'text-slate-600'
              }`}
            >
              Hanya Keluar (-)
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span>
              Total Baris Mutasi: <strong className="text-slate-900 font-mono">{filteredMovements.length}</strong>
            </span>
            <button
              onClick={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortOrder === 'desc' ? 'Waktu Terbaru' : 'Waktu Terlama'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Tanggal &amp; Waktu</th>
                <th className="py-3 px-4">No. Referensi</th>
                <th className="py-3 px-4">Produk / SKU</th>
                <th className="py-3 px-4">Jenis Transaksi</th>
                <th className="py-3 px-4 text-center">Stok Awal</th>
                <th className="py-3 px-4 text-center">Masuk (+)</th>
                <th className="py-3 px-4 text-center">Keluar (-)</th>
                <th className="py-3 px-4 text-center">Stok Akhir</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4">Pengguna</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Tidak ada catatan mutasi kartu stok pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const isMasuk = m.direction === 'masuk';
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {formatDateTime(m.date)}
                      </td>

                      <td className="py-3 px-4 font-mono font-medium text-blue-600">
                        {m.referenceNumber}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 line-clamp-1">{m.productName}</div>
                        <div className="font-mono text-[11px] text-slate-500">{m.productSku}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800">
                          {getMovementLabel(m.movementType)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-slate-600">
                        {m.initialStock}
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600">
                        {isMasuk ? `+${m.quantity}` : '-'}
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-red-600">
                        {!isMasuk ? `-${m.quantity}` : '-'}
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 bg-slate-50/60">
                        {m.finalStock}
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={m.notes}>
                        {m.notes || '-'}
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {m.performedBy}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
