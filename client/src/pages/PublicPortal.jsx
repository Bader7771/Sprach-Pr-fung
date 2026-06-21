import { Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import http from '../api/http.js';
import StudentTable from '../components/StudentTable.jsx';

export default function PublicPortal() {
  const [filters, setFilters] = useState({ className: '', groupNumber: '', name: '' });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  async function search(event) {
    event.preventDefault();
    setLoading(true);
    const { data } = await http.get('/students/public', { params: { ...filters, limit: 50 } });
    setStudents(data.data);
    setLoading(false);
  }

  return (
    <main className="publicPage">
      <header className="publicHeader">
        <div>
          <span className="eyebrow">Student Portal</span>
          <h1>View exam results</h1>
          <p>Search by class, group, and student name to view official notes.</p>
        </div>
        <Link className="btn secondary" to="/login">Admin Login</Link>
      </header>
      <form className="searchPanel" onSubmit={search}>
        <label>Class Name<input value={filters.className} onChange={(e) => setFilters({ ...filters, className: e.target.value })} placeholder="1st Year" /></label>
        <label>Group Number<input value={filters.groupNumber} onChange={(e) => setFilters({ ...filters, groupNumber: e.target.value })} placeholder="Group A" /></label>
        <label>Student Name<input value={filters.name} onChange={(e) => setFilters({ ...filters, name: e.target.value })} placeholder="Full name" /></label>
        <button className="btn primary"><Search size={16} /> {loading ? 'Searching...' : 'Search'}</button>
      </form>
      <section className="panel">
        <StudentTable students={students} showActions={false} />
      </section>
    </main>
  );
}
