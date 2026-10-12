# Ketoko POS & Manajemen Inventori

Aplikasi web Point of Sale (POS) dan manajemen inventori modern, terstruktur, responsif, dan terintegrasi penuh untuk ritel dan grosir Indonesia dengan referensi alur kerja operasional teruji.

---

## 1. Fitur Utama

### A. Dashboard Terintegrasi
- Ringkasan indikator kinerja utama (KPI): Total penjualan hari ini, total transaksi, produk aktif, total unit stok, stok menipis, stok habis, dan total piutang berjalan.
- Grafik penjualan harian (7 hari), bulanan (6 bulan), dan tahunan.
- Daftar produk terlaris (fast moving), riwayat mutasi stok terbaru, dan peringatan stok kritis otomatis.

### B. Master Data
1. **Daftar Item / Produk**:
   - Operasi CRUD lengkap dengan validasi integritas relasi transaksi.
   - Fitur duplikasi produk (menghasilkan ID baru, reset stok ke 0, tanpa menduplikasi riwayat mutasi).
   - Validasi keunikan SKU dan Barcode.
   - Lokasi rak penyimpanan dan penetapan batas minimum stok.
   - Impor dan ekspor CSV format Excel.
2. **Daftar Pelanggan**:
   - Manajemen pelanggan retail dan grosir.
   - Cetak label alamat pengiriman thermal ukuran standar 100 × 150 mm (atau ukuran kustom) lengkap dengan preview.
3. **Daftar Sales**:
   - Manajemen tenaga penjualan (sales rep).
   - Laporan kinerja dan rekapitulasi omzet per sales.
4. **Kartu Stok**:
   - Pelacak riwayat mutasi stok kronologis (Saldo awal, Item masuk, Item keluar, Penjualan, Retur, Penyesuaian opname, Pembatalan).
   - Filter periode bulan, tahun, jenis transaksi, dan arah pergerakan.

### C. Penjualan & Kasir
1. **Daftar Penjualan**:
   - Pembuatan transaksi baru dengan input Barcode Scanner USB HID otomatis.
   - Cetak invoice nota penjualan profesional.
   - Pembatalan transaksi belum lunas dengan pemulihan stok otomatis.
2. **Kasir (Point of Sale)**:
   - Pelunasan pembayaran penuh, uang muka (DP), dan cicilan piutang.
   - Multi metode pembayaran: Tunai (dengan kalkulator kembalian otomatis & tombol cepat), Transfer BCA, Transfer Mandiri, QRIS, dan Kartu Debit/Kredit.
   - Cetak struk kasir thermal (format roll 58mm / 80mm).
   - Pencegahan pengurangan stok ganda saat transaksi dilunasi bertahap.
3. **Retur Penjualan**:
   - Retur barang berbasis invoice asli dengan validasi kuantitas.
   - Kondisi barang "Layak Jual" otomatis mengembalikan stok fisik ke inventori.
   - Pilihan tindakan pengembalian dana tunai, kredit piutang, atau penggantian barang.

### D. Persediaan
1. **Item Masuk (Stock In)**:
   - Pencatatan barang masuk dari supplier / faktur pembelian.
   - Otomatis menambah stok fisik dan mencatat kartu stok.
2. **Item Keluar (Stock Out)**:
   - Pencatatan barang keluar untuk barang rusak/expired, pemakaian internal, atau susut.
   - Proteksi pencegahan stok negatif secara sistem.
3. **Stok Opname**:
   - Pembuatan sesi perhitungan fisik dengan snapshot stok sistem.
   - Kalkulasi selisih fisik vs sistem secara real-time.
   - Simpan draft dan finalisasi otorisasi bertingkat (Supervisor / Admin).

### E. Laporan
1. **Laporan Daftar Item & Valuasi Persediaan**:
   - Rekap nilai aset persediaan berdasarkan harga beli (modal) dan potensi harga jual.
   - Ekspor Excel (.CSV) dan format cetak PDF.
2. **Laporan Rekapitulasi Penjualan**:
   - Analisis omzet bersih, diskon, retur, kas diterima, piutang tertunggak, dan performa sales.

### F. Fitur Stok Pintar (Smart Stock)
- Formula perhitungan Reorder Point (ROP): `(Kecepatan Penjualan Harian × Lead Time) + Safety Stock`.
- Rekomendasi Reorder Quantity (ROQ) untuk mencegah kekosongan barang.
- Deteksi barang macet / mati (Dead Stock).

### G. Modul Cetak Barcode Label Thermal
- Ukuran standar printer roll thermal: **33 mm × 15 mm** (dapat disesuaikan).
- Layout 3 baris presisi:
  - Baris 1: Nama Produk & Harga Jual.
  - Baris 2: Barcode vektor tajam di tengah.
  - Baris 3: Kode angka barcode di bawah.
- Pratinjau skala nyata 1:1 dan dialog cetak tanpa margin pergeseran.

### H. Keamanan & Audit Log
- Sistem hak akses multi peran: Administrator, Kasir, Petugas Gudang, Supervisor.
- Audit log mencatat setiap perubahan data, waktu, pengguna, dan aktivitas.
- Fitur Cadangkan (Backup) dan Pulihkan (Restore) database format JSON serta tombol reset ke data demo.

---

## 2. Struktur Database Relasional

Data disimpan dengan persistensi browser (LocalStorage & IndexedDB) dengan pola transaksi terisolasi:
- `users`: Data pengguna dan peran otorisasi.
- `categories`: Kategori produk.
- `units`: Satuan barang (Pcs, Box, Dus, Kg, dll).
- `products`: Master data item, SKU unik, barcode, harga, dan rak.
- `customers`: Data kontak dan alamat pengiriman.
- `salespeople`: Data tenaga penjualan.
- `sales` & `sale_items`: Transaksi penjualan.
- `payments`: Riwayat pembayaran dan nomor bukti unik.
- `returns` & `return_items`: Dokumen pengembalian penjualan.
- `stock_movements`: Buku besar mutasi kartu stok.
- `stock_receipts`: Dokumen penerimaan barang masuk.
- `stock_issues`: Dokumen pengeluaran barang keluar.
- `stocktakes`: Sesi perhitungan stok opname.
- `audit_logs`: Rekaman log kepatuhan dan audit keamanan.
- `app_settings`: Konfigurasi toko, PPN, dan printer thermal.

---

## 3. Instalasi dan Cara Menjalankan

### Kebutuhan Sistem
- Node.js versi 18 atau lebih tinggi
- NPM

### Langkah Menjalankan Proyek
```bash
# 1. Pasang dependensi
npm install

# 2. Jalankan server pengembangan
npm run dev

# 3. Akses aplikasi melalui browser
# Buka http://localhost:3000
```

### Build untuk Produksi
```bash
npm run build
npm run preview
```
