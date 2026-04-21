
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const THEME = {
  bg: '#F6F7F8',
  surface: 'rgba(255,255,255,0.62)',
  surfaceStrong: 'rgba(255,255,255,0.82)',
  border: 'rgba(20, 35, 55, 0.14)',
  ink: '#142337',
  leviBlue: '#2F5D8C',
  leviBlueDark: '#234B74',
  sunset: '#E07A5F',
};

export default function PortalLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit() {
    if (!password) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/portal/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/portal');
        router.refresh();
      } else {
        setError('Incorrect password');
        setPassword('');
      }
    } catch {
      setError('Connection error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: THEME.bg }}
    >
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(47, 93, 140, 0.10) 0%, transparent 55%),
            radial-gradient(circle at 80% 70%, rgba(79, 122, 106, 0.08) 0%, transparent 55%)
          `,
        }}
      />

      <div className="fixed inset-0 z-0 pointer-events-none" style={{ opacity: 0.25 }}>
        <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="none" aria-hidden="true">
          {Array.from({ length: 9 }).map((_, i) => {
            const y = 120 + i * 70;
            const o = 0.08 - i * 0.007;
            return (
              <path
                key={i}
                d={`M0 ${y} C 200 ${y - 18}, 360 ${y + 12}, 520 ${y - 8} C 700 ${y - 22}, 900 ${y + 18}, 1200 ${y - 6}`}
                fill="none"
                stroke={`rgba(20, 35, 55, ${Math.max(o, 0.02)})`}
                strokeWidth="1.15"
              />
            );
          })}
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-10">
          <a href="/" className="inline-block">
            <div className="text-3xl font-light tracking-wide" style={{ color: THEME.ink }}>
              <span>Ceto</span>
              <span style={{ color: THEME.leviBlue, fontWeight: 400 }}>Portal</span>
            </div>
          </a>
          <div
            className="text-[10px] font-light mt-2 tracking-[0.30em] uppercase"
            style={{ color: 'rgba(20,35,55,0.40)' }}
          >
            Private Operations Access
          </div>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: THEME.surfaceStrong,
            border: `1px solid ${THEME.border}`,
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="mb-5">
            <label
              className="block text-[11px] font-light mb-2 tracking-widest uppercase"
              style={{ color: 'rgba(20,35,55,0.45)' }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="••••••••••••"
              autoFocus
              autoComplete="current-password"
              className="w-full text-sm font-light px-4 py-3 rounded-xl outline-none transition-all duration-200"
              style={{
                backgroundColor: 'rgba(20,35,55,0.04)',
                border: `1px solid ${error ? 'rgba(224,122,95,0.55)' : 'rgba(20,35,55,0.14)'}`,
                color: THEME.ink,
              }}
            />
            {error && (
              <div
                className="text-xs font-light mt-2 flex items-center gap-1.5"
                style={{ color: THEME.sunset }}
              >
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                </svg>
                {error}
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!password || loading}
            className="w-full py-3 rounded-full font-light text-sm text-white transition-all duration-200 disabled:opacity-35"
            style={{ backgroundColor: loading ? THEME.leviBlueDark : THEME.leviBlue }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Verifying
              </span>
            ) : (
              'Enter Portal'
            )}
          </button>
        </div>

        <div className="text-center mt-6">
          
            href="/"
            className="text-[11px] font-light transition-colors duration-200"
            style={{ color: 'rgba(20,35,55,0.35)' }}
          >
            ← cetointeractive.com
          </a>
        </div>
      </div>
    </div>
  );
}
