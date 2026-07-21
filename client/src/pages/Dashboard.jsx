import { FileDown, LogOut, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import http from '../api/http.js';
import ClassForm from '../components/ClassForm.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import StatCard from '../components/StatCard.jsx';
import StudentForm from '../components/StudentForm.jsx';
import StudentTable from '../components/StudentTable.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { buildAttestationPdf } from '../utils/attestationPdf.js';
import { calculateExamAverage, examKeys, getExamLabel, hasPassedExam } from '../utils/results.js';

function studentName(student) {
  return student?.fullName || [student?.firstName, student?.lastName].filter(Boolean).join(' ');
}

export default function Dashboard() {
  const { admin, logout } = useAuth();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState({ recentStudents: [] });
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [classEdit, setClassEdit] = useState(null);
  const [studentEdit, setStudentEdit] = useState(null);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [noteEdit, setNoteEdit] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingStudentId, setSavingStudentId] = useState('');
  const [generatingAttestationId, setGeneratingAttestationId] = useState('');

  const selectedClass = useMemo(
    () => classes.find((item) => item._id === selectedClassId),
    [classes, selectedClassId]
  );

  async function loadClasses() {
    const [{ data: classData }, { data: analyticsData }] = await Promise.all([
      http.get('/classes'),
      http.get('/analytics')
    ]);
    setClasses(classData);
    setAnalytics(analyticsData);
    if (!selectedClassId && classData.length) setSelectedClassId(classData[0]._id);
  }

  async function loadStudents(classId = selectedClassId, search = query) {
    if (!classId) {
      setStudents([]);
      return;
    }
    const { data } = await http.get('/students', {
      params: { classId, search, limit: 200 }
    });
    setStudents(data.data);
    if (selectedStudent) {
      const refreshed = data.data.find((item) => item._id === selectedStudent._id);
      setSelectedStudent(refreshed || null);
    }
  }

  async function loadAll() {
    try {
      setLoading(true);
      await loadClasses();
    } catch (error) {
      toast.error(error.userMessage || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    loadStudents().catch((error) => toast.error(error.userMessage || 'Failed to load students'));
  }, [selectedClassId]);

  async function submitClass(values) {
    try {
      if (classEdit) {
        await http.put(`/classes/${classEdit._id}`, values);
        toast.success('Class updated');
      } else {
        await http.post('/classes', values);
        toast.success('Class created');
      }
      setClassEdit(null);
      await loadClasses();
    } catch (error) {
      toast.error(error.userMessage || 'Class save failed');
    }
  }

  async function deleteClass(item) {
    try {
      await http.delete(`/classes/${item._id}`);
      toast.success('Class deleted');
      setConfirm(null);
      if (selectedClassId === item._id) {
        setSelectedClassId('');
        setSelectedStudent(null);
      }
      await loadClasses();
    } catch (error) {
      toast.error(error.userMessage || 'Delete failed');
    }
  }

  async function submitStudent(values) {
    try {
      const payload = { ...values, classRoom: selectedClassId };
      if (studentEdit) {
        await http.put(`/students/${studentEdit._id}`, payload);
        toast.success('Student updated');
      } else {
        await http.post('/students', payload);
        toast.success('Student added');
      }
      setStudentEdit(null);
      setShowStudentForm(false);
      await Promise.all([loadStudents(), loadClasses()]);
    } catch (error) {
      toast.error(error.userMessage || 'Student save failed');
    }
  }

  async function deleteStudent(item) {
    try {
      await http.delete(`/students/${item._id}`);
      toast.success('Student deleted');
      setConfirm(null);
      if (selectedStudent?._id === item._id) setSelectedStudent(null);
      await Promise.all([loadStudents(), loadClasses()]);
    } catch (error) {
      toast.error(error.userMessage || 'Delete failed');
    }
  }

  function startAddStudent() {
    if (!selectedClassId) {
      toast.info('Create or select a class first');
      return;
    }
    setStudentEdit(null);
    setShowStudentForm(true);
  }

  async function saveStudentExams(student, draft) {
    const invalidExam = examKeys.find((key) => {
      if (draft.examAbsences[key] || draft.exams[key] === '') return false;
      const value = Number(draft.exams[key]);
      return !Number.isFinite(value) || value < 0 || value > 20;
    });

    if (invalidExam) {
      toast.error(`${getExamLabel(invalidExam)} score must be between 0 and 20.`);
      return;
    }

    try {
      setSavingStudentId(student._id);
      const payload = {
        firstName: student.firstName || student.fullName?.split(' ')[0] || '',
        lastName: student.lastName || student.fullName?.split(' ').slice(1).join(' ') || '',
        studentNumber: student.studentNumber || '',
        dateOfBirth: student.dateOfBirth || '',
        examLevel: student.examLevel || '',
        comments: student.comments || '',
        classRoom: student.classRoom || selectedClassId,
        notes: student.notes || [],
        exams: Object.fromEntries(examKeys.map((key) => [
          key,
          draft.examAbsences[key] || draft.exams[key] === '' ? undefined : Number(draft.exams[key])
        ])),
        examAbsences: draft.examAbsences
      };
      const { data } = await http.put(`/students/${student._id}`, payload);
      setStudents((current) => current.map((item) => item._id === data._id ? data : item));
      if (selectedStudent?._id === data._id) setSelectedStudent(data);
      toast.success('Exam results saved');
      await loadClasses();
    } catch (error) {
      toast.error(error.userMessage || 'Exam results save failed');
    } finally {
      setSavingStudentId('');
    }
  }

  async function printAttestation(student) {
    if (!hasPassedExam(student)) {
      toast.info('Attestation is available only for students with an average of 10/20 or higher.');
      return;
    }

    try {
      setGeneratingAttestationId(student._id);
      const { doc, fileName } = buildAttestationPdf(student, student.className || selectedClass?.className);
      doc.save(fileName);
      toast.success('Attestation PDF generated');
    } catch (error) {
      toast.error(error.message || 'Attestation PDF could not be generated. Please try again.');
    } finally {
      setGeneratingAttestationId('');
    }
  }

  return (
    <main className="dashboard simple">
      <header className="appHeader">
        <div>
          <span className="eyebrow">Sprach-Pr-fung Admin</span>
          <h1>Classes and Exam Results</h1>
          <p>{admin?.name || admin?.email}</p>
        </div>
        <button className="btn ghost" onClick={logout}><LogOut size={16} /> Logout</button>
      </header>

      <section className="statsGrid">
        <StatCard label="Total Classes" value={analytics.totalClasses} />
        <StatCard label="Total Students" value={analytics.totalStudents} tone="blue" />
        <StatCard label="Average Grade" value={analytics.averageGrade ?? 0} tone="amber" />
        <StatCard label="Recent Students" value={analytics.recentStudents?.length || 0} tone="green" />
      </section>

      <section className="dashboardGrid">
        <aside className="panel classPanel">
          <div className="panelHead">
            <div>
              <h2>Classes</h2>
              <span>{loading ? 'Loading...' : `${classes.length} total`}</span>
            </div>
          </div>
          <ClassForm editing={classEdit} onSubmit={submitClass} onCancel={() => setClassEdit(null)} />
          <div className="classList">
            {classes.map((item) => (
              <button
                key={item._id}
                className={`classItem ${selectedClassId === item._id ? 'active' : ''}`}
                onClick={() => { setSelectedClassId(item._id); setSelectedStudent(null); }}
              >
                <span>
                  <strong>{item.className}</strong>
                  <small>{item.studentCount || 0} students</small>
                </span>
                <span className="classActions">
                  <span className="miniBtn" onClick={(event) => { event.stopPropagation(); setClassEdit(item); }}>Edit</span>
                  <span className="miniBtn danger" onClick={(event) => { event.stopPropagation(); setConfirm({ type: 'class', item }); }}>Delete</span>
                </span>
              </button>
            ))}
            {!classes.length && <p className="emptyState">No classes yet. Create your first class.</p>}
          </div>
        </aside>

        <section className="panel studentsPanel">
          <div className="panelHead wrap">
            <div>
              <h2>{selectedClass ? `Class: ${selectedClass.className}` : 'Students'}</h2>
              <span>{students.length ? `${students.length} students` : 'No students yet.'}</span>
            </div>
            <div className="toolbar">
              <form className="inlineSearch" onSubmit={(event) => { event.preventDefault(); loadStudents(selectedClassId, query); }}>
                <Search size={16} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search student" />
              </form>
              <button className="btn primary" onClick={startAddStudent}><Plus size={16} /> Add Student</button>
            </div>
          </div>

          {showStudentForm && (
            <div className="subPanel">
              <StudentForm
                editing={studentEdit}
                onSubmit={submitStudent}
                onCancel={() => { setStudentEdit(null); setShowStudentForm(false); }}
              />
            </div>
          )}

          <StudentTable
            students={students}
            onView={setSelectedStudent}
            onEdit={(student) => { setStudentEdit(student); setShowStudentForm(true); }}
            onDelete={(student) => setConfirm({ type: 'student', item: student })}
            onSaveExams={saveStudentExams}
            onPrintAttestation={printAttestation}
            savingStudentId={savingStudentId}
            generatingAttestationId={generatingAttestationId}
          />
        </section>
      </section>

      <section className="panel detailPanel">
        {selectedStudent ? (
          <>
            <div className="panelHead wrap">
              <div>
                <h2>{studentName(selectedStudent)}</h2>
                <span>Average: {calculateExamAverage(selectedStudent).average?.toFixed(2) ?? Number(selectedStudent.finalNote || 0).toFixed(2)}</span>
              </div>
              <div className="rowActions">
                {hasPassedExam(selectedStudent) && (
                  <button
                    className="btn secondary"
                    onClick={() => printAttestation(selectedStudent)}
                    disabled={generatingAttestationId === selectedStudent._id}
                  >
                    <FileDown size={16} />
                    {generatingAttestationId === selectedStudent._id ? 'Generating...' : 'Print Attestation'}
                  </button>
                )}
                <button className="btn danger" onClick={() => setConfirm({ type: 'student', item: selectedStudent })}><Trash2 size={16} /> Delete Student</button>
              </div>
            </div>
            {selectedStudent.comments && <p className="studentComment">{selectedStudent.comments}</p>}
            <div className="examSummaryGrid">
              {examKeys.map((key) => {
                const absent = selectedStudent.examAbsences?.[key];
                const value = selectedStudent.exams?.[key];
                return (
                  <article className="examSummary" key={key}>
                    <span>{getExamLabel(key)}</span>
                    <strong>{absent ? 'Absent' : Number.isFinite(Number(value)) ? `${Number(value).toFixed(2)}/20` : '-'}</strong>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <p className="emptyState">Select a student to view exam results.</p>
        )}
      </section>

      <ConfirmModal
        open={Boolean(confirm)}
        title="Confirm deletion"
        message={`Delete ${studentName(confirm?.item) || confirm?.item?.className || 'this record'}?`}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm?.type === 'class' ? deleteClass(confirm.item) : deleteStudent(confirm.item)}
      />
    </main>
  );
}
