const express = require('express');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

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

  let currentRow = 1;

  // Add logo if available
  if (template?.show_logo && template?.logo_url) {
    try {
      // Note: In production, you'd fetch the image and add it properly
      // For now, we'll skip the actual image embedding
      currentRow += 3;
    } catch (err) {
      console.error('Error adding logo:', err);
    }
  }

  // Add college name
  if (template?.show_college_name && template?.college_name) {
    const nameCell = worksheet.getCell(`A${currentRow}`);
    nameCell.value = template.college_name;
    nameCell.font = { size: 18, bold: true, color: { argb: template.header_color?.replace('#', 'FF') || 'FFFF6B35' } };
    nameCell.alignment = { 
      horizontal: template.college_name_position === 'top-left' ? 'left' : template.college_name_position === 'top-right' ? 'right' : 'center',
      vertical: 'middle'
    };
    worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(64 + Object.keys(students[0]).length)}${currentRow}`);
    currentRow += 1;
  }

  // Add report title
  const titleCell = worksheet.getCell(`A${currentRow}`);
  titleCell.value = 'Student Report';
  titleCell.font = { size: 14, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(64 + Object.keys(students[0]).length)}${currentRow}`);
  currentRow += 2;

  // Add headers
  const headers = Object.keys(students[0]);
  const headerRow = worksheet.getRow(currentRow);
  headers.forEach((header, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = header.replace(/_/g, ' ').toUpperCase();
    cell.font = { bold: true, color: { argb: template?.header_color?.replace('#', 'FF') || 'FFFF6B35' }, size: template?.font_size || 12 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: (template?.header_color?.replace('#', '') || 'FF6B35') + '20' }
    };
    cell.border = {
      bottom: { style: 'thick', color: { argb: template?.header_color?.replace('#', 'FF') || 'FFFF6B35' } }
    };
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
  });
  currentRow += 1;

  // Add data rows
  students.forEach((student) => {
    const dataRow = worksheet.getRow(currentRow);
    headers.forEach((header, idx) => {
      const cell = dataRow.getCell(idx + 1);
      cell.value = student[header];
      cell.font = { size: template?.font_size || 12 };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE5E5E5' } }
      };
    });
    currentRow += 1;
  });

  // Auto-fit columns
  worksheet.columns.forEach((column, idx) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const cellLength = cell.value ? cell.value.toString().length : 10;
      if (cellLength > maxLength) {
        maxLength = cellLength;
      }
    });
    column.width = Math.min(Math.max(maxLength + 2, 12), 50);
  });

  // Add footer
  currentRow += 1;
  const footerCell = worksheet.getCell(`A${currentRow}`);
  footerCell.value = `Generated on ${new Date().toLocaleDateString()}`;
  footerCell.font = { size: (template?.font_size || 12) - 2, italic: true, color: { argb: 'FF666666' } };
  footerCell.alignment = { horizontal: 'center' };
  worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(64 + headers.length)}${currentRow}`);

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

  let yPosition = 50;

  // Add logo if available (placeholder for now)
  if (template?.show_logo && template?.logo_url) {
    // In production, fetch and embed the actual logo
    yPosition += 80;
  }

  // Add college name
  if (template?.show_college_name && template?.college_name) {
    doc.fontSize(18)
       .fillColor(template?.header_color || '#FF6B35')
       .text(template.college_name, 50, yPosition, {
         align: template.college_name_position === 'top-left' ? 'left' : template.college_name_position === 'top-right' ? 'right' : 'center',
         width: doc.page.width - 100
       });
    yPosition += 30;
  }

  // Add report title
  doc.fontSize(14)
     .fillColor('#333333')
     .text('Student Report', 50, yPosition, { align: 'center', width: doc.page.width - 100 });
  yPosition += 40;

  // Prepare table
  const headers = Object.keys(students[0]);
  const columnWidth = (doc.page.width - 100) / headers.length;
  const fontSize = template?.font_size || 12;

  // Draw header row
  doc.fontSize(fontSize)
     .fillColor(template?.header_color || '#FF6B35');

  headers.forEach((header, idx) => {
    doc.text(
      header.replace(/_/g, ' ').toUpperCase(),
      50 + idx * columnWidth,
      yPosition,
      { width: columnWidth - 5, align: 'left' }
    );
  });

  // Draw header underline
  doc.moveTo(50, yPosition + 15)
     .lineTo(doc.page.width - 50, yPosition + 15)
     .strokeColor(template?.header_color || '#FF6B35')
     .lineWidth(2)
     .stroke();

  yPosition += 25;

  // Draw data rows
  doc.fontSize(fontSize).fillColor('#333333');

  students.forEach((student, studentIdx) => {
    // Check if we need a new page
    if (yPosition > doc.page.height - 100) {
      doc.addPage();
      yPosition = 50;
    }

    headers.forEach((header, idx) => {
      const value = student[header] || '';
      doc.text(
        String(value),
        50 + idx * columnWidth,
        yPosition,
        { width: columnWidth - 5, align: 'left', ellipsis: true }
      );
    });

    // Draw row separator
    yPosition += 20;
    doc.moveTo(50, yPosition)
       .lineTo(doc.page.width - 50, yPosition)
       .strokeColor('#E5E5E5')
       .lineWidth(0.5)
       .stroke();

    yPosition += 5;
  });

  // Add footer
  yPosition += 20;
  doc.fontSize(fontSize - 2)
     .fillColor('#666666')
     .text(
       `Generated on ${new Date().toLocaleDateString()}`,
       50,
       yPosition,
       { align: 'center', width: doc.page.width - 100 }
     );

  doc.end();
}

module.exports = router;
