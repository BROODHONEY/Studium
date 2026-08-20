const express = require('express');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const https = require('https');
const http = require('http');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Fetch a remote image URL into a Buffer
function fetchImageBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`Image fetch failed: ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Convert column index (1-based) to Excel column letter(s): 1→A, 26→Z, 27→AA
function colLetter(n) {
  let letter = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

// ── Generate Report (XLSX or PDF) ────────────────────
router.post('/generate', async (req, res) => {
  try {
    const { students, format, template, reportType } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: 'No students provided' });
    }

    if (format === 'xlsx') {
      await generateExcelReport(students, template, res);
    } else if (format === 'pdf') {
      await generatePDFReport(students, template, res);
    } else {
      return res.status(400).json({ error: 'Invalid format' });
    }
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

async function generateExcelReport(students, template, res) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Report');

  const headers = Object.keys(students[0]);
  const colCount = headers.length;
  const lastCol = colLetter(colCount);

  let currentRow = 1;

  // Add logo
  if (template?.show_logo && template?.logo_url) {
    try {
      const imgBuffer = await fetchImageBuffer(template.logo_url);
      const ext = template.logo_url.match(/\.(png|jpg|jpeg|gif|webp)/i)?.[1]?.toLowerCase() || 'png';
      const imageId = workbook.addImage({ buffer: imgBuffer, extension: ext === 'jpg' ? 'jpeg' : ext });

      const logoSizes = { small: 40, medium: 60, large: 80 };
      const sizePx = logoSizes[template.logo_size] || 60;
      // ExcelJS uses EMU: 1px ≈ 9525 EMU (96 dpi)
      const sizeEmu = sizePx * 9525;

      let colOffset = 0; // default left
      if (template.logo_position === 'top-center') colOffset = Math.floor(colCount / 2);
      else if (template.logo_position === 'top-right') colOffset = colCount - 1;

      worksheet.addImage(imageId, {
        tl: { col: colOffset, row: currentRow - 1 },
        ext: { width: sizePx, height: sizePx },
      });
      currentRow += 4;
    } catch (err) {
      console.error('Error embedding logo in Excel:', err);
      currentRow += 1;
    }
  }

  // College name
  if (template?.show_college_name && template?.college_name) {
    const nameCell = worksheet.getCell(`A${currentRow}`);
    nameCell.value = template.college_name;
    nameCell.font = { size: 18, bold: true, color: { argb: 'FF' + (template.header_color?.replace('#', '') || 'FF6B35') } };
    const nameAlign = template.college_name_position === 'top-left' ? 'left'
      : template.college_name_position === 'top-right' ? 'right' : 'center';
    nameCell.alignment = { horizontal: nameAlign, vertical: 'middle' };
    worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
    currentRow += 1;
  }

  // Subtitle
  if (template?.show_subtitle && template?.subtitle) {
    const subtitleCell = worksheet.getCell(`A${currentRow}`);
    subtitleCell.value = template.subtitle;
    subtitleCell.font = { size: 12, italic: true, color: { argb: 'FF666666' } };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
    currentRow += 1;
  }

  // Header text
  if (template?.show_header_text && template?.header_text) {
    const headerTextCell = worksheet.getCell(`A${currentRow}`);
    headerTextCell.value = template.header_text;
    headerTextCell.font = { size: 10, color: { argb: 'FF666666' } };
    headerTextCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    headerTextCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
    worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
    worksheet.getRow(currentRow).height = 30;
    currentRow += 1;
  }

  // Report title
  const titleCell = worksheet.getCell(`A${currentRow}`);
  titleCell.value = 'Student Report';
  titleCell.font = { size: 14, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
  currentRow += 2;

  // Header row
  const headerRow = worksheet.getRow(currentRow);
  headers.forEach((header, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = header.replace(/_/g, ' ').toUpperCase();
    cell.font = { bold: true, color: { argb: 'FF' + (template?.header_color?.replace('#', '') || 'FF6B35') }, size: template?.font_size || 12 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: (template?.header_color?.replace('#', '') || 'FF6B35') + '20' },
    };
    cell.border = {
      bottom: { style: 'thick', color: { argb: 'FF' + (template?.header_color?.replace('#', '') || 'FF6B35') } },
    };
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
  });
  currentRow += 1;

  // Data rows
  students.forEach((student) => {
    const dataRow = worksheet.getRow(currentRow);
    headers.forEach((header, idx) => {
      const cell = dataRow.getCell(idx + 1);
      const val = student[header];
      cell.value = val === null || val === undefined ? '' : val;
      cell.font = { size: template?.font_size || 12 };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFE5E5E5' } } };
    });
    currentRow += 1;
  });

  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    let maxLength = 10;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const len = cell.value != null ? String(cell.value).length : 0;
      if (len > maxLength) maxLength = len;
    });
    column.width = Math.min(maxLength + 2, 50);
  });

  currentRow += 1;

  // Footer text
  if (template?.show_footer_text && template?.footer_text) {
    const footerTextCell = worksheet.getCell(`A${currentRow}`);
    footerTextCell.value = template.footer_text;
    footerTextCell.font = { size: Math.max((template?.font_size || 12) - 2, 8), color: { argb: 'FF666666' } };
    footerTextCell.alignment = { horizontal: 'center', wrapText: true };
    worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
    currentRow += 1;
  }

  const footerCell = worksheet.getCell(`A${currentRow}`);
  footerCell.value = `Generated on ${new Date().toLocaleDateString()}`;
  footerCell.font = { size: Math.max((template?.font_size || 12) - 2, 8), italic: true, color: { argb: 'FF666666' } };
  footerCell.alignment = { horizontal: 'center' };
  worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=report_${Date.now()}.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
}

async function generatePDFReport(students, template, res) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=report_${Date.now()}.pdf`);

  doc.pipe(res);

  const pageWidth = doc.page.width;
  const contentWidth = pageWidth - 100;
  let yPosition = 50;

  // Logo
  if (template?.show_logo && template?.logo_url) {
    try {
      const imgBuffer = await fetchImageBuffer(template.logo_url);
      const logoSizes = { small: 40, medium: 60, large: 80 };
      const logoSize = logoSizes[template.logo_size] || 60;

      let xPos = 50 + (contentWidth - logoSize) / 2; // center default
      if (template.logo_position === 'top-left' || template.logo_position === 'side-left') xPos = 50;
      else if (template.logo_position === 'top-right' || template.logo_position === 'side-right') xPos = pageWidth - 50 - logoSize;

      doc.image(imgBuffer, xPos, yPosition, { width: logoSize, height: logoSize });
      yPosition += logoSize + 12;
    } catch (err) {
      console.error('Error embedding logo in PDF:', err);
    }
  }

  // College name
  if (template?.show_college_name && template?.college_name) {
    const nameAlign = template.college_name_position === 'top-left' ? 'left'
      : template.college_name_position === 'top-right' ? 'right' : 'center';
    doc.fontSize(18)
       .fillColor(template.header_color || '#FF6B35')
       .text(template.college_name, 50, yPosition, { align: nameAlign, width: contentWidth });
    yPosition += 30;
  }

  // Subtitle
  if (template?.show_subtitle && template?.subtitle) {
    doc.fontSize(12)
       .fillColor('#666666')
       .text(template.subtitle, 50, yPosition, { align: 'center', width: contentWidth });
    yPosition += 25;
  }

  // Header text
  if (template?.show_header_text && template?.header_text) {
    doc.fontSize(10)
       .fillColor('#666666')
       .text(template.header_text, 50, yPosition, { align: 'center', width: contentWidth });
    yPosition += 30;
  }

  // Report title
  doc.fontSize(14)
     .fillColor('#333333')
     .text('Student Report', 50, yPosition, { align: 'center', width: contentWidth });
  yPosition += 40;

  const headers = Object.keys(students[0]);
  const columnWidth = contentWidth / headers.length;
  const fontSize = template?.font_size || 12;

  // Header row
  doc.fontSize(fontSize).fillColor(template?.header_color || '#FF6B35');
  headers.forEach((header, idx) => {
    doc.text(
      header.replace(/_/g, ' ').toUpperCase(),
      50 + idx * columnWidth,
      yPosition,
      { width: columnWidth - 5, align: 'left' }
    );
  });

  doc.moveTo(50, yPosition + fontSize + 4)
     .lineTo(pageWidth - 50, yPosition + fontSize + 4)
     .strokeColor(template?.header_color || '#FF6B35')
     .lineWidth(2)
     .stroke();

  yPosition += fontSize + 12;

  // Data rows
  doc.fontSize(fontSize).fillColor('#333333');

  students.forEach((student) => {
    if (yPosition > doc.page.height - 100) {
      doc.addPage();
      yPosition = 50;
    }

    const rowTop = yPosition;
    headers.forEach((header, idx) => {
      const value = student[header] == null ? '' : String(student[header]);
      doc.text(value, 50 + idx * columnWidth, rowTop, { width: columnWidth - 5, align: 'left', ellipsis: true });
    });

    yPosition += fontSize + 10;
    doc.moveTo(50, yPosition)
       .lineTo(pageWidth - 50, yPosition)
       .strokeColor('#E5E5E5')
       .lineWidth(0.5)
       .stroke();
    yPosition += 5;
  });

  yPosition += 20;

  // Footer text
  if (template?.show_footer_text && template?.footer_text) {
    if (yPosition > doc.page.height - 80) { doc.addPage(); yPosition = 50; }
    doc.fontSize(Math.max(fontSize - 2, 8))
       .fillColor('#666666')
       .text(template.footer_text, 50, yPosition, { align: 'center', width: contentWidth });
    yPosition += 20;
  }

  if (yPosition > doc.page.height - 60) { doc.addPage(); yPosition = 50; }
  doc.fontSize(Math.max(fontSize - 2, 8))
     .fillColor('#666666')
     .text(`Generated on ${new Date().toLocaleDateString()}`, 50, yPosition, { align: 'center', width: contentWidth });

  doc.end();
}

module.exports = router;
