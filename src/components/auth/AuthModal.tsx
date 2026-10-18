import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Shield,
  User,
  X,
} from 'lucide-react';
import { apiLogin, apiRegister, type AuthUserProfile } from '../../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUserProfile) => void;
  initialMode?: 'login' | 'register';
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'candidate' | 'recruiter'>('candidate');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validation
    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        const res = await apiLogin({
          email: email.trim(),
          password,
        });
        setSuccessMsg(`Welcome back, ${res.user.name}!`);
        setTimeout(() => {
          onSuccess(res.user);
          onClose();
        }, 500);
      } else {
        const res = await apiRegister({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
        });
        setSuccessMsg(`Account created! Welcome, ${res.user.name}.`);
        setTimeout(() => {
          onSuccess(res.user);
          onClose();
        }, 500);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string, demoRole: 'recruiter' | 'candidate') => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await apiLogin({
        email: demoEmail,
        password: 'password123',
      });
      setSuccessMsg(`Logged in as Demo ${demoRole === 'recruiter' ? 'Recruiter' : 'Candidate'}!`);
      setTimeout(() => {
        onSuccess(res.user);
        onClose();
      }, 400);
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close authentication modal"
        onClick={onClose}
        className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="proof-scale-in relative z-10 w-full max-w-[440px] rounded-card border border-line bg-surface p-6 shadow-pop sm:p-7"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-[6px] p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <X size={18} aria-hidden="true" />
        </button>

        {/* Modal Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accentSoft text-accent">
            <Shield size={24} strokeWidth={2.2} />
          </div>
          <h2 id="auth-modal-title" className="mt-3 text-[20px] font-bold text-ink">
            {mode === 'login' ? 'Sign In to PROOF' : 'Create an Account'}
          </h2>
          <p className="mt-1 text-[13px] text-muted">
            {mode === 'login'
              ? 'Access your coding assessments, telemetry, and evaluations'
              : 'Join as a candidate or reviewer for evidence-backed assessment'}
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="mt-5 grid grid-cols-2 rounded-[8px] bg-surface-2 p-1 text-[13px] font-semibold text-muted">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`rounded-[6px] py-1.5 transition-colors ${
              mode === 'login' ? 'bg-surface text-ink shadow-sm' : 'hover:text-ink'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`rounded-[6px] py-1.5 transition-colors ${
              mode === 'register' ? 'bg-surface text-ink shadow-sm' : 'hover:text-ink'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error ? (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-[6px] border border-danger/30 bg-dangerSoft/40 p-3 text-[13px] text-danger"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p className="leading-snug">{error}</p>
          </div>
        ) : null}

        {/* Success Alert */}
        {successMsg ? (
          <div
            role="status"
            className="mt-4 flex items-start gap-2.5 rounded-[6px] border border-success/30 bg-successSoft/40 p-3 text-[13px] text-success"
          >
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <p className="leading-snug">{successMsg}</p>
          </div>
        ) : null}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-[12px] font-semibold text-ink">Full Name</label>
              <div className="relative mt-1">
                <User size={15} className="absolute left-3 top-3 text-muted" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rehan Kwatla"
                  className="w-full rounded-[6px] border border-line bg-surface py-2 pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[12px] font-semibold text-ink">Email Address</label>
            <div className="relative mt-1">
              <Mail size={15} className="absolute left-3 top-3 text-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-[6px] border border-line bg-surface py-2 pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-[12px] font-semibold text-ink">Password</label>
            </div>
            <div className="relative mt-1">
              <Lock size={15} className="absolute left-3 top-3 text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-[6px] border border-line bg-surface py-2 pl-9 pr-10 text-[13px] text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-2.5 text-muted hover:text-ink"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-[12px] font-semibold text-ink">Confirm Password</label>
                <div className="relative mt-1">
                  <KeyRound size={15} className="absolute left-3 top-3 text-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full rounded-[6px] border border-line bg-surface py-2 pl-9 pr-3 text-[13px] text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-ink">Account Role</label>
                <div className="mt-1 grid grid-cols-2 gap-2 text-[12px]">
                  <button
                    type="button"
                    onClick={() => setRole('candidate')}
                    className={`flex items-center justify-center gap-1.5 rounded-[6px] border p-2 font-medium transition-colors ${
                      role === 'candidate'
                        ? 'border-accent bg-accentSoft/30 text-accent font-semibold'
                        : 'border-line text-muted hover:bg-surface-2'
                    }`}
                  >
                    Candidate
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('recruiter')}
                    className={`flex items-center justify-center gap-1.5 rounded-[6px] border p-2 font-medium transition-colors ${
                      role === 'recruiter'
                        ? 'border-accent bg-accentSoft/30 text-accent font-semibold'
                        : 'border-line text-muted hover:bg-surface-2'
                    }`}
                  >
                    Recruiter / Reviewer
                  </button>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-[6px] bg-accent py-2.5 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-accent/90 disabled:opacity-60"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
          </button>
        </form>

        {/* Demo Fast Login Helper */}
        <div className="mt-5 border-t border-line pt-4">
          <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted">
            Or Sign In With Demo Account
          </p>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickDemoLogin('candidate@proof.dev', 'candidate')}
              className="flex items-center justify-center gap-1.5 rounded-[6px] border border-line bg-surface-2/60 px-3 py-2 text-[12px] font-medium text-ink transition-colors hover:bg-surface-2"
            >
              <span>Demo Candidate</span>
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickDemoLogin('recruiter@proof.dev', 'recruiter')}
              className="flex items-center justify-center gap-1.5 rounded-[6px] border border-line bg-surface-2/60 px-3 py-2 text-[12px] font-medium text-ink transition-colors hover:bg-surface-2"
            >
              <span>Demo Recruiter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
