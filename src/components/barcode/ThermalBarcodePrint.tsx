import React, { useState, useMemo } from 'react';
import {
  Barcode as BarcodeIcon,
  Printer,
  Settings,
  Plus,
  Trash2,
  AlertTriangle,
  RotateCw,
  Eye,
  Sliders,
} from 'lucide-react';
import { db } from '../../services/db';
import { Product } from '../../types';
import { formatRupiah, generateBarcodeSvgString, printHtmlDocument } from '../../utils/formatters';

interface ThermalBarcodePrintProps {
  initialProductId?: string;
}

export const ThermalBarcodePrint: React.FC<ThermalBarcodePrintProps> = ({ initialProductId }) => {
  const products = db.getProducts();

  // Print Queue: array of { product, copies }
  const [printQueue, setPrintQueue] = useState<{ productId: string; copies: number }[]>(() => {
    if (initialProductId) {
      return [{ productId: initialProductId, copies: 1 }];
    }
    const first = products[0]?.id;
    return first ? [{ productId: first, copies: 5 }] : [];
  });

  // Label Configuration
  const [labelConfig, setLabelConfig] = useState({
    widthMm: 33, // Default 33 mm
    heightMm: 15, // Default 15 mm
    layoutLines: '3' as '1' | '2' | '3', // 3 lines default
    fontSizePt: 6, // Optimized for 15mm height
    gapMm: 2,
    marginMm: 1,
    barcodeHeightMm: 6,
    orientation: 'portrait' as 'portrait' | 'landscape',
    showStoreName: false,
  });

  const handleAddProductToQueue = (productId: string) => {
    if (!productId) return;
    setPrintQueue((prev) => {
      const idx = prev.findIndex((i) => i.productId === productId);
      if (idx !== -1) {
        const next = [...prev];
        next[idx].copies += 1;
        return next;
      }
      return [...prev, { productId, copies: 1 }];
    });
  };

  const handleUpdateCopies = (productId: string, copies: number) => {
    if (copies <= 0) {
      setPrintQueue((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setPrintQueue((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, copies } : i))
    );
  };

  const handleRemoveFromQueue = (productId: string) => {
    setPrintQueue((prev) => prev.filter((i) => i.productId !== productId));
  };

  // Preset sizes
  const handlePresetSize = (w: number, h: number) => {
    setLabelConfig((prev) => ({
      ...prev,
      widthMm: w,
      heightMm: h,
      barcodeHeightMm: Math.max(4, Math.floor(h * 0.4)),
      fontSizePt: h <= 15 ? 6 : h <= 25 ? 7.5 : 9,
    }));
  };

  // Total labels to print
  const totalLabels = useMemo(
    () => printQueue.reduce((acc, i) => acc + i.copies, 0),
    [printQueue]
  );

  // First product for preview
  const previewProduct = useMemo(() => {
    if (printQueue.length === 0) return products[0];
    return products.find((p) => p.id === printQueue[0].productId) || products[0];
  }, [printQueue, products]);

  // Handle Trigger Thermal Print Dialog
  const handlePrintLabels = () => {
    if (printQueue.length === 0) {
      alert('Pilih minimal satu produk untuk dicetak.');
      return;
    }

    const { widthMm, heightMm, layoutLines, fontSizePt, marginMm, barcodeHeightMm } = labelConfig;

    // Generate label cards
    const labelsHtmlArray: string[] = [];

    printQueue.forEach((queueItem) => {
      const p = products.find((prod) => prod.id === queueItem.productId);
      if (!p) return;

      const barcodeCode = p.barcode || p.sku;
      const barcodeSvg = generateBarcodeSvgString(barcodeCode, {
        height: barcodeHeightMm * 4,
        showText: layoutLines !== '3', // If 3 lines, line 3 will render text explicitly
        fontSize: layoutLines === '3' ? 0 : 8,
      });

      for (let c = 0; c < queueItem.copies; c++) {
        let labelContent = '';

        if (layoutLines === '3') {
          // Line 1: Name (left), Price (right)
          // Line 2: Barcode (center)
          // Line 3: Barcode text (center bottom)
          labelContent = `
            <div class="line-1">
              <span class="p-name">${p.name}</span>
              <span class="p-price">${formatRupiah(p.sellingPrice)}</span>
            </div>
            <div class="line-2">
              ${barcodeSvg}
            </div>
            <div class="line-3 font-mono">
              ${barcodeCode}
            </div>
          `;
        } else if (layoutLines === '2') {
          // Line 1: Name & Price
          // Line 2: Barcode with integrated number
          labelContent = `
            <div class="line-1">
              <span class="p-name">${p.name}</span>
              <span class="p-price">${formatRupiah(p.sellingPrice)}</span>
            </div>
            <div class="line-2" style="flex: 1;">
              ${barcodeSvg}
            </div>
          `;
        } else {
          // Line 1: Barcode only
          labelContent = `
            <div class="line-2" style="height: 100%;">
              ${barcodeSvg}
            </div>
          `;
        }

        labelsHtmlArray.push(`
          <div class="label-page">
            <div class="label-inner">
              ${labelContent}
            </div>
          </div>
        `);
      }
    });

    const printHtml = `
      <style>
        @page {
          size: ${widthMm}mm ${heightMm}mm;
          margin: 0;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 0;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #000;
          background: #fff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .label-page {
          width: ${widthMm}mm;
          height: ${heightMm}mm;
          page-break-after: always;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .label-inner {
          width: ${widthMm - marginMm * 2}mm;
          height: ${heightMm - marginMm * 2}mm;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: center;
          overflow: hidden;
          line-height: 1;
        }
        .line-1 {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          font-size: ${fontSizePt}pt;
          font-weight: 700;
          margin-bottom: 0.5mm;
          overflow: hidden;
        }
        .p-name {
          text-align: left;
          max-width: 65%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .p-price {
          text-align: right;
          font-family: 'JetBrains Mono', monospace;
          white-space: nowrap;
        }
        .line-2 {
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          height: ${barcodeHeightMm}mm;
        }
        .line-2 svg {
          height: 100%;
          max-width: 100%;
        }
        .line-3 {
          font-size: ${Math.max(5, fontSizePt - 0.5)}pt;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin-top: 0.3mm;
          text-align: center;
        }
      </style>
      ${labelsHtmlArray.join('')}
    `;

    printHtmlDocument(printHtml, 'Cetak_Barcode_Thermal');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Cetak Barcode Label Thermal</h1>
          <p className="text-xs text-slate-500 mt-1">
            Standar thermal roll 33 × 15 mm, layout presisi 3 baris (Nama &amp; Harga, Barcode, Kode Angka), dan dialog cetak bebas margin.
          </p>
        </div>
        <button
          onClick={handlePrintLabels}
          disabled={printQueue.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all disabled:opacity-40 self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak {totalLabels} Label Thermal</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Selection & Queue (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Antrean Produk yang Dicetak</h3>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Total: {totalLabels} Label
            </span>
          </div>

          {/* Quick Product Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pilih Produk untuk Ditambahkan ke Antrean:
            </label>
            <select
              aria-label="Pilih Produk untuk Dicetak Label Barcode"
              onChange={(e) => {
                if (e.target.value) {
                  handleAddProductToQueue(e.target.value);
                  e.target.value = '';
                }
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">-- Tambah Produk Dari Master Data --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) - {formatRupiah(p.sellingPrice)}
                </option>
              ))}
            </select>
          </div>

          {/* Queue List */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1 divide-y divide-slate-100">
            {printQueue.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada produk dalam antrean cetak.
              </div>
            ) : (
              printQueue.map((item) => {
                const prod = products.find((p) => p.id === item.productId);
                if (!prod) return null;
                return (
                  <div key={item.productId} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                    <div className="flex-1 pr-2">
                      <div className="font-semibold text-slate-900 line-clamp-1">{prod.name}</div>
                      <div className="font-mono text-[10px] text-slate-500">
                        SKU: {prod.sku} · Barcode: {prod.barcode || '-'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-slate-200 rounded">
                        <button
                          type="button"
                          onClick={() => handleUpdateCopies(item.productId, item.copies - 1)}
                          className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.copies}
                          onChange={(e) =>
                            handleUpdateCopies(item.productId, parseInt(e.target.value, 10) || 1)
                          }
                          className="w-12 text-center font-mono py-0.5 border-x border-slate-200 text-xs font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateCopies(item.productId, item.copies + 1)}
                          className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromQueue(item.productId)}
                        className="p-1 text-slate-400 hover:text-red-600"
                        title="Hapus dari antrean"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Physical Configuration & Live 1:1 Scale Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Preset Buttons & Physical Dimensions */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Ukuran &amp; Tata Letak Label Thermal</h3>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePresetSize(33, 15)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
                    labelConfig.widthMm === 33 && labelConfig.heightMm === 15
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  33 × 15 mm (Default)
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSize(40, 20)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
                    labelConfig.widthMm === 40 && labelConfig.heightMm === 20
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  40 × 20 mm
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSize(50, 30)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
                    labelConfig.widthMm === 50 && labelConfig.heightMm === 30
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  50 × 30 mm
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Lebar (mm)</label>
                <input
                  type="number"
                  value={labelConfig.widthMm}
                  onChange={(e) =>
                    setLabelConfig({ ...labelConfig, widthMm: Number(e.target.value) || 33 })
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Tinggi (mm)</label>
                <input
                  type="number"
                  value={labelConfig.heightMm}
                  onChange={(e) =>
                    setLabelConfig({ ...labelConfig, heightMm: Number(e.target.value) || 15 })
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Layout Baris</label>
                <select
                  value={labelConfig.layoutLines}
                  onChange={(e) => setLabelConfig({ ...labelConfig, layoutLines: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg"
                >
                  <option value="3">3 Baris (Standar)</option>
                  <option value="2">2 Baris (Ringkas)</option>
                  <option value="1">1 Baris (Barcode Saja)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Ukuran Font (pt)</label>
                <input
                  type="number"
                  step="0.5"
                  value={labelConfig.fontSizePt}
                  onChange={(e) =>
                    setLabelConfig({ ...labelConfig, fontSizePt: Number(e.target.value) || 6 })
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono"
                />
              </div>
            </div>

            {/* Warning if 33x15mm is tight */}
            {labelConfig.widthMm <= 33 && labelConfig.heightMm <= 15 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Optimasi Thermal 33 × 15 mm:</strong> Font disesuaikan ke {labelConfig.fontSizePt}pt dan barcode setinggi {labelConfig.barcodeHeightMm}mm agar presisi dan tidak terpotong saat dicetak roll.
                </div>
              </div>
            )}
          </div>

          {/* Live Preview Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-500" />
                <h3 className="font-bold text-slate-900 text-sm">Pratinjau Fisik Label (Skala Nyata)</h3>
              </div>
              <span className="text-xs text-slate-400">
                Ukuran: {labelConfig.widthMm} × {labelConfig.heightMm} mm
              </span>
            </div>

            {previewProduct ? (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-100 rounded-xl border border-slate-200">
                {/* Simulated Physical Thermal Sticker */}
                <div
                  style={{
                    // Render in CSS mm with high DPI precision
                    width: `${labelConfig.widthMm * 3.78}px`, // ~96dpi representation for preview screen
                    height: `${labelConfig.heightMm * 3.78}px`,
                    padding: `${labelConfig.marginMm * 3.78}px`,
                  }}
                  className="bg-white border-2 border-slate-900 rounded-xs flex flex-col justify-between text-black shadow-lg overflow-hidden select-none"
                >
                  {labelConfig.layoutLines === '3' ? (
                    <>
                      {/* Baris 1: Nama Produk di Kiri Atas, Harga Jual di Kanan Atas */}
                      <div className="flex justify-between items-start leading-none gap-1">
                        <span
                          style={{ fontSize: `${labelConfig.fontSizePt * 1.3}px` }}
                          className="font-bold truncate text-left max-w-[65%]"
                        >
                          {previewProduct.name}
                        </span>
                        <span
                          style={{ fontSize: `${labelConfig.fontSizePt * 1.3}px` }}
                          className="font-mono font-bold whitespace-nowrap text-right"
                        >
                          {formatRupiah(previewProduct.sellingPrice)}
                        </span>
                      </div>

                      {/* Baris 2: Barcode di tengah label */}
                      <div
                        style={{ height: `${labelConfig.barcodeHeightMm * 3.78}px` }}
                        className="flex items-center justify-center overflow-hidden"
                        dangerouslySetInnerHTML={{
                          __html: generateBarcodeSvgString(previewProduct.barcode || previewProduct.sku, {
                            height: 28,
                            showText: false,
                          }),
                        }}
                      />

                      {/* Baris 3: Nomor kode barcode di tengah bagian bawah */}
                      <div
                        style={{ fontSize: `${Math.max(7, labelConfig.fontSizePt * 1.1)}px` }}
                        className="font-mono font-semibold text-center tracking-wider leading-none"
                      >
                        {previewProduct.barcode || previewProduct.sku}
                      </div>
                    </>
                  ) : labelConfig.layoutLines === '2' ? (
                    <>
                      <div className="flex justify-between items-start leading-none gap-1">
                        <span
                          style={{ fontSize: `${labelConfig.fontSizePt * 1.3}px` }}
                          className="font-bold truncate text-left max-w-[65%]"
                        >
                          {previewProduct.name}
                        </span>
                        <span
                          style={{ fontSize: `${labelConfig.fontSizePt * 1.3}px` }}
                          className="font-mono font-bold whitespace-nowrap text-right"
                        >
                          {formatRupiah(previewProduct.sellingPrice)}
                        </span>
                      </div>
                      <div
                        style={{ flex: 1 }}
                        className="flex items-center justify-center overflow-hidden"
                        dangerouslySetInnerHTML={{
                          __html: generateBarcodeSvgString(previewProduct.barcode || previewProduct.sku, {
                            height: 28,
                            showText: true,
                            fontSize: 8,
                          }),
                        }}
                      />
                    </>
                  ) : (
                    <div
                      style={{ height: '100%' }}
                      className="flex items-center justify-center overflow-hidden"
                      dangerouslySetInnerHTML={{
                        __html: generateBarcodeSvgString(previewProduct.barcode || previewProduct.sku, {
                          height: 32,
                          showText: true,
                          fontSize: 9,
                        }),
                      }}
                    />
                  )}
                </div>

                <div className="text-[11px] text-slate-500 mt-4 text-center">
                  Pratinjau fisik produk: <strong className="text-slate-900">{previewProduct.name}</strong>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
