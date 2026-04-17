import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import BrandLogo from '../components/ui/BrandLogo';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { api, getApiErrorMessage } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const fromNav = location.state?.email;
    const fromQuery = searchParams.get('email');
    const next = (fromNav || fromQuery || '').trim().toLowerCase();
    if (next) {
      setEmail((prev) => (prev ? prev : next));
    }
  }, [location.state, searchParams.get('email')]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleVerify(event) {
    event.preventDefault();
    setError('');
    setInfo('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Enter the email you used to register.');
      return;
    }
    const digits = otp.replace(/\D/g, '');
    if (digits.length !== 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setIsVerifying(true);
    try {
      await api.post('/auth/verify-otp', { email: trimmed, otp: digits });
      navigate('/login', { replace: true, state: { verified: true, email: trimmed } });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    setError('');
    setInfo('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Enter your email first, then resend the code.');
      return;
    }
    setIsResending(true);
    try {
      await api.post('/auth/send-otp', { email: trimmed });
      setInfo('A new code was sent. It expires in 10 minutes.');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-5">
      <Card className="w-full max-w-md p-8">
        <div className="mb-5 flex items-center justify-center gap-2.5">
          <BrandLogo className="h-9 w-auto max-w-[100px] sm:h-10 sm:max-w-[112px]" alt="" />
          <span className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">HireBoard</span>
        </div>
        <h1 className="hb-card-title">Verify your email</h1>
        <p className="hb-card-subtitle">
          Enter the 6-digit code we sent you. You need to verify before you can sign in.
        </p>

        <form onSubmit={handleVerify} className="mt-7 space-y-4">
          <Input
            id="verify-email"
            name="email"
            type="email"
            autoComplete="email"
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            id="verify-otp"
            name="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            label="Verification code"
            placeholder="000000"
            maxLength={12}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
          />

          {error ? <p className="hb-error">{error}</p> : null}
          {info ? <p className="text-sm font-medium text-emerald-700">{info}</p> : null}

          <Button type="submit" loading={isVerifying} disabled={isVerifying}>
            Verify email
          </Button>
        </form>

        <div className="mt-4">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            loading={isResending}
            disabled={isResending}
            onClick={() => void handleResend()}
          >
            Resend code
          </Button>
        </div>

        <p className="mt-6 text-center text-sm hb-muted">
          <Link to="/login">Back to login</Link>
          {' · '}
          <Link to="/register">Register</Link>
        </p>
      </Card>
    </div>
  );
}
