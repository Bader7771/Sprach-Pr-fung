import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

const empty = { firstName: '', lastName: '', studentNumber: '', dateOfBirth: '', examLevel: '', comments: '' };

function dateInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

export default function StudentForm({ editing, onSubmit, onCancel }) {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({ defaultValues: empty });

  useEffect(() => {
    if (editing) {
      reset({
        firstName: editing.firstName || editing.fullName?.split(' ')[0] || '',
        lastName: editing.lastName || editing.fullName?.split(' ').slice(1).join(' ') || '',
        studentNumber: editing.studentNumber || '',
        dateOfBirth: dateInputValue(editing.dateOfBirth),
        examLevel: editing.examLevel || '',
        comments: editing.comments || ''
      });
    } else {
      reset(empty);
    }
  }, [editing, reset]);

  return (
    <form className="formGrid studentForm" onSubmit={handleSubmit(onSubmit)}>
      <label>
        First Name
        <input {...register('firstName', { required: true })} placeholder="Ahmed" />
      </label>
      <label>
        Last Name
        <input {...register('lastName', { required: true })} placeholder="Mohamed" />
      </label>
      <label>
        Student Number
        <input {...register('studentNumber')} placeholder="Optional" />
      </label>
      <label>
        Date of Birth
        <input type="date" {...register('dateOfBirth', { required: true })} />
      </label>
      <label>
        Exam Level
        <select {...register('examLevel')}>
          <option value="">Not specified</option>
          {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => <option key={level} value={level}>{level}</option>)}
        </select>
      </label>
      <label className="wide">
        Comments
        <textarea {...register('comments')} placeholder="Optional comments" rows="3" />
      </label>
      <div className="formActions wide">
        {editing && <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>}
        <button className="btn primary" disabled={isSubmitting}>{editing ? 'Update Student' : 'Add Student'}</button>
      </div>
    </form>
  );
}
