export const examKeys = ['exam1', 'exam2', 'exam3', 'exam4'];
export const examLabels = {
  exam1: 'Lesen',
  exam2: 'Hören',
  exam3: 'Schreiben',
  exam4: 'Sprechen'
};

export function getExamLabel(key) {
  return examLabels[key] || key;
}

export function getStudentName(student) {
  return student?.fullName || [student?.firstName, student?.lastName].filter(Boolean).join(' ');
}

export function normalizeExamValue(value) {
  if (value === '' || value === null || value === undefined) return '';
  const number = Number(value);
  return Number.isFinite(number) ? number : '';
}

export function getExamDisplay(student, key) {
  if (student?.examAbsences?.[key]) return 'Abwesend';
  const value = normalizeExamValue(student?.exams?.[key]);
  return value === '' ? '-' : `${Number(value).toFixed(2)}/100`;
}

export function calculateExamAverage(student) {
  const scores = examKeys
    .filter((key) => !student?.examAbsences?.[key])
    .map((key) => normalizeExamValue(student?.exams?.[key]))
    .filter((value) => value !== '' && value >= 0 && value <= 100);

  return {
    average: scores.length
      ? Number((scores.reduce((sum, value) => sum + Number(value), 0) / scores.length).toFixed(2))
      : null,
    completedCount: scores.length,
    absentCount: examKeys.filter((key) => student?.examAbsences?.[key]).length
  };
}

export function hasPassedExam(student) {
  const result = calculateExamAverage(student);
  return result.average !== null && result.average >= 60 && result.average <= 100;
}

export function hasAnyExamResult(student) {
  return examKeys.some((key) => student?.examAbsences?.[key] || normalizeExamValue(student?.exams?.[key]) !== '');
}

export function rankStudents(students = []) {
  const indexed = students.map((student, index) => ({
    student,
    index,
    result: calculateExamAverage(student)
  }));

  indexed.sort((a, b) => {
    const aScore = a.result.average;
    const bScore = b.result.average;
    if (aScore === null && bScore === null) return a.index - b.index;
    if (aScore === null) return 1;
    if (bScore === null) return -1;
    if (bScore !== aScore) return bScore - aScore;
    return a.index - b.index;
  });

  let previousAverage = null;
  let previousRank = 0;
  return indexed.map((item, index) => {
    const rank = item.result.average !== null && item.result.average === previousAverage
      ? previousRank
      : index + 1;
    previousAverage = item.result.average;
    previousRank = rank;
    return { ...item, rank };
  });
}
