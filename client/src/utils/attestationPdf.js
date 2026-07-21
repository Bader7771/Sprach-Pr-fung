import { jsPDF } from 'jspdf';
import { calculateExamAverage, getStudentName } from './results.js';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const SCHOOL_NAME = process.env.REACT_APP_SCHOOL_NAME || 'EGIM';
const SCHOOL_CITY = process.env.REACT_APP_SCHOOL_CITY || 'Casablanca';

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

function centered(doc, text, y, size, style = 'normal', color = 45) {
  doc.setFont('times', style);
  doc.setFontSize(size);
  doc.setTextColor(color);
  doc.text(cleanText(text), PAGE_WIDTH / 2, y, { align: 'center' });
}

// Quiet, low-contrast latitude/longitude decoration used on the reference-style paper.
function drawBackground(doc) {
  doc.setFillColor(250, 250, 249);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
  doc.setDrawColor(236, 236, 234);
  doc.setLineWidth(0.18);
  [28, 52, 76, 100, 124, 148, 172].forEach((x) => doc.ellipse(105, 151, x, 112, 'S'));
  [70, 94, 118, 142, 166, 190, 214, 238].forEach((y) => doc.ellipse(105, 151, 78, Math.abs(y - 151) + 8, 'S'));
}

function drawWorldMap(doc) {
  doc.setFillColor(224, 224, 222);
  const land = [
    [[37,247],[43,242],[51,241],[58,245],[55,251],[48,253],[45,260],[40,256]],
    [[59,261],[65,263],[69,270],[66,280],[61,274]],
    [[86,246],[94,240],[107,241],[111,246],[105,250],[100,258],[94,255],[90,261],[84,255]],
    [[111,242],[124,238],[140,241],[149,246],[160,244],[173,249],[168,255],[153,258],[145,254],[136,261],[126,257],[119,251]],
    [[105,259],[116,260],[122,269],[116,280],[108,273],[103,265]],
    [[159,271],[169,269],[176,274],[172,280],[162,279]]
  ];
  land.forEach((sourcePoints) => {
    const points = sourcePoints.map(([x, y]) => [x, 254 + (y - 238) * 0.7]);
    const [[x, y], ...rest] = points;
    const deltas = rest.map(([nextX, nextY], index) => {
      const [previousX, previousY] = points[index];
      return [nextX - previousX, nextY - previousY];
    });
    doc.lines(deltas, x, y, [1, 1], 'F', true);
  });
}

export function buildAttestationPdf(student) {
  const result = calculateExamAverage(student);
  if (result.average === null || result.average < 10) {
    throw new Error('Attestation is only available for students with an average of 10/20 or higher.');
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const studentName = cleanText(getStudentName(student), 'Student');
  const level = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(student?.examLevel) ? student.examLevel : '';
  const issueDate = formatGermanDate(new Date());

  doc.setProperties({
    title: `Zertifikat - ${studentName}`,
    subject: 'Deutsch Sprachprüfung Zertifikat',
    creator: SCHOOL_NAME
  });

  drawBackground(doc);

  centered(doc, SCHOOL_NAME, 21, 11, 'bold', 105);
  centered(doc, 'Zertifikat', 48, 31, 'bold', 40);
  centered(doc, studentName, 74, 21, 'normal', 42);
  centered(doc, `geboren am ${formatGermanDate(student?.dateOfBirth)}`, 87, 11, 'normal', 70);
  centered(doc, 'hat die Prüfung', 107, 10, 'normal', 88);
  centered(doc, `Deutsch Sprachprüfung${level ? ` ${level}` : ''}`, 126, 22, 'bold', 38);
  centered(doc, 'am Prüfungszentrum', 145, 10, 'normal', 88);
  centered(doc, SCHOOL_NAME, 159, 15, 'bold', 45);
  centered(doc, `${SCHOOL_CITY}, Morocco`, 170, 11, 'normal', 65);
  centered(doc, 'gut bestanden', 195, 20, 'bold', 40);

  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(65);
  doc.text(`Ort: ${SCHOOL_CITY}`, 29, 218);
  doc.text(`Datum: ${issueDate}`, 181, 218, { align: 'right' });

  doc.setDrawColor(145);
  doc.setLineWidth(0.25);
  doc.line(31, 239, 83, 239);
  doc.line(127, 239, 179, 239);
  doc.setFontSize(10);
  doc.text('Administrator', 57, 245, { align: 'center' });
  doc.text('School Director', 153, 245, { align: 'center' });

  drawWorldMap(doc);

  return {
    doc,
    fileName: `zertifikat-${safeFilePart(studentName)}.pdf`
  };
}
