import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

export default function ClassForm({ editing, onSubmit, onCancel }) {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { className: '' }
  });

  useEffect(() => {
    reset(editing || { className: '' });
  }, [editing, reset]);

  return (
    <form className="formGrid" onSubmit={handleSubmit(onSubmit)}>
      <label>
        Class Name
        <input {...register('className', { required: true })} placeholder="1A" />
      </label>
      <div className="formActions">
        {editing && <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>}
        <button className="btn primary" disabled={isSubmitting}>{editing ? 'Update Class' : 'Create Class'}</button>
      </div>
    </form>
  );
}
