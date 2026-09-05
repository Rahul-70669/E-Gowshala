import PDFDocument from 'pdfkit';

interface ReceiptData {
  receiptNumber: string;
  donorName: string;
  donorEmail: string;
  donorPan: string;
  donorAddress: string;
  amount: number;
  purpose: string;
  date: Date;
  paymentId: string;
}

const numberToWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';
  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
  if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' and ' + numberToWords(num % 100) : '');
  if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
  if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
  return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '');
};

export const generate80GReceipt = (data: ReceiptData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const formatDate = (d: Date) => {
        const date = new Date(d);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
      };

      // ─── Header ────────────────────────────────
      doc.rect(0, 0, 595.28, 100).fill('#F97316');
      doc.fontSize(24).fillColor('#FFFFFF').font('Helvetica-Bold')
        .text('🐄 E-GOWSHALA', 50, 25, { align: 'center' });
      doc.fontSize(10).font('Helvetica')
        .text('Shri Gau Seva Sansthan | Registered Under Section 80G of Income Tax Act', 50, 55, { align: 'center' });
      doc.text('Registration No: 80G/2026/GA-12345 | PAN: AACTS1234F', 50, 70, { align: 'center' });

      // ─── Receipt Title ─────────────────────────
      doc.fillColor('#333333');
      doc.moveDown(2);
      doc.fontSize(18).font('Helvetica-Bold')
        .text('DONATION RECEIPT (80G)', { align: 'center' });
      doc.moveDown(0.5);

      // ─── Receipt Details ───────────────────────
      const startY = 150;
      doc.fontSize(10).font('Helvetica');

      doc.font('Helvetica-Bold').text('Receipt No:', 50, startY);
      doc.font('Helvetica').text(data.receiptNumber, 200, startY);

      doc.font('Helvetica-Bold').text('Date:', 350, startY);
      doc.font('Helvetica').text(formatDate(data.date), 420, startY);

      doc.font('Helvetica-Bold').text('Payment ID:', 50, startY + 20);
      doc.font('Helvetica').text(data.paymentId, 200, startY + 20);

      // ─── Donor Details ─────────────────────────
      doc.moveDown(2);
      const donorY = startY + 60;
      doc.rect(50, donorY, 495, 100).lineWidth(0.5).stroke('#CCCCCC');

      doc.fontSize(11).font('Helvetica-Bold').fillColor('#F97316')
        .text('DONOR DETAILS', 60, donorY + 10);

      doc.fillColor('#333333').fontSize(10).font('Helvetica');
      doc.font('Helvetica-Bold').text('Name:', 60, donorY + 30);
      doc.font('Helvetica').text(data.donorName, 200, donorY + 30);

      doc.font('Helvetica-Bold').text('Email:', 60, donorY + 45);
      doc.font('Helvetica').text(data.donorEmail, 200, donorY + 45);

      doc.font('Helvetica-Bold').text('PAN:', 350, donorY + 30);
      doc.font('Helvetica').text(data.donorPan, 420, donorY + 30);

      doc.font('Helvetica-Bold').text('Address:', 60, donorY + 65);
      doc.font('Helvetica').text(data.donorAddress, 200, donorY + 65, { width: 340 });

      // ─── Donation Details ──────────────────────
      const detailY = donorY + 120;
      doc.rect(50, detailY, 495, 80).lineWidth(0.5).stroke('#CCCCCC');

      doc.fontSize(11).font('Helvetica-Bold').fillColor('#F97316')
        .text('DONATION DETAILS', 60, detailY + 10);

      doc.fillColor('#333333').fontSize(10);
      doc.font('Helvetica-Bold').text('Amount:', 60, detailY + 30);
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#22C55E')
        .text(`₹ ${data.amount.toLocaleString('en-IN')}`, 200, detailY + 28);

      doc.fillColor('#333333').fontSize(10).font('Helvetica');
      doc.font('Helvetica-Bold').text('In Words:', 60, detailY + 50);
      doc.font('Helvetica').text(`Rupees ${numberToWords(Math.floor(data.amount))} Only`, 200, detailY + 50);

      doc.font('Helvetica-Bold').text('Purpose:', 350, detailY + 30);
      doc.font('Helvetica').text(data.purpose.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()), 420, detailY + 30);

      // ─── 80G Certificate ──────────────────────
      const certY = detailY + 110;
      doc.rect(50, certY, 495, 80).fill('#FFF7ED');
      doc.rect(50, certY, 495, 80).lineWidth(0.5).stroke('#F97316');

      doc.fontSize(9).fillColor('#92400E').font('Helvetica-Bold')
        .text('CERTIFICATE UNDER SECTION 80G', 60, certY + 10, { align: 'center' });
      doc.font('Helvetica').fontSize(8).fillColor('#78350F')
        .text(
          'This is to certify that the above donation has been received by Shri Gau Seva Sansthan (E-Gowshala), ' +
          'an organization approved under Section 80G(5)(vi) of the Income Tax Act, 1961. ' +
          'The donor is entitled to claim deduction under Section 80G for the above donation. ' +
          'Approval Order No: ITBA/EXM/S/80G/2026/1234567890 dated 01/04/2026.',
          60, certY + 25, { width: 475, lineGap: 3 }
        );

      // ─── Footer ────────────────────────────────
      doc.moveDown(4);
      doc.fontSize(10).fillColor('#333333').font('Helvetica-Bold');
      doc.text('For Shri Gau Seva Sansthan (E-Gowshala)', 300, certY + 100, { align: 'right' });
      doc.moveDown(2);
      doc.fontSize(9).font('Helvetica')
        .text('Authorized Signatory', 300, certY + 140, { align: 'right' });

      // ─── Disclaimer ───────────────────────────
      doc.fontSize(7).fillColor('#999999').font('Helvetica')
        .text(
          'This is a computer-generated receipt and does not require a physical signature. ' +
          'For any queries, contact us at info@egowshala.org | +91-XXXXX-XXXXX',
          50, 750, { align: 'center', width: 495 }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
