import PDFDocument from 'pdfkit';
import Student from '../models/Student.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { writeAudit } from '../services/auditService.js';

export const generateCertificate = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  student.certificatesGenerated += 1;
  await student.save();
  await writeAudit({ actor: req.admin._id, action: 'GENERATE_CERTIFICATE', entity: 'Student', entityId: student._id.toString() });

  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  const fileName = `${student.fullName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_certificate.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  doc.pipe(res);

  const schoolName = process.env.SCHOOL_NAME || 'German School';
  doc.rect(28, 28, 539, 785).lineWidth(2).stroke('#1f2937');
  doc.rect(40, 40, 515, 761).lineWidth(0.7).stroke('#9ca3af');

  doc.circle(297, 95, 34).fillAndStroke('#0f766e', '#0f766e');
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('GS', 0, 82, { align: 'center' });

  doc.fillColor('#111827').fontSize(24).font('Helvetica-Bold').text(schoolName, 48, 140, { align: 'center' });
  doc.fontSize(11).fillColor('#6b7280').text('Official Student Result Certificate', { align: 'center' });
  doc.moveDown(2);

  doc.fillColor('#111827').fontSize(28).font('Helvetica-Bold').text('Certificate of Achievement', { align: 'center' });
  doc.moveDown(1.2);
  doc.fontSize(13).font('Helvetica').fillColor('#374151').text('This certificate is proudly issued to', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(25).font('Helvetica-Bold').fillColor('#0f766e').text(student.fullName, { align: 'center' });
  doc.moveDown(0.7);
  doc.fontSize(13).font('Helvetica').fillColor('#374151').text(`Class: ${student.className}    Group: ${student.groupNumber}`, { align: 'center' });
  doc.moveDown(1.5);

  const startX = 112;
  const startY = doc.y;
  const rowH = 34;
  const rows = [
    ['Exam 1 Note', student.exams.exam1],
    ['Exam 2 Note', student.exams.exam2],
    ['Exam 3 Note', student.exams.exam3],
    ['Exam 4 Note', student.exams.exam4],
    ['Final Note', student.finalNote]
  ];
  doc.fontSize(12);
  rows.forEach(([label, value], index) => {
    const y = startY + index * rowH;
    doc.rect(startX, y, 370, rowH).fill(index === 4 ? '#ecfdf5' : '#f9fafb').stroke('#d1d5db');
    doc.fillColor('#111827').font(index === 4 ? 'Helvetica-Bold' : 'Helvetica').text(label, startX + 18, y + 11);
    doc.text(String(value), startX + 305, y + 11);
  });

  doc.fillColor('#374151').font('Helvetica').fontSize(11).text(`Date of Issue: ${new Date().toLocaleDateString()}`, 80, 685);
  doc.moveTo(380, 710).lineTo(510, 710).stroke('#111827');
  doc.text('Authorized Signature', 392, 718);
  doc.end();
});
