import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Shield,
  UserCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { db } from '../../services/db';
import { exportToCsv, formatDateTime } from '../../utils/formatters';

export const AuditLogView: React.FC = () => {
  const auditLogs = db.getAuditLogs();
  const users = db.getUsers();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedModule, setSelectedModule] = useState('ALL');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const q = searchQuery.toLowerCase().trim();
      if (
        q &&
        !log.details.toLowerCase().includes(q) &&
        !log.userName.toLowerCase().includes(q) &&
        !log.module.toLowerCase().includes(q)
      ) {
        return false;
      }

      if (selectedRole !== 'ALL' && log.userRole !== selectedRole) return false;
      if (selectedModule !== 'ALL' && log.module !== selectedModule) return false;

      return true;
    });
  }, [auditLogs, searchQuery, selectedRole, selectedModule]);

  const handleExportCsv = () => {
    const headers = ['Waktu', 'Pengguna', 'Peran', 'Aksi', 'Modul', 'Rincian Aktivitas'];
    const rows = filteredLogs.map((l) => [
      formatDateTime(l.timestamp),
      l.userName,
      l.userRole,
      l.action,
      l.module,
      l.details,
    ]);
    exportToCsv(`audit_log_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audit Log &amp; Keamanan Sistem</h1>
          <p className="text-xs text-slate-500 mt-1">
            Jejak audit seluruh perubahan data penting, mutasi persediaan, transaksi kasir, dan penyesuaian otorisasi.
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-slate-600" />
          <span>Ekspor Log Audit (.CSV)</span>
        </button>
      </div>

      {/* Access Control & Permissions Matrix Panel */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-sm">Matriks Hak Akses &amp; Otorisasi Peran</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>Administrator</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono">ALL ACCESS</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Akses penuh ke seluruh menu, master produk, pelanggan, pengaturan toko, reset database, dan laporan finansial.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>Kasir (Cashier)</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">POS &amp; SALES</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Membuat transaksi penjualan, menerima pembayaran kasir, kalkulator kembalian, cetak struk thermal &amp; faktur.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>Petugas Gudang</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono">LOGISTICS</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Mencatat penerimaan barang masuk (Stock In), pengeluaran item keluar (Stock Out), dan input perhitungan fisik opname.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>Supervisor</span>
              <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-mono">APPROVAL</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Otorisasi persetujuan retur penjualan, finalisasi penyesuaian stok opname, dan validasi selisih inventori.
            </p>
          </div>
        </div>
      </div>

      {/* Audit Log Table & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari rincian audit log atau pengguna..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Filter Peran Pengguna Audit Log"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="ALL">Semua Peran</option>
              <option value="admin">Administrator</option>
              <option value="kasir">Kasir</option>
              <option value="gudang">Petugas Gudang</option>
              <option value="supervisor">Supervisor</option>
            </select>

            <select
              aria-label="Filter Modul Audit Log"
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="ALL">Semua Modul</option>
              <option value="Produk">Master Produk</option>
              <option value="Penjualan">Penjualan</option>
              <option value="Kasir">Kasir</option>
              <option value="Item Masuk">Item Masuk</option>
              <option value="Item Keluar">Item Keluar</option>
              <option value="Stok Opname">Stok Opname</option>
              <option value="Retur Penjualan">Retur Penjualan</option>
              <option value="Pengaturan">Pengaturan</option>
              <option value="Database">Database</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Waktu Kejadian</th>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Peran</th>
                <th className="py-3 px-4 text-center">Aksi</th>
                <th className="py-3 px-4">Modul</th>
                <th className="py-3 px-4">Rincian Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ada catatan audit log yang cocok.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {formatDateTime(l.timestamp)}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{l.userName}</td>
                    <td className="py-2.5 px-4 capitalize text-slate-600">{l.userRole}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          l.action === 'CREATE'
                            ? 'bg-blue-100 text-blue-800'
                            : l.action === 'PAYMENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : l.action === 'DELETE'
                            ? 'bg-red-100 text-red-800'
                            : l.action === 'RETURN'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {l.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">{l.module}</td>
                    <td className="py-2.5 px-4 text-slate-600 leading-relaxed">{l.details}</td>
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
