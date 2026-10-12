import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Filter,
  DollarSign,
  Boxes,
  ArrowUpDown,
} from 'lucide-react';
import { db } from '../../services/db';
import { exportToCsv, formatNumber, formatRupiah, printHtmlDocument } from '../../utils/formatters';

export const ItemReportView: React.FC = () => {
  const products = db.getProducts();
  const categories = db.getCategories();
  const settings = db.getSettings();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStockCondition, setSelectedStockCondition] = useState('ALL');
  const [selectedRack, setSelectedRack] = useState('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'sku' | 'stock' | 'cost' | 'sell'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Rack list
  const rackLocations = useMemo(() => {
    const s = new Set<string>();
    products.forEach((p) => {
      if (p.rackLocation) s.add(p.rackLocation);
    });
    return Array.from(s).sort();
  }, [products]);

  // Filtered products
  const reportProducts = useMemo(() => {
    return products
      .filter((p) => {
        const q = searchQuery.toLowerCase().trim();
        if (
          q &&
          !p.name.toLowerCase().includes(q) &&
          !p.sku.toLowerCase().includes(q) &&
          !p.barcode.includes(q)
        ) {
          return false;
        }

        if (selectedCategory !== 'ALL' && p.categoryId !== selectedCategory) return false;

        if (selectedStockCondition === 'LOW' && (p.stock === 0 || p.stock > p.minStock)) return false;
        if (selectedStockCondition === 'OUT' && p.stock !== 0) return false;
        if (selectedStockCondition === 'ACTIVE' && !p.isActive) return false;
        if (selectedStockCondition === 'INACTIVE' && p.isActive) return false;

        if (selectedRack !== 'ALL' && p.rackLocation !== selectedRack) return false;

        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
        else if (sortBy === 'sku') cmp = a.sku.localeCompare(b.sku);
        else if (sortBy === 'stock') cmp = a.stock - b.stock;
        else if (sortBy === 'cost') cmp = a.costPrice - b.costPrice;
        else if (sortBy === 'sell') cmp = a.sellingPrice - b.sellingPrice;
        return sortOrder === 'asc' ? cmp : -cmp;
      });
  }, [products, searchQuery, selectedCategory, selectedStockCondition, selectedRack, sortBy, sortOrder]);

  // Total valuation calculation
  const totalValuationCost = useMemo(() => {
    return reportProducts.reduce((acc, p) => acc + p.stock * p.costPrice, 0);
  }, [reportProducts]);

  const totalValuationSelling = useMemo(() => {
    return reportProducts.reduce((acc, p) => acc + p.stock * p.sellingPrice, 0);
  }, [reportProducts]);

  const totalStockUnits = useMemo(() => {
    return reportProducts.reduce((acc, p) => acc + p.stock, 0);
  }, [reportProducts]);

  const handleExportCsv = () => {
    const headers = [
      'SKU',
      'Barcode',
      'Nama Produk',
      'Kategori',
      'Satuan',
      'Harga Beli (Modal)',
      'Harga Jual',
      'Stok Fisik',
      'Stok Minimum',
      'Total Nilai Modal',
      'Total Potensi Jual',
      'Lokasi Rak',
      'Status',
    ];
    const rows = reportProducts.map((p) => [
      p.sku,
      p.barcode,
      p.name,
      p.categoryName,
      p.unit,
      p.costPrice,
      p.sellingPrice,
      p.stock,
      p.minStock,
      p.stock * p.costPrice,
      p.stock * p.sellingPrice,
      p.rackLocation,
      p.isActive ? 'Aktif' : 'Nonaktif',
    ]);
    exportToCsv(`laporan_daftar_item_${new Date().toISOString().slice(0, 10)}`, headers, rows);
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
        .text-center { text-align: center; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
      </style>
      <div class="rpt">
        <div class="border-b" style="display:flex; justify-content:space-between; align-items:flex-end;">
          <div>
            <h1 style="font-size:18px; font-weight:bold; margin-bottom:2px;">${settings.storeName}</h1>
            <div>${settings.storeAddress} · Telp: ${settings.storePhone}</div>
          </div>
          <div style="text-align:right;">
            <h2 style="font-size:16px; font-weight:bold; color:#2563eb;">LAPORAN DAFTAR ITEM &amp; VALUASI ASET</h2>
            <div>Waktu Cetak: ${new Date().toLocaleDateString('id-ID')} WIB</div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; margin-bottom:12px; background:#f8fafc; padding:8px; border-radius:6px; font-size:11px;">
          <div>Filter Kategori: <strong>${selectedCategory === 'ALL' ? 'Semua' : selectedCategory}</strong> · Kondisi: <strong>${selectedStockCondition}</strong></div>
          <div style="font-weight:bold;">Total Item: ${reportProducts.length} SKU · Fisik: ${formatNumber(totalStockUnits)} Unit</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Nama Produk</th>
              <th>Kategori</th>
              <th class="text-right">Harga Beli</th>
              <th class="text-right">Harga Jual</th>
              <th class="text-center">Stok</th>
              <th class="text-right">Total Nilai Modal</th>
              <th class="text-right">Total Potensi Jual</th>
              <th>Lokasi</th>
            </tr>
          </thead>
          <tbody>
            ${reportProducts
              .map(
                (p) => `
              <tr>
                <td class="font-mono">${p.sku}</td>
                <td><strong>${p.name}</strong></td>
                <td>${p.categoryName}</td>
                <td class="text-right font-mono">${formatRupiah(p.costPrice)}</td>
                <td class="text-right font-mono">${formatRupiah(p.sellingPrice)}</td>
                <td class="text-center font-mono bold">${p.stock} ${p.unit}</td>
                <td class="text-right font-mono">${formatRupiah(p.stock * p.costPrice)}</td>
                <td class="text-right font-mono bold">${formatRupiah(p.stock * p.sellingPrice)}</td>
                <td class="font-mono">${p.rackLocation || '-'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div style="margin-top:16px; padding:10px; background:#f1f5f9; border-radius:6px; display:flex; justify-content:space-between; font-size:13px; font-weight:bold;">
          <span>TOTAL VALUASI ASET PERSEDIAAN:</span>
          <div>
            <span>Modal: <strong class="font-mono" style="color:#0f766e;">${formatRupiah(totalValuationCost)}</strong></span>
            <span style="margin: 0 10px;">|</span>
            <span>Jual: <strong class="font-mono" style="color:#2563eb;">${formatRupiah(totalValuationSelling)}</strong></span>
          </div>
        </div>
      </div>
    `;

    printHtmlDocument(html, 'Laporan_Daftar_Item');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Laporan Daftar Item &amp; Valuasi Stok</h1>
          <p className="text-xs text-slate-500 mt-1">
            Rekapitulasi seluruh persediaan produk, level stok, serta kalkulasi nilai aset harga modal dan harga jual.
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
            <span>Total Nilai Aset Modal</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700">
            {formatRupiah(totalValuationCost)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Total harga beli fisik tersedia</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
            <span>Potensi Nilai Jual</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-700">
            {formatRupiah(totalValuationSelling)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Total omzet jika seluruh stok terjual</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
            <span>Total Fisik Persediaan</span>
            <Boxes className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900">
            {formatNumber(totalStockUnits)} Unit
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Dari {reportProducts.length} jenis SKU terdaftar</div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, SKU, atau barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <select
              aria-label="Filter Kategori Laporan"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              aria-label="Filter Kondisi Stok Laporan"
              value={selectedStockCondition}
              onChange={(e) => setSelectedStockCondition(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
            >
              <option value="ALL">Semua Kondisi Stok</option>
              <option value="LOW">Stok Menipis (&le; Min)</option>
              <option value="OUT">Stok Habis (0)</option>
              <option value="ACTIVE">Produk Aktif</option>
              <option value="INACTIVE">Produk Nonaktif</option>
            </select>
          </div>

          <div>
            <select
              aria-label="Filter Lokasi Rak Laporan"
              value={selectedRack}
              onChange={(e) => setSelectedRack(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
            >
              <option value="ALL">Semua Lokasi Rak</option>
              {rackLocations.map((r) => (
                <option key={r} value={r}>
                  Lokasi: {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">SKU / Barcode</th>
                <th className="py-3 px-4">Nama Produk</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-right">Harga Beli</th>
                <th className="py-3 px-4 text-right">Harga Jual</th>
                <th className="py-3 px-4 text-center">Stok</th>
                <th className="py-3 px-4 text-right">Total Nilai Modal</th>
                <th className="py-3 px-4 text-right">Total Potensi Jual</th>
                <th className="py-3 px-4">Lokasi Rak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {reportProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Tidak ada produk yang memenuhi kriteria filter laporan.
                  </td>
                </tr>
              ) : (
                reportProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      <div>{p.sku}</div>
                      <div className="text-[10px] text-slate-400">{p.barcode || '-'}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4">{p.categoryName}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                      {formatRupiah(p.costPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {formatRupiah(p.sellingPrice)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                      {p.stock} {p.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700 font-medium">
                      {formatRupiah(p.stock * p.costPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-blue-700 font-bold">
                      {formatRupiah(p.stock * p.sellingPrice)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{p.rackLocation || '-'}</td>
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
