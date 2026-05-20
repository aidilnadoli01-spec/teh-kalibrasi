'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// ==========================================
// Lightweight Native SVG Icon Components
// ==========================================
function MailIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function RefreshCwIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

function Loader2Icon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

interface Toast {
  type: 'success' | 'error';
  message: string;
}

function OTPVerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  // Timer states
  const [expiryTime, setExpiryTime] = useState(300); // 5 minutes (300 seconds) for OTP validity
  const [cooldown, setCooldown] = useState(0); // Cooldown for resend in seconds

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Show auto toast helper
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Timer for OTP expiration countdown
  useEffect(() => {
    if (expiryTime <= 0) return;
    const timer = setInterval(() => {
      setExpiryTime((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [expiryTime]);

  // Timer for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Check if resend is passed in URL to trigger initial cooldown or toast
  useEffect(() => {
    if (searchParams.get('resend') === 'true') {
      setCooldown(60);
      showToast('success', 'Kode OTP baru telah dikirim ke email Anda.');
    }
  }, [searchParams]);

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return; // only allow numbers

    const newOtp = [...otp];
    // Keep only the last character entered
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input if a value is typed
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current field is empty, delete previous and focus it
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d+$/.test(pastedData)) return; // check if contains only digits

    const digits = pastedData.slice(0, 6).split('');
    const newOtp = [...otp];

    for (let i = 0; i < 6; i++) {
      if (digits[i]) {
        newOtp[i] = digits[i];
      }
    }
    setOtp(newOtp);

    // Focus last filled input or verify automatically if 6 digits pasted
    const targetIndex = Math.min(digits.length - 1, 5);
    inputRefs.current[targetIndex]?.focus();

    if (digits.length === 6) {
      verifyOTP(digits.join(''));
    }
  };

  const verifyOTP = async (otpCode: string) => {
    setLoading(true);
    setToast(null);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verifikasi OTP gagal.');
      }

      showToast('success', data.message || 'Email Anda berhasil diverifikasi!');
      
      // Redirect to login after a brief delay
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      showToast('error', err.message);
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      showToast('error', 'Silakan masukkan 6 digit kode OTP secara lengkap.');
      return;
    }

    if (expiryTime <= 0) {
      showToast('error', 'Kode OTP telah kedaluwarsa. Silakan kirim ulang OTP baru.');
      return;
    }

    verifyOTP(fullOtp);
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;

    setResending(true);
    setToast(null);

    try {
      const res = await fetch('/api/auth/otp/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim ulang OTP.');
      }

      showToast('success', data.message || 'OTP baru telah berhasil dikirim!');
      setExpiryTime(300); // Reset validity to 5 minutes
      setCooldown(60); // Trigger 60 seconds cooldown
      setOtp(Array(6).fill('')); // Clear inputs
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md w-full relative backdrop-blur-md shadow-2xl">
      {/* Toast Notification Container */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute top-4 left-4 right-4 p-3 rounded-lg flex items-center gap-2 text-sm z-50 shadow-lg ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border border-emerald-500/30 text-emerald-400'
                : 'bg-red-950/90 border border-red-500/30 text-red-400'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertTriangleIcon className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-white/40 hover:text-emerald-500 text-sm mb-6 transition-all"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Kembali ke Login
      </Link>

      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-500">
          <MailIcon className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Verifikasi Email</h1>
        <p className="text-white/40 text-sm">
          Kami telah mengirimkan 6 digit kode OTP ke alamat email:
        </p>
        <p className="text-emerald-500 font-medium text-sm mt-1 break-all select-all">{email}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="flex justify-center gap-2 sm:gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={digit}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-14 bg-white/5 border border-white/20 rounded-lg text-center text-xl font-bold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-white transition-all transition-colors duration-200"
                required
              />
            ))}
          </div>
          
          <div className="flex justify-between items-center mt-4 px-1 text-xs">
            <span className="text-white/40">Masa berlaku OTP:</span>
            {expiryTime > 0 ? (
              <span className={`font-bold ${expiryTime < 60 ? 'text-red-500' : 'text-emerald-500'}`}>
                {formatTime(expiryTime)}
              </span>
            ) : (
              <span className="text-red-500 font-bold">Kode Kedaluwarsa</span>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || otp.join('').length < 6}
          className="w-full py-3 bg-emerald-500 text-black font-extrabold rounded-lg hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2Icon className="w-5 h-5 animate-spin" />
              Memverifikasi...
            </>
          ) : (
            'Verifikasi Kode'
          )}
        </button>
      </form>

      <div className="mt-8 text-center border-t border-white/5 pt-6">
        <p className="text-white/40 text-xs mb-2">Tidak menerima kode OTP?</p>
        <button
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-500 hover:text-emerald-400 disabled:opacity-50 disabled:hover:text-emerald-500 transition-all cursor-pointer"
        >
          {resending ? (
            <>
              <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
              Mengirim ulang...
            </>
          ) : cooldown > 0 ? (
            <>
              <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" />
              Kirim Ulang OTP ({cooldown}s)
            </>
          ) : (
            <>
              <RefreshCwIcon className="w-3.5 h-3.5" />
              Kirim Ulang OTP
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function OTPVerificationPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Premium glowing background mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06),transparent_60%)] pointer-events-none" />
      <div className="absolute top-10 left-10 w-96 h-96 bg-emerald-500/5 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/5 rounded-full filter blur-[100px] pointer-events-none" />

      {/* Next.js client-side router requires searchParams to be inside Suspense boundary */}
      <Suspense
        fallback={
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center backdrop-blur-md">
            <Loader2Icon className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-4" />
            <p className="text-white/60">Memuat halaman verifikasi...</p>
          </div>
        }
      >
        <OTPVerificationForm />
      </Suspense>
    </div>
  );
}
