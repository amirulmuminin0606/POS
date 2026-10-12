/**
 * Utility Formatters & Barcode Generators for Ketoko POS
 */

export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return '0';
  return new Intl.NumberFormat('id-ID').format(value);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes} WIB`;
  } catch {
    return dateString;
  }
}

/**
 * Robust Code 128 (Subset B) Barcode Patterns
 * Produces crisp, standard-compliant vector SVG barcode bars
 */
const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112' // 100-106
];

export function encodeCode128B(text: string): { widths: number[]; checksum: number } | null {
  if (!text || text.length === 0) return null;
  // Start B is pattern 104
  const startCode = 104;
  const values: number[] = [startCode];
  let sum = startCode;

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    if (charCode < 32 || charCode > 126) continue;
    const val = charCode - 32;
    values.push(val);
    sum += val * (i + 1);
  }

  const checksum = sum % 103;
  values.push(checksum);
  values.push(106); // Stop code

  const widths: number[] = [];
  for (const val of values) {
    const pattern = CODE128_PATTERNS[val];
    if (pattern) {
      for (let j = 0; j < pattern.length; j++) {
        widths.push(parseInt(pattern[j], 10));
      }
    }
  }

  return { widths, checksum };
}

/**
 * Generates an SVG string representation of a Code 128 barcode
 */
export function generateBarcodeSvgString(
  text: string,
  options: {
    height?: number;
    moduleWidth?: number;
    showText?: boolean;
    fontSize?: number;
  } = {}
): string {
  const height = options.height || 36;
  const moduleWidth = options.moduleWidth || 1.4;
  const showText = options.showText !== undefined ? options.showText : true;
  const fontSize = options.fontSize || 10;

  const encoded = encodeCode128B(text);
  if (!encoded) return '';

  let totalModules = 0;
  for (const w of encoded.widths) {
    totalModules += w;
  }

  // Quiet zones (10 modules on each side)
  const quietZoneModules = 10;
  const fullModules = totalModules + quietZoneModules * 2;
  const totalSvgWidth = fullModules * moduleWidth;
  const totalSvgHeight = height + (showText ? fontSize + 4 : 0);

  let curX = quietZoneModules * moduleWidth;
  let isBar = true;
  let rects = '';

  for (const w of encoded.widths) {
    const barWidth = w * moduleWidth;
    if (isBar) {
      rects += `<rect x="${curX.toFixed(2)}" y="0" width="${barWidth.toFixed(2)}" height="${height}" fill="#000000" />`;
    }
    curX += barWidth;
    isBar = !isBar;
  }

  let textElement = '';
  if (showText) {
    textElement = `<text x="${(totalSvgWidth / 2).toFixed(2)}" y="${(height + fontSize + 2).toFixed(2)}" font-family="'JetBrains Mono', monospace" font-size="${fontSize}" font-weight="600" text-anchor="middle" fill="#000000" letter-spacing="1.5">${text}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSvgWidth} ${totalSvgHeight}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
    ${rects}
    ${textElement}
  </svg>`;
}

/**
 * Export tabular data directly to CSV with UTF-8 BOM for Microsoft Excel compatibility
 */
export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCell = (val: string | number) => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  const csvRows: string[] = [];
  csvRows.push(headers.map(escapeCell).join(','));

  for (const row of rows) {
    csvRows.push(row.map(escapeCell).join(','));
  }

  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Utility to trigger browser print dialog with styled printable window
 */
export function printHtmlDocument(contentHtml: string, title: string = 'Cetak Dokumen') {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    // If popups blocked, print current iframe/page with fallback
    window.print();
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #0f172a;
          background: #ffffff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .mono { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
        @page { margin: 10mm; size: auto; }
        @media print {
          body { margin: 0; padding: 0; }
        }
      </style>
    </head>
    <body>
      ${contentHtml}
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            window.close();
          }, 250);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
