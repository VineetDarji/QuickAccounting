
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { SavedCalculation } from '../types';

export const exportToExcel = (calc: SavedCalculation) => {
  const data = [
    ["TaxAmbit - Professional Calculation Report"],
    ["User:", calc.userEmail],
    ["Label:", calc.label],
    ["Date:", new Date(calc.timestamp).toLocaleString()],
    ["Type:", calc.type],
    [],
    ["INPUT PARAMETERS"],
    ...Object.entries(calc.inputs).map(([k, v]) => [k.toUpperCase(), v]),
    [],
    ["CALCULATION RESULTS"],
    ...Object.entries(calc.results).map(([k, v]) => [k.toUpperCase(), typeof v === 'number' ? v.toFixed(2) : v]),
    [],
    ["Disclaimer: This is an AI-assisted estimation. Please consult a professional CA for final filings."]
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Calculation");
  XLSX.writeFile(wb, `${calc.label.replace(/\s+/g, '_')}_TaxAmbit.xlsx`);
};

export const exportToPDF = (calc: SavedCalculation) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(79, 70, 229); // Indigo 600
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("TaxAmbit", 15, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Professional Accounting & Tax Solutions", 15, 28);
  doc.text(`Report ID: ${calc.id}`, 140, 28);

  // Body
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(16);
  doc.text(`Calculation Report: ${calc.label}`, 15, 55);
  
  doc.setFontSize(10);
  doc.text(`User: ${calc.userEmail}`, 15, 65);
  doc.text(`Generated on: ${new Date(calc.timestamp).toLocaleString()}`, 15, 70);
  doc.text(`Type: ${calc.type.replace('_', ' ')}`, 15, 75);

  // Inputs Table
  doc.setDrawColor(226, 232, 240);
  doc.line(15, 85, 195, 85);
  doc.setFont("helvetica", "bold");
  doc.text("INPUT DATA", 15, 95);
  doc.setFont("helvetica", "normal");
  
  let y = 105;
  Object.entries(calc.inputs).forEach(([k, v]) => {
    doc.text(`${k.charAt(0).toUpperCase() + k.slice(1)}:`, 15, y);
    doc.text(String(v), 100, y);
    y += 7;
  });

  // Results
  y += 10;
  doc.line(15, y, 195, y);
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.text("CALCULATION SUMMARY", 15, y);
  doc.setFont("helvetica", "normal");
  y += 10;
  
  Object.entries(calc.results).forEach(([k, v]) => {
    if (typeof v === 'number') {
        doc.text(`${k.replace(/([A-Z])/g, ' $1').toUpperCase()}:`, 15, y);
        doc.text(`INR ${v.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, 100, y);
        y += 7;
    }
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("This document is a computer-generated estimation and does not constitute legal tax advice.", 15, 280);
  doc.text("TaxAmbit Solutions Pvt Ltd | ICAI Registered Member | www.taxambit.com", 15, 285);

  doc.save(`${calc.label.replace(/\s+/g, '_')}_TaxAmbit.pdf`);
};
