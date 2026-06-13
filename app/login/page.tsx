'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, KeyRound, AlertTriangle, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { fetchCurrentUser } from '@/lib/api';

type LoginStep = 'credentials' | 'totp' | 'success';

interface LoginResponse {
  ok: boolean;
  requires2fa?: boolean;
  user?: { email?: string; name?: string };
  error?: string;
  retryAfter?: number;
}

export default function LoginPage() {
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<LoginStep>('credentials');
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  // Check if already authenticated
  useEffect(() => {
    fetchCurrentUser().then((user) => {
      if (user) router.replace('/');
    });
  }, [router]);

  // Handle auto-submit when 6 digits entered
  useEffect(() => {
    if (step === 'totp' && totpCode.replace(/\D/g, '').length === 6 && !loading) {
      handleTotpSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totpCode, step]);

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data: LoginResponse = await res.json();

      if (!res.ok) {
        setError(data.error || 'خطا در ورود');
        if (data.retryAfter) {
          setRetryAfter(data.retryAfter);
        }
        return;
      }

      if (data.requires2fa) {
        // 2FA required - move to TOTP step
        setStep('totp');
        setError(null);
        return;
      }

      // Success (no 2FA)
      setStep('success');
      setTimeout(() => router.push('/'), 600);
    } catch (err) {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  }

  async function handleTotpSubmit() {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, totpCode }),
        credentials: 'include',
      });

      const data: LoginResponse = await res.json();

      if (!res.ok) {
        setError(data.error || 'کد تأیید اشتباه است');
        setTotpCode('');
        return;
      }

      setStep('success');
      setTimeout(() => router.push('/'), 600);
    } catch (err) {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    setStep('credentials');
    setTotpCode('');
    setError(null);
  }

  // Format retry time
  const formatRetryTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins} دقیقه و ${secs} ثانیه`;
    return `${secs} ثانیه`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Logo */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {step === 'credentials' && 'ورود به پنل مدیریت'}
              {step === 'totp' && 'تأیید دو مرحله‌ای'}
              {step === 'success' && 'ورود موفق'}
            </h1>
            <p className="text-gray-600 mt-2 text-sm">
              {step === 'credentials' && 'لطفاً اطلاعات حساب خود را وارد کنید'}
              {step === 'totp' && 'کد ۶ رقمی از Google Authenticator وارد کنید'}
              {step === 'success' && 'در حال انتقال به داشبورد...'}
            </p>
          </div>

          {/* ===== Step 1: Credentials ===== */}
          {step === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  <KeyRound className="w-4 h-4 inline ml-1" />
                  ایمیل
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                  aria-invalid={!!error}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  <Lock className="w-4 h-4 inline ml-1" />
                  رمز عبور
                </label>
                <input
                  id="password"
                  type="password"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  aria-invalid={!!error}
                />
              </div>

              {error && (
                <div
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2"
                  role="alert"
                >
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p>{error}</p>
                    {retryAfter && (
                      <p className="text-xs mt-1 text-red-600">
                        ⏱️ زمان باقی‌مانده: {formatRetryTime(retryAfter)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    در حال بررسی...
                  </>
                ) : (
                  <>
                    ادامه
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ===== Step 2: TOTP ===== */}
          {step === 'totp' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (totpCode.replace(/\D/g, '').length === 6) handleTotpSubmit();
              }}
              className="space-y-4"
              noValidate
            >
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <Shield className="w-5 h-5 inline ml-1" />
                حساب شما با تأیید دو مرحله‌ای محافظت می‌شود. کد ۶ رقمی از برنامه
                Google Authenticator وارد کنید.
              </div>

              <div>
                <label htmlFor="totp" className="block text-sm font-medium text-gray-700 mb-1">
                  کد تأیید
                </label>
                <input
                  id="totp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  className="w-full px-4 py-4 rounded-lg border-2 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-center text-2xl font-mono tracking-widest"
                  placeholder="------"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  autoFocus
                  aria-invalid={!!error}
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  کد هر ۳۰ ثانیه تغییر می‌کند
                </p>
              </div>

              {error && (
                <div
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2"
                  role="alert"
                >
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium disabled:opacity-50"
                >
                  بازگشت
                </button>
                <button
                  type="submit"
                  disabled={loading || totpCode.replace(/\D/g, '').length !== 6}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      در حال تأیید...
                    </>
                  ) : (
                    'تأیید و ورود'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ===== Step 3: Success ===== */}
          {step === 'success' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <p className="text-green-700 font-medium">خوش آمدید! در حال انتقال...</p>
            </div>
          )}

          {/* Security badge */}
          <div className="text-xs text-gray-500 text-center pt-4 border-t space-y-1">
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-3 h-3 text-green-600" />
              <span>🔒 رمزنگاری AES-256-GCM</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Lock className="w-3 h-3 text-green-600" />
              <span>HttpOnly + Secure + SameSite=Lax</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <KeyRound className="w-3 h-3 text-blue-600" />
              <span>پشتیبانی از 2FA (TOTP)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-4">
          تمام تلاش‌های ورود ثبت و بررسی می‌شوند
        </p>
      </div>
    </div>
  );
}
