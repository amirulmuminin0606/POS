import React, { useState } from 'react';
import {
  Bell,
  Search,
  Settings,
  Shield,
  Download,
  Upload,
  RotateCcw,
  Store,
  X,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { db } from '../../services/db';
import { AppSettings, Product, User } from '../../types';
import { formatRupiah } from '../../utils/formatters';

interface HeaderProps {
  activeUser: User;
  onUserChange: (user: User) => void;
  onNavigate: (menu: string) => void;
  onRefreshData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeUser,
  onUserChange,
  onNavigate,
  onRefreshData,
}) => {
  const users = db.getUsers();
  const settings = db.getSettings();
  const products = db.getProducts();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState<AppSettings>(settings);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Critical stock alert items
  const lowStockItems = products.filter(
    (p) => p.isActive && (p.stock === 0 || p.stock <= p.minStock)
  );

  // Filtered search products
  const searchResults = searchQuery.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.barcode.includes(searchQuery) ||
            p.rackLocation.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 6)
    : [];

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateSettings(settingsForm);
    setShowSettingsModal(false);
    onRefreshData();
  };

  const handleExportBackup = () => {
    const json = db.exportDatabaseJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_ketoko_pos_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = db.importDatabaseJson(content);
      if (res.success) {
        setImportStatus('Data berhasil dipulihkan!');
        setTimeout(() => {
          setImportStatus(null);
          setShowBackupModal(false);
          onRefreshData();
        }, 1200);
      } else {
        setImportStatus(`Gagal: ${res.error}`);
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = () => {
    if (confirm('Apakah Anda yakin ingin menyetel ulang semua data kembali ke kondisi demo awal? Semua perubahan baru akan diganti.')) {
      db.resetToDemoData();
      setShowBackupModal(false);
      onRefreshData();
      alert('Data demo berhasil disetel ulang.');
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between gap-4 no-print">
        {/* Left: Global Search */}
        <div className="relative flex-1 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari produk, SKU, barcode, atau rak... (Alt + S)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {showSearchResults && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Hasil Pencarian Item ({searchResults.length})
              </div>
              {searchResults.length === 0 ? (
                <div className="px-3 py-3 text-sm text-slate-500 text-center">
                  Tidak ada produk yang cocok dengan "{searchQuery}"
                </div>
              ) : (
                searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setShowSearchResults(false);
                      setSearchQuery('');
                      onNavigate('master-products');
                    }}
                    className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-50 border-b border-slate-100 last:border-none"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-900">{p.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span className="font-mono">{p.sku}</span>
                        <span>·</span>
                        <span>Rak: {p.rackLocation}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-900 font-mono">
                        {formatRupiah(p.sellingPrice)}
                      </div>
                      <div className={`text-xs ${p.stock <= p.minStock ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                        Stok: {p.stock} {p.unit}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Notification Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Notifikasi & Peringatan Stok"
            >
              <Bell className="w-5 h-5" />
              {lowStockItems.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {lowStockItems.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">Peringatan Inventori</span>
                  <span className="text-xs text-slate-500">{lowStockItems.length} Produk Perlu Perhatian</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {lowStockItems.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      Semua stok aman dan di atas batas minimum.
                    </div>
                  ) : (
                    lowStockItems.map((item) => (
                      <div key={item.id} className="p-3 hover:bg-slate-50 flex items-start gap-3">
                        <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${item.stock === 0 ? 'text-red-600' : 'text-amber-500'}`} />
                        <div className="flex-1">
                          <div className="text-xs font-semibold text-slate-900">{item.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Sisa stok: <strong className="font-mono text-red-600">{item.stock} {item.unit}</strong> (Min: {item.minStock})
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigate('smart-stock');
                    }}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    Buka Halaman Stok Pintar →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Backup / Restore Button */}
          <button
            onClick={() => setShowBackupModal(true)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors hidden sm:flex items-center gap-1.5 text-xs font-medium"
            title="Cadangkan atau Pulihkan Database"
          >
            <Download className="w-4 h-4" />
            <span>Database</span>
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Pengaturan Toko & POS"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* User Role Switcher Dropdown */}
          <div className="flex items-center pl-2 border-l border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-semibold text-xs border border-blue-200">
                {activeUser.name.charAt(0)}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-slate-900 leading-tight flex items-center gap-1">
                  {activeUser.name}
                  {activeUser.role === 'admin' && <Shield className="w-3 h-3 text-blue-600" />}
                </div>
                <div className="text-[11px] text-slate-500 capitalize">{activeUser.role}</div>
              </div>

              {/* Fast Role Switch for testing access control */}
              <select
                aria-label="Pilih Peran Pengguna Aktif"
                value={activeUser.id}
                onChange={(e) => {
                  const targetUser = users.find((u) => u.id === e.target.value);
                  if (targetUser) {
                    onUserChange(targetUser);
                  }
                }}
                className="text-xs bg-slate-50 border border-slate-200 rounded-md py-1 px-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
                title="Ganti Peran Pengguna untuk Pengujian Hak Akses"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name.split(' ')[0]} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900">Pengaturan Toko &amp; POS</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Toko</label>
                <input
                  type="text"
                  required
                  value={settingsForm.storeName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Toko</label>
                <input
                  type="text"
                  required
                  value={settingsForm.storeAddress}
                  onChange={(e) => setSettingsForm({ ...settingsForm, storeAddress: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
                <input
                  type="text"
                  value={settingsForm.storePhone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, storePhone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tarif PPN (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settingsForm.ppnRate}
                    onChange={(e) => setSettingsForm({ ...settingsForm, ppnRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Time Pengadaan (Hari)</label>
                  <input
                    type="number"
                    min="1"
                    value={settingsForm.leadTimeDays}
                    onChange={(e) => setSettingsForm({ ...settingsForm, leadTimeDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Kaki Struk Kasir</label>
                <textarea
                  rows={2}
                  value={settingsForm.receiptFooter}
                  onChange={(e) => setSettingsForm({ ...settingsForm, receiptFooter: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="allowNegativeStock"
                  checked={settingsForm.allowNegativeStock}
                  onChange={(e) => setSettingsForm({ ...settingsForm, allowNegativeStock: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300"
                />
                <label htmlFor="allowNegativeStock" className="text-xs text-slate-700">
                  Izinkan penjualan saat stok minus (tidak direkomendasikan)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Simpan Pengaturan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Database Backup & Restore Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Manajemen Database &amp; Cadangan</h3>
              <button
                onClick={() => setShowBackupModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xs font-semibold text-slate-900 mb-1">Cadangkan Database (Backup)</div>
                <p className="text-xs text-slate-500 mb-3">
                  Unduh seluruh data produk, transaksi penjualan, mutasi stok, pelanggan, dan audit log dalam satu file JSON.
                </p>
                <button
                  onClick={handleExportBackup}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shadow-2xs"
                >
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>Unduh File Cadangan (.JSON)</span>
                </button>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="text-xs font-semibold text-slate-900 mb-1">Pulihkan Database (Restore)</div>
                <p className="text-xs text-slate-500 mb-3">
                  Unggah file cadangan JSON untuk memulihkan seluruh data sebelumnya.
                </p>
                <label className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs">
                  <Upload className="w-4 h-4 text-green-600" />
                  <span>Pilih &amp; Pulihkan File JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
                {importStatus && (
                  <div className="text-xs font-medium text-center text-blue-600 mt-2">
                    {importStatus}
                  </div>
                )}
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-xs font-semibold text-red-900 mb-1">Setel Ulang Data Demo</div>
                <p className="text-xs text-red-700 mb-3">
                  Kembalikan data seperti semula dengan 12 produk demo, mutasi saldo awal, dan transaksi percontohan.
                </p>
                <button
                  onClick={handleResetDemo}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-red-600" />
                  <span>Reset ke Data Demo Awal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
