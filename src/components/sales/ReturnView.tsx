import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Search,
  Plus,
  Printer,
  AlertCircle,
  CheckCircle,
  X,
  Package,
  Calendar,
  FileText,
} from 'lucide-react';
import { db } from '../../services/db';
import { ReturnAction, ReturnCondition, Sale, SaleReturn, SaleReturnItem } from '../../types';
import { formatDate, formatDateTime, formatRupiah, printHtmlDocument } from '../../utils/formatters';

interface ReturnViewProps {
  onRefreshData: () => void;
}

export const ReturnView: React.FC<ReturnViewProps> = ({ onRefreshData }) => {
  const returns = db.getReturns();
  const sales = db.getSales();
  const settings = db.getSettings();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<SaleReturn | null>(null);

  // New return form
  const [selectedSaleId, setSelectedSaleId] = useState<string>('');
  const [returnItems, setReturnItems] = useState<
    {
      productId: string;
      productSku: string;
      productName: string;
      boughtQuantity: number;
      returnQuantity: number;
      unitPrice: number;
      reason: string;
      condition: ReturnCondition;
    }[]
  >([]);
  const [refundAction, setRefundAction] = useState<ReturnAction>('pengembalian_dana');
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Selected sale for new return
  const saleTarget = useMemo(() => {
    return sales.find((s) => s.id === selectedSaleId) || null;
  }, [sales, selectedSaleId]);

  // When saleTarget changes, populate items
  React.useEffect(() => {
    if (saleTarget) {
      setReturnItems(
        saleTarget.items.map((i) => ({
          productId: i.productId,
          productSku: i.productSku,
          productName: i.productName,
          boughtQuantity: i.quantity,
          returnQuantity: 0,
          unitPrice: i.unitPrice,
          reason: 'Cacat produksi / Rusak kemasan',
          condition: 'layak_jual',
        }))
      );
    } else {
      setReturnItems([]);
    }
  }, [saleTarget]);

  // Calculate total refund
  const totalRefundAmount = useMemo(() => {
    return returnItems.reduce((acc, i) => acc + i.returnQuantity * i.unitPrice, 0);
  }, [returnItems]);

  const handleCreateReturn = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!saleTarget) {
      setFormError('Pilih transaksi penjualan asli.');
      return;
    }

    const validItems = returnItems.filter((i) => i.returnQuantity > 0);
    if (validItems.length === 0) {
      setFormError('Tentukan jumlah item yang akan diretur (minimal 1 unit).');
      return;
    }

    // Validate quantities
    for (const item of validItems) {
      if (item.returnQuantity > item.boughtQuantity) {
        setFormError(
          `Jumlah retur produk "${item.productName}" (${item.returnQuantity}) melebihi jumlah pembelian asli (${item.boughtQuantity}).`
        );
        return;
      }
    }

    const payloadItems: SaleReturnItem[] = validItems.map((i) => ({
      productId: i.productId,
      productSku: i.productSku,
      productName: i.productName,
      quantity: i.returnQuantity,
      unitPrice: i.unitPrice,
      subtotal: i.returnQuantity * i.unitPrice,
      reason: i.reason,
      condition: i.condition,
      stockRestored: i.condition === 'layak_jual',
    }));

    const res = db.createReturn({
      saleId: saleTarget.id,
      invoiceNumber: saleTarget.invoiceNumber,
      items: payloadItems,
      totalRefund: totalRefundAmount,
      refundAction,
      notes,
    });

    if (res.success && res.returnDoc) {
      setShowAddModal(false);
      onRefreshData();
      alert(`Retur ${res.returnDoc.returnNumber} berhasil diproses. Stok barang yang layak jual telah ditambahkan kembali ke inventori.`);
    } else {
      setFormError(res.error || 'Gagal memproses retur penjualan.');
    }
  };

  const handlePrintReturnReceipt = (retDoc: SaleReturn) => {
    const returnHtml = `
      <style>
        .ret-box { max-width: 600px; margin: auto; padding: 20px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #1e293b; }
        .bold { font-weight: bold; }
        .border-b { border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; margin-bottom: 12px; }
        .row { display: flex; justify-content: space-between; margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 11px; }
        th { background: #f8fafc; border-bottom: 1px solid #94a3b8; padding: 6px; text-align: left; }
        td { padding: 6px; border-bottom: 1px solid #e2e8f0; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
      </style>
      <div class="ret-box">
        <div class="border-b" style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <h2 class="bold" style="font-size:16px;">${settings.storeName}</h2>
            <div>${settings.storeAddress}</div>
            <div>Telp: ${settings.storePhone}</div>
          </div>
          <div style="text-align:right;">
            <h3 class="bold" style="color:#dc2626; font-size:14px;">BUKTI RETUR PENJUALAN</h3>
            <div class="font-mono bold">No: ${retDoc.returnNumber}</div>
            <div>Waktu: ${formatDateTime(retDoc.date)}</div>
          </div>
        </div>

        <div class="row">
          <span>Referensi No. Faktur Asli:</span>
          <span class="font-mono bold">${retDoc.invoiceNumber}</span>
        </div>
        <div class="row">
          <span>Tindakan Pengembalian:</span>
          <span class="bold uppercase">${retDoc.refundAction.replace('_', ' ')}</span>
        </div>
        <div class="row">
          <span>Petugas:</span>
          <span>${retDoc.processedBy}</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>Produk</th>
              <th style="text-align:center;">Qty Retur</th>
              <th>Kondisi</th>
              <th style="text-align:right;">Pengembalian</th>
            </tr>
          </thead>
          <tbody>
            ${retDoc.items
              .map(
                (item) => `
              <tr>
                <td>
                  <strong>${item.productName}</strong><br/>
                  <span style="color:#64748b;">Alasan: ${item.reason}</span>
                </td>
                <td style="text-align:center;" class="font-mono">${item.quantity}</td>
                <td>${item.condition === 'layak_jual' ? 'Layak Jual (Masuk Stok)' : 'Rusak (Karantina)'}</td>
                <td style="text-align:right;" class="font-mono bold">${formatRupiah(item.subtotal)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div style="text-align:right; margin-top:12px; font-size:14px; font-weight:bold;">
          <span>TOTAL DANA PENGEMBALIAN: </span>
          <span class="font-mono" style="color:#dc2626;">${formatRupiah(retDoc.totalRefund)}</span>
        </div>

        <div style="margin-top:30px; display:flex; justify-content:space-between; text-align:center;">
          <div style="width:140px;">
            <div>Pelanggan / Pembeli</div>
            <div style="height:50px;"></div>
            <div style="border-top:1px solid #94a3b8;">( .......................... )</div>
          </div>
          <div style="width:140px;">
            <div>Petugas Toko</div>
            <div style="height:50px;"></div>
            <div style="border-top:1px solid #94a3b8;">( ${retDoc.processedBy} )</div>
          </div>
        </div>
      </div>
    `;

    printHtmlDocument(returnHtml, `Bukti_Retur_${retDoc.returnNumber}`);
  };

  const filteredReturns = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return returns;
    return returns.filter(
      (r) =>
        r.returnNumber.toLowerCase().includes(q) ||
        r.invoiceNumber.toLowerCase().includes(q) ||
        r.notes.toLowerCase().includes(q)
    );
  }, [returns, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Retur Penjualan</h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola pengembalian barang dari pelanggan, audit kelayakan kondisi barang, pemulihan stok fisik, dan cetak bukti retur.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedSaleId('');
            setFormError(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Buat Retur Penjualan</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari no. retur atau no. faktur asli..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="text-xs text-slate-500">
          Total Dokumen Retur: <strong className="text-slate-900 font-mono">{filteredReturns.length}</strong>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">No. Retur</th>
                <th className="py-3 px-4">Tanggal &amp; Waktu</th>
                <th className="py-3 px-4">No. Faktur Asli</th>
                <th className="py-3 px-4 text-center">Jumlah Item</th>
                <th className="py-3 px-4">Tindakan Pengembalian</th>
                <th className="py-3 px-4 text-right">Nilai Retur</th>
                <th className="py-3 px-4">Petugas</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Belum ada riwayat dokumen retur penjualan.
                  </td>
                </tr>
              ) : (
                filteredReturns.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-red-600">{r.returnNumber}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {formatDateTime(r.date)}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-blue-600">
                      {r.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {r.items.reduce((acc, i) => acc + i.quantity, 0)} Item
                    </td>
                    <td className="py-3 px-4 font-medium uppercase text-slate-800">
                      {r.refundAction.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(r.totalRefund)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{r.processedBy}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handlePrintReturnReceipt(r)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="Cetak Bukti Retur"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedReturn(r);
                            setShowDetailModal(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="Lihat Detail Retur"
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

      {/* Modal: Tambah Retur Penjualan */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-900 text-sm">Proses Retur Penjualan Barang</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReturn} className="flex-1 overflow-y-auto p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Step 1: Select Original Sale */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1. Pilih Transaksi Penjualan Asli *
                </label>
                <select
                  required
                  value={selectedSaleId}
                  onChange={(e) => setSelectedSaleId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="">-- Pilih Faktur Penjualan --</option>
                  {sales
                    .filter((s) => s.orderStatus !== 'dibatalkan')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.invoiceNumber} - {s.customerName} ({formatRupiah(s.grandTotal)}) [
                        {s.paymentStatus.toUpperCase()}]
                      </option>
                    ))}
                </select>
              </div>

              {/* Step 2: Return Items List */}
              {saleTarget && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-700">
                    2. Pilih Barang &amp; Masukkan Jumlah yang Diretur:
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                          <th className="py-2.5 px-3">Produk</th>
                          <th className="py-2.5 px-3 text-center">Dibeli</th>
                          <th className="py-2.5 px-3 text-center">Qty Retur</th>
                          <th className="py-2.5 px-3">Kondisi Barang</th>
                          <th className="py-2.5 px-3">Alasan Retur</th>
                          <th className="py-2.5 px-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {returnItems.map((item, idx) => (
                          <tr key={item.productId} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-900">{item.productName}</div>
                              <div className="font-mono text-[10px] text-slate-400">{item.productSku}</div>
                            </td>

                            <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                              {item.boughtQuantity}
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max={item.boughtQuantity}
                                value={item.returnQuantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 0;
                                  const next = [...returnItems];
                                  next[idx].returnQuantity = Math.min(item.boughtQuantity, Math.max(0, val));
                                  setReturnItems(next);
                                }}
                                className="w-16 px-2 py-1 text-center font-mono border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
                              />
                            </td>

                            <td className="py-2.5 px-3">
                              <select
                                value={item.condition}
                                onChange={(e) => {
                                  const next = [...returnItems];
                                  next[idx].condition = e.target.value as any;
                                  setReturnItems(next);
                                }}
                                className="text-xs bg-white border border-slate-200 rounded px-2 py-1"
                              >
                                <option value="layak_jual">Layak Jual (Kembali ke Stok)</option>
                                <option value="rusak_karantina">Rusak (Karantina / Tidak Dijual)</option>
                              </select>
                            </td>

                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={item.reason}
                                onChange={(e) => {
                                  const next = [...returnItems];
                                  next[idx].reason = e.target.value;
                                  setReturnItems(next);
                                }}
                                className="w-full text-xs px-2 py-1 border border-slate-200 rounded"
                              />
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              {formatRupiah(item.returnQuantity * item.unitPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Step 3: Refund Action */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        3. Tindakan Pengembalian Dana / Nilai:
                      </label>
                      <select
                        value={refundAction}
                        onChange={(e) => setRefundAction(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                      >
                        <option value="pengembalian_dana">Pengembalian Uang Tunai / Refund</option>
                        <option value="kredit_pelanggan">Saldo Kredit Piutang Pelanggan</option>
                        <option value="ganti_barang">Penggantian Barang Sejenis</option>
                      </select>
                    </div>

                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-xs">
                      <span className="font-semibold text-red-900">Total Nilai Retur:</span>
                      <strong className="text-base font-mono text-red-700 font-bold">
                        {formatRupiah(totalRefundAmount)}
                      </strong>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan Retur</label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                      placeholder="Informasi kondisi fisik, persetujuan supervisor, dll."
                    />
                  </div>
                </div>
              )}

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
                  disabled={!saleTarget || totalRefundAmount === 0}
                  className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm disabled:opacity-40"
                >
                  Konfirmasi &amp; Simpan Retur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
