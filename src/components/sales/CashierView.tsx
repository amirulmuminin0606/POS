import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  Receipt,
  CheckCircle,
  AlertCircle,
  Printer,
  X,
  History,
  DollarSign,
  ArrowRight,
  Clock,
  Layers,
} from 'lucide-react';
import { db } from '../../services/db';
import { Payment, PaymentMethod, Sale } from '../../types';
import { formatDateTime, formatRupiah, printHtmlDocument } from '../../utils/formatters';

interface CashierViewProps {
  initialSaleId?: string;
  onRefreshData: () => void;
  onNavigateToInvoice: (saleId: string) => void;
}

export const CashierView: React.FC<CashierViewProps> = ({
  initialSaleId,
  onRefreshData,
  onNavigateToInvoice,
}) => {
  const sales = db.getSales();
  const payments = db.getPayments();
  const settings = db.getSettings();
  const activeUser = db.getActiveUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState<string>(initialSaleId || '');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PARTIAL' | 'PAID'>('UNPAID');

  // Payment form states
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [tenderedAmount, setTenderedAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai');
  const [notes, setNotes] = useState<string>('');
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [lastPayment, setLastPayment] = useState<Payment | null>(null);

  // Selected sale
  const selectedSale = useMemo(() => {
    return sales.find((s) => s.id === selectedSaleId) || null;
  }, [sales, selectedSaleId]);

  // When selected sale changes, auto populate payment amount with balance due
  React.useEffect(() => {
    if (selectedSale) {
      const due = selectedSale.balanceDue;
      setPaymentAmount(due);
      setTenderedAmount(due);
      setPaymentError(null);
      setPaymentSuccess(null);
    }
  }, [selectedSale]);

  // Filtered sales in cashier queue
  const cashierSalesList = useMemo(() => {
    return sales.filter((s) => {
      if (s.orderStatus === 'dibatalkan') return false;

      // Status filter
      if (statusFilter === 'UNPAID' && s.paymentStatus !== 'belum_dibayar') return false;
      if (statusFilter === 'PARTIAL' && s.paymentStatus !== 'dibayar_sebagian') return false;
      if (statusFilter === 'PAID' && s.paymentStatus !== 'lunas') return false;

      // Search
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        return (
          s.invoiceNumber.toLowerCase().includes(q) ||
          s.customerName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [sales, statusFilter, searchQuery]);

  // Change amount calculation
  const changeAmount = useMemo(() => {
    if (paymentMethod !== 'tunai') return 0;
    return Math.max(0, tenderedAmount - paymentAmount);
  }, [tenderedAmount, paymentAmount, paymentMethod]);

  // Payments for currently selected sale
  const salePaymentHistory = useMemo(() => {
    if (!selectedSale) return [];
    return payments.filter((p) => p.saleId === selectedSale.id);
  }, [selectedSale, payments]);

  // Handle submit payment
  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    setPaymentSuccess(null);

    if (!selectedSale) {
      setPaymentError('Pilih transaksi penjualan yang akan diproses pembayarannya.');
      return;
    }

    if (paymentAmount <= 0) {
      setPaymentError('Nominal pembayaran harus lebih besar dari Rp 0.');
      return;
    }

    if (paymentAmount > selectedSale.balanceDue) {
      setPaymentError(`Nominal pembayaran melebihi sisa tagihan (${formatRupiah(selectedSale.balanceDue)}).`);
      return;
    }

    if (paymentMethod === 'tunai' && tenderedAmount < paymentAmount) {
      setPaymentError(`Uang tunai yang diterima (${formatRupiah(tenderedAmount)}) kurang dari nominal pembayaran (${formatRupiah(paymentAmount)}).`);
      return;
    }

    const res = db.recordPayment({
      saleId: selectedSale.id,
      invoiceNumber: selectedSale.invoiceNumber,
      amount: paymentAmount,
      method: paymentMethod,
      tenderedAmount: paymentMethod === 'tunai' ? tenderedAmount : paymentAmount,
      changeAmount,
      notes: notes || (paymentAmount >= selectedSale.balanceDue ? 'Pelunasan faktur' : 'Pembayaran termin/DP'),
    });

    if (res.success && res.payment) {
      setLastPayment(res.payment);
      setPaymentSuccess(`Pembayaran ${res.payment.paymentNumber} berhasil diproses!`);
      onRefreshData();
    } else {
      setPaymentError(res.error || 'Gagal memproses pembayaran kasir.');
    }
  };

  // Preset cash quick buttons
  const handleQuickCash = (amt: number) => {
    setTenderedAmount(amt);
  };

  // Print Thermal Receipt (58mm / 80mm format)
  const handlePrintThermalReceipt = (sale: Sale, pmt?: Payment | null) => {
    const payment = pmt || lastPayment || salePaymentHistory[0];
    const receiptHtml = `
      <style>
        @page { margin: 0; size: 80mm auto; }
        body {
          margin: 0;
          padding: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          line-height: 15px;
          color: #000;
          background: #fff;
          width: 72mm;
        }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 6px 0; }
        .double-line { border-top: 2px dashed #000; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; margin: 2px 0; }
      </style>
      <div>
        <div class="center bold" style="font-size: 14px; text-transform: uppercase;">${settings.storeName}</div>
        <div class="center" style="font-size: 9px; margin-top: 2px;">${settings.storeAddress}</div>
        <div class="center" style="font-size: 9px;">Telp: ${settings.storePhone}</div>

        <div class="line"></div>

        <div class="row">
          <span>No. Struk:</span>
          <span class="bold">${payment?.paymentNumber || sale.invoiceNumber}</span>
        </div>
        <div class="row">
          <span>No. Faktur:</span>
          <span>${sale.invoiceNumber}</span>
        </div>
        <div class="row">
          <span>Waktu:</span>
          <span>${formatDateTime(new Date().toISOString())}</span>
        </div>
        <div class="row">
          <span>Kasir:</span>
          <span>${activeUser.name.split(' ')[0]}</span>
        </div>
        <div class="row">
          <span>Pelanggan:</span>
          <span>${sale.customerName}</span>
        </div>

        <div class="line"></div>

        ${sale.items
          .map(
            (item) => `
          <div>
            <div class="bold">${item.productName}</div>
            <div class="row" style="color: #333;">
              <span>${item.quantity} ${item.unit} x ${formatRupiah(item.unitPrice)}</span>
              <span>${formatRupiah(item.subtotal)}</span>
            </div>
          </div>
        `
          )
          .join('')}

        <div class="line"></div>

        <div class="row">
          <span>Subtotal:</span>
          <span>${formatRupiah(sale.subtotal)}</span>
        </div>
        ${
          sale.discount > 0
            ? `<div class="row">
                <span>Diskon:</span>
                <span>-${formatRupiah(sale.discount)}</span>
              </div>`
            : ''
        }
        ${
          sale.tax > 0
            ? `<div class="row">
                <span>PPN (${settings.ppnRate}%):</span>
                <span>+${formatRupiah(sale.tax)}</span>
              </div>`
            : ''
        }
        <div class="row bold" style="font-size: 13px; margin: 4px 0;">
          <span>TOTAL:</span>
          <span>${formatRupiah(sale.grandTotal)}</span>
        </div>

        <div class="line"></div>

        <div class="row">
          <span>Bayar (${(payment?.method || paymentMethod).replace('_', ' ').toUpperCase()}):</span>
          <span class="bold">${formatRupiah(payment?.amount || paymentAmount)}</span>
        </div>
        <div class="row">
          <span>Uang Diterima:</span>
          <span>${formatRupiah(payment?.tenderedAmount || tenderedAmount)}</span>
        </div>
        <div class="row bold">
          <span>Kembalian:</span>
          <span>${formatRupiah(payment?.changeAmount || changeAmount)}</span>
        </div>

        ${
          sale.balanceDue > 0
            ? `<div class="row" style="color: red; font-weight: bold; margin-top: 4px;">
                <span>Sisa Tagihan:</span>
                <span>${formatRupiah(sale.balanceDue)}</span>
              </div>`
            : `<div class="center bold" style="margin-top: 6px; font-size: 12px;">*** LUNAS ***</div>`
        }

        <div class="double-line"></div>

        <div class="center" style="font-size: 9px; line-height: 12px; margin-top: 6px;">
          ${settings.receiptFooter.replace(/\n/g, '<br/>')}
        </div>
      </div>
    `;

    printHtmlDocument(receiptHtml, `Struk_Kasir_${sale.invoiceNumber}`);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Kasir &amp; Pelunasan Pembayaran POS</h1>
          <p className="text-xs text-slate-500 mt-1">
            Selesaikan pembayaran faktur penjualan, kalkulator kembalian otomatis, multi-metode pembayaran, dan cetak struk thermal.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: List of Sales to Pay (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Antrean Transaksi Penjualan</h2>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
              <button
                onClick={() => setStatusFilter('UNPAID')}
                className={`px-2.5 py-1 rounded font-medium ${
                  statusFilter === 'UNPAID' ? 'bg-white text-red-700 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                Belum Bayar
              </button>
              <button
                onClick={() => setStatusFilter('PARTIAL')}
                className={`px-2.5 py-1 rounded font-medium ${
                  statusFilter === 'PARTIAL' ? 'bg-white text-amber-700 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                Sebagian
              </button>
              <button
                onClick={() => setStatusFilter('PAID')}
                className={`px-2.5 py-1 rounded font-medium ${
                  statusFilter === 'PAID' ? 'bg-white text-emerald-700 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                Lunas
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari no. faktur atau nama pelanggan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Queue List */}
          <div className="max-h-[560px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
            {cashierSalesList.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Tidak ada transaksi dengan status pembayaran ini.
              </div>
            ) : (
              cashierSalesList.map((s) => {
                const isSelected = s.id === selectedSaleId;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSaleId(s.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-2xs'
                        : 'border-slate-100 bg-slate-50/40 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-blue-600">{s.invoiceNumber}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          s.paymentStatus === 'lunas'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.paymentStatus === 'dibayar_sebagian'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {s.paymentStatus.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-900 mt-1">{s.customerName}</div>

                    <div className="flex items-center justify-between text-xs mt-2 pt-1 border-t border-slate-200/60 font-mono">
                      <span className="text-slate-500 text-[11px]">Total: {formatRupiah(s.grandTotal)}</span>
                      <span className="font-bold text-red-600">
                        Sisa: {formatRupiah(s.balanceDue)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Checkout & Payment Terminal (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 space-y-5">
          {!selectedSale ? (
            <div className="py-24 text-center text-slate-400 space-y-2">
              <CreditCard className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
              <div className="text-sm font-semibold text-slate-700">Pilih Transaksi untuk Melakukan Pembayaran</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Pilih faktur dari daftar antrean di sebelah kiri atau cari transaksi yang ingin dilunasi.
              </p>
            </div>
          ) : (
            <>
              {/* Selected Sale Overview Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">{selectedSale.invoiceNumber}</h2>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        selectedSale.paymentStatus === 'lunas'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedSale.paymentStatus.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Pelanggan: <strong className="text-slate-900">{selectedSale.customerName}</strong> · Waktu: {formatDateTime(selectedSale.date)}
                  </div>
                </div>

                <div className="text-right">
                  <button
                    onClick={() => handlePrintThermalReceipt(selectedSale)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Struk Thermal</span>
                  </button>
                </div>
              </div>

              {/* Items Summary Accordion/Strip */}
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-100">
                <div className="font-semibold text-slate-700 mb-1">Rincian Item Pembelian:</div>
                {selectedSale.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-slate-600">
                    <span>
                      {i.productName} ({i.quantity} {i.unit})
                    </span>
                    <span className="font-mono">{formatRupiah(i.subtotal)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                  <span>Grand Total Tagihan:</span>
                  <span className="font-mono text-sm">{formatRupiah(selectedSale.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Sudah Dibayar:</span>
                  <span className="font-mono">{formatRupiah(selectedSale.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-red-600 font-bold text-sm pt-1 border-t border-slate-200">
                  <span>Sisa yang Harus Dibayar:</span>
                  <span className="font-mono">{formatRupiah(selectedSale.balanceDue)}</span>
                </div>
              </div>

              {/* Payment Success Alert */}
              {paymentSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold">{paymentSuccess}</div>
                      {lastPayment && (
                        <div className="text-[11px] mt-0.5">
                          Uang Diterima: {formatRupiah(lastPayment.tenderedAmount)} · Kembalian:{' '}
                          <strong className="font-mono text-emerald-700">{formatRupiah(lastPayment.changeAmount)}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handlePrintThermalReceipt(selectedSale, lastPayment)}
                    className="px-3 py-1.5 bg-emerald-700 text-white font-semibold rounded-lg hover:bg-emerald-800 shadow-2xs"
                  >
                    Cetak Struk Sekarang
                  </button>
                </div>
              )}

              {/* Payment Error Alert */}
              {paymentError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Payment Form (Only if balance due > 0) */}
              {selectedSale.balanceDue > 0 ? (
                <form onSubmit={handleProcessPayment} className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      1. Pilih Metode Pembayaran
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'tunai', label: 'Tunai / Cash' },
                        { id: 'transfer_bca', label: 'Transfer BCA' },
                        { id: 'transfer_mandiri', label: 'Transfer Mandiri' },
                        { id: 'qris', label: 'QRIS' },
                        { id: 'kartu_debit', label: 'Kartu Debit' },
                        { id: 'kartu_kredit', label: 'Kartu Kredit' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id as any)}
                          className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                            paymentMethod === m.id
                              ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        2. Nominal Pembayaran Saat Ini (Rp)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={selectedSale.balanceDue}
                        required
                        value={paymentAmount}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setPaymentAmount(val);
                          setTenderedAmount(val);
                        }}
                        className="w-full px-3 py-2 text-sm font-bold text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                      />
                      <span className="text-[10px] text-slate-400">
                        Bisa bayar penuh atau sebagian (DP)
                      </span>
                    </div>

                    {paymentMethod === 'tunai' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          3. Jumlah Uang Diterima / Cash (Rp)
                        </label>
                        <input
                          type="number"
                          min={paymentAmount}
                          required
                          value={tenderedAmount}
                          onChange={(e) => setTenderedAmount(Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 text-sm font-bold text-emerald-700 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                        />
                        <div className="text-[11px] text-slate-500 mt-1 flex justify-between font-mono">
                          <span>Kembalian:</span>
                          <strong className="text-emerald-700 font-bold text-sm">
                            {formatRupiah(changeAmount)}
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Cash Presets for cash payments */}
                  {paymentMethod === 'tunai' && (
                    <div>
                      <span className="text-[11px] font-medium text-slate-500 block mb-1">
                        Tombol Nominal Cepat:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickCash(paymentAmount)}
                          className="px-2.5 py-1 text-xs font-mono font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md"
                        >
                          Uang Pas ({formatRupiah(paymentAmount)})
                        </button>
                        {[20000, 50000, 100000, 200000, 500000].map((cashVal) => (
                          <button
                            key={cashVal}
                            type="button"
                            onClick={() => handleQuickCash(cashVal)}
                            className="px-2.5 py-1 text-xs font-mono font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md"
                          >
                            {formatRupiah(cashVal)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Pembayaran</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                      placeholder="Contoh: No. referensi transfer bank / pembayaran kasir"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <DollarSign className="w-5 h-5" />
                    <span>
                      Proses Pembayaran {formatRupiah(paymentAmount)}
                    </span>
                  </button>
                </form>
              ) : (
                <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-2">
                  <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                  <div className="font-bold text-emerald-900 text-sm">Faktur Ini Sudah Lunas</div>
                  <p className="text-xs text-emerald-700">
                    Seluruh tagihan sebesar {formatRupiah(selectedSale.grandTotal)} telah diterima penuh.
                  </p>
                </div>
              )}

              {/* Payment History Log for this Sale */}
              {salePaymentHistory.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <History className="w-4 h-4 text-slate-500" />
                    <span>Riwayat Pembayaran Faktur Ini ({salePaymentHistory.length})</span>
                  </div>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                    {salePaymentHistory.map((pmt) => (
                      <div key={pmt.id} className="p-2.5 bg-white flex items-center justify-between text-xs">
                        <div>
                          <div className="font-mono font-semibold text-slate-900">{pmt.paymentNumber}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>{formatDateTime(pmt.date)}</span>
                            <span>·</span>
                            <span className="uppercase">{pmt.method.replace('_', ' ')}</span>
                            <span>·</span>
                            <span>Kasir: {pmt.cashierName}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-emerald-700">{formatRupiah(pmt.amount)}</div>
                          <button
                            onClick={() => handlePrintThermalReceipt(selectedSale, pmt)}
                            className="text-[11px] text-blue-600 hover:underline"
                          >
                            Cetak Struk
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
