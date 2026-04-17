import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import BrandLogo from '../components/ui/BrandLogo';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const verifiedBanner = location.state?.verified;
  const prefilledEmail = location.state?.email || '';
  const [form, setForm] = useState({
    email: typeof prefilledEmail === 'string' ? prefilledEmail : '',
    password: '',
  });
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
        <div className="mb-5 flex items-center justify-center gap-2.5">
          <BrandLogo className="h-11 w-11 rounded-xl object-contain shadow-lg" />
          <span className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">HireBoard</span>
        </div>
        <h1 className="hb-card-title">Welcome back</h1>
        <p className="hb-card-subtitle">Log in to continue managing your job pipeline.</p>

        {verifiedBanner ? (
          <p className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
            Email verified. You can sign in now.
          </p>
        ) : null}

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

        <p className="mt-4 text-center text-sm">
          <Link
            className="font-semibold text-[var(--color-primary)]"
            to={form.email.trim() ? `/verify-email?email=${encodeURIComponent(form.email.trim())}` : '/verify-email'}
          >
            Verify email or resend code
          </Link>
        </p>

        <p className="mt-5 text-center text-sm hb-muted">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </Card>
    </div>
  );
}
