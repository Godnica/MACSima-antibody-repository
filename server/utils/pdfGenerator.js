const PDFDocument = require('pdfkit');

/**
 * @param {Object} data
 * @param {string} data.experimentName
 * @param {string} data.experimentDate
 * @param {string} data.requestingLab
 * @param {string} data.ownerLab
 * @param {string} data.ownerLabPI
 * @param {string} data.billingAddress
 * @param {Array}  data.antibodies - [{ tube_number, target, clone, fluorochrome, total_ul_used, chf_per_ul, total_chf }]
 * @param {number} data.totalCost
 * @returns {PDFDocument}
 */
exports.generateBillingPdf = (data) => {
  const doc = new PDFDocument({ margin: 50 });

  // Header
  doc.fontSize(18).text('Antibody Usage Invoice', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10);
  doc.text(`Date: ${data.experimentDate}`);
  doc.text(`Experiment: ${data.experimentName}`);
  doc.text(`Requesting Lab: ${data.requestingLab}`);
  doc.text(`Billed to: ${data.ownerLab} (PI: ${data.ownerLabPI || '—'})`);
  if (data.billingAddress) doc.text(`Address: ${data.billingAddress}`);
  doc.moveDown();

  // Table header
  const tableTop = doc.y;
  const cols = [50, 140, 220, 300, 390, 440, 500];
  doc.font('Helvetica-Bold').fontSize(8);
  doc.text('Tube', cols[0], tableTop);
  doc.text('Target', cols[1], tableTop);
  doc.text('Clone', cols[2], tableTop);
  doc.text('Fluorochrome', cols[3], tableTop);
  doc.text('µL used', cols[4], tableTop);
  doc.text('CHF/µL', cols[5], tableTop);
  doc.text('Total CHF', cols[6], tableTop);

  // Separator line
  doc.moveTo(50, tableTop + 12).lineTo(560, tableTop + 12).stroke();

  // Table rows
  doc.font('Helvetica').fontSize(8);
  let y = tableTop + 18;
  for (const ab of data.antibodies) {
    if (y > 700) {
      doc.addPage();
      y = 50;
    }
    doc.text(ab.tube_number || '', cols[0], y, { width: 85 });
    doc.text(ab.target || '', cols[1], y, { width: 75 });
    doc.text(ab.clone || '', cols[2], y, { width: 75 });
    doc.text(ab.fluorochrome || '', cols[3], y, { width: 85 });
    doc.text(ab.total_ul_used.toFixed(1), cols[4], y, { width: 45 });
    doc.text(ab.chf_per_ul.toFixed(4), cols[5], y, { width: 55 });
    doc.text(ab.total_chf.toFixed(2), cols[6], y, { width: 60 });
    y += 14;
  }

  // Total
  y += 10;
  doc.moveTo(430, y - 4).lineTo(560, y - 4).stroke();
  doc.font('Helvetica-Bold').fontSize(10);
  doc.text(`Total: ${data.totalCost.toFixed(2)} CHF`, 430, y, { align: 'right', width: 130 });

  doc.end();
  return doc;
};
