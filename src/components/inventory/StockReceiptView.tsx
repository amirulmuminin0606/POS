import React, { useState, useMemo } from 'react';
import {
  ArrowDownToLine,
  Search,
  Plus,
  Printer,
  Barcode as BarcodeIcon,
  X,
  FileText,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { db } from '../../services/db';
import { Product, StockReceipt, StockReceiptItem } from '../../types';
import { formatDateTime, formatRupiah, printHtmlDocument } from '../../utils/formatters';

interface StockReceiptViewProps {
  onRefreshData: () => void;
}

export const StockReceiptView: React.FC<StockReceiptViewProps> = ({ onRefreshData }) => {
  const receipts = db.getStockReceipts();
  const products = db.getProducts();
  const settings = db.getSettings();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<StockReceipt | null>(null);

  // New Receipt Form
  const [supplier, setSupplier] = useState('');
  const [referenceDoc, setReferenceDoc] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<{ productId: string; quantity: number; unitCost: number }[]>([]);
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

    setItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === prod.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx].quantity += 1;
        return next;
      }
      return [...prev, { productId: prod.id, quantity: 1, unitCost: prod.costPrice }];
    });

    setBarcodeInput('');
  };

  const handleUpdateItem = (productId: string, quantity: number, unitCost: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity, unitCost } : i))
    );
  };

  const handleCreateReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (items.length === 0) {
      setFormError('Daftar item masuk masih kosong! Scan barcode atau pilih produk.');
      return;
    }

    const res = db.createStockReceipt({
      supplier: supplier || 'Pemasok Umum',
      referenceDoc,
      items,
      notes,
    });

    if (res.success && res.receipt) {
      setShowAddModal(false);
      onRefreshData();
      alert(`Penerimaan barang ${res.receipt.receiptNumber} berhasil disimpan. Stok bertambah secara otomatis.`);
    } else {
      setFormError(res.error || 'Gagal menyimpan penerimaan barang.');
    }
  };

  const handlePrintReceiptDoc = (rcv: StockReceipt) => {
    const printHtml = `
      <style>
        .box { max-width: 650px; margin: auto; padding: 20px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #1e293b; }
        .bold { font-weight: bold; }
        .border-b { border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
        th { background: #f8fafc; border-bottom: 2px solid #cbd5e1; padding: 8px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .text-right { text-align: right; }
      </style>
      <div class="box">
        <div class="border-b" style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <h2 class="bold" style="font-size:18px;">${settings.storeName}</h2>
            <div>${settings.storeAddress}</div>
            <div>Telp: ${settings.storePhone}</div>
          </div>
          <div style="text-align:right;">
            <h3 class="bold" style="color:#2563eb; font-size:15px;">BUKTI PENERIMAAN BARANG (ITEM MASUK)</h3>
            <div class="font-mono bold">No: ${rcv.receiptNumber}</div>
            <div>Tanggal: ${formatDateTime(rcv.date)}</div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; margin-bottom:12px; background:#f8fafc; padding:10px; border-radius:6px;">
          <div>
            <div style="font-size:11px; color:#64748b; font-weight:bold;">PEMASOK / SUPPLIER:</div>
            <div style="font-size:13px; font-weight:bold;">${rcv.supplier}</div>
            <div>Ref. Surat Jalan: ${rcv.referenceDoc || '-'}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px; color:#64748b; font-weight:bold;">DITERIMA OLEH:</div>
            <div style="font-weight:bold;">${rcv.createdBy}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Produk / SKU</th>
              <th style="text-align:center;">Jumlah Masuk</th>
              <th class="text-right">Harga Beli</th>
              <th class="text-right">Total Nilai</th>
            </tr>
          </thead>
          <tbody>
            ${rcv.items
              .map((i, idx) => {
                return `
                <tr>
                  <td style="width:30px;">${idx + 1}</td>
                  <td>
                    <strong>${i.productName}</strong><br/>
                    <span class="font-mono" style="color:#64748b; font-size:10px;">${i.productSku}</span>
                  </td>
                  <td style="text-align:center;" class="font-mono bold">+${i.quantity}</td>
                  <td class="text-right font-mono">${formatRupiah(i.unitCost)}</td>
                  <td class="text-right font-mono bold">${formatRupiah(i.subtotal)}</td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>

        <div style="text-align:right; font-size:14px; font-weight:bold; margin-top:12px;">
          <span>TOTAL NILAI PENERIMAAN: </span>
          <span class="font-mono" style="color:#2563eb;">${formatRupiah(rcv.totalCost)}</span>
        </div>

        <div style="margin-top:40px; display:flex; justify-content:space-between; text-align:center;">
          <div style="width:150px;">
            <div>Petugas Pengirim</div>
            <div style="height:50px;"></div>
            <div style="border-top:1px solid #94a3b8;">( ${rcv.supplier} )</div>
          </div>
          <div style="width:150px;">
            <div>Petugas Penerima (Gudang)</div>
            <div style="height:50px;"></div>
            <div style="border-top:1px solid #94a3b8;">( ${rcv.createdBy} )</div>
          </div>
        </div>
      </div>
    `;

    printHtmlDocument(printHtml, `Bukti_Penerimaan_${rcv.receiptNumber}`);
  };

  const filteredReceipts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return receipts;
    return receipts.filter(
      (r) =>
        r.receiptNumber.toLowerCase().includes(q) ||
        r.supplier.toLowerCase().includes(q) ||
        r.referenceDoc.toLowerCase().includes(q)
    );
  }, [receipts, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Penerimaan Item Masuk (Stock In)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Catat penerimaan pasokan barang dari supplier, update otomatis stok fisik, dan cetak bukti penerimaan.
          </p>
        </div>
        <button
          onClick={() => {
            setSupplier('');
            setReferenceDoc('');
            setNotes('');
            setItems([]);
            setFormError(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Catat Item Masuk Baru</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari no. penerimaan, supplier, atau surat jalan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="text-xs text-slate-500">
          Total Dokumen: <strong className="text-slate-900 font-mono">{filteredReceipts.length}</strong>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">No. Penerimaan</th>
                <th className="py-3 px-4">Tanggal &amp; Waktu</th>
                <th className="py-3 px-4">Pemasok / Supplier</th>
                <th className="py-3 px-4">Ref. Surat Jalan</th>
                <th className="py-3 px-4 text-center">Total Item</th>
                <th className="py-3 px-4 text-right">Nilai Pembelian</th>
                <th className="py-3 px-4">Petugas</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Belum ada riwayat dokumen penerimaan barang masuk.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{r.receiptNumber}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {formatDateTime(r.date)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{r.supplier}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{r.referenceDoc || '-'}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">
                      +{r.items.reduce((acc, i) => acc + i.quantity, 0)} Unit
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(r.totalCost)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{r.createdBy}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handlePrintReceiptDoc(r)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="Cetak Bukti Penerimaan Barang"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedReceipt(r);
                            setShowDetailModal(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="Lihat Detail Penerimaan"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah Item Masuk */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-900 text-sm">Catat Penerimaan Barang Masuk (Stok In)</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReceipt} className="flex-1 overflow-y-auto p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Pemasok / Supplier *
                  </label>
                  <input
                    type="text"
                    required
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Contoh: PT Indofood Sukses Makmur"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. Dokumen / Surat Jalan
                  </label>
                  <input
                    type="text"
                    value={referenceDoc}
                    onChange={(e) => setReferenceDoc(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                    placeholder="Contoh: SJ-2026-9988"
                  />
                </div>
              </div>

              {/* Barcode scanner box */}
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <BarcodeIcon className="w-4 h-4 text-blue-600" />
                  <span>Scan Barcode atau Pilih Produk</span>
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleScanOrAddProduct(e);
                      }
                    }}
                    placeholder="Scan barcode scanner USB atau masukkan SKU..."
                    className="flex-1 px-3 py-2 text-xs bg-white border border-blue-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleScanOrAddProduct}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
                  >
                    + Tambahkan
                  </button>
                </div>

                {/* Quick select */}
                <select
                  aria-label="Pilih Produk Manual untuk Penerimaan"
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
                  className="w-full text-xs bg-white border border-slate-200 rounded px-3 py-1.5 text-slate-700 mt-1"
                >
                  <option value="">-- Atau Pilih Produk Dari Daftar --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - Stok Saat Ini: {p.stock} {p.unit}
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
                      <th className="py-2.5 px-3 text-center">Jumlah Masuk</th>
                      <th className="py-2.5 px-3 text-right">Harga Beli Satuan</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                      <th className="py-2.5 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
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

                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="number"
                                min="1"
                                value={i.quantity}
                                onChange={(e) =>
                                  handleUpdateItem(i.productId, parseInt(e.target.value, 10) || 1, i.unitCost)
                                }
                                className="w-16 px-2 py-1 text-center font-mono border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
                              />
                              <span className="ml-1 text-[11px] text-slate-500">{prod?.unit}</span>
                            </td>

                            <td className="py-2.5 px-3 text-right">
                              <input
                                type="number"
                                min="0"
                                value={i.unitCost}
                                onChange={(e) =>
                                  handleUpdateItem(i.productId, i.quantity, parseFloat(e.target.value) || 0)
                                }
                                className="w-24 px-2 py-1 text-right font-mono border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
                              />
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              {formatRupiah(i.quantity * i.unitCost)}
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleUpdateItem(i.productId, 0, i.unitCost)}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Penerimaan</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Kondisi pengiriman, nomor kendaraan pengangkut..."
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
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-40"
                >
                  Simpan &amp; Tambahkan ke Stok Fisik
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detail Penerimaan */}
      {showDetailModal && selectedReceipt && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-bold text-slate-900 text-sm">
                Detail Penerimaan: {selectedReceipt.receiptNumber}
              </h3>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Pemasok:</span>
                  <div className="font-semibold text-slate-900">{selectedReceipt.supplier}</div>
                </div>
                <div>
                  <span className="text-slate-500">Ref. Dokumen:</span>
                  <div className="font-mono font-semibold text-slate-900">{selectedReceipt.referenceDoc || '-'}</div>
                </div>
                <div>
                  <span className="text-slate-500">Waktu Terima:</span>
                  <div>{formatDateTime(selectedReceipt.date)}</div>
                </div>
                <div>
                  <span className="text-slate-500">Penerima:</span>
                  <div>{selectedReceipt.createdBy}</div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-2 px-3">Produk</th>
                      <th className="py-2 px-3 text-center">Jumlah</th>
                      <th className="py-2 px-3 text-right">Harga Beli</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedReceipt.items.map((i, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3">
                          <div className="font-semibold text-slate-900">{i.productName}</div>
                          <div className="font-mono text-[10px] text-slate-400">{i.productSku}</div>
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-emerald-700">
                          +{i.quantity}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">{formatRupiah(i.unitCost)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(i.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-right text-sm font-bold text-slate-900 pt-2">
                Total Nilai: <span className="font-mono text-blue-600">{formatRupiah(selectedReceipt.totalCost)}</span>
              </div>

              <div className="flex justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => handlePrintReceiptDoc(selectedReceipt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Bukti Penerimaan</span>
                </button>
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
