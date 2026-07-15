import { LogOut, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import http from '../api/http.js';
import ClassForm from '../components/ClassForm.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import NoteForm from '../components/NoteForm.jsx';
import StatCard from '../components/StatCard.jsx';
import StudentForm from '../components/StudentForm.jsx';
import StudentTable from '../components/StudentTable.jsx';
import { useAuth } from '../context/AuthContext.jsx';

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

  async function submitNote(values) {
    if (!selectedStudent) return;
    try {
      if (noteEdit) {
        const { data } = await http.put(`/students/${selectedStudent._id}/notes/${noteEdit._id}`, values);
        setSelectedStudent(data);
        toast.success('Note updated');
      } else {
        const { data } = await http.post(`/students/${selectedStudent._id}/notes`, values);
        setSelectedStudent(data);
        toast.success('Note added');
      }
      setNoteEdit(null);
      await Promise.all([loadStudents(), loadClasses()]);
    } catch (error) {
      toast.error(error.userMessage || 'Note save failed');
    }
  }

  async function deleteNote(note) {
    if (!selectedStudent) return;
    try {
      const { data } = await http.delete(`/students/${selectedStudent._id}/notes/${note._id}`);
      setSelectedStudent(data);
      toast.success('Note deleted');
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

  return (
    <main className="dashboard simple">
      <header className="appHeader">
        <div>
          <span className="eyebrow">EGIM Admin</span>
          <h1>Classes and Student Notes</h1>
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
          />
        </section>
      </section>

      <section className="panel detailPanel">
        {selectedStudent ? (
          <>
            <div className="panelHead wrap">
              <div>
                <h2>{studentName(selectedStudent)}</h2>
                <span>Average: {Number(selectedStudent.finalNote || 0).toFixed(2)}</span>
              </div>
              <button className="btn danger" onClick={() => setConfirm({ type: 'student', item: selectedStudent })}><Trash2 size={16} /> Delete Student</button>
            </div>
            {selectedStudent.comments && <p className="studentComment">{selectedStudent.comments}</p>}
            <div className="notesLayout">
              <div className="notesList">
                {(selectedStudent.notes || []).map((note) => (
                  <div className="noteItem" key={note._id}>
                    <span>
                      <strong>{note.subject}</strong>
                      {note.comment && <small>{note.comment}</small>}
                    </span>
                    <strong>{Number(note.grade).toFixed(2)}</strong>
                    <button className="btn tiny" onClick={() => setNoteEdit(note)}>Edit</button>
                    <button className="btn tiny danger" onClick={() => deleteNote(note)}>Delete</button>
                  </div>
                ))}
                {!selectedStudent.notes?.length && <p className="emptyState">No notes yet.</p>}
              </div>
              <div className="subPanel">
                <h3>{noteEdit ? 'Edit Note' : 'Add Note'}</h3>
                <NoteForm editing={noteEdit} onSubmit={submitNote} onCancel={() => setNoteEdit(null)} />
              </div>
            </div>
          </>
        ) : (
          <p className="emptyState">Select a student to view notes.</p>
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
