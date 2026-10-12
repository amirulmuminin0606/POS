import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  Search,
  Plus,
  Printer,
  CheckCircle,
  AlertCircle,
  X,
  FileText,
  Lock,
  Layers,
  Barcode as BarcodeIcon,
} from 'lucide-react';
import { db } from '../../services/db';
import { Product, Stocktake, StocktakeItem } from '../../types';
import { formatDateTime, printHtmlDocument } from '../../utils/formatters';

interface StocktakeViewProps {
  onRefreshData: () => void;
}

export const StocktakeView: React.FC<StocktakeViewProps> = ({ onRefreshData }) => {
  const stocktakes = db.getStocktakes();
  const products = db.getProducts();
  const settings = db.getSettings();
  const activeUser = db.getActiveUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStocktake, setSelectedStocktake] = useState<Stocktake | null>(null);

  // New stocktake session state
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<StocktakeItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenAddModal = () => {
    // Populate with snapshot of all active products
    const initialItems: StocktakeItem[] = products
      .filter((p) => p.isActive)
      .map((p) => ({
        productId: p.id,
        productSku: p.sku,
        productName: p.name,
        barcode: p.barcode,
        rackLocation: p.rackLocation,
        systemStock: p.stock,
        physicalStock: p.stock, // default to system stock
        difference: 0,
        notes: '',
      }));

    setItems(initialItems);
    setNotes('Sesi Opname Fisik Gudang & Rak Toko');
    setFormError(null);
    setShowAddModal(true);
  };

  const handleUpdatePhysicalStock = (productId: string, physicalStock: number, itemNotes?: string) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.productId === productId) {
          const diff = physicalStock - i.systemStock;
          return {
            ...i,
            physicalStock,
            difference: diff,
            notes: itemNotes !== undefined ? itemNotes : i.notes,
          };
        }
        return i;
      })
    );
  };

  const handleBarcodeQuickLocate = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    const target = items.find(
      (i) => i.barcode === code || i.productSku.toLowerCase() === code.toLowerCase()
    );

    if (target) {
      alert(`Produk ditemukan: "${target.productName}" (Rak: ${target.rackLocation}). Silakan input stok fisik.`);
    } else {
      alert(`Produk dengan barcode/SKU "${code}" tidak ditemukan dalam daftar opname!`);
    }
    setBarcodeInput('');
  };

  const handleSaveDraft = () => {
    const res = db.saveStocktakeDraft({
      items,
      notes,
    });
    if (res.success && res.stocktake) {
      setShowAddModal(false);
      onRefreshData();
      alert(`Draft sesi opname ${res.stocktake.sessionNumber} berhasil disimpan.`);
    }
  };

  const handleFinalizeSession = (stocktakeId: string) => {
    if (activeUser.role !== 'admin' && activeUser.role !== 'supervisor') {
      alert('Akses Ditolak: Hanya Supervisor atau Administrator yang berwenang memfinalisasi stok opname.');
      return;
    }

    if (
      confirm(
        'PERINGATAN FINALISASI OPNAME: Stok fisik pada sesi ini akan diterapkan langsung ke master data produk, dan seluruh selisih akan dibuatkan mutasi penyesuaian di kartu stok secara permanen. Lanjutkan?'
      )
    ) {
      const res = db.finalizeStocktake(stocktakeId);
      if (res.success && res.stocktake) {
        onRefreshData();
        setSelectedStocktake(res.stocktake);
        alert(`Sesi opname ${res.stocktake.sessionNumber} berhasil difinalisasi dan stok telah disesuaikan.`);
      } else {
        alert(res.error || 'Gagal memfinalisasi sesi opname.');
      }
    }
  };

  const handlePrintStocktakeSheet = (st: Stocktake) => {
    const printHtml = `
      <style>
        .box { max-width: 800px; margin: auto; padding: 20px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; color: #0f172a; }
        .bold { font-weight: bold; }
        .border-b { border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 11px; }
        th { background: #f8fafc; border-bottom: 2px solid #cbd5e1; padding: 6px 8px; text-align: left; }
        td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .text-center { text-align: center; }
      </style>
      <div class="box">
        <div class="border-b" style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <h2 class="bold" style="font-size:16px;">${settings.storeName}</h2>
            <div>${settings.storeAddress}</div>
          </div>
          <div style="text-align:right;">
            <h3 class="bold" style="color:#0f766e; font-size:14px;">LAPORAN HASIL STOK OPNAME</h3>
            <div class="font-mono bold">No: ${st.sessionNumber}</div>
            <div>Waktu: ${formatDateTime(st.date)}</div>
            <div>Status: <strong style="text-transform:uppercase;">${st.status}</strong></div>
          </div>
        </div>

        <div style="margin-bottom:12px; font-size:11px; color:#475569;">
          <div>Catatan Sesi: ${st.notes || '-'}</div>
          ${st.finalizedBy ? `<div>Difinalisasi oleh: <strong>${st.finalizedBy}</strong> pada ${formatDateTime(st.finalizedAt || '')}</div>` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>SKU / Barcode</th>
              <th>Nama Produk</th>
              <th>Lokasi Rak</th>
              <th class="text-center">Stok Sistem</th>
              <th class="text-center">Stok Fisik</th>
              <th class="text-center">Selisih</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            ${st.items
              .map((i, idx) => {
                const diffColor = i.difference === 0 ? '#475569' : i.difference > 0 ? '#16a34a' : '#dc2626';
                return `
                <tr>
                  <td style="width:25px;">${idx + 1}</td>
                  <td class="font-mono">${i.productSku}</td>
                  <td><strong>${i.productName}</strong></td>
                  <td class="font-mono">${i.rackLocation || '-'}</td>
                  <td class="text-center font-mono">${i.systemStock}</td>
                  <td class="text-center font-mono bold">${i.physicalStock}</td>
                  <td class="text-center font-mono bold" style="color:${diffColor};">
                    ${i.difference > 0 ? '+' : ''}${i.difference}
                  </td>
                  <td>${i.notes || '-'}</td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>

        <div style="margin-top:40px; display:flex; justify-content:space-between; text-align:center;">
          <div style="width:180px;">
            <div>Petugas Penghitung (Fisik)</div>
            <div style="height:50px;"></div>
            <div style="border-top:1px solid #94a3b8;">( ................................... )</div>
          </div>
          <div style="width:180px;">
            <div>Supervisor / Penyetuju</div>
            <div style="height:50px;"></div>
            <div style="border-top:1px solid #94a3b8;">( ${st.finalizedBy || '...................................'} )</div>
          </div>
        </div>
      </div>
    `;

    printHtmlDocument(printHtml, `Stok_Opname_${st.sessionNumber}`);
  };

  const filteredStocktakes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return stocktakes;
    return stocktakes.filter(
      (s) =>
        s.sessionNumber.toLowerCase().includes(q) ||
        s.notes.toLowerCase().includes(q) ||
        (s.finalizedBy && s.finalizedBy.toLowerCase().includes(q))
    );
  }, [stocktakes, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Stok Opname Persediaan</h1>
          <p className="text-xs text-slate-500 mt-1">
            Hitung fisik stok gudang, bandingkan dengan stok sistem, analisis selisih, simpan draft, dan finalisasi penyesuaian.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Buat Sesi Stok Opname Baru</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari no. sesi opname, catatan, atau petugas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="text-xs text-slate-500">
          Total Sesi Opname: <strong className="text-slate-900 font-mono">{filteredStocktakes.length}</strong>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">No. Sesi Opname</th>
                <th className="py-3 px-4">Tanggal &amp; Waktu</th>
                <th className="py-3 px-4 text-center">Jumlah Item Dihitung</th>
                <th className="py-3 px-4 text-center">Item Selisih</th>
                <th className="py-3 px-4 text-center">Status Sesi</th>
                <th className="py-3 px-4">Difinalisasi Oleh</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStocktakes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Belum ada riwayat sesi stok opname.
                  </td>
                </tr>
              ) : (
                filteredStocktakes.map((st) => {
                  const diffItemsCount = st.items.filter((i) => i.difference !== 0).length;
                  const isFinal = st.status === 'difinalisasi';
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">{st.sessionNumber}</td>
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {formatDateTime(st.date)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">{st.items.length} Item</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono font-bold ${
                            diffItemsCount > 0 ? 'text-amber-600' : 'text-slate-400'
                          }`}
                        >
                          {diffItemsCount} Item
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isFinal ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {st.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {st.finalizedBy ? `${st.finalizedBy} (${formatDateTime(st.finalizedAt || '')})` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handlePrintStocktakeSheet(st)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                            title="Cetak Laporan Opname"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedStocktake(st);
                              setShowDetailModal(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                            title="Buka Lembar Opname"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          {!isFinal && (
                            <button
                              onClick={() => handleFinalizeSession(st.id)}
                              className="px-2 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-2xs"
                              title="Terapkan Hasil Opname ke Master Stok"
                            >
                              Finalisasi
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Buat Sesi Opname Baru */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Input Sesi Stok Opname Baru</h3>
                <p className="text-xs text-slate-500">
                  Snapshot stok sistem diambil otomatis. Masukkan stok fisik yang dihitung di gudang/rak.
                </p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="w-full sm:max-w-xs">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Sesi Opname</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {/* Quick Barcode Scanner Locator */}
                <form onSubmit={handleBarcodeQuickLocate} className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <BarcodeIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      placeholder="Cari barcode / SKU..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                  >
                    Temukan
                  </button>
                </form>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                      <th className="py-2.5 px-3">Kode / Barcode</th>
                      <th className="py-2.5 px-3">Nama Produk</th>
                      <th className="py-2.5 px-3">Lokasi Rak</th>
                      <th className="py-2.5 px-3 text-center">Stok Sistem</th>
                      <th className="py-2.5 px-3 text-center">Stok Fisik (Input)</th>
                      <th className="py-2.5 px-3 text-center">Selisih</th>
                      <th className="py-2.5 px-3">Keterangan Selisih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {items.map((i) => {
                      const diff = i.physicalStock - i.systemStock;
                      return (
                        <tr key={i.productId} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-mono">
                            <div className="font-semibold text-slate-900">{i.productSku}</div>
                            <div className="text-[10px] text-slate-400">{i.barcode || '-'}</div>
                          </td>

                          <td className="py-2 px-3 font-semibold text-slate-900">{i.productName}</td>

                          <td className="py-2 px-3 font-mono font-medium text-slate-700">
                            {i.rackLocation || '-'}
                          </td>

                          <td className="py-2 px-3 text-center font-mono bg-slate-50 font-medium">
                            {i.systemStock}
                          </td>

                          <td className="py-2 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={i.physicalStock}
                              onChange={(e) =>
                                handleUpdatePhysicalStock(
                                  i.productId,
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                              className="w-20 px-2 py-1 text-center font-mono font-bold text-slate-900 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                            />
                          </td>

                          <td className="py-2 px-3 text-center font-mono font-bold">
                            <span
                              className={
                                diff === 0
                                  ? 'text-slate-400'
                                  : diff > 0
                                  ? 'text-emerald-600'
                                  : 'text-red-600'
                              }
                            >
                              {diff > 0 ? `+${diff}` : diff}
                            </span>
                          </td>

                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={i.notes}
                              onChange={(e) =>
                                handleUpdatePhysicalStock(i.productId, i.physicalStock, e.target.value)
                              }
                              placeholder="Alasan selisih..."
                              className="w-full text-xs px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="text-xs text-slate-500">
                Item yang memiliki selisih:{' '}
                <strong className="font-mono text-amber-600 font-bold">
                  {items.filter((i) => i.physicalStock !== i.systemStock).length}
                </strong>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  Simpan Draft Sesi Opname
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detail Sesi Opname */}
      {showDetailModal && selectedStocktake && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Lembar Hasil Sesi Opname: {selectedStocktake.sessionNumber}
                </h3>
                <div className="text-xs text-slate-500">{formatDateTime(selectedStocktake.date)}</div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <div>
                  <span className="text-slate-500">Status: </span>
                  <span className="font-bold uppercase">{selectedStocktake.status}</span>
                  {selectedStocktake.finalizedBy && (
                    <span className="text-slate-600 ml-2">
                      (Oleh: {selectedStocktake.finalizedBy})
                    </span>
                  )}
                </div>
                <div>
                  Catatan: <strong className="text-slate-900">{selectedStocktake.notes || '-'}</strong>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Produk</th>
                      <th className="py-2.5 px-3">Lokasi Rak</th>
                      <th className="py-2.5 px-3 text-center">Stok Sistem</th>
                      <th className="py-2.5 px-3 text-center">Stok Fisik</th>
                      <th className="py-2.5 px-3 text-center">Selisih</th>
                      <th className="py-2.5 px-3">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {selectedStocktake.items.map((i) => {
                      const diff = i.difference;
                      return (
                        <tr key={i.productId}>
                          <td className="py-2 px-3 font-mono">{i.productSku}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{i.productName}</td>
                          <td className="py-2 px-3 font-mono">{i.rackLocation || '-'}</td>
                          <td className="py-2 px-3 text-center font-mono">{i.systemStock}</td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">
                            {i.physicalStock}
                          </td>
                          <td
                            className={`py-2 px-3 text-center font-mono font-bold ${
                              diff === 0 ? 'text-slate-400' : diff > 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}
                          >
                            {diff > 0 ? `+${diff}` : diff}
                          </td>
                          <td className="py-2 px-3 text-slate-600">{i.notes || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <button
                onClick={() => handlePrintStocktakeSheet(selectedStocktake)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembar Opname</span>
              </button>

              <div className="flex gap-2">
                {selectedStocktake.status !== 'difinalisasi' && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleFinalizeSession(selectedStocktake.id);
                    }}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                  >
                    Finalisasi Sekarang
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
      )}
    </div>
  );
};
