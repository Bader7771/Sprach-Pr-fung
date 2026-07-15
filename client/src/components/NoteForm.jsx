import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

const empty = { subject: '', grade: 0, comment: '' };

export default function NoteForm({ editing, onSubmit, onCancel }) {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({ defaultValues: empty });

  useEffect(() => {
    reset(editing || empty);
  }, [editing, reset]);

  return (
    <form className="noteForm" onSubmit={handleSubmit(onSubmit)}>
      <label>
        Subject
        <input {...register('subject', { required: true })} placeholder="German" />
      </label>
      <label>
        Grade
        <input type="number" min="0" max="20" step="0.01" {...register('grade', { required: true, valueAsNumber: true })} />
      </label>
      <label>
        Comment
        <input {...register('comment')} placeholder="Optional" />
      </label>
      <div className="formActions">
        {editing && <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>}
        <button className="btn primary" disabled={isSubmitting}>{editing ? 'Update Note' : 'Add Note'}</button>
      </div>
    </form>
  );
}
