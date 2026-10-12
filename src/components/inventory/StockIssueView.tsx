import React, { useState, useMemo } from 'react';
import {
  ArrowUpFromLine,
  Search,
  Plus,
  Barcode as BarcodeIcon,
  X,
  FileText,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { db } from '../../services/db';
import { Product, StockIssue } from '../../types';
import { formatDateTime } from '../../utils/formatters';

interface StockIssueViewProps {
  onRefreshData: () => void;
}

export const StockIssueView: React.FC<StockIssueViewProps> = ({ onRefreshData }) => {
  const issues = db.getStockIssues();
  const products = db.getProducts();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<StockIssue | null>(null);

  // Form states
  const [reason, setReason] = useState('Barang Rusak / Kadaluarsa (Expired)');
  const [referenceDoc, setReferenceDoc] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleScanOrAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    const prod = products.find(
      (p) => p.isActive && (p.barcode === code || p.sku.toLowerCase() === code.toLowerCase())
    );

    if (!prod) {
      alert(`Produk dengan barcode/SKU "${code}" tidak ditemukan!`);
      setBarcodeInput('');
      return;
    }

    if (prod.stock <= 0) {
      alert(`Produk "${prod.name}" stoknya kosong (0). Tidak dapat dikeluarkan.`);
      setBarcodeInput('');
      return;
    }

    setItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === prod.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx].quantity = Math.min(prod.stock, next[idx].quantity + 1);
        return next;
      }
      return [...prev, { productId: prod.id, quantity: 1 }];
    });

    setBarcodeInput('');
  };

  const handleUpdateItem = (productId: string, quantity: number) => {
    const prod = products.find((p) => p.id === productId);
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    const maxQty = prod?.stock || 999;
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: Math.min(maxQty, quantity) } : i))
    );
  };

  const handleCreateIssue = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (items.length === 0) {
      setFormError('Daftar item keluar masih kosong! Scan barcode atau pilih produk.');
      return;
    }

    const res = db.createStockIssue({
      reason,
      referenceDoc,
      items,
      notes,
    });

    if (res.success && res.issue) {
      setShowAddModal(false);
      onRefreshData();
      alert(`Pengeluaran barang ${res.issue.issueNumber} berhasil diproses. Stok fisik berkurang dan tercatat di kartu stok.`);
    } else {
      setFormError(res.error || 'Gagal menyimpan pengeluaran barang.');
    }
  };

  const filteredIssues = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return issues;
    return issues.filter(
      (iss) =>
        iss.issueNumber.toLowerCase().includes(q) ||
        iss.reason.toLowerCase().includes(q) ||
        iss.referenceDoc.toLowerCase().includes(q) ||
        iss.notes.toLowerCase().includes(q)
    );
  }, [issues, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pengeluaran Item Keluar (Stock Out)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Catat pemakaian internal, barang rusak/expired, susut, atau kehilangan dengan validasi pencegahan stok negatif.
          </p>
        </div>
        <button
          onClick={() => {
            setReferenceDoc('');
            setNotes('');
            setItems([]);
            setFormError(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Catat Item Keluar Baru</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari no. pengeluaran, alasan, atau dokumen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="text-xs text-slate-500">
          Total Dokumen: <strong className="text-slate-900 font-mono">{filteredIssues.length}</strong>
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">No. Pengeluaran</th>
                <th className="py-3 px-4">Tanggal &amp; Waktu</th>
                <th className="py-3 px-4">Alasan Pengeluaran</th>
                <th className="py-3 px-4">No. Ref / Dokumen</th>
                <th className="py-3 px-4 text-center">Total Unit Keluar</th>
                <th className="py-3 px-4">Petugas</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Belum ada riwayat dokumen pengeluaran item keluar.
                  </td>
                </tr>
              ) : (
                filteredIssues.map((iss) => (
                  <tr key={iss.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-600">{iss.issueNumber}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {formatDateTime(iss.date)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{iss.reason}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{iss.referenceDoc || '-'}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-red-600">
                      -{iss.items.reduce((acc, i) => acc + i.quantity, 0)} Unit
                    </td>
                    <td className="py-3 px-4 text-slate-500">{iss.createdBy}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedIssue(iss);
                          setShowDetailModal(true);
                        }}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                        title="Lihat Rincian Item"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah Item Keluar */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-900 text-sm">Catat Pengeluaran Item Keluar (Stock Out)</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIssue} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alasan Pengeluaran Barang *
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="Barang Rusak / Kadaluarsa (Expired)">Barang Rusak / Kadaluarsa (Expired)</option>
                    <option value="Pemakaian Internal Toko / Operasional">Pemakaian Internal Toko / Operasional</option>
                    <option value="Kehilangan / Selisih Fisik">Kehilangan / Selisih Fisik</option>
                    <option value="Sample Promosi / Tester">Sample Promosi / Tester</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. Dokumen / Memo Referensi
                  </label>
                  <input
                    type="text"
                    value={referenceDoc}
                    onChange={(e) => setReferenceDoc(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                    placeholder="Contoh: MEMO-GUDANG-04"
                  />
                </div>
              </div>

              {/* Barcode scanner */}
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <BarcodeIcon className="w-4 h-4 text-amber-600" />
                  <span>Scan Barcode atau Pilih Produk</span>
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleScanOrAddProduct(e);
                    }}
                    placeholder="Scan barcode scanner USB atau ketik SKU..."
                    className="flex-1 px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleScanOrAddProduct}
                    className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg"
                  >
                    + Tambahkan
                  </button>
                </div>

                {/* Quick select dropdown */}
                <select
                  aria-label="Pilih Produk Manual untuk Pengeluaran"
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const prod = products.find((p) => p.id === e.target.value);
                    if (prod) {
                      setBarcodeInput(prod.barcode || prod.sku);
                      setTimeout(() => {
                        const evt = { preventDefault: () => {} } as React.FormEvent;
                        handleScanOrAddProduct(evt);
                      }, 40);
                    }
                    e.target.value = '';
                  }}
                  className="w-full text-xs bg-white border border-slate-200 rounded px-3 py-1.5 text-slate-700"
                >
                  <option value="">-- Atau Pilih Produk Dari Daftar --</option>
                  {products
                    .filter((p) => p.stock > 0)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku}) - Stok Tersedia: {p.stock} {p.unit}
                      </option>
                    ))}
                </select>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                      <th className="py-2.5 px-3">Produk</th>
                      <th className="py-2.5 px-3 text-center">Stok Saat Ini</th>
                      <th className="py-2.5 px-3 text-center">Qty Dikeluarkan</th>
                      <th className="py-2.5 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          Belum ada item ditambahkan.
                        </td>
                      </tr>
                    ) : (
                      items.map((i) => {
                        const prod = products.find((p) => p.id === i.productId);
                        return (
                          <tr key={i.productId} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-900">{prod?.name}</div>
                              <div className="font-mono text-[10px] text-slate-400">{prod?.sku}</div>
                            </td>

                            <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-700">
                              {prod?.stock} {prod?.unit}
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="number"
                                min="1"
                                max={prod?.stock || 1}
                                value={i.quantity}
                                onChange={(e) =>
                                  handleUpdateItem(i.productId, parseInt(e.target.value, 10) || 1)
                                }
                                className="w-16 px-2 py-1 text-center font-mono border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
                              />
                              <span className="ml-1 text-[11px] text-slate-500">{prod?.unit}</span>
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleUpdateItem(i.productId, 0)}
                                className="p-1 text-red-500 hover:text-red-700 rounded"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Keterangan kondisi barang..."
                />
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
                  type="submit"
                  disabled={items.length === 0}
                  className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm disabled:opacity-40"
                >
                  Finalisasi Pengeluaran Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detail Item Keluar */}
      {showDetailModal && selectedIssue && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-bold text-slate-900 text-sm">
                Detail Pengeluaran: {selectedIssue.issueNumber}
              </h3>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500">Alasan:</span>
                  <div className="font-semibold text-slate-900">{selectedIssue.reason}</div>
                </div>
                <div>
                  <span className="text-slate-500">No. Ref:</span>
                  <div className="font-mono font-semibold text-slate-900">{selectedIssue.referenceDoc || '-'}</div>
                </div>
                <div>
                  <span className="text-slate-500">Waktu:</span>
                  <div>{formatDateTime(selectedIssue.date)}</div>
                </div>
                <div>
                  <span className="text-slate-500">Petugas:</span>
                  <div>{selectedIssue.createdBy}</div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-2 px-3">Produk</th>
                      <th className="py-2 px-3 text-center">Jumlah Dikeluarkan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedIssue.items.map((i, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3">
                          <div className="font-semibold text-slate-900">{i.productName}</div>
                          <div className="font-mono text-[10px] text-slate-400">{i.productSku}</div>
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-red-600">
                          -{i.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedIssue.notes && (
                <div>
                  <span className="text-slate-500">Catatan:</span>
                  <div className="text-slate-700 mt-0.5">{selectedIssue.notes}</div>
                </div>
              )}

              <div className="flex justify-end pt-3 border-t border-slate-100">
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
