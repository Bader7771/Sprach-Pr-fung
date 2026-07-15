import { Eye, Pencil, Trash2 } from 'lucide-react';

function studentName(student) {
  return student.fullName || [student.firstName, student.lastName].filter(Boolean).join(' ');
}

export default function StudentTable({ students, onView, onEdit, onDelete }) {
  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Student Number</th>
            <th>Notes</th>
            <th>Average</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student._id}>
              <td><strong>{studentName(student)}</strong></td>
              <td>{student.studentNumber || '-'}</td>
              <td>{student.notes?.length || 0}</td>
              <td><strong>{Number(student.finalNote || 0).toFixed(2)}</strong></td>
              <td>{student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '-'}</td>
              <td>
                <div className="rowActions">
                  <button className="iconBtn" onClick={() => onView(student)} title="View student"><Eye size={16} /></button>
                  <button className="iconBtn" onClick={() => onEdit(student)} title="Edit student"><Pencil size={16} /></button>
                  <button className="iconBtn dangerText" onClick={() => onDelete(student)} title="Delete student"><Trash2 size={16} /></button>
                </div>
              </td>
            </tr>
          ))}
          {!students.length && (
            <tr>
              <td colSpan="6" className="empty">No students yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
