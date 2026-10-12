import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Copy,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  X,
  Layers,
  ArrowUpDown,
  Barcode as BarcodeIcon,
} from 'lucide-react';
import { db } from '../../services/db';
import { Category, Product, Unit } from '../../types';
import { exportToCsv, formatNumber, formatRupiah, generateBarcodeSvgString } from '../../utils/formatters';

interface ProductListProps {
  onRefreshData: () => void;
  onNavigateToStockCard: (productId: string) => void;
  onNavigateToThermalBarcode: (productId: string) => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  onRefreshData,
  onNavigateToStockCard,
  onNavigateToThermalBarcode,
}) => {
  const products = db.getProducts();
  const categories = db.getCategories();
  const units = db.getUnits();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStockStatus, setSelectedStockStatus] = useState('ALL'); // ALL, LOW, OUT, ACTIVE, INACTIVE
  const [selectedRack, setSelectedRack] = useState('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'sku' | 'category' | 'stock' | 'sellingPrice'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    sku: '',
    barcode: '',
    name: '',
    categoryId: categories[0]?.id || '',
    unit: units[0]?.name || 'Pcs',
    costPrice: 0,
    sellingPrice: 0,
    stock: 0,
    minStock: 5,
    rackLocation: 'RAK-A1',
    isActive: true,
    description: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Unique rack locations for filtering
  const rackLocations = useMemo(() => {
    const racks = new Set<string>();
    products.forEach((p) => {
      if (p.rackLocation) racks.add(p.rackLocation);
    });
    return Array.from(racks).sort();
  }, [products]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search query: name, sku, barcode, rack
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q) ||
          p.rackLocation.toLowerCase().includes(q);

        // Category filter
        const matchesCategory = selectedCategory === 'ALL' || p.categoryId === selectedCategory;

        // Stock status filter
        let matchesStock = true;
        if (selectedStockStatus === 'LOW') {
          matchesStock = p.stock > 0 && p.stock <= p.minStock;
        } else if (selectedStockStatus === 'OUT') {
          matchesStock = p.stock === 0;
        } else if (selectedStockStatus === 'ACTIVE') {
          matchesStock = p.isActive;
        } else if (selectedStockStatus === 'INACTIVE') {
          matchesStock = !p.isActive;
        }

        // Rack location filter
        const matchesRack = selectedRack === 'ALL' || p.rackLocation === selectedRack;

        return matchesSearch && matchesCategory && matchesStock && matchesRack;
      })
      .sort((a, b) => {
        let compare = 0;
        if (sortBy === 'name') compare = a.name.localeCompare(b.name);
        else if (sortBy === 'sku') compare = a.sku.localeCompare(b.sku);
        else if (sortBy === 'category') compare = a.categoryName.localeCompare(b.categoryName);
        else if (sortBy === 'stock') compare = a.stock - b.stock;
        else if (sortBy === 'sellingPrice') compare = a.sellingPrice - b.sellingPrice;
        return sortOrder === 'asc' ? compare : -compare;
      });
  }, [products, searchQuery, selectedCategory, selectedStockStatus, selectedRack, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenAdd = () => {
    setFormData({
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      barcode: `899${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      name: '',
      categoryId: categories[0]?.id || '',
      unit: units[0]?.name || 'Pcs',
      costPrice: 0,
      sellingPrice: 0,
      stock: 0,
      minStock: 5,
      rackLocation: 'RAK-A1',
      isActive: true,
      description: '',
    });
    setFormError(null);
    setFormSuccess(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setSelectedProduct(p);
    setFormData({
      sku: p.sku,
      barcode: p.barcode,
      name: p.name,
      categoryId: p.categoryId,
      unit: p.unit,
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      stock: p.stock,
      minStock: p.minStock,
      rackLocation: p.rackLocation,
      isActive: p.isActive,
      description: p.description || '',
    });
    setFormError(null);
    setFormSuccess(null);
    setShowEditModal(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const category = categories.find((c) => c.id === formData.categoryId);
    const res = db.createProduct({
      ...formData,
      categoryName: category?.name || 'Umum',
    });

    if (res.success) {
      setFormSuccess('Produk berhasil ditambahkan.');
      setTimeout(() => {
        setShowAddModal(false);
        onRefreshData();
      }, 700);
    } else {
      setFormError(res.error || 'Gagal menyimpan produk.');
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setFormError(null);

    const category = categories.find((c) => c.id === formData.categoryId);
    const res = db.updateProduct(selectedProduct.id, {
      ...formData,
      categoryName: category?.name || 'Umum',
    });

    if (res.success) {
      setFormSuccess('Data produk berhasil diperbarui.');
      setTimeout(() => {
        setShowEditModal(false);
        onRefreshData();
      }, 700);
    } else {
      setFormError(res.error || 'Gagal memperbarui produk.');
    }
  };

  const handleDuplicate = (p: Product) => {
    if (confirm(`Duplikat produk "${p.name}"? Produk baru akan dibuat dengan stok awal 0.`)) {
      const res = db.duplicateProduct(p.id);
      if (res.success) {
        onRefreshData();
        alert('Produk berhasil diduplikasi.');
      } else {
        alert(res.error || 'Gagal menduplikasi produk.');
      }
    }
  };

  const handleDelete = (p: Product) => {
    if (confirm(`Yakin ingin menghapus produk "${p.name}"? Sistem akan memeriksa relasi transaksi.`)) {
      const res = db.deleteProduct(p.id);
      if (res.success) {
        onRefreshData();
        alert('Produk berhasil dihapus.');
      } else {
        alert(res.error);
      }
    }
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'SKU', 'Barcode', 'Nama Produk', 'Kategori', 'Satuan', 'Harga Beli', 'Harga Jual', 'Stok', 'Stok Min', 'Lokasi Rak', 'Status'];
    const rows = filteredProducts.map((p) => [
      p.id,
      p.sku,
      p.barcode,
      p.name,
      p.categoryName,
      p.unit,
      p.costPrice,
      p.sellingPrice,
      p.stock,
      p.minStock,
      p.rackLocation,
      p.isActive ? 'Aktif' : 'Nonaktif',
    ]);
    exportToCsv(`daftar_produk_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        alert('File CSV kosong atau hanya berisi header.');
        return;
      }

      let successCount = 0;
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
        if (cols.length >= 8) {
          const sku = cols[1] || `SKU-${Date.now()}-${i}`;
          const barcode = cols[2] || '';
          const name = cols[3] || 'Produk Impor';
          const catName = cols[4] || 'Umum';
          const unit = cols[5] || 'Pcs';
          const costPrice = parseFloat(cols[6]) || 0;
          const sellingPrice = parseFloat(cols[7]) || 0;
          const stock = parseInt(cols[8], 10) || 0;

          let cat = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
          if (!cat) {
            cat = db.addCategory(catName);
          }

          const res = db.createProduct({
            sku,
            barcode,
            name,
            categoryId: cat.id,
            categoryName: cat.name,
            unit,
            costPrice,
            sellingPrice,
            stock,
            minStock: 5,
            rackLocation: cols[10] || 'RAK-A1',
            isActive: true,
            description: 'Diimpor dari file CSV',
          });
          if (res.success) successCount++;
        }
      }

      onRefreshData();
      alert(`Berhasil mengimpor ${successCount} produk baru.`);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Daftar Item / Produk</h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola master data produk, SKU, barcode, harga jual, lokasi rak, dan level minimum stok.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* CSV Import / Export */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Ekspor CSV untuk Excel"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Ekspor CSV</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Impor CSV</span>
            <input type="file" accept=".csv" onChange={handleImportCsv} className="hidden" />
          </label>

          {/* Add Product Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama produk, SKU, barcode, atau rak..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              aria-label="Filter Kategori"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div>
            <select
              aria-label="Filter Status Stok"
              value={selectedStockStatus}
              onChange={(e) => {
                setSelectedStockStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">Semua Status Stok</option>
              <option value="LOW">Stok Menipis (&le; Min)</option>
              <option value="OUT">Stok Habis (0)</option>
              <option value="ACTIVE">Produk Aktif</option>
              <option value="INACTIVE">Produk Nonaktif / Arsip</option>
            </select>
          </div>

          {/* Rack Location Filter */}
          <div>
            <select
              aria-label="Filter Lokasi Rak"
              value={selectedRack}
              onChange={(e) => {
                setSelectedRack(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">Semua Lokasi Rak</option>
              {rackLocations.map((r) => (
                <option key={r} value={r}>
                  Lokasi: {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort & Counter bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Menampilkan <strong className="text-slate-900 font-mono">{filteredProducts.length}</strong> produk ditemukan
          </div>

          <div className="flex items-center gap-2">
            <span>Urutkan:</span>
            <select
              aria-label="Urutkan Berdasarkan"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-medium text-slate-800 border-none focus:outline-none cursor-pointer"
            >
              <option value="name">Nama Produk</option>
              <option value="sku">SKU / Kode Barang</option>
              <option value="category">Kategori</option>
              <option value="stock">Jumlah Stok</option>
              <option value="sellingPrice">Harga Jual</option>
            </select>
            <button
              onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
              className="p-1 hover:bg-slate-100 rounded text-slate-700 flex items-center gap-1 font-semibold"
              title="Balik Arah Pengurutan"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{sortOrder === 'asc' ? 'A-Z' : 'Z-A'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">SKU / Barcode</th>
                <th className="py-3 px-4">Nama Produk</th>
                <th className="py-3 px-4">Kategori &amp; Satuan</th>
                <th className="py-3 px-4 text-right">Harga Beli</th>
                <th className="py-3 px-4 text-right">Harga Jual</th>
                <th className="py-3 px-4 text-center">Stok Fisik</th>
                <th className="py-3 px-4">Lokasi Rak</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Tidak ada produk yang memenuhi kriteria pencarian atau filter.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const isLow = p.stock > 0 && p.stock <= p.minStock;
                  const isOut = p.stock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-medium text-slate-900">{p.sku}</div>
                        <div className="font-mono text-[11px] text-slate-500">{p.barcode || '-'}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        {p.description && (
                          <div className="text-[11px] text-slate-500 line-clamp-1">{p.description}</div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{p.categoryName}</div>
                        <div className="text-[11px] text-slate-500">Satuan: {p.unit}</div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                        {formatRupiah(p.costPrice)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {formatRupiah(p.sellingPrice)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div
                          className={`font-mono font-bold ${
                            isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-900'
                          }`}
                        >
                          {p.stock} {p.unit}
                        </div>
                        <div className="text-[10px] text-slate-400">Min: {p.minStock}</div>
                      </td>

                      <td className="py-3 px-4 font-mono font-medium text-slate-800">
                        {p.rackLocation || '-'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                            p.isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {p.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Detail */}
                          <button
                            onClick={() => {
                              setSelectedProduct(p);
                              setShowDetailModal(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                            title="Lihat Detail Produk"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Print Barcode Label */}
                          <button
                            onClick={() => onNavigateToThermalBarcode(p.id)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded"
                            title="Cetak Barcode Label Thermal 33x15mm"
                          >
                            <BarcodeIcon className="w-3.5 h-3.5" />
                          </button>

                          {/* Stock Card */}
                          <button
                            onClick={() => onNavigateToStockCard(p.id)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded"
                            title="Buka Kartu Stok Mutasi"
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </button>

                          {/* Duplicate */}
                          <button
                            onClick={() => handleDuplicate(p)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                            title="Duplikat Produk (ID Baru & Stok 0)"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded"
                            title="Edit Data Dasar Produk"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete with relation check */}
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-slate-100 rounded"
                            title="Hapus Produk (Relasi Terproteksi)"
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

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Halaman <strong className="font-mono">{currentPage}</strong> dari{' '}
            <strong className="font-mono">{totalPages}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Tambah Produk */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-bold text-slate-900 text-sm">Tambah Master Produk Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SKU / Kode Barang *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                    placeholder="Contoh: SKU-BERAS-01"
                  />
                  <span className="text-[10px] text-slate-400">Harus unik</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Barcode (EAN-13 / Code128)</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                    placeholder="Contoh: 8999999195047"
                  />
                  <span className="text-[10px] text-slate-400">Untuk scanner barcode</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Produk *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Contoh: Beras Pandan Wangi Premium 5 Kg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Produk *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Satuan *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Beli (Modal) (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Jual (Rp) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Dicatat sebagai saldo awal</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stok Minimum</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Peringatan restock</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Lokasi Rak</label>
                  <input
                    type="text"
                    value={formData.rackLocation}
                    onChange={(e) => setFormData({ ...formData, rackLocation: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                    placeholder="Contoh: RAK-B2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Produk</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Catatan atau spesifikasi produk..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveAdd"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300"
                />
                <label htmlFor="isActiveAdd" className="text-xs text-slate-700">
                  Status produk aktif (bisa dijual di POS)
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
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Produk */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-bold text-slate-900 text-sm">Edit Data Produk: {selectedProduct.name}</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                <strong>Aturan Bisnis:</strong> Stok fisik saat ini (<strong className="font-mono">{selectedProduct.stock} {selectedProduct.unit}</strong>) tidak dapat diubah di formulir ini untuk menjaga integritas data. Gunakan menu <strong>Item Masuk</strong>, <strong>Item Keluar</strong>, atau <strong>Stok Opname</strong> untuk melakukan pergerakan stok.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SKU / Kode Barang *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Produk *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Satuan *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Beli (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Jual (Rp) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stok Minimum</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Lokasi Rak</label>
                  <input
                    type="text"
                    value={formData.rackLocation}
                    onChange={(e) => setFormData({ ...formData, rackLocation: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveEdit"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300"
                />
                <label htmlFor="isActiveEdit" className="text-xs text-slate-700">
                  Status produk aktif
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

      {/* Modal: Detail Produk */}
      {showDetailModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Informasi Detail Produk</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center pb-4 border-b border-slate-100">
                <h4 className="text-base font-bold text-slate-900">{selectedProduct.name}</h4>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  SKU: {selectedProduct.sku} · ID: {selectedProduct.id}
                </div>

                {/* Barcode Render */}
                {selectedProduct.barcode && (
                  <div className="mt-3 flex flex-col items-center justify-center">
                    <div
                      className="w-48 h-16 flex items-center justify-center bg-white p-1 rounded"
                      dangerouslySetInnerHTML={{
                        __html: generateBarcodeSvgString(selectedProduct.barcode, { height: 36, fontSize: 10 }),
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="text-slate-500">Harga Beli:</div>
                  <div className="font-semibold text-slate-900 font-mono mt-0.5">
                    {formatRupiah(selectedProduct.costPrice)}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="text-slate-500">Harga Jual:</div>
                  <div className="font-semibold text-blue-600 font-mono mt-0.5">
                    {formatRupiah(selectedProduct.sellingPrice)}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="text-slate-500">Stok Saat Ini:</div>
                  <div className="font-bold text-slate-900 font-mono mt-0.5">
                    {selectedProduct.stock} {selectedProduct.unit}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="text-slate-500">Stok Minimum:</div>
                  <div className="font-semibold text-slate-700 font-mono mt-0.5">
                    {selectedProduct.minStock} {selectedProduct.unit}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="text-slate-500">Lokasi Rak:</div>
                  <div className="font-semibold text-slate-900 font-mono mt-0.5">
                    {selectedProduct.rackLocation || '-'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="text-slate-500">Kategori:</div>
                  <div className="font-semibold text-slate-900 mt-0.5">
                    {selectedProduct.categoryName}
                  </div>
                </div>
              </div>

              {selectedProduct.description && (
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
                  <div className="font-semibold text-slate-700 mb-1">Keterangan:</div>
                  {selectedProduct.description}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    onNavigateToStockCard(selectedProduct.id);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Lihat Kartu Stok</span>
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
