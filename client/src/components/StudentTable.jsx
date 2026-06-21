import { Download, Edit, FileText, Trash2 } from 'lucide-react';

export default function StudentTable({ students, onEdit, onDelete, onCertificate, showActions = true }) {
  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Class</th>
            <th>Group</th>
            <th>Exam 1</th>
            <th>Exam 2</th>
            <th>Exam 3</th>
            <th>Exam 4</th>
            <th>Final Note</th>
            {showActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student._id}>
              <td>{student.fullName}</td>
              <td>{student.className}</td>
              <td>{student.groupNumber}</td>
              <td>{student.exams.exam1}</td>
              <td>{student.exams.exam2}</td>
              <td>{student.exams.exam3}</td>
              <td>{student.exams.exam4}</td>
              <td><strong>{student.finalNote}</strong></td>
              {showActions && (
                <td>
                  <div className="rowActions">
                    <button className="iconBtn" onClick={() => onEdit(student)} title="Edit"><Edit size={16} /></button>
                    <button className="iconBtn" onClick={() => onCertificate(student)} title="Generate and download certificate"><FileText size={16} /><Download size={14} /></button>
                    <button className="iconBtn dangerText" onClick={() => onDelete(student)} title="Delete"><Trash2 size={16} /></button>
                  </div>
                </td>
              )}
            </tr>
          ))}
          {!students.length && (
            <tr>
              <td colSpan={showActions ? 9 : 8} className="empty">No students found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
