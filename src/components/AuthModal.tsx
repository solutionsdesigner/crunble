import React, { useState } from 'react';
import { User } from '../types';
import { X, Check, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const payload = mode === 'signup' ? { email, password, name } : { email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      if (data.user) {
        onAuthSuccess(data.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#faf7f2]/90 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#faf7f2] p-8 text-[#1a1a1a] border-b border-[#1a1a1a] relative animate-in fade-in duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-1 text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 text-xs uppercase tracking-wider mb-2">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`transition-colors pb-1 ${
                mode === 'login'
                  ? 'text-[#1a1a1a] font-semibold underline underline-offset-4'
                  : 'text-[#6b6b6b] hover:text-[#1a1a1a]'
              }`}
            >
              Sign In
            </button>
            <span className="text-[#a3a3a3]">·</span>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`transition-colors pb-1 ${
                mode === 'signup'
                  ? 'text-[#1a1a1a] font-semibold underline underline-offset-4'
                  : 'text-[#6b6b6b] hover:text-[#1a1a1a]'
              }`}
            >
              Create Account
            </button>
          </div>

          <h2 className="text-2xl font-light tracking-tight text-[#1a1a1a]">
            {mode === 'login' ? 'Welcome back to Cronble' : 'Join Cronble Timeline'}
          </h2>
          <p className="text-xs text-[#6b6b6b] mt-1 font-light">
            Securely store, synchronize, and protect your tasks and preferences.
          </p>
        </div>

        {error && (
          <div className="mb-6 text-xs text-red-700 underline underline-offset-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="auth-email" className="block text-xs uppercase tracking-wider text-[#6b6b6b] mb-1">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full py-2 bg-transparent border-b border-[#1a1a1a] text-[#1a1a1a] placeholder:text-[#a3a3a3] text-sm outline-none"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs uppercase tracking-wider text-[#6b6b6b] mb-1">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              minLength={6}
              className="w-full py-2 bg-transparent border-b border-[#1a1a1a] text-[#1a1a1a] placeholder:text-[#a3a3a3] text-sm outline-none"
            />
          </div>

          <div className="pt-4 border-t border-[#1a1a1a] flex items-center justify-between">
            <button
              type="submit"
              disabled={isLoading}
              className="text-xs uppercase tracking-wider text-[#1a1a1a] hover:opacity-75 underline underline-offset-4 transition-opacity font-medium inline-flex items-center gap-2 disabled:opacity-40"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{mode === 'login' ? 'Log in' : 'Create account'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[#6b6b6b] hover:text-[#1a1a1a] underline underline-offset-2"
            >
              Continue as guest
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
