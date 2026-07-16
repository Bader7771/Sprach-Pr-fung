import { jsPDF } from 'jspdf';
import { calculateExamAverage, examKeys, getExamDisplay, getExamLabel, getStudentName } from './results.js';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 18;

function cleanText(value, fallback = '-') {
  return String(value || fallback)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}

function safeFilePart(value) {
  return cleanText(value, 'student')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'student';
}

function splitText(doc, text, maxWidth) {
  return doc.splitTextToSize(cleanText(text), maxWidth);
}

function referenceNumber(student) {
  const id = cleanText(student?._id || Date.now().toString(), 'local').slice(-8).toUpperCase();
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `SP-${date}-${id}`;
}

function drawCenteredLines(doc, lines, y, options = {}) {
  const { size = 12, color = [31, 41, 55], lineHeight = 7, font = 'helvetica', style = 'normal' } = options;
  doc.setFont(font, style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
  lines.forEach((line, index) => {
    doc.text(line, PAGE_WIDTH / 2, y + index * lineHeight, { align: 'center' });
  });
  return y + lines.length * lineHeight;
}

export function buildAttestationPdf(student, className) {
  const result = calculateExamAverage(student);
  if (result.average === null || result.average < 10) {
    throw new Error('Attestation is only available for students with an average of 10/20 or higher.');
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const studentName = cleanText(getStudentName(student), 'Student');
  const resolvedClassName = cleanText(className || student?.className, 'Classe');
  const average = result.average.toFixed(2);
  const issuedAt = new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());
  const ref = referenceNumber(student);

  doc.setProperties({
    title: `Attestation de réussite - ${studentName}`,
    subject: 'Sprach-Pr-fung attestation de réussite',
    creator: 'Sprach-Pr-fung'
  });

  doc.setFillColor(252, 250, 246);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  doc.setDrawColor(20, 50, 92);
  doc.setLineWidth(1.2);
  doc.rect(MARGIN, MARGIN, PAGE_WIDTH - MARGIN * 2, PAGE_HEIGHT - MARGIN * 2);
  doc.setDrawColor(196, 156, 80);
  doc.setLineWidth(0.4);
  doc.rect(MARGIN + 3, MARGIN + 3, PAGE_WIDTH - (MARGIN + 3) * 2, PAGE_HEIGHT - (MARGIN + 3) * 2);

  doc.setDrawColor(226, 214, 190);
  doc.setLineWidth(0.2);
  for (let x = MARGIN + 12; x < PAGE_WIDTH - MARGIN; x += 12) {
    doc.line(x, MARGIN + 12, x - 42, PAGE_HEIGHT - MARGIN - 12);
  }

  doc.setFillColor(16, 39, 82);
  doc.roundedRect(PAGE_WIDTH / 2 - 13, 28, 26, 20, 2, 2, 'F');
  doc.setTextColor(255, 248, 234);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('SP', PAGE_WIDTH / 2, 41, { align: 'center' });

  drawCenteredLines(doc, ['Sprach-Pr-fung'], 58, {
    size: 18,
    color: [16, 39, 82],
    font: 'helvetica',
    style: 'bold',
    lineHeight: 8
  });
  drawCenteredLines(doc, ['École de langue allemande'], 67, {
    size: 10,
    color: [98, 112, 134],
    lineHeight: 6
  });

  drawCenteredLines(doc, ['Attestation de réussite'], 88, {
    size: 24,
    color: [16, 39, 82],
    font: 'times',
    style: 'bold',
    lineHeight: 10
  });

  doc.setDrawColor(196, 156, 80);
  doc.line(60, 101, 150, 101);

  const paragraph = `Nous attestons que ${studentName}, inscrit(e) dans la classe ${resolvedClassName}, a réussi l'examen de langue allemande avec une moyenne de ${average}/20.`;
  const paragraphLines = splitText(doc, paragraph, 150);
  let y = 121;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(42, 53, 71);
  paragraphLines.forEach((line) => {
    doc.text(line, PAGE_WIDTH / 2, y, { align: 'center' });
    y += 7;
  });

  y += 9;
  const tableX = 43;
  const tableY = y;
  const rowHeight = 12;
  doc.setDrawColor(207, 194, 168);
  doc.setFillColor(245, 239, 226);
  doc.rect(tableX, tableY, 124, rowHeight, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(16, 39, 82);
  doc.text('Section', tableX + 6, tableY + 8);
  doc.text('Résultat', tableX + 92, tableY + 8);

  examKeys.forEach((key, index) => {
    const rowY = tableY + rowHeight * (index + 1);
    doc.setFillColor(index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 251, index % 2 === 0 ? 255 : 245);
    doc.rect(tableX, rowY, 124, rowHeight, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(42, 53, 71);
    doc.text(getExamLabel(key), tableX + 6, rowY + 8);
    doc.text(getExamDisplay(student, key), tableX + 92, rowY + 8);
  });

  const averageY = tableY + rowHeight * 5;
  doc.setFillColor(16, 39, 82);
  doc.rect(tableX, averageY, 124, rowHeight, 'F');
  doc.setTextColor(255, 248, 234);
  doc.setFont('helvetica', 'bold');
  doc.text('Moyenne finale', tableX + 6, averageY + 8);
  doc.text(`${average}/20`, tableX + 92, averageY + 8);

  doc.setTextColor(80, 91, 112);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Date d'émission : ${issuedAt}`, MARGIN + 12, 220);
  doc.text(`Référence : ${ref}`, MARGIN + 12, 228);

  doc.setDrawColor(124, 135, 152);
  doc.line(MARGIN + 12, 252, MARGIN + 72, 252);
  doc.line(PAGE_WIDTH - MARGIN - 72, 252, PAGE_WIDTH - MARGIN - 12, 252);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(42, 53, 71);
  doc.text('Signature de l\'école', MARGIN + 12, 260);
  doc.text('Cachet officiel', PAGE_WIDTH - MARGIN - 72, 260);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(98, 112, 134);
  doc.text('Cette attestation est délivrée par Sprach-Pr-fung et ne constitue pas un certificat officiel ÖSD.', PAGE_WIDTH / 2, 276, {
    align: 'center'
  });

  return {
    doc,
    fileName: `attestation-${safeFilePart(studentName)}.pdf`,
    reference: ref
  };
}
