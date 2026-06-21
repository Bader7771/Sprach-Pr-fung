import { Download, LogOut, Search, Upload } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import http from '../api/http.js';
import ClassForm from '../components/ClassForm.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import StatCard from '../components/StatCard.jsx';
import StudentForm from '../components/StudentForm.jsx';
import StudentTable from '../components/StudentTable.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { admin, logout } = useAuth();
  const fileRef = useRef(null);
  const [dark, setDark] = useState(localStorage.getItem('sms_theme') === 'dark');
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [classEdit, setClassEdit] = useState(null);
  const [studentEdit, setStudentEdit] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('sms_theme', dark ? 'dark' : 'light');
  }, [dark]);

  async function load(nextPage = page, nextQuery = query) {
    setLoading(true);
    const [classRes, studentRes, analyticsRes] = await Promise.all([
      http.get('/classes'),
      http.get('/students', { params: { page: nextPage, search: nextQuery } }),
      http.get('/analytics')
    ]);
    setClasses(classRes.data);
    setStudents(studentRes.data.data);
    setPages(studentRes.data.pages);
    setAnalytics(analyticsRes.data);
    setLoading(false);
  }

  useEffect(() => {
    load().catch((error) => toast.error(error.response?.data?.message || 'Failed to load dashboard'));
  }, [page]);

  async function submitClass(values) {
    if (classEdit) {
      await http.put(`/classes/${classEdit._id}`, values);
      toast.success('Class updated');
    } else {
      await http.post('/classes', values);
      toast.success('Class created');
    }
    setClassEdit(null);
    await load();
  }

  async function submitStudent(values) {
    if (studentEdit) {
      await http.put(`/students/${studentEdit._id}`, values);
      toast.success('Student updated');
    } else {
      await http.post('/students', values);
      toast.success('Student added');
    }
    setStudentEdit(null);
    await load();
  }

  async function deleteClass(item) {
    try {
      await http.delete(`/classes/${item._id}`);
      toast.success('Class deleted');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    } finally {
      setConfirm(null);
    }
  }

  async function deleteStudent(item) {
    await http.delete(`/students/${item._id}`);
    toast.success('Student deleted');
    setConfirm(null);
    await load();
  }

  async function certificate(student) {
    const response = await http.get(`/students/${student._id}/certificate`, { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${student.fullName.replace(/\s+/g, '_')}_certificate.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Certificate downloaded');
    await load();
  }

  async function exportExcel() {
    const response = await http.get('/students/export/excel', { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'students.xlsx';
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importExcel(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    const { data } = await http.post('/students/import/excel', form);
    toast.success(`Imported ${data.created} students`);
    event.target.value = '';
    await load();
  }

  const bestStudent = useMemo(() => analytics.bestStudent?.fullName || 'No students yet', [analytics]);

  return (
    <main className="dashboard">
      <aside className="sidebar">
        <div className="logo">GS</div>
        <nav>
          <a href="#overview">Overview</a>
          <a href="#classes">Classes</a>
          <a href="#students">Students</a>
          <a href="#reports">Reports</a>
        </nav>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Admin Dashboard</span>
            <h1>School Management</h1>
            <p>{admin?.name} · role-ready access layer</p>
          </div>
          <div className="topActions">
            <ThemeToggle dark={dark} onToggle={() => setDark(!dark)} />
            <button className="btn ghost" onClick={logout}><LogOut size={16} /> Logout</button>
          </div>
        </header>

        <section id="overview" className="statsGrid">
          <StatCard label="Total Classes" value={analytics.totalClasses} />
          <StatCard label="Total Groups" value={analytics.totalGroups} tone="blue" />
          <StatCard label="Total Students" value={analytics.totalStudents} tone="violet" />
          <StatCard label="Average Score" value={analytics.averageSchoolScore} tone="amber" />
          <StatCard label="Best Student" value={bestStudent} tone="rose" />
          <StatCard label="Certificates" value={analytics.certificatesGenerated} tone="green" />
        </section>

        <div className="gridTwo">
          <section id="classes" className="panel">
            <div className="panelHead">
              <h2>Class Management</h2>
              <span>{classes.length} records</span>
            </div>
            <ClassForm editing={classEdit} onSubmit={submitClass} onCancel={() => setClassEdit(null)} />
            <div className="miniList">
              {classes.map((item) => (
                <div key={item._id} className="miniItem">
                  <strong>{item.className}</strong>
                  <span>{item.groupNumber}</span>
                  <button className="btn tiny" onClick={() => setClassEdit(item)}>Edit</button>
                  <button className="btn tiny danger" onClick={() => setConfirm({ type: 'class', item })}>Delete</button>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panelHead">
              <h2>Student Form</h2>
              <span>4 exams auto-average</span>
            </div>
            <StudentForm classes={classes} editing={studentEdit} onSubmit={submitStudent} onCancel={() => setStudentEdit(null)} />
          </section>
        </div>

        <section id="students" className="panel">
          <div className="panelHead wrap">
            <div>
              <h2>Student Results</h2>
              <span>{loading ? 'Loading...' : `${students.length} visible rows`}</span>
            </div>
            <div className="toolbar">
              <form className="inlineSearch" onSubmit={(e) => { e.preventDefault(); setPage(1); load(1, query); }}>
                <Search size={16} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Global search" />
              </form>
              <button className="btn secondary" onClick={exportExcel}><Download size={16} /> Excel</button>
              <button className="btn secondary" onClick={() => fileRef.current.click()}><Upload size={16} /> Import</button>
              <input ref={fileRef} hidden type="file" accept=".xlsx,.xls" onChange={importExcel} />
            </div>
          </div>
          <StudentTable students={students} onEdit={setStudentEdit} onDelete={(item) => setConfirm({ type: 'student', item })} onCertificate={certificate} />
          <div className="pagination">
            <button className="btn ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span>Page {page} of {pages}</span>
            <button className="btn ghost" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </section>
      </section>

      <ConfirmModal
        open={Boolean(confirm)}
        title="Confirm deletion"
        message={`Delete ${confirm?.item?.fullName || confirm?.item?.className || 'this record'}?`}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm?.type === 'class' ? deleteClass(confirm.item) : deleteStudent(confirm.item)}
      />
    </main>
  );
}
