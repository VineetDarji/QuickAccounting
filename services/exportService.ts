
import { jsPDF } from 'jspdf';
import ExcelJS from 'exceljs';
import { SavedCalculation } from '../types';

export const exportToExcel = async (calc: SavedCalculation) => {
  const workbook = new ExcelJS.Workbook();
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
    lightBg: 'F8FAFC',     // Light gray
    darkBg: 'E2E8F0',      // Dark gray
    text: '1E293B',        // Dark text
    lightText: '64748B'    // Light text
  };

  // ========== LOGO & BRANDING ==========
  worksheet.mergeCells(`B${row}:D${row}`);
  const logoCell = worksheet.getCell(`B${row}`);
  logoCell.value = '🚀 QUICK ACCOUNTING SERVICE';
  logoCell.font = { bold: true, size: 16, color: { argb: colors.primary } };
  logoCell.alignment = { horizontal: 'left', vertical: 'center' };
  row++;

  worksheet.mergeCells(`B${row}:D${row}`);
  const taglineCell = worksheet.getCell(`B${row}`);
  taglineCell.value = 'Professional Accounting & Tax Solutions';
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
  disclaimerHeaderCell.value = '⚠️  IMPORTANT DISCLAIMER & LEGAL NOTICE';
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
  footerCell.value = 'Quick Accounting Service | ICAI Registered | support@quickaccounting.com';
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
  link.download = `Quick_Accounting_${calc.label.replace(/\s+/g, '_')}_${new Date().getFullYear()}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToPDF = (calc: SavedCalculation) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Colors
  const colors = {
    primary: [99, 102, 241],
    secondary: [129, 140, 248],
    accent: [254, 243, 154],
    darkText: [30, 41, 59],
    lightText: [100, 116, 139],
    border: [226, 232, 240],
    white: [255, 255, 255]
  };

  let yPos = 10;

  // ========== HEADER SECTION ==========
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(...colors.white);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Quick Accounting Service', 15, 15);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 210, 240);
  doc.text('Professional Accounting & Tax Solutions', 15, 23);
  
  doc.setFontSize(8);
  doc.text(`Report ID: ${calc.id.slice(0, 8).toUpperCase()}`, pageWidth - 60, 15);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 60, 22);

  yPos = 50;

  // ========== DOCUMENT INFO SECTION ==========
  doc.setFillColor(...colors.secondary);
  doc.rect(15, yPos - 2, pageWidth - 30, 7, 'F');
  doc.setTextColor(...colors.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DOCUMENT INFORMATION', 18, yPos + 2);
  yPos += 10;

  // Info rows
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.darkText);
  
  const infoRows = [
    ['Report Title:', calc.label],
    ['Calculation Type:', calc.type.replace(/_/g, ' ').toUpperCase()],
    ['User Name:', calc.userName || 'User'],
    ['Report Date:', new Date(calc.timestamp).toLocaleDateString()],
  ];

  infoRows.forEach((row, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, yPos - 2, pageWidth - 30, 5, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text(row[0], 18, yPos + 1);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.darkText);
    const label = String(row[1]).length > 40 ? String(row[1]).substring(0, 40) + '...' : String(row[1]);
    doc.text(label, 65, yPos + 1);
    yPos += 6;
  });

  yPos += 5;

  // ========== INPUT PARAMETERS ==========
  doc.setFillColor(...colors.secondary);
  doc.rect(15, yPos - 2, pageWidth - 30, 7, 'F');
  doc.setTextColor(...colors.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('INPUT PARAMETERS', 18, yPos + 2);
  yPos += 8;

  // Table header
  doc.setFillColor(...colors.primary);
  doc.setTextColor(...colors.white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.rect(15, yPos - 2, pageWidth - 30, 5, 'F');
  doc.text('Parameter', 18, yPos + 1);
  doc.text('Value', pageWidth - 50, yPos + 1);
  yPos += 6;

  // Table data
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  let inputCount = 0;
  Object.entries(calc.inputs).forEach((entry, idx) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 15;
      inputCount = 0;
    }

    const [key, value] = entry;
    const label = key.replace(/([A-Z])/g, ' $1').trim();
    const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);

    if (inputCount % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, yPos - 2, pageWidth - 30, 5, 'F');
    }

    doc.setTextColor(...colors.darkText);
    const displayValue = String(value).length > 30 ? String(value).substring(0, 30) : String(value);
    doc.text(displayLabel, 18, yPos + 1);
    doc.text(displayValue, pageWidth - 50, yPos + 1);
    yPos += 5;
    inputCount++;
  });

  yPos += 5;

  if (yPos > 260) {
    doc.addPage();
    yPos = 15;
  }

  // ========== CALCULATION RESULTS ==========
  doc.setFillColor(...colors.secondary);
  doc.rect(15, yPos - 2, pageWidth - 30, 7, 'F');
  doc.setTextColor(...colors.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CALCULATION RESULTS', 18, yPos + 2);
  yPos += 8;

  // Results table header
  doc.setFillColor(...colors.primary);
  doc.setTextColor(...colors.white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.rect(15, yPos - 2, pageWidth - 30, 5, 'F');
  doc.text('Result', 18, yPos + 1);
  doc.text('Amount (Rs)', pageWidth - 50, yPos + 1);
  yPos += 6;

  // Results data
  doc.setFont('helvetica', 'normal');
  let resultCount = 0;
  Object.entries(calc.results)
    .filter(([, v]) => typeof v === 'number' || typeof v === 'string')
    .forEach((entry) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 15;
        resultCount = 0;
      }

      const [key, value] = entry;
      const label = key.replace(/([A-Z])/g, ' $1').trim();
      const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);
      const displayValue = typeof value === 'number'
        ? `Rs ${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
        : String(value);

      const isImportant = key.toLowerCase().includes('total') || key.toLowerCase().includes('net') || key.toLowerCase().includes('final');

      if (isImportant) {
        doc.setFillColor(254, 243, 154);
        doc.rect(15, yPos - 2, pageWidth - 30, 5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(146, 64, 14);
      } else {
        if (resultCount % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(15, yPos - 2, pageWidth - 30, 5, 'F');
        }
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.darkText);
      }

      doc.text(displayLabel, 18, yPos + 1);
      doc.text(displayValue, pageWidth - 50, yPos + 1);
      yPos += 5;
      resultCount++;
    });

  yPos += 8;

  if (yPos > 250) {
    doc.addPage();
    yPos = 15;
  }

  // ========== DISCLAIMER ==========
  doc.setFillColor(254, 243, 199);
  doc.rect(15, yPos - 2, pageWidth - 30, 7, 'F');
  doc.setTextColor(146, 64, 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('IMPORTANT DISCLAIMER', 18, yPos + 2);
  yPos += 8;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.lightText);

  const disclaimers = [
    'This report is computer-generated estimation based on provided information.',
    'It does NOT constitute legal or professional tax advice.',
    'Consult with a Chartered Accountant (CA) for final tax filings.',
    'Quick Accounting Service is not liable for any errors or omissions.',
    'Users are responsible for verifying all information independently.'
  ];

  disclaimers.forEach((line) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 15;
    }
    doc.text(line, 18, yPos);
    yPos += 4;
  });

  // ========== FOOTER ON ALL PAGES ==========
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    doc.setDrawColor(...colors.border);
    doc.line(15, pageHeight - 18, pageWidth - 15, pageHeight - 18);
    
    doc.setFontSize(7);
    doc.setTextColor(...colors.lightText);
    doc.setFont('helvetica', 'normal');
    doc.text('Quick Accounting Service', pageWidth / 2, pageHeight - 12, { align: 'center' });
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 20, pageHeight - 6, { align: 'right' });
  }

  doc.save(`Quick_Accounting_${calc.label.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`);
};
