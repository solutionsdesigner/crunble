import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface PasswordWallProps {
  onUnlock: () => void;
}

const SECRET_PASSWORD = '20260730';

export const PasswordWall: React.FC<PasswordWallProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Verify secret password
    if (password === SECRET_PASSWORD) {
      try {
        localStorage.setItem('cronble_app_unlocked', 'true');
        localStorage.setItem('chronos_app_unlocked', 'true');
      } catch (e) {
        console.warn('Storage unavailable:', e);
      }
      onUnlock();
    } else {
      setError('Incorrect secret password. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#faf7f2] flex flex-col justify-between p-6 sm:p-12 text-[#1a1a1a] select-none">
      {/* Top Header */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between pb-6 border-b border-[#e3dfd7]">
        <span className="font-semibold tracking-wider text-sm uppercase">CRONBLE</span>
        <span className="text-[11px] font-mono-nums text-[#6b6b6b] uppercase tracking-widest flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-[#1a1a1a]" />
          <span>Security Wall</span>
        </span>
      </header>

      {/* Main Lock Screen Card */}
      <main className="max-w-md w-full mx-auto my-auto py-12">
        <div className="mb-8">
          <div className="w-10 h-10 border border-[#1a1a1a] flex items-center justify-center mb-6">
            <Lock className="w-4 h-4 text-[#1a1a1a]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-[#1a1a1a] mb-2">
            Protected Application
          </h1>
          <p className="text-xs text-[#6b6b6b] leading-relaxed">
            This daily timeline &amp; itinerary application is protected. Enter the secret password to remove this security wall and access the app.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="wall-secret-password"
              className="block text-xs uppercase tracking-wider text-[#6b6b6b] mb-2 font-mono-nums"
            >
              Secret Password
            </label>
            <input
              id="wall-secret-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter password to unlock"
              autoFocus
              className="w-full bg-transparent border-b border-[#1a1a1a] py-2.5 text-base text-[#1a1a1a] placeholder-[#8c8c8c] focus:outline-hidden focus:border-b-2 font-mono"
            />
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 p-3 border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !password}
              className="w-full bg-[#1a1a1a] hover:bg-black text-[#faf7f2] py-3 px-6 text-xs uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              <span>Unlock App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-[#e3dfd7] flex items-center gap-2 text-[11px] text-[#6b6b6b]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#1a1a1a]" />
          <span>Encrypted Session Protection</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto pt-6 border-t border-[#e3dfd7] text-center text-[11px] text-[#8c8c8c]">
        Cronble · Daily Itinerary &amp; Timeline Progression
      </footer>
    </div>
  );
};
