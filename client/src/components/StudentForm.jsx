import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

const empty = { fullName: '', classRoom: '', exam1: 0, exam2: 0, exam3: 0, exam4: 0 };

export default function StudentForm({ classes, editing, onSubmit, onCancel }) {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({ defaultValues: empty });

  useEffect(() => {
    if (editing) {
      reset({
        fullName: editing.fullName,
        classRoom: editing.classRoom,
        exam1: editing.exams.exam1,
        exam2: editing.exams.exam2,
        exam3: editing.exams.exam3,
        exam4: editing.exams.exam4
      });
    } else {
      reset(empty);
    }
  }, [editing, reset]);

  return (
    <form className="formGrid studentForm" onSubmit={handleSubmit(onSubmit)}>
      <label>
        Full Name
        <input {...register('fullName', { required: true })} placeholder="Student full name" />
      </label>
      <label>
        Class / Group
        <select {...register('classRoom', { required: true })}>
          <option value="">Select class</option>
          {classes.map((item) => (
            <option key={item._id} value={item._id}>{item.className} - {item.groupNumber}</option>
          ))}
        </select>
      </label>
      {[1, 2, 3, 4].map((n) => (
        <label key={n}>
          Exam {n} Note
          <input type="number" min="0" max="20" step="0.01" {...register(`exam${n}`, { required: true, valueAsNumber: true })} />
        </label>
      ))}
      <div className="formActions wide">
        {editing && <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>}
        <button className="btn primary" disabled={isSubmitting}>{editing ? 'Update Student' : 'Add Student'}</button>
      </div>
    </form>
  );
}
