import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Flame,
  Snowflake,
  TrendingUp,
  Clock,
  Layers,
  Settings,
  HelpCircle,
  Package,
  Plus,
} from 'lucide-react';
import { db } from '../../services/db';
import { formatNumber, formatRupiah } from '../../utils/formatters';

interface SmartStockViewProps {
  onNavigateToStockIn: () => void;
}

export const SmartStockView: React.FC<SmartStockViewProps> = ({ onNavigateToStockIn }) => {
  const settings = db.getSettings();

  const [leadTimeDays, setLeadTimeDays] = useState(settings.leadTimeDays || 3);
  const [safetyStockPercent, setSafetyStockPercent] = useState(settings.safetyStockPercent || 20);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = db.getCategories();
  const analytics = useMemo(() => {
    return db.getSmartStockAnalytics(leadTimeDays, safetyStockPercent);
  }, [leadTimeDays, safetyStockPercent]);

  // Filtered items
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'ALL') return analytics.items;
    return analytics.items.filter((i) => i.product.categoryId === selectedCategory);
  }, [analytics.items, selectedCategory]);

  // Rack location breakdown
  const rackSummary = useMemo(() => {
    const map = new Map<string, { count: number; totalUnits: number; lowStockCount: number }>();
    analytics.items.forEach((item) => {
      const rack = item.product.rackLocation || 'TANPA RAK';
      const cur = map.get(rack) || { count: 0, totalUnits: 0, lowStockCount: 0 };
      cur.count += 1;
      cur.totalUnits += item.product.stock;
      if (item.product.stock <= item.product.minStock) cur.lowStockCount += 1;
      map.set(rack, cur);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [analytics.items]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Kecerdasan Inventori Berbasis Data Penjualan</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Fitur Stok Pintar (Smart Stock Intelligence)
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Menghitung kecepatan penjualan (sales velocity), estimasi sisa hari stok (days of inventory), dan rekomendasi pemesanan ulang (Reorder Quantity / ROQ) secara matematis akurat.
          </p>
        </div>

        <button
          onClick={onNavigateToStockIn}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Penerimaan Restock</span>
        </button>
      </div>

      {/* Control Panel: Lead Time & Safety Stock Parameter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-700">Waktu Tunggu Pengadaan (Lead Time):</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="1"
                max="60"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(Number(e.target.value) || 1)}
                className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded font-mono font-bold text-center"
              />
              <span className="text-slate-500">Hari</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-700">Stok Pengaman (Safety Buffer):</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="100"
                value={safetyStockPercent}
                onChange={(e) => setSafetyStockPercent(Number(e.target.value) || 0)}
                className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded font-mono font-bold text-center"
              />
              <span className="text-slate-500">%</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-700">Filter Kategori:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>ROP = (Penjualan Harian × Lead Time) + Safety Buffer</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-red-200">
          <div className="flex items-center justify-between text-red-700 text-xs font-semibold">
            <span>Perlu Segera Restock</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-600 mt-2">
            {analytics.restockNeededCount} SKU
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Stok &le; Reorder Point (ROP)</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold">
            <span>Stok Habis Total (0)</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-2">
            {analytics.outOfStockCount} SKU
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Kehilangan potensi omzet</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
            <span>Fast Moving (Terlaris)</span>
            <Flame className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-2">
            {analytics.fastMoving.length} SKU
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Penjualan aktif 30 hari terakhir</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-600 text-xs font-semibold">
            <span>Dead Stock (Stok Mati)</span>
            <Snowflake className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {analytics.deadStockCount} SKU
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Ada stok fisik namun 0 penjualan</div>
        </div>
      </div>

      {/* Main Table: Recommendations & Velocity */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Analisis Kecepatan Penjualan &amp; Rekomendasi Restock
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Urutan rekomendasi berdasarkan tingkat urgensi stok kritis dan potensi kehabisan barang.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Produk / SKU</th>
                <th className="py-3 px-4 text-center">Stok Saat Ini</th>
                <th className="py-3 px-4 text-center">Terjual (30 Hari)</th>
                <th className="py-3 px-4 text-center">Kecepatan / Hari</th>
                <th className="py-3 px-4 text-center">Sisa Hari Stok</th>
                <th className="py-3 px-4 text-center">Reorder Point (ROP)</th>
                <th className="py-3 px-4 text-center">Rekomendasi Pesan (ROQ)</th>
                <th className="py-3 px-4 text-center">Status Inventori</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredItems.map((item) => {
                const p = item.product;
                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      item.needsRestock ? 'bg-red-50/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                        <span>{p.sku}</span>
                        <span>·</span>
                        <span>Rak: {p.rackLocation || '-'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold">
                      <span className={p.stock === 0 ? 'text-red-600' : p.stock <= p.minStock ? 'text-amber-600' : 'text-slate-900'}>
                        {p.stock} {p.unit}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-semibold text-slate-800">
                      {item.totalSold30d} {p.unit}
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-slate-600">
                      {item.dailyVelocity.toFixed(2)} / hari
                    </td>

                    <td className="py-3 px-4 text-center font-mono">
                      {item.daysOfInventory >= 999 ? (
                        <span className="text-slate-400">&infin; (Macet)</span>
                      ) : item.daysOfInventory <= leadTimeDays ? (
                        <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                          {item.daysOfInventory} Hari
                        </span>
                      ) : (
                        <span className="text-slate-700">{item.daysOfInventory} Hari</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                      {item.reorderPoint} {p.unit}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {item.recommendedOrderQty > 0 ? (
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          +{item.recommendedOrderQty} {p.unit}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">-</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {p.stock === 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                          HABIS
                        </span>
                      ) : item.needsRestock ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          PERLU RESTOCK
                        </span>
                      ) : item.isDeadStock ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                          DEAD STOCK
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700">
                          OPTIMAL
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rack Location Summary Box */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">Ringkasan Persediaan per Lokasi Rak Gudang</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {rackSummary.map(([rack, data]) => (
            <div key={rack} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <div className="font-mono font-bold text-blue-600">{rack}</div>
              <div className="font-semibold text-slate-900 mt-1">{data.count} SKU Produk</div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">Total: {data.totalUnits} Unit</div>
              {data.lowStockCount > 0 && (
                <div className="text-[10px] font-bold text-red-600 mt-1">
                  {data.lowStockCount} SKU Menipis
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
