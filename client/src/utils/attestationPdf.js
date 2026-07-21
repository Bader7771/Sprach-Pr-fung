import { jsPDF } from 'jspdf';
import egimLogo from '../assets/egim-logo-transparent.png';
import { calculateExamAverage, getStudentName } from './results.js';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CENTER_X = PAGE_WIDTH / 2;
const SCHOOL_NAME = process.env.REACT_APP_SCHOOL_NAME || 'EGIM';
const INK = [34, 42, 48];
const MUTED_INK = [91, 99, 104];
const GOLD = [170, 145, 82];

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

function formatGermanDate(value) {
  if (!value) return '--.--.----';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--.--.----';
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC'
  }).format(date);
}

function fitFontSize(doc, text, preferredSize, maxWidth, minimumSize = 15) {
  let size = preferredSize;
  doc.setFontSize(size);
  while (size > minimumSize && doc.getTextWidth(text) > maxWidth) {
    size -= 0.5;
    doc.setFontSize(size);
  }
  return size;
}

function centered(doc, text, y, size, style = 'normal', color = INK, maxWidth = 170) {
  const value = cleanText(text);
  doc.setFont('times', style);
  doc.setTextColor(...color);
  doc.setFontSize(fitFontSize(doc, value, size, maxWidth));
  doc.text(value, CENTER_X, y, { align: 'center' });
}

function drawSecurityWaves(doc, originX, originY, width, height, direction = 1) {
  doc.setDrawColor(226, 227, 224);
  doc.setLineWidth(0.12);
  for (let line = 0; line < 18; line += 1) {
    const inset = line * 0.72;
    const y = originY + line * 1.45;
    const sway = direction * (8 + line * 0.35);
    doc.lines([
      [width * 0.22, -height * 0.22],
      [width * 0.32, height * 0.34],
      [width * 0.24, -height * 0.08],
      [width * 0.22, -height * 0.04]
    ], originX + inset - sway, y, [1, 1], 'S', false);
  }
}

function drawBackground(doc) {
  doc.setFillColor(252, 252, 249);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  // Fine guilloche-style linework, kept outside the primary reading column.
  drawSecurityWaves(doc, 4, 13, 102, 94, 1);
  drawSecurityWaves(doc, 105, 225, 102, 94, -1);

  doc.setDrawColor(232, 232, 228);
  doc.setLineWidth(0.13);
  for (let radius = 20; radius <= 88; radius += 8.5) {
    doc.ellipse(CENTER_X, 151, radius, radius * 1.28, 'S');
  }
  for (let offset = -54; offset <= 54; offset += 9) {
    doc.ellipse(CENTER_X + offset * 0.12, 151, 72, 18 + Math.abs(offset) * 0.65, 'S');
  }

  // Formal double frame with restrained corner ornaments.
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.65);
  doc.rect(8, 8, PAGE_WIDTH - 16, PAGE_HEIGHT - 16);
  doc.setDrawColor(207, 199, 176);
  doc.setLineWidth(0.2);
  doc.rect(11.5, 11.5, PAGE_WIDTH - 23, PAGE_HEIGHT - 23);

  const corners = [[15, 15, 1, 1], [195, 15, -1, 1], [15, 282, 1, -1], [195, 282, -1, -1]];
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.35);
  corners.forEach(([x, y, sx, sy]) => {
    doc.line(x, y, x + sx * 17, y);
    doc.line(x, y, x, y + sy * 17);
    doc.line(x + sx * 3, y + sy * 3, x + sx * 11, y + sy * 3);
    doc.line(x + sx * 3, y + sy * 3, x + sx * 3, y + sy * 11);
  });
}

function drawHeadingOrnament(doc, y) {
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.line(62, y, 96, y);
  doc.line(114, y, 148, y);
  doc.setFillColor(...GOLD);
  doc.circle(CENTER_X, y, 1.15, 'F');
  doc.circle(100.5, y, 0.45, 'F');
  doc.circle(109.5, y, 0.45, 'F');
}

function drawWorldMap(doc) {
  doc.setFillColor(195, 199, 196);
  const land = [
    [[0,8],[5,3],[13,1],[22,4],[27,9],[24,14],[18,14],[15,20],[10,17],[8,12],[3,12]],
    [[18,20],[23,22],[26,29],[24,39],[20,35],[17,27]],
    [[35,8],[42,3],[51,4],[55,8],[51,12],[46,13],[43,19],[38,17],[34,12]],
    [[53,7],[63,3],[76,4],[84,7],[96,6],[107,11],[103,16],[93,17],[87,14],[79,19],[70,17],[65,13],[58,14]],
    [[50,18],[58,18],[63,24],[60,36],[55,40],[51,33],[48,25]],
    [[96,29],[104,27],[111,31],[108,37],[100,37]]
  ];
  const scale = 0.65;
  const mapWidth = 111 * scale;
  const startX = CENTER_X - mapWidth / 2;
  const startY = 255;
  land.forEach((shape) => {
    const points = shape.map(([x, y]) => [startX + x * scale, startY + y * scale]);
    const [[x, y], ...rest] = points;
    const deltas = rest.map(([nextX, nextY], index) => {
      const [previousX, previousY] = points[index];
      return [nextX - previousX, nextY - previousY];
    });
    doc.lines(deltas, x, y, [1, 1], 'F', true);
  });

  doc.setDrawColor(218, 218, 214);
  doc.setLineWidth(0.12);
  doc.ellipse(CENTER_X, 267, 41, 14, 'S');
  doc.ellipse(CENTER_X, 267, 29, 14, 'S');
  doc.line(64, 267, 146, 267);
}

function drawSignatures(doc, issueDate) {
  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...MUTED_INK);
  doc.text('Ort: MEKNES', 28, 222);
  doc.text(`Ausstellungsdatum: ${issueDate}`, 182, 222, { align: 'right' });

  doc.setDrawColor(120, 125, 126);
  doc.setLineWidth(0.25);
  doc.line(28, 242, 83, 242);
  doc.line(127, 242, 182, 242);
  doc.setFontSize(9.5);
  doc.setTextColor(...INK);
  doc.text('Kursleiter', 55.5, 247, { align: 'center' });
  doc.text('CHTATOU BILAL', 55.5, 251, { align: 'center' });
  doc.text('Stempel der Institution', 154.5, 247, { align: 'center' });
  doc.text('EL MEHDI CHALH', 154.5, 251, { align: 'center' });
}

export function buildAttestationPdf(student, selectedLevel) {
  const result = calculateExamAverage(student);
  if (result.average === null || result.average < 60 || result.average > 100) {
    throw new Error('Attestation is only available for students with an average between 60/100 and 100/100.');
  }

  const level = ['A2', 'B1', 'B2'].includes(selectedLevel) ? selectedLevel : '';
  if (!level) throw new Error('Select an exam level before generating the certificate.');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const studentName = cleanText(getStudentName(student), 'Student');
  const issueDate = formatGermanDate(new Date());

  doc.setProperties({
    title: `Zertifikat - ${studentName}`,
    subject: 'Deutsch Sprachprüfung Zertifikat',
    creator: SCHOOL_NAME
  });

  drawBackground(doc);

  doc.addImage(egimLogo, 'PNG', 89, 13, 32, 32, 'egim-logo', 'MEDIUM');
  doc.setCharSpace(1.1);
  centered(doc, 'Zertifikat', 55, 38, 'normal', [67, 68, 62], 165);
  doc.setCharSpace(0);
  drawHeadingOrnament(doc, 64);

  centered(doc, studentName, 87, 27, 'bold', INK, 174);

  centered(doc, 'hat die Prüfung', 113, 12.5, 'normal', MUTED_INK);
  centered(doc, 'Deutsch Sprachprüfung', 143, 25.5, 'bold', INK, 180);
  centered(doc, level, 153, 13.5, 'bold', INK, 180);

  centered(doc, 'am Prüfungszentrum', 164, 12.5, 'normal', MUTED_INK);
  centered(doc, SCHOOL_NAME, 179, 16, 'bold', INK, 165);
  centered(doc, 'Morocco', 191, 12.5, 'normal', MUTED_INK);

  centered(doc, 'bestanden', 211, 24, 'bold', INK, 170);

  drawSignatures(doc, issueDate);
  drawWorldMap(doc);

  return {
    doc,
    fileName: `zertifikat-${safeFilePart(studentName)}.pdf`
  };
}
