import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login(form);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    navigate('/dashboard', { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-5">
      <Card className="w-full max-w-md p-8">
        <h1 className="hb-card-title">Welcome back</h1>
        <p className="hb-card-subtitle">Log in to continue managing your job pipeline.</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            label="Email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />

          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            label="Password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            required
          />

          {error ? <p className="hb-error">{error}</p> : null}

          <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
            Login
          </Button>
        </form>

        <p className="mt-5 text-center text-sm hb-muted">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </Card>
    </div>
  );
}
