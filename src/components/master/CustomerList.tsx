import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Download,
  Upload,
  Printer,
  Edit2,
  Trash2,
  Eye,
  X,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { db } from '../../services/db';
import { Customer } from '../../types';
import { exportToCsv, formatDate, printHtmlDocument } from '../../utils/formatters';

interface CustomerListProps {
  onRefreshData: () => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({ onRefreshData }) => {
  const customers = db.getCustomers();
  const settings = db.getSettings();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    notes: '',
  });

  // Address Label customizer state
  const [labelSettings, setLabelSettings] = useState({
    widthMm: 100,
    heightMm: 150,
    marginMm: 5,
    orientation: 'portrait' as 'portrait' | 'landscape',
    includeSender: true,
    fontSizePt: 10,
    senderName: settings.storeName,
    senderPhone: settings.storePhone,
    senderAddress: settings.storeAddress,
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.city.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      phone: '',
      address: '',
      city: 'Jakarta Pusat',
      province: 'DKI Jakarta',
      postalCode: '',
      notes: '',
    });
    setFormError(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setSelectedCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone,
      address: c.address,
      city: c.city,
      province: c.province,
      postalCode: c.postalCode,
      notes: c.notes,
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Nama pelanggan wajib diisi.');
      return;
    }
    db.createCustomer(formData);
    setShowAddModal(false);
    onRefreshData();
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    db.updateCustomer(selectedCustomer.id, formData);
    setShowEditModal(false);
    onRefreshData();
  };

  const handleDelete = (c: Customer) => {
    if (confirm(`Hapus data pelanggan "${c.name}"?`)) {
      const res = db.deleteCustomer(c.id);
      if (res.success) {
        onRefreshData();
      } else {
        alert(res.error || 'Gagal menghapus pelanggan.');
      }
    }
  };

  const handleExportCsv = () => {
    const headers = ['ID Pelanggan', 'Nama Pelanggan', 'No Telepon', 'Alamat', 'Kota', 'Provinsi', 'Kode Pos', 'Catatan', 'Tanggal Dibuat'];
    const rows = filteredCustomers.map((c) => [
      c.id,
      c.name,
      c.phone,
      c.address,
      c.city,
      c.province,
      c.postalCode,
      c.notes,
      formatDate(c.createdAt),
    ]);
    exportToCsv(`daftar_pelanggan_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) return;

      let count = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
        if (cols.length >= 2) {
          db.createCustomer({
            name: cols[1] || 'Pelanggan Baru',
            phone: cols[2] || '',
            address: cols[3] || '',
            city: cols[4] || '',
            province: cols[5] || '',
            postalCode: cols[6] || '',
            notes: cols[7] || '',
          });
          count++;
        }
      }
      onRefreshData();
      alert(`Berhasil mengimpor ${count} data pelanggan.`);
    };
    reader.readAsText(file);
  };

  // Open shipping label modal
  const handleOpenLabelModal = (c: Customer) => {
    setSelectedCustomer(c);
    setShowLabelModal(true);
  };

  // Trigger print shipping address label
  const handlePrintLabel = () => {
    if (!selectedCustomer) return;

    const { widthMm, heightMm, marginMm, orientation, fontSizePt, includeSender, senderName, senderPhone, senderAddress } =
      labelSettings;

    const printHtml = `
      <style>
        @page {
          size: ${widthMm}mm ${heightMm}mm ${orientation};
          margin: 0;
        }
        body {
          margin: 0;
          padding: ${marginMm}mm;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #000;
          background: #fff;
          font-size: ${fontSizePt}pt;
        }
        .label-container {
          width: ${widthMm - marginMm * 2}mm;
          height: ${heightMm - marginMm * 2}mm;
          border: 2px solid #000;
          padding: 4mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .badge {
          border: 1px solid #000;
          padding: 2px 6px;
          font-weight: bold;
          font-size: 8pt;
          display: inline-block;
          margin-bottom: 4px;
        }
        .section {
          margin-bottom: 4mm;
        }
        .title {
          font-weight: bold;
          font-size: ${fontSizePt + 2}pt;
          margin-bottom: 2px;
        }
        .address-box {
          border-top: 1px dashed #666;
          padding-top: 3mm;
          margin-top: 3mm;
        }
      </style>
      <div class="label-container">
        <div>
          ${
            includeSender
              ? `
            <div class="section">
              <span class="badge">PENGIRIM:</span>
              <div class="title">${senderName}</div>
              <div>Telp: ${senderPhone}</div>
              <div style="font-size: ${fontSizePt - 1}pt; color: #333;">${senderAddress}</div>
            </div>
          `
              : ''
          }

          <div class="address-box">
            <span class="badge" style="background:#000; color:#fff;">PENERIMA / TUJUAN:</span>
            <div class="title" style="font-size: ${fontSizePt + 4}pt; text-transform: uppercase;">${selectedCustomer.name}</div>
            <div style="font-weight: bold; margin-bottom: 2px;">No. Telp / WA: ${selectedCustomer.phone}</div>
            <div style="margin-top: 3px; line-height: 1.3;">${selectedCustomer.address}</div>
            <div style="font-weight: bold; margin-top: 4px;">
              ${selectedCustomer.city}, ${selectedCustomer.province} ${selectedCustomer.postalCode ? '- ' + selectedCustomer.postalCode : ''}
            </div>
          </div>
        </div>

        <div style="border-top: 1px solid #000; padding-top: 2mm; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <div style="font-size: 8pt;">ID: <strong>${selectedCustomer.id}</strong></div>
            <div style="font-size: 8pt;">Catatan: ${selectedCustomer.notes || '-'}</div>
          </div>
          <div style="font-size: 9pt; font-weight: bold;">
            KETOKO EXPRESS
          </div>
        </div>
      </div>
    `;

    printHtmlDocument(printHtml, `Label_Alamat_${selectedCustomer.id}`);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Daftar Pelanggan</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manajemen data kontak pelanggan, riwayat alamat, dan cetak label pengiriman thermal 100 × 150 mm.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Ekspor CSV</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Impor CSV</span>
            <input type="file" accept=".csv" onChange={handleImportCsv} className="hidden" />
          </label>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pelanggan</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, ID pelanggan, nomor telepon, atau kota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
        </div>
        <div className="text-xs text-slate-500">
          Total: <strong className="text-slate-900 font-mono">{filteredCustomers.length}</strong> Pelanggan
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">ID Pelanggan</th>
                <th className="py-3 px-4">Nama Pelanggan</th>
                <th className="py-3 px-4">Nomor Telepon</th>
                <th className="py-3 px-4">Alamat &amp; Kota</th>
                <th className="py-3 px-4">Catatan</th>
                <th className="py-3 px-4">Terdaftar</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada data pelanggan yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{c.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{c.phone || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="line-clamp-1 text-slate-800">{c.address || '-'}</div>
                      <div className="text-[11px] text-slate-500">
                        {c.city}, {c.province} {c.postalCode}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 line-clamp-1">{c.notes || '-'}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(c.createdAt)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Print Address Label Button */}
                        <button
                          onClick={() => handleOpenLabelModal(c)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="Cetak Label Alamat (100x150 mm)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCustomer(c);
                            setShowDetailModal(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="Lihat Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-slate-100 rounded"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal: Tambah Pelanggan */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Tambah Pelanggan Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs">{formError}</div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Pelanggan *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Contoh: Toko Barokah Sejahtera"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  placeholder="Contoh: 0812-3456-7890"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Jalan, nomor ruko/rumah, RT/RW, kelurahan, kecamatan..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kota / Kabupaten</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Provinsi</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Pos</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Syarat pembayaran, preferensi kirim, dll."
                />
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
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Pelanggan */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Edit Data Pelanggan: {selectedCustomer.name}</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Pelanggan *</label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kota</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Provinsi</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Pos</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
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

      {/* Modal: Cetak Label Alamat Pengiriman (Thermal 100x150 mm) */}
      {showLabelModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Cetak Label Alamat Pengiriman Pelanggan
                </h3>
              </div>
              <button onClick={() => setShowLabelModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Settings Controls */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="text-xs font-bold text-slate-900">Konfigurasi Ukuran &amp; Tata Letak Label</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Lebar (mm)</label>
                    <input
                      type="number"
                      value={labelSettings.widthMm}
                      onChange={(e) => setLabelSettings({ ...labelSettings, widthMm: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Tinggi (mm)</label>
                    <input
                      type="number"
                      value={labelSettings.heightMm}
                      onChange={(e) => setLabelSettings({ ...labelSettings, heightMm: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Margin (mm)</label>
                    <input
                      type="number"
                      value={labelSettings.marginMm}
                      onChange={(e) => setLabelSettings({ ...labelSettings, marginMm: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1 font-medium">Orientasi</label>
                    <select
                      value={labelSettings.orientation}
                      onChange={(e) => setLabelSettings({ ...labelSettings, orientation: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="incSender"
                    checked={labelSettings.includeSender}
                    onChange={(e) => setLabelSettings({ ...labelSettings, includeSender: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  <label htmlFor="incSender" className="text-xs text-slate-700">
                    Sertakan informasi toko sebagai pengirim
                  </label>
                </div>
              </div>

              {/* Live Preview Box */}
              <div>
                <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                  Pratinjau Label Fisik (Standar Thermal 100 × 150 mm)
                </div>
                <div className="flex justify-center p-4 bg-slate-100 rounded-xl border border-slate-200">
                  <div
                    style={{
                      width: '280px',
                      minHeight: '380px',
                    }}
                    className="bg-white border-2 border-black p-4 flex flex-col justify-between shadow-md text-black"
                  >
                    <div>
                      {labelSettings.includeSender && (
                        <div className="border-b border-black pb-2 mb-3">
                          <span className="text-[10px] font-bold border border-black px-1.5 py-0.5 uppercase">
                            Pengirim:
                          </span>
                          <div className="font-bold text-xs mt-1">{labelSettings.senderName}</div>
                          <div className="text-[11px] text-slate-700">Telp: {labelSettings.senderPhone}</div>
                          <div className="text-[10px] text-slate-600 line-clamp-2 mt-0.5">
                            {labelSettings.senderAddress}
                          </div>
                        </div>
                      )}

                      <div>
                        <span className="text-[10px] font-bold bg-black text-white px-1.5 py-0.5 uppercase">
                          Penerima:
                        </span>
                        <div className="font-bold text-sm text-black mt-1.5 uppercase">
                          {selectedCustomer.name}
                        </div>
                        <div className="font-bold text-xs mt-0.5">
                          Telp / WA: {selectedCustomer.phone || '-'}
                        </div>
                        <div className="text-xs mt-2 leading-relaxed text-slate-800">
                          {selectedCustomer.address || 'Alamat belum diisi'}
                        </div>
                        <div className="font-bold text-xs mt-1.5">
                          {selectedCustomer.city}, {selectedCustomer.province} {selectedCustomer.postalCode}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-black pt-2 mt-4 flex items-center justify-between text-[10px]">
                      <div>
                        <div>Ref: <strong>{selectedCustomer.id}</strong></div>
                        <div className="text-slate-600">Catatan: {selectedCustomer.notes || '-'}</div>
                      </div>
                      <div className="font-bold font-mono text-[11px]">
                        KETOKO EXPRESS
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLabelModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handlePrintLabel}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak ke Printer Thermal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
