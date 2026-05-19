

const fs = require('fs');
const path = require('path');

async function generateSamplePDF() {
  try {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    const outputPath = path.join(__dirname, '..', 'sample-policy.pdf');
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Colors
    const darkSlate = '#0a0f1a';
    const amber = '#f59e0b';
    const slate = '#334155';
    const lightSlate = '#94a3b8';

    // Header bar
    doc.rect(0, 0, doc.page.width, 60).fill(darkSlate);
    doc.fillColor('#f59e0b').fontSize(24).font('Helvetica-Bold').text('NICSAN CRM', 50, 20);
    doc.fillColor('#fff').fontSize(10).text('Insurance Policy Management', 50, 38);
    doc.fillColor(amber).fontSize(9).text('SECUREDRIVE GENERAL INSURANCE', doc.page.width - 200, 24);
    doc.fillColor('#fff').fontSize(8).text('Licence No: IRDAI/2024/001/1234', doc.page.width - 200, 38);

    let y = 90;

    // Policy Title
    doc.fillColor('#1e293b').fontSize(18).font('Helvetica-Bold').text('COMPREHENSIVE MOTOR INSURANCE POLICY', 50, y);
    y += 30;

    // Horizontal rule
    doc.strokeColor(amber).lineWidth(2).moveTo(50, y).lineTo(doc.page.width - 50, y).stroke();
    y += 25;

    // Certificate number
    doc.fillColor('#475569').fontSize(10).text('Certificate Number:', 50, y);
    doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text('CERT-2024-SD-582491', doc.page.width - 250, y);
    y += 25;

    doc.fillColor('#475569').fontSize(10).text('Date of Issue:', 50, y);
    doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text('15 May 2024', doc.page.width - 250, y);
    y += 35;

    // Section: Insured Details
    doc.fillColor(darkSlate).fontSize(13).font('Helvetica-Bold').text('INSURED DETAILS', 50, y);
    y += 5;
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, y).lineTo(doc.page.width - 50, y).stroke();
    y += 15;

    const fields = [
      ['Name of Insured:', 'ROHAN KAPOOR'],
      ['Address:', '42, MG Road, Koramangala, Bangalore, Karnataka 560034'],
      ['Contact:', '+91 98765 43210'],
      ['Email:', 'rohan.kapoor@example.com'],
    ];

    for (const [label, value] of fields) {
      doc.fillColor('#64748b').fontSize(10).font('Helvetica').text(label, 50, y);
      doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text(value, 180, y);
      y += 22;
    }

    y += 10;

    // Section: Vehicle Details
    doc.fillColor(darkSlate).fontSize(13).font('Helvetica-Bold').text('VEHICLE DETAILS', 50, y);
    y += 5;
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, y).lineTo(doc.page.width - 50, y).stroke();
    y += 15;

    const vehicleFields = [
      ['Vehicle Number:', 'KA 09 ZR 5824'],
      ['Make & Model:', 'Skoda Kushaq 1.5 TSI Style'],
      ['Vehicle Type:', 'Private Car'],
      ['Year of Manufacture:', '2023'],
      ['Registration Category:', 'Individual'],
    ];

    for (const [label, value] of vehicleFields) {
      doc.fillColor('#64748b').fontSize(10).font('Helvetica').text(label, 50, y);
      doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text(value, 180, y);
      y += 22;
    }

    y += 10;

    // Section: Insurance Coverage
    doc.fillColor(darkSlate).fontSize(13).font('Helvetica-Bold').text('INSURANCE COVERAGE', 50, y);
    y += 5;
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, y).lineTo(doc.page.width - 50, y).stroke();
    y += 15;

    const coverageFields = [
      ['Policy Type:', 'Comprehensive'],
      ['Coverage Period:', '12 Months (15 May 2024 to 14 May 2025)'],
      ['IDV (Insured Declared Value):', '₹14,50,000'],
      ['Sum Insured:', '₹14,50,000'],
    ];

    for (const [label, value] of coverageFields) {
      doc.fillColor('#64748b').fontSize(10).font('Helvetica').text(label, 50, y);
      doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text(value, 220, y);
      y += 22;
    }

    y += 10;

    // Section: Premium Breakdown
    doc.fillColor(darkSlate).fontSize(13).font('Helvetica-Bold').text('PREMIUM BREAKDOWN', 50, y);
    y += 5;
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, y).lineTo(doc.page.width - 50, y).stroke();
    y += 15;

    const premiumFields = [
      ['Basic OD Premium:', '₹18,500'],
      ['Basic TP Premium:', '₹8,200'],
      ['Add-on Covers (Zero Dep, RTI, CCA):', '₹3,200'],
      ['NCB Benefit (20%):', '- ₹4,340'],
      ['GST (18%):', '₹5,709'],
    ];

    for (const [label, value] of premiumFields) {
      doc.fillColor('#64748b').fontSize(10).font('Helvetica').text(label, 50, y);
      doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text(value, 280, y);
      y += 22;
    }

    // Total Premium highlight
    y += 5;
    doc.rect(50, y, doc.page.width - 100, 40).fill('#fef3c7');
    doc.fillColor('#92400e').fontSize(10).font('Helvetica-Bold').text('TOTAL PREMIUM (Including GST):', 70, y + 10);
    doc.fillColor('#92400e').fontSize(16).font('Helvetica-Bold').text('₹31,269', 320, y + 8);
    y += 55;

    // Add-ons
    doc.fillColor(darkSlate).fontSize(13).font('Helvetica-Bold').text('ADD-ON COVERS', 50, y);
    y += 5;
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, y).lineTo(doc.page.width - 50, y).stroke();
    y += 15;

    const addons = [
      '✓ Zero Depreciation Cover (120 months)',
      '✓ Return to Invoice',
      '✓ Consumables Cover',
      '✓ Engine Protection',
      '✓ Roadside Assistance',
    ];

    for (const addon of addons) {
      doc.fillColor('#16a34a').fontSize(10).text(addon, 50, y);
      y += 18;
    }

    y += 10;

    // Section: Insurer
    doc.fillColor(darkSlate).fontSize(13).font('Helvetica-Bold').text('INSURER DETAILS', 50, y);
    y += 5;
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, y).lineTo(doc.page.width - 50, y).stroke();
    y += 15;

    doc.fillColor('#64748b').fontSize(10).text('Insurer:', 50, y);
    doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text('SecureDrive General Insurance Ltd.', 180, y);
    y += 22;
    doc.fillColor('#64748b').fontSize(10).text('Registered Office:', 50, y);
    doc.fillColor('#1e293b').fontSize(11).text('SecureDrive Tower, Bandra Kurla Complex, Mumbai 400051', 180, y);
    y += 22;
    doc.fillColor('#64748b').fontSize(10).text(' Toll-Free:', 50, y);
    doc.fillColor('#1e293b').fontSize(11).text('1800 123 4567', 180, y);

    // Footer
    const footerY = doc.page.height - 80;
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, footerY).lineTo(doc.page.width - 50, footerY).stroke();
    doc.fillColor('#94a3b8').fontSize(8).text('This is a computer-generated policy document. For verification contact SecureDrive at 1800 123 4567 or www.securedrive.in', 50, footerY + 10);
    doc.fillColor('#64748b').fontSize(8).text('Nicsan Insurance Marketing LLP | +91 9686449289 | admin@nicsan.in', 50, footerY + 25);

    doc.end();

    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    console.log(`✅ Sample PDF generated: ${outputPath}`);
  } catch (err) {
    console.error('❌ Failed to generate PDF:', err.message);
    process.exit(1);
  }
}

generateSamplePDF();