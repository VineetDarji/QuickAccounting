
import { SavedCalculation } from '../types';

const BRAND = {
  name: 'Quick Accounting Service',
  tagline: 'Professional Accounting & Tax Solutions',
  supportEmail: 'support@quickaccounting.com',
};

const safeFileSegment = (value: string) =>
  value
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 60);

const makeFileBase = (calc: SavedCalculation) => {
  const label = safeFileSegment(calc.label || 'Report') || 'Report';
  const type = safeFileSegment(calc.type || 'CALC') || 'CALC';
  const id = String(calc.id || '').slice(0, 8).toUpperCase() || 'ID';
  const yyyy = new Date().getFullYear();
  return `Quick_Accounting_${type}_${label}_${id}_${yyyy}`;
};

const humanizeKey = (key: string) => {
  const s = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const isImportantKey = (key: string) => {
  const k = key.toLowerCase();
  return k.includes('total') || k.includes('net') || k.includes('final') || k.includes('payable') || k.includes('tax');
};

const pickHighlights = (results: any) => {
  const entries = Object.entries(results || {})
    .filter(([, v]) => typeof v === 'number' && Number.isFinite(v as number))
    .map(([k, v]) => ({ key: k, value: Number(v), important: isImportantKey(k) }));

  const sorted = entries.sort((a, b) => {
    if (a.important !== b.important) return a.important ? -1 : 1;
    return Math.abs(b.value) - Math.abs(a.value);
  });

  return sorted.slice(0, 3).map((e) => ({ label: humanizeKey(e.key), value: e.value, important: e.important }));
};

const formatNumberIN = (value: number) => value.toLocaleString('en-IN', { maximumFractionDigits: 2 });

export const exportToExcel = async (calc: SavedCalculation) => {
  const ExcelJSImport = await import('exceljs');
  const ExcelJS = (ExcelJSImport as any).default ?? (ExcelJSImport as any);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = BRAND.name;
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.title = `${calc.type.replace(/_/g, ' ')} - ${calc.label}`;
  const worksheet = workbook.addWorksheet('Report', {
    pageSetup: { paperSize: 9, orientation: 'portrait' }
  });

  // Set column widths
  worksheet.columns = [
    { width: 3 },
    { width: 28 },
    { width: 25 },
    { width: 25 },
    { width: 3 }
  ];

  let row = 1;

  // Color palette
  const colors = {
    primary: '6366F1',     // Indigo
    secondary: '818CF8',   // Light Indigo
    accent: 'FEF08A',      // Yellow
    highlightBg: 'EEF2FF', // Indigo-50
    lightBg: 'F8FAFC',     // Light gray
    darkBg: 'E2E8F0',      // Dark gray
    text: '1E293B',        // Dark text
    lightText: '64748B'    // Light text
  };

  // ========== LOGO & BRANDING ==========
  worksheet.mergeCells(`B${row}:D${row}`);
  const logoCell = worksheet.getCell(`B${row}`);
  logoCell.value = BRAND.name;
  logoCell.font = { bold: true, size: 16, color: { argb: colors.primary } };
  logoCell.alignment = { horizontal: 'left', vertical: 'center' };
  row++;

  worksheet.mergeCells(`B${row}:D${row}`);
  const taglineCell = worksheet.getCell(`B${row}`);
  taglineCell.value = BRAND.tagline;
  taglineCell.font = { size: 10, color: { argb: colors.lightText } };
  taglineCell.alignment = { horizontal: 'left', vertical: 'center' };
  row++;

  row++; // Empty row

  // ========== DOCUMENT INFORMATION ==========
  worksheet.mergeCells(`B${row}:D${row}`);
  const docHeaderCell = worksheet.getCell(`B${row}`);
  docHeaderCell.value = 'DOCUMENT INFORMATION';
  docHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.secondary } };
  docHeaderCell.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
  docHeaderCell.alignment = { horizontal: 'left', vertical: 'center' };
  docHeaderCell.border = { bottom: { style: 'thin', color: { argb: colors.primary } } };
  row++;

  const docInfo = [
    ['Report ID:', calc.id.slice(0, 12)],
    ['Generated Date:', new Date().toLocaleString('en-IN')],
    ['Calculation Type:', calc.type.replace(/_/g, ' ').toUpperCase()],
    ['Report Title:', calc.label],
    ['User Name:', calc.userName || 'User'],
    ['Data Source Date:', new Date(calc.timestamp).toLocaleString('en-IN')],
  ];

  docInfo.forEach((info, idx) => {
    const labelCell = worksheet.getCell(`B${row}`);
    const valueCell = worksheet.getCell(`C${row}`);
    
    labelCell.value = info[0];
    labelCell.font = { bold: true, size: 10, color: { argb: colors.text } };
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.lightBg } };
    labelCell.border = { right: { style: 'thin', color: { argb: colors.darkBg } }, bottom: { style: 'thin', color: { argb: colors.darkBg } } };
    labelCell.alignment = { horizontal: 'left', vertical: 'center' };

    valueCell.value = info[1];
    valueCell.font = { size: 10, color: { argb: colors.text } };
    valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.lightBg } };
    valueCell.border = { bottom: { style: 'thin', color: { argb: colors.darkBg } } };
    valueCell.alignment = { horizontal: 'left', vertical: 'center' };
    
    row++;
  });

  row++; // Empty row

  // ========== KEY HIGHLIGHTS ==========
  const highlights = pickHighlights(calc.results);
  if (highlights.length) {
    worksheet.mergeCells(`B${row}:D${row}`);
    const highlightsHeaderCell = worksheet.getCell(`B${row}`);
    highlightsHeaderCell.value = 'KEY HIGHLIGHTS';
    highlightsHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.secondary } };
    highlightsHeaderCell.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
    highlightsHeaderCell.alignment = { horizontal: 'left', vertical: 'center' };
    highlightsHeaderCell.border = { bottom: { style: 'thin', color: { argb: colors.primary } } };
    row++;

    const topRow = row;
    const bottomRow = row + 1;
    const cols = ['B', 'C', 'D'] as const;

    const formatHighlightValue = (label: string, value: number) => {
      const l = label.toLowerCase();
      if (l.includes('rate') || l.includes('percent') || l.includes('percentage') || l.includes('%')) {
        return `${formatNumberIN(value)}%`;
      }
      return `₹ ${formatNumberIN(value)}`;
    };

    highlights.slice(0, 3).forEach((h, idx) => {
      const col = cols[idx];
      const cardTop = worksheet.getCell(`${col}${topRow}`);
      const cardBottom = worksheet.getCell(`${col}${bottomRow}`);

      const bg = h.important ? colors.accent : colors.highlightBg;
      const titleColor = h.important ? '92400E' : colors.lightText;
      const valueColor = h.important ? '92400E' : colors.text;

      cardTop.value = h.label;
      cardTop.font = { size: 9, bold: true, color: { argb: titleColor } };
      cardTop.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cardTop.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
      cardTop.border = {
        top: { style: 'thin', color: { argb: colors.darkBg } },
        left: { style: 'thin', color: { argb: colors.darkBg } },
        right: { style: 'thin', color: { argb: colors.darkBg } },
      };

      cardBottom.value = formatHighlightValue(h.label, h.value);
      cardBottom.font = { size: 14, bold: true, color: { argb: valueColor } };
      cardBottom.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cardBottom.alignment = { horizontal: 'center', vertical: 'center' };
      cardBottom.border = {
        left: { style: 'thin', color: { argb: colors.darkBg } },
        right: { style: 'thin', color: { argb: colors.darkBg } },
        bottom: { style: 'thin', color: { argb: colors.darkBg } },
      };
    });

    row += 3;
  }

  // ========== TABLE OF CONTENTS ==========
  worksheet.mergeCells(`B${row}:D${row}`);
  const tocHeaderCell = worksheet.getCell(`B${row}`);
  tocHeaderCell.value = 'TABLE OF CONTENTS';
  tocHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.secondary } };
  tocHeaderCell.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
  tocHeaderCell.alignment = { horizontal: 'left', vertical: 'center' };
  tocHeaderCell.border = { bottom: { style: 'thin', color: { argb: colors.primary } } };
  row++;

  ['1. Document Information', '2. Input Parameters', '3. Calculation Results', '4. Summary & Analysis', '5. Disclaimer'].forEach((item) => {
    const cell = worksheet.getCell(`B${row}`);
    cell.value = item;
    cell.font = { size: 10, color: { argb: colors.text } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.lightBg } };
    cell.border = { bottom: { style: 'thin', color: { argb: colors.darkBg } } };
    cell.alignment = { horizontal: 'left', vertical: 'center' };
    row++;
  });

  row++; // Empty row

  // ========== INPUT PARAMETERS ==========
  worksheet.mergeCells(`B${row}:D${row}`);
  const inputHeaderCell = worksheet.getCell(`B${row}`);
  inputHeaderCell.value = 'INPUT PARAMETERS';
  inputHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.secondary } };
  inputHeaderCell.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
  inputHeaderCell.alignment = { horizontal: 'left', vertical: 'center' };
  inputHeaderCell.border = { bottom: { style: 'thin', color: { argb: colors.primary } } };
  row++;

  // Table header
  const headers = ['Parameter', 'Value', 'Details'];
  headers.forEach((header, colIdx) => {
    const cell = worksheet.getCell(row, colIdx + 2);
    cell.value = header;
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primary } };
    cell.border = { bottom: { style: 'thin', color: { argb: colors.primary } } };
    cell.alignment = { horizontal: 'center', vertical: 'center' };
  });
  row++;

  // Input data
  Object.entries(calc.inputs).forEach((entry, idx) => {
    const [key, value] = entry;
    const label = key.replace(/([A-Z])/g, ' $1').trim();
    const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);
    const bgColor = idx % 2 === 0 ? colors.lightBg : 'FFFFFF';

    const labelCell = worksheet.getCell(`B${row}`);
    const valueCell = worksheet.getCell(`C${row}`);
    const detailCell = worksheet.getCell(`D${row}`);

    labelCell.value = displayLabel;
    labelCell.font = { size: 10, color: { argb: colors.text } };
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    labelCell.border = { bottom: { style: 'thin', color: { argb: colors.darkBg } } };
    labelCell.alignment = { horizontal: 'left', vertical: 'center' };

    valueCell.value = value;
    valueCell.font = { size: 10, color: { argb: colors.text }, bold: true };
    valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    valueCell.border = { bottom: { style: 'thin', color: { argb: colors.darkBg } } };
    valueCell.alignment = { horizontal: 'center', vertical: 'center' };

    detailCell.value = 'Input Data';
    detailCell.font = { size: 9, color: { argb: colors.lightText }, italic: true };
    detailCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    detailCell.border = { bottom: { style: 'thin', color: { argb: colors.darkBg } } };
    detailCell.alignment = { horizontal: 'center', vertical: 'center' };

    row++;
  });

  row++; // Empty row

  // ========== CALCULATION RESULTS ==========
  worksheet.mergeCells(`B${row}:D${row}`);
  const resultsHeaderCell = worksheet.getCell(`B${row}`);
  resultsHeaderCell.value = 'CALCULATION RESULTS';
  resultsHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.secondary } };
  resultsHeaderCell.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
  resultsHeaderCell.alignment = { horizontal: 'left', vertical: 'center' };
  resultsHeaderCell.border = { bottom: { style: 'thin', color: { argb: colors.primary } } };
  row++;

  // Results table header
  ['Result Parameter', 'Value (₹)', 'Category'].forEach((header, colIdx) => {
    const cell = worksheet.getCell(row, colIdx + 2);
    cell.value = header;
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primary } };
    cell.border = { bottom: { style: 'thin', color: { argb: colors.primary } } };
    cell.alignment = { horizontal: 'center', vertical: 'center' };
  });
  row++;

  // Results data
  Object.entries(calc.results)
    .filter(([, v]) => typeof v === 'number' || typeof v === 'string')
    .forEach((entry, idx) => {
      const [key, value] = entry;
      const label = key.replace(/([A-Z])/g, ' $1').trim();
      const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);
      const displayValue = typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : String(value);
      const isImportant = key.toLowerCase().includes('total') || key.toLowerCase().includes('net') || key.toLowerCase().includes('final');

      const labelCell = worksheet.getCell(`B${row}`);
      const valueCell = worksheet.getCell(`C${row}`);
      const categoryCell = worksheet.getCell(`D${row}`);

      const bgColor = isImportant ? colors.accent : (idx % 2 === 0 ? colors.lightBg : 'FFFFFF');
      const textColor = isImportant ? '92400E' : colors.text;

      labelCell.value = displayLabel;
      labelCell.font = { size: 10, color: { argb: textColor }, bold: isImportant };
      labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      labelCell.border = { bottom: { style: 'thin', color: { argb: colors.darkBg } } };
      labelCell.alignment = { horizontal: 'left', vertical: 'center' };

      valueCell.value = typeof value === 'number' ? value : displayValue;
      valueCell.font = { size: 10, color: { argb: textColor }, bold: isImportant };
      valueCell.numFmt = typeof value === 'number' ? '#,##0.00' : 'General';
      valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      valueCell.border = { bottom: { style: 'thin', color: { argb: colors.darkBg } } };
      valueCell.alignment = { horizontal: 'right', vertical: 'center' };

      categoryCell.value = isImportant ? 'KEY VALUE' : 'Detail';
      categoryCell.font = { size: 9, color: { argb: textColor }, bold: isImportant };
      categoryCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      categoryCell.border = { bottom: { style: 'thin', color: { argb: colors.darkBg } } };
      categoryCell.alignment = { horizontal: 'center', vertical: 'center' };

      row++;
    });

  row++; // Empty row

  // ========== SUMMARY ==========
  worksheet.mergeCells(`B${row}:D${row}`);
  const summaryHeaderCell = worksheet.getCell(`B${row}`);
  summaryHeaderCell.value = 'SUMMARY & ANALYSIS';
  summaryHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.secondary } };
  summaryHeaderCell.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
  summaryHeaderCell.alignment = { horizontal: 'left', vertical: 'center' };
  summaryHeaderCell.border = { bottom: { style: 'thin', color: { argb: colors.primary } } };
  row++;

  const summaryData = [
    ['Total Input Parameters:', Object.keys(calc.inputs).length],
    ['Total Results Generated:', Object.entries(calc.results).filter(([, v]) => typeof v === 'number').length],
    ['Report Generated:', new Date().toLocaleString('en-IN')],
    ['Calculation Status:', 'Completed Successfully'],
  ];

  summaryData.forEach((item, idx) => {
    const bgColor = idx % 2 === 0 ? colors.lightBg : 'FFFFFF';
    const labelCell = worksheet.getCell(`B${row}`);
    const valueCell = worksheet.getCell(`C${row}`);

    labelCell.value = item[0];
    labelCell.font = { size: 10, color: { argb: colors.text }, bold: true };
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    labelCell.border = { bottom: { style: 'thin', color: { argb: colors.darkBg } } };
    labelCell.alignment = { horizontal: 'left', vertical: 'center' };

    valueCell.value = item[1];
    valueCell.font = { size: 10, color: { argb: colors.text } };
    valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    valueCell.border = { bottom: { style: 'thin', color: { argb: colors.darkBg } } };
    valueCell.alignment = { horizontal: 'center', vertical: 'center' };

    row++;
  });

  row += 2; // Empty rows

  // ========== DISCLAIMER ==========
  worksheet.mergeCells(`B${row}:D${row}`);
  const disclaimerHeaderCell = worksheet.getCell(`B${row}`);
  disclaimerHeaderCell.value = 'IMPORTANT DISCLAIMER & LEGAL NOTICE';
  disclaimerHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF3C7' } };
  disclaimerHeaderCell.font = { bold: true, size: 10, color: { argb: '92400E' } };
  disclaimerHeaderCell.border = { bottom: { style: 'thin', color: { argb: 'F59E0B' } } };
  disclaimerHeaderCell.alignment = { horizontal: 'left', vertical: 'center' };
  row++;

  const disclaimers = [
    'This report is a computer-generated estimation based on the information provided.',
    'It does not constitute legal or professional tax advice.',
    'Always consult with a qualified Chartered Accountant (CA) for final filings and compliance.',
    '',
    'Quick Accounting Service shall not be liable for any errors or omissions in this report.',
    'Users are responsible for verifying all information independently.',
  ];

  disclaimers.forEach((disclaimer) => {
    const cell = worksheet.getCell(`B${row}`);
    cell.value = disclaimer;
    cell.font = { size: 9, color: { argb: colors.lightText }, italic: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBF3' } };
    cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
    row++;
  });

  row++; // Empty row

  // ========== FOOTER ==========
  worksheet.mergeCells(`B${row}:D${row}`);
  const footerCell = worksheet.getCell(`B${row}`);
  footerCell.value = `${BRAND.name} | Support: ${BRAND.supportEmail}`;
  footerCell.font = { size: 9, color: { argb: colors.lightText }, italic: true };
  footerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.lightBg } };
  footerCell.alignment = { horizontal: 'center', vertical: 'center' };
  row++;

  worksheet.mergeCells(`B${row}:D${row}`);
  const copyrightCell = worksheet.getCell(`B${row}`);
  copyrightCell.value = `© ${new Date().getFullYear()} Quick Accounting Service. All Rights Reserved.`;
  copyrightCell.font = { size: 8, color: { argb: colors.lightText } };
  copyrightCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.lightBg } };
  copyrightCell.alignment = { horizontal: 'center', vertical: 'center' };

  // Save file - browser compatible
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${makeFileBase(calc)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToPDF = async (calc: SavedCalculation) => {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setProperties({
    title: `${calc.label} - ${calc.type}`,
    subject: 'Calculation Report',
    author: BRAND.name,
    creator: BRAND.name,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const marginX = 15;
  const contentWidth = pageWidth - marginX * 2;
  const contentBottomY = pageHeight - 26;
  const pageTopY = 22;

  const reportId = String(calc.id || '').slice(0, 8).toUpperCase() || 'REPORT';
  const generatedAt = new Date();

  // Colors
  const colors = {
    primary: [99, 102, 241] as const,
    secondary: [129, 140, 248] as const,
    accent: [254, 243, 154] as const,
    highlightBg: [238, 242, 255] as const,
    darkText: [30, 41, 59] as const,
    lightText: [100, 116, 139] as const,
    border: [226, 232, 240] as const,
    white: [255, 255, 255] as const,
    noticeFill: [254, 243, 199] as const,
    noticeText: [146, 64, 14] as const,
  };

  let yPos = 10;

  const drawCoverHeader = () => {
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(...colors.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(BRAND.name, marginX, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(200, 210, 240);
    doc.text(BRAND.tagline, marginX, 23);

    doc.setFontSize(8);
    doc.setTextColor(...colors.white);
    doc.text(`Report ID: ${reportId}`, pageWidth - marginX, 15, { align: 'right' });
    doc.text(`Generated: ${generatedAt.toLocaleDateString('en-IN')}`, pageWidth - marginX, 22, { align: 'right' });
  };

  const drawPageHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...colors.primary);
    doc.text(BRAND.name, marginX, 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...colors.lightText);
    doc.text(calc.label || 'Report', marginX, 14);

    doc.setFontSize(8);
    doc.text(`Report ID: ${reportId}`, pageWidth - marginX, 10, { align: 'right' });

    doc.setDrawColor(...colors.border);
    doc.line(marginX, 16, pageWidth - marginX, 16);
  };

  const addPage = () => {
    doc.addPage();
    drawPageHeader();
    yPos = pageTopY;
  };

  const ensureSpace = (neededHeight: number, onNewPage?: () => void) => {
    if (yPos + neededHeight <= contentBottomY) return;
    addPage();
    onNewPage?.();
  };

  const drawSectionHeader = (title: string) => {
    ensureSpace(12);
    doc.setFillColor(...colors.secondary);
    doc.rect(marginX, yPos - 2, contentWidth, 7, 'F');
    doc.setTextColor(...colors.white);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(title, marginX + 3, yPos + 2);
    yPos += 10;
  };

  const drawTableHeader = (left: string, right: string, labelX: number, valueRightX: number) => {
    doc.setFillColor(...colors.primary);
    doc.setTextColor(...colors.white);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.rect(marginX, yPos - 2, contentWidth, 5, 'F');
    doc.text(left, labelX, yPos + 1);
    doc.text(right, valueRightX, yPos + 1, { align: 'right' });
    yPos += 6;
  };

  const drawKeyValueRow = (opts: {
    labelLines: string[];
    valueLines: string[];
    labelX: number;
    valueRightX: number;
    rowIndex: number;
    important?: boolean;
    onNewPage?: () => void;
  }) => {
    const lineH = 4;
    const paddingY = 1.2;
    const rowLines = Math.max(opts.labelLines.length, opts.valueLines.length);
    const rowH = rowLines * lineH + paddingY * 2;

    ensureSpace(rowH + 2, opts.onNewPage);

    if (opts.important) {
      doc.setFillColor(...colors.accent);
      doc.rect(marginX, yPos - 2, contentWidth, rowH + 1, 'F');
      doc.setTextColor(...colors.noticeText);
      doc.setFont('helvetica', 'bold');
    } else {
      if (opts.rowIndex % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, yPos - 2, contentWidth, rowH + 1, 'F');
      }
      doc.setTextColor(...colors.darkText);
      doc.setFont('helvetica', 'normal');
    }

    doc.setFontSize(8);
    opts.labelLines.forEach((line, i) => doc.text(line, opts.labelX, yPos + paddingY + i * lineH));
    opts.valueLines.forEach((line, i) => doc.text(line, opts.valueRightX, yPos + paddingY + i * lineH, { align: 'right' }));

    yPos += rowH;
  };

  const split = (text: string, width: number) => (doc.splitTextToSize(text, width) as string[]) || [text];

  const formatValue = (value: unknown) => {
    if (typeof value === 'number' && Number.isFinite(value)) return formatNumberIN(value);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value === null || value === undefined) return '-';
    return String(value);
  };

  const formatResultValue = (key: string, value: unknown) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      const k = key.toLowerCase();
      if (k.includes('rate') || k.includes('percent') || k.includes('percentage')) return `${formatNumberIN(value)}%`;
      return `Rs ${formatNumberIN(value)}`;
    }
    return formatValue(value);
  };

  // ========== COVER HEADER ==========
  drawCoverHeader();
  yPos = 50;

  // ========== DOCUMENT INFORMATION ==========
  drawSectionHeader('DOCUMENT INFORMATION');

  const infoPairs: Array<[string, string]> = [
    ['Report Title', calc.label],
    ['Calculation Type', calc.type.replace(/_/g, ' ').toUpperCase()],
    ['User Name', calc.userName || 'User'],
    ['Report Date', new Date(calc.timestamp).toLocaleString('en-IN')],
    ['Total Inputs', String(Object.keys(calc.inputs || {}).length)],
    ['Total Results', String(Object.keys(calc.results || {}).length)],
  ];

  const infoLabelX = marginX + 3;
  const infoValueX = marginX + 58;
  const infoLabelW = infoValueX - infoLabelX - 4;
  const infoValueW = pageWidth - marginX - infoValueX;

  doc.setFontSize(8);
  infoPairs.forEach(([k, v], idx) => {
    const labelLines = split(`${k}:`, infoLabelW);
    const valueLines = split(v || '-', infoValueW);
    const lineH = 4;
    const rowLines = Math.max(labelLines.length, valueLines.length);
    const rowH = rowLines * lineH + 2;

    ensureSpace(rowH + 2);

    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, yPos - 2, contentWidth, rowH + 1, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    labelLines.forEach((line, i) => doc.text(line, infoLabelX, yPos + 1.2 + i * lineH));

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.darkText);
    valueLines.forEach((line, i) => doc.text(line, infoValueX, yPos + 1.2 + i * lineH));

    yPos += rowH;
  });

  yPos += 6;

  // ========== KEY HIGHLIGHTS ==========
  const highlights = pickHighlights(calc.results);
  if (highlights.length) {
    drawSectionHeader('KEY HIGHLIGHTS');

    const cardGap = 3;
    const cardW = (contentWidth - cardGap * 2) / 3;
    const cardH = 18;

    ensureSpace(cardH + 6);

    const drawCard = (x: number, y: number, w: number, h: number, style: 'F' | 'S' | 'FD') => {
      const anyDoc = doc as any;
      if (typeof anyDoc.roundedRect === 'function') return anyDoc.roundedRect(x, y, w, h, 3, 3, style);
      return doc.rect(x, y, w, h, style);
    };

    const formatHighlight = (label: string, value: number) => {
      const l = label.toLowerCase();
      if (l.includes('rate') || l.includes('percent') || l.includes('percentage') || l.includes('%')) return `${formatNumberIN(value)}%`;
      return `Rs ${formatNumberIN(value)}`;
    };

    highlights.slice(0, 3).forEach((h, idx) => {
      const x = marginX + idx * (cardW + cardGap);
      const y = yPos;
      const bg = h.important ? colors.accent : colors.highlightBg;
      const text = h.important ? colors.noticeText : colors.darkText;

      doc.setFillColor(...bg);
      drawCard(x, y, cardW, cardH, 'F');
      doc.setDrawColor(...colors.border);
      drawCard(x, y, cardW, cardH, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...text);
      const titleLines = split(h.label, cardW - 6).slice(0, 2);
      titleLines.forEach((line, i) => doc.text(line, x + 3, y + 5 + i * 3.5));

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(formatHighlight(h.label, h.value), x + 3, y + 15);
    });

    yPos += cardH + 8;
  }

  // ========== INPUT PARAMETERS ==========
  drawSectionHeader('INPUT PARAMETERS');

  const tableGap = 6;
  const valueColW = contentWidth * 0.38;
  const labelColW = contentWidth - valueColW - tableGap;
  const labelX = marginX + 3;
  const valueRightX = marginX + contentWidth - 3;

  drawTableHeader('Parameter', 'Value', labelX, valueRightX);

  Object.entries(calc.inputs || {}).forEach(([key, value], idx) => {
    const labelLines = split(humanizeKey(key), labelColW - 2);
    const valueLines = split(formatValue(value), valueColW - 2);

    drawKeyValueRow({
      labelLines,
      valueLines,
      labelX,
      valueRightX,
      rowIndex: idx,
      onNewPage: () => {
        drawSectionHeader('INPUT PARAMETERS (CONT.)');
        drawTableHeader('Parameter', 'Value', labelX, valueRightX);
      },
    });
  });

  yPos += 8;

  // ========== CALCULATION RESULTS ==========
  if (yPos > contentBottomY - 30) addPage();
  drawSectionHeader('CALCULATION RESULTS');
  drawTableHeader('Result', 'Value', labelX, valueRightX);

  Object.entries(calc.results || {})
    .filter(([, v]) => typeof v === 'number' || typeof v === 'string')
    .forEach(([key, value], idx) => {
      const important = isImportantKey(key);
      const labelLines = split(humanizeKey(key), labelColW - 2);
      const valueLines = split(formatResultValue(key, value), valueColW - 2);

      drawKeyValueRow({
        labelLines,
        valueLines,
        labelX,
        valueRightX,
        rowIndex: idx,
        important,
        onNewPage: () => {
          drawSectionHeader('CALCULATION RESULTS (CONT.)');
          drawTableHeader('Result', 'Value', labelX, valueRightX);
        },
      });
    });

  yPos += 10;

  // ========== DISCLAIMER ==========
  ensureSpace(40);
  doc.setFillColor(...colors.noticeFill);
  doc.rect(marginX, yPos - 2, contentWidth, 7, 'F');
  doc.setTextColor(...colors.noticeText);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('IMPORTANT DISCLAIMER', marginX + 3, yPos + 2);
  yPos += 10;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.lightText);

  const disclaimerLines = [
    'This report is a computer-generated estimation based on the information provided.',
    'It does not constitute legal or professional tax advice.',
    'Always consult with a qualified Chartered Accountant (CA) for final filings and compliance.',
    'Quick Accounting Service shall not be liable for any errors or omissions in this report.',
    'Users are responsible for verifying all information independently.',
  ];

  disclaimerLines.forEach((line) => {
    const wrapped = split(`• ${line}`, contentWidth - 6);
    ensureSpace(wrapped.length * 3.5 + 2, () => {
      doc.setFillColor(...colors.noticeFill);
      doc.rect(marginX, yPos - 2, contentWidth, 7, 'F');
      doc.setTextColor(...colors.noticeText);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('IMPORTANT DISCLAIMER (CONT.)', marginX + 3, yPos + 2);
      yPos += 10;

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.lightText);
    });

    wrapped.forEach((w) => {
      doc.text(w, marginX + 3, yPos);
      yPos += 3.5;
    });
    yPos += 1;
  });

  // ========== FOOTER ON ALL PAGES ==========
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    doc.setDrawColor(...colors.border);
    doc.line(marginX, pageHeight - 18, pageWidth - marginX, pageHeight - 18);

    doc.setFontSize(7);
    doc.setTextColor(...colors.lightText);
    doc.setFont('helvetica', 'normal');
    doc.text(`${BRAND.name} • ${BRAND.supportEmail}`, pageWidth / 2, pageHeight - 12, { align: 'center' });
    doc.text(`Report ID: ${reportId}`, marginX, pageHeight - 6);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, pageHeight - 6, { align: 'right' });
  }

  doc.save(`${makeFileBase(calc)}.pdf`);
};
