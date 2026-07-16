import { GraduationCap } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getErrorMessage } from '../api/http.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm({ defaultValues: { email: '', password: '' } });

  async function submit(values) {
    try {
      setLoading(true);
      await login(values.email, values.password);
      toast.success('Logged in');
      navigate('/admin');
    } catch (error) {
      toast.error(error.userMessage || getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="authPage">
      <section className="authPanel">
        <div className="brandMark"><GraduationCap size={30} /></div>
        <h1>Admin Login</h1>
        <p>Secure access to Sprach-Pr-fung classes, students, exams, and averages.</p>
        <form onSubmit={handleSubmit(submit)}>
          <label>Email<input type="email" {...register('email', { required: true })} /></label>
          <label>Password<input type="password" {...register('password', { required: true })} /></label>
          <button className="btn primary full" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
      </section>
    </main>
  );
}
