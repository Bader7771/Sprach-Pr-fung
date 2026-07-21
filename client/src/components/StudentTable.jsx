import { FileDown, Eye, Pencil, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { calculateExamAverage, examKeys, getExamLabel, getStudentName, hasPassedExam, normalizeExamValue } from '../utils/results.js';

function studentName(student) {
  return getStudentName(student);
}

function buildDraft(student) {
  return {
    exams: Object.fromEntries(examKeys.map((key) => [key, normalizeExamValue(student?.exams?.[key])])),
    examAbsences: Object.fromEntries(examKeys.map((key) => [key, Boolean(student?.examAbsences?.[key])]))
  };
}

function ExamEditorRow({ student, onView, onEdit, onDelete, onSaveExams, onPrintAttestation, saving, generatingAttestation }) {
  const [draft, setDraft] = useState(() => buildDraft(student));
  const average = calculateExamAverage({ ...student, ...draft });
  const passed = hasPassedExam(student);

  useEffect(() => {
    setDraft(buildDraft(student));
  }, [student]);

  function updateScore(key, value) {
    setDraft((current) => ({
      ...current,
      exams: { ...current.exams, [key]: value }
    }));
  }

  function updateAbsence(key, checked) {
    setDraft((current) => ({
      exams: { ...current.exams, [key]: checked ? '' : current.exams[key] },
      examAbsences: { ...current.examAbsences, [key]: checked }
    }));
  }

  return (
    <tr>
      <td><strong>{studentName(student)}</strong></td>
      <td>{student.studentNumber || '-'}</td>
      {examKeys.map((key) => (
        <td key={key}>
          <div className="examEditCell">
            <label className="srOnly" htmlFor={`${student._id}-${key}`}>{getExamLabel(key)} score</label>
            <input
              id={`${student._id}-${key}`}
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={draft.exams[key]}
              disabled={draft.examAbsences[key]}
              onChange={(event) => updateScore(key, event.target.value)}
              aria-label={`${getExamLabel(key)} score for ${studentName(student)}`}
            />
            <label className="absenceToggle">
              <input
                type="checkbox"
                checked={draft.examAbsences[key]}
                onChange={(event) => updateAbsence(key, event.target.checked)}
              />
              <span>Absent</span>
            </label>
          </div>
        </td>
      ))}
      <td>
        <strong>{average.average === null ? '-' : `${average.average.toFixed(2)}/100`}</strong>
        {average.absentCount > 0 && <small className="mutedLine">{average.absentCount} absent</small>}
      </td>
      <td>
        <div className="rowActions">
          <button className="iconBtn" onClick={() => onSaveExams(student, draft)} disabled={saving} title="Save exam results" aria-label={`Save exam results for ${studentName(student)}`}>
            <Save size={16} />
          </button>
          {passed && (
            <button
              className="iconBtn"
              onClick={() => onPrintAttestation(student)}
              disabled={generatingAttestation}
              title="Print Attestation"
              aria-label={`Print Attestation for ${studentName(student)}`}
            >
              <FileDown size={16} />
            </button>
          )}
          <button className="iconBtn" onClick={() => onView(student)} title="View student" aria-label={`View ${studentName(student)}`}><Eye size={16} /></button>
          <button className="iconBtn" onClick={() => onEdit(student)} title="Edit student" aria-label={`Edit ${studentName(student)}`}><Pencil size={16} /></button>
          <button className="iconBtn dangerText" onClick={() => onDelete(student)} title="Delete student" aria-label={`Delete ${studentName(student)}`}><Trash2 size={16} /></button>
        </div>
      </td>
    </tr>
  );
}

export default function StudentTable({
  students,
  onView,
  onEdit,
  onDelete,
  onSaveExams,
  onPrintAttestation,
  savingStudentId,
  generatingAttestationId
}) {
  return (
    <div className="tableWrap">
      <table className="studentExamTable">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Student Number</th>
            {examKeys.map((key) => <th key={key}>{getExamLabel(key)}</th>)}
            <th>Average</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <ExamEditorRow
              key={student._id}
              student={student}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onSaveExams={onSaveExams}
              saving={savingStudentId === student._id}
              onPrintAttestation={onPrintAttestation}
              generatingAttestation={generatingAttestationId === student._id}
            />
          ))}
          {!students.length && (
            <tr>
              <td colSpan="8" className="empty">No students yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
