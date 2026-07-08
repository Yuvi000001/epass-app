const PDFDocument = require('pdfkit');
const { getBucket } = require('../config/firebase');

/**
 * Builds the E-Pass PDF in memory (student details, leave duration, approval date)
 * and uploads the result to Firebase Storage, returning the public PDF URL.
 *
 * To embed the actual QR image inside the PDF (instead of just printing its URL),
 * fetch the image bytes first (e.g. with Node's built-in `https` module) and pass
 * the buffer to `doc.image(buffer, x, y, { width: 150 })` before `doc.end()`.
 */
async function generateEpassPdf({ passId, studentName, rollNumber, branch, leaveType, fromDate, toDate, approvedOn, qrCodeUrl }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', async () => {
      try {
        const pdfBuffer = Buffer.concat(chunks);
        const bucket = getBucket();

        if (!bucket) {
          console.warn('Firebase Storage not configured — E-Pass PDF returned as a base64 data URL.');
          resolve(`data:application/pdf;base64,${pdfBuffer.toString('base64')}`);
          return;
        }

        const destPath = `epass/passes/pass_${passId}.pdf`;
        const file = bucket.file(destPath);
        await file.save(pdfBuffer, { metadata: { contentType: 'application/pdf' }, public: true });
        resolve(`https://storage.googleapis.com/${bucket.name}/${destPath}`);
      } catch (err) {
        reject(err);
      }
    });

    // ---- Header ----
    doc.fillColor('#0A4DAD').fontSize(20).text('BANSAL GROUP OF INSTITUTES', { align: 'center' });
    doc.fontSize(10).fillColor('#666666').text('Bhopal | Indore | Mandideep', { align: 'center' });
    doc.moveDown(1);
    doc.fillColor('#0A4DAD').fontSize(16).text('E-PASS — Approved Leave Pass', { align: 'center' });
    doc.moveDown(1.5);

    // ---- Status badge ----
    doc.fillColor('#1B8A4C').fontSize(14).text('LEAVE APPROVED', { align: 'center' });
    doc.moveDown(1);

    // ---- Details table ----
    const rows = [
      ['Pass ID', passId],
      ['Student Name', studentName],
      ['Roll Number', rollNumber],
      ['Branch', branch || '-'],
      ['Leave Type', leaveType],
      ['From Date', fromDate],
      ['To Date', toDate],
      ['Approved On', approvedOn],
    ];
    doc.fillColor('#000000').fontSize(11);
    rows.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').text(`${label}: `, { continued: true }).font('Helvetica').text(String(value));
      doc.moveDown(0.3);
    });

    doc.moveDown(1);
    doc.fontSize(9).fillColor('#888888').text(
      'This is a digitally generated pass. Scan the QR code to verify authenticity.',
      { align: 'center' }
    );
    doc.moveDown(1);
    doc.fontSize(9).fillColor('#0A4DAD').text(`Verify QR: ${qrCodeUrl}`, { align: 'center' });

    doc.end();
  });
}

module.exports = { generateEpassPdf };
