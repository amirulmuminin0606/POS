import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Briefcase,
  TrendingUp,
  Receipt,
  Edit2,
  Trash2,
  Eye,
  X,
  Phone,
  Calendar,
} from 'lucide-react';
import { db } from '../../services/db';
import { Sale, Salesperson } from '../../types';
import { formatDate, formatDateTime, formatRupiah } from '../../utils/formatters';

interface SalesListProps {
  onRefreshData: () => void;
}

export const SalesList: React.FC<SalesListProps> = ({ onRefreshData }) => {
  const salespeople = db.getSalespeople();
  const sales = db.getSales();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSalesperson, setSelectedSalesperson] = useState<Salesperson | null>(null);

  // Detail filter
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'THIS_MONTH' | 'THIS_YEAR'>('ALL');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    isActive: true,
    notes: '',
  });

  // Calculate sales metrics per salesperson
  const salesStatsMap = useMemo(() => {
    const map = new Map<string, { totalOmzet: number; transactionCount: number }>();
    salespeople.forEach((s) => map.set(s.id, { totalOmzet: 0, transactionCount: 0 }));

    sales.forEach((sale) => {
      if (sale.salesId && sale.orderStatus !== 'dibatalkan') {
        const cur = map.get(sale.salesId) || { totalOmzet: 0, transactionCount: 0 };
        cur.totalOmzet += sale.grandTotal;
        cur.transactionCount += 1;
        map.set(sale.salesId, cur);
      }
    });
    return map;
  }, [salespeople, sales]);

  const filteredSalespeople = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return salespeople;
    return salespeople.filter(
      (s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.phone.includes(q)
    );
  }, [salespeople, searchQuery]);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      phone: '',
      address: '',
      isActive: true,
      notes: '',
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (s: Salesperson) => {
    setSelectedSalesperson(s);
    setFormData({
      name: s.name,
      phone: s.phone,
      address: s.address || '',
      isActive: s.isActive,
      notes: s.notes || '',
    });
    setShowEditModal(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    db.createSalesperson(formData);
    setShowAddModal(false);
    onRefreshData();
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSalesperson) return;
    db.updateSalesperson(selectedSalesperson.id, formData);
    setShowEditModal(false);
    onRefreshData();
  };

  const handleDelete = (s: Salesperson) => {
    if (confirm(`Hapus data sales "${s.name}"?`)) {
      const res = db.deleteSalesperson(s.id);
      if (res.success) {
        onRefreshData();
      } else {
        alert(res.error);
      }
    }
  };

  // Transactions belonging to selected salesperson
  const salespersonTransactions = useMemo(() => {
    if (!selectedSalesperson) return [];
    let list = sales.filter((s) => s.salesId === selectedSalesperson.id);

    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = String(now.getMonth() + 1).padStart(2, '0');

    if (periodFilter === 'THIS_MONTH') {
      list = list.filter((s) => s.date.startsWith(`${curYear}-${curMonth}`));
    } else if (periodFilter === 'THIS_YEAR') {
      list = list.filter((s) => s.date.startsWith(String(curYear)));
    }

    return list;
  }, [selectedSalesperson, sales, periodFilter]);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Daftar Tenaga Penjualan (Sales)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola tim sales, pantau transaksi tiap sales rep, dan analisis performa omzet penjualan.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Sales</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama sales, ID sales, atau telepon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>
        <div className="text-xs text-slate-500">
          Total: <strong className="text-slate-900 font-mono">{filteredSalespeople.length}</strong> Sales
        </div>
      </div>

      {/* Salespeople Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">ID Sales</th>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">No. Telepon</th>
                <th className="py-3 px-4">Alamat / Wilayah</th>
                <th className="py-3 px-4 text-center">Jumlah Transaksi</th>
                <th className="py-3 px-4 text-right">Total Penjualan (Omzet)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSalespeople.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada data sales ditemukan.
                  </td>
                </tr>
              ) : (
                filteredSalespeople.map((s) => {
                  const stats = salesStatsMap.get(s.id) || { totalOmzet: 0, transactionCount: 0 };
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{s.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{s.phone || '-'}</td>
                      <td className="py-3 px-4">
                        <div>{s.address || '-'}</div>
                        {s.notes && <div className="text-[11px] text-slate-400">{s.notes}</div>}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium text-slate-900">
                        {stats.transactionCount} Transaksi
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        {formatRupiah(stats.totalOmzet)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                            s.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {s.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedSalesperson(s);
                              setShowDetailModal(true);
                            }}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                            title="Lihat Daftar Transaksi Sales"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded"
                            title="Edit Data Sales"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(s)}
                            className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-slate-100 rounded"
                            title="Hapus / Nonaktifkan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Modal: Tambah Sales */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Tambah Sales Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Sales *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Contoh: Budi Santoso"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Telepon</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  placeholder="Contoh: 0812-9988-7711"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat / Area Wilayah</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Contoh: Area Jakarta Pusat & Utara"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Target bulanan, jadwal kunjungan, dll."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveSales"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300"
                />
                <label htmlFor="isActiveSales" className="text-xs text-slate-700">
                  Status sales aktif
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Simpan Sales
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Sales */}
      {showEditModal && selectedSalesperson && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Edit Data Sales: {selectedSalesperson.name}</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Sales *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Telepon</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat / Area</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveSalesEdit"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300"
                />
                <label htmlFor="isActiveSalesEdit" className="text-xs text-slate-700">
                  Status sales aktif
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Transaksi per Sales */}
      {showDetailModal && selectedSalesperson && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Daftar Transaksi: {selectedSalesperson.name} ({selectedSalesperson.id})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Laporan dan riwayat penjualan yang dihasilkan oleh sales terkait.
                </p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Period Filter Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setPeriodFilter('ALL')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      periodFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                    }`}
                  >
                    Semua Periode
                  </button>
                  <button
                    onClick={() => setPeriodFilter('THIS_MONTH')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      periodFilter === 'THIS_MONTH' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                    }`}
                  >
                    Bulan Ini
                  </button>
                  <button
                    onClick={() => setPeriodFilter('THIS_YEAR')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      periodFilter === 'THIS_YEAR' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                    }`}
                  >
                    Tahun Ini
                  </button>
                </div>

                <div className="text-xs text-slate-600">
                  Total Omzet:{' '}
                  <strong className="text-emerald-700 font-mono text-sm">
                    {formatRupiah(salespersonTransactions.reduce((acc, s) => acc + s.grandTotal, 0))}
                  </strong>
                </div>
              </div>

              {/* Transactions List */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                      <th className="py-2.5 px-3">No. Invoice</th>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Pelanggan</th>
                      <th className="py-2.5 px-3 text-right">Nilai Total</th>
                      <th className="py-2.5 px-3 text-center">Status Bayar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {salespersonTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Belum ada transaksi pada periode yang dipilih.
                        </td>
                      </tr>
                    ) : (
                      salespersonTransactions.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-mono font-medium text-blue-600">{s.invoiceNumber}</td>
                          <td className="py-2.5 px-3">{formatDateTime(s.date)}</td>
                          <td className="py-2.5 px-3 font-medium">{s.customerName}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {formatRupiah(s.grandTotal)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
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

              <div className="flex justify-end pt-2">
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
