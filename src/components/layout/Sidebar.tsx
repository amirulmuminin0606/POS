import React, { useState } from 'react';
import {
  LayoutDashboard,
  Database,
  ShoppingCart,
  Boxes,
  FileBarChart,
  Sparkles,
  Barcode,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Package,
  Users,
  Briefcase,
  Layers,
  Receipt,
  RotateCcw,
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardCheck,
  FileSpreadsheet,
  TrendingUp,
  CreditCard,
} from 'lucide-react';
import { User } from '../../types';

interface SidebarProps {
  currentMenu: string;
  onSelectMenu: (menu: string) => void;
  activeUser: User;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMenu,
  onSelectMenu,
  activeUser,
}) => {
  // Collapsible submenus state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    master: true,
    sales: true,
    inventory: true,
    reports: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const isRole = (roles: string[]) => roles.includes(activeUser.role);

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 no-print select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800 bg-slate-950/40">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold text-lg">
          K
        </div>
        <div>
          <div className="font-bold text-white text-base tracking-tight leading-none">
            Ketoko POS
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Inventori &amp; Penjualan
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 text-xs">
        {/* Dashboard */}
        <button
          onClick={() => onSelectMenu('dashboard')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
            currentMenu === 'dashboard'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span>Dashboard</span>
        </button>

        {/* SECTION: MASTER DATA */}
        <div>
          <button
            onClick={() => toggleSection('master')}
            className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-slate-200 transition-colors uppercase font-semibold text-[10px] tracking-wider mt-3"
          >
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5" />
              <span>Master Data</span>
            </div>
            {openSections.master ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>

          {openSections.master && (
            <div className="mt-1 pl-2 space-y-0.5">
              <button
                onClick={() => onSelectMenu('master-products')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                  currentMenu === 'master-products'
                    ? 'bg-blue-600/90 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Daftar Item / Produk</span>
              </button>

              <button
                onClick={() => onSelectMenu('master-customers')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                  currentMenu === 'master-customers'
                    ? 'bg-blue-600/90 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Daftar Pelanggan</span>
              </button>

              <button
                onClick={() => onSelectMenu('master-sales')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                  currentMenu === 'master-sales'
                    ? 'bg-blue-600/90 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Daftar Sales</span>
              </button>

              <button
                onClick={() => onSelectMenu('master-stock-card')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                  currentMenu === 'master-stock-card'
                    ? 'bg-blue-600/90 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Kartu Stok</span>
              </button>
            </div>
          )}
        </div>

        {/* SECTION: PENJUALAN */}
        <div>
          <button
            onClick={() => toggleSection('sales')}
            className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-slate-200 transition-colors uppercase font-semibold text-[10px] tracking-wider mt-3"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Penjualan</span>
            </div>
            {openSections.sales ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>

          {openSections.sales && (
            <div className="mt-1 pl-2 space-y-0.5">
              <button
                onClick={() => onSelectMenu('sales-list')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                  currentMenu === 'sales-list'
                    ? 'bg-blue-600/90 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Daftar Penjualan</span>
              </button>

              <button
                onClick={() => onSelectMenu('sales-cashier')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                  currentMenu === 'sales-cashier'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-emerald-400 hover:bg-slate-800 hover:text-emerald-300'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Kasir (Point of Sale)</span>
              </button>

              <button
                onClick={() => onSelectMenu('sales-returns')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                  currentMenu === 'sales-returns'
                    ? 'bg-blue-600/90 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retur Penjualan</span>
              </button>
            </div>
          )}
        </div>

        {/* SECTION: PERSEDIAAN */}
        <div>
          <button
            onClick={() => toggleSection('inventory')}
            className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-slate-200 transition-colors uppercase font-semibold text-[10px] tracking-wider mt-3"
          >
            <div className="flex items-center gap-2">
              <Boxes className="w-3.5 h-3.5" />
              <span>Persediaan</span>
            </div>
            {openSections.inventory ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>

          {openSections.inventory && (
            <div className="mt-1 pl-2 space-y-0.5">
              <button
                onClick={() => onSelectMenu('inventory-in')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                  currentMenu === 'inventory-in'
                    ? 'bg-blue-600/90 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <ArrowDownToLine className="w-3.5 h-3.5 text-blue-400" />
                <span>Item Masuk</span>
              </button>

              <button
                onClick={() => onSelectMenu('inventory-out')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                  currentMenu === 'inventory-out'
                    ? 'bg-blue-600/90 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <ArrowUpFromLine className="w-3.5 h-3.5 text-amber-400" />
                <span>Item Keluar</span>
              </button>

              <button
                onClick={() => onSelectMenu('inventory-stocktake')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                  currentMenu === 'inventory-stocktake'
                    ? 'bg-blue-600/90 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Stok Opname</span>
              </button>
            </div>
          )}
        </div>

        {/* SECTION: LAPORAN */}
        <div>
          <button
            onClick={() => toggleSection('reports')}
            className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-slate-200 transition-colors uppercase font-semibold text-[10px] tracking-wider mt-3"
          >
            <div className="flex items-center gap-2">
              <FileBarChart className="w-3.5 h-3.5" />
              <span>Laporan</span>
            </div>
            {openSections.reports ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>

          {openSections.reports && (
            <div className="mt-1 pl-2 space-y-0.5">
              <button
                onClick={() => onSelectMenu('reports-items')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                  currentMenu === 'reports-items'
                    ? 'bg-blue-600/90 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Laporan Daftar Item</span>
              </button>

              <button
                onClick={() => onSelectMenu('reports-sales')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                  currentMenu === 'reports-sales'
                    ? 'bg-blue-600/90 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Laporan Penjualan</span>
              </button>
            </div>
          )}
        </div>

        {/* FITUR KHUSUS */}
        <div className="pt-3 border-t border-slate-800/80 space-y-1">
          <button
            onClick={() => onSelectMenu('smart-stock')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-medium transition-colors ${
              currentMenu === 'smart-stock'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-indigo-400 hover:bg-slate-800 hover:text-indigo-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Stok Pintar (Smart Stock)</span>
          </button>

          <button
            onClick={() => onSelectMenu('thermal-barcode')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-medium transition-colors ${
              currentMenu === 'thermal-barcode'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Barcode className="w-4 h-4 text-slate-400" />
            <span>Cetak Barcode Label</span>
          </button>

          <button
            onClick={() => onSelectMenu('audit-log')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-medium transition-colors ${
              currentMenu === 'audit-log'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-slate-500" />
            <span>Audit Log &amp; Keamanan</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <div>
          <span className="text-slate-300 font-medium">Status:</span> Aktif
        </div>
        <div className="font-mono text-[10px] text-slate-400">
          WIB (UTC+7)
        </div>
      </div>
    </aside>
  );
};
