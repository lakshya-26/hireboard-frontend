import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import BrandLogo from '../components/ui/BrandLogo';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
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

    const result = await register(form);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    navigate('/verify-email', {
      replace: true,
      state: { email: form.email.trim().toLowerCase() },
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-5">
      <Card className="w-full max-w-md p-8">
        <div className="mb-5 flex items-center justify-center gap-2.5">
          <BrandLogo className="h-11 w-11 rounded-xl object-contain shadow-lg" />
          <span className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">HireBoard</span>
        </div>
        <h1 className="hb-card-title">Create account</h1>
        <p className="hb-card-subtitle">Start organizing your job search professionally.</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            label="Name"
            placeholder="Your full name"
            value={form.name}
            onChange={handleChange}
            required
          />

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
            autoComplete="new-password"
            label="Password"
            placeholder="Create a strong password"
            value={form.password}
            onChange={handleChange}
            required
          />

          {error ? <p className="hb-error">{error}</p> : null}

          <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
            Create Account
          </Button>
        </form>

        <p className="mt-5 text-center text-sm hb-muted">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </Card>
    </div>
  );
}
