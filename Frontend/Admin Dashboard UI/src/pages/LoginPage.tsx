import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Small artificial delay for UX
    await new Promise((r) => setTimeout(r, 600));

    const success = login(username, password);
    setIsLoading(false);

    if (!success) {
      setError('Invalid username or password. Please try again.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      {/* Ambient glow blobs */}
      <div
        style={{
          position: 'fixed',
          top: '15%',
          left: '10%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '10%',
          right: '10%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      <div
        className={isShaking ? 'shake' : ''}
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'rgba(15,23,42,0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(148,163,184,0.12)',
          borderRadius: 20,
          padding: '40px 36px',
          boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(6,182,212,0.05)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 60,
              height: 60,
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 28,
              boxShadow: '0 8px 24px rgba(6,182,212,0.35)',
            }}
          >
            🛒
          </div>
          <h1
            style={{
              color: '#f1f5f9',
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.3px',
              margin: 0,
            }}
          >
            GRAB &amp; GO
          </h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
            Admin Portal — Sign in to continue
          </p>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: 'linear-gradient(to right, transparent, rgba(148,163,184,0.15), transparent)',
            marginBottom: 28,
          }}
        />

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Username */}
          <div style={{ marginBottom: 18 }}>
            <label
              htmlFor="username"
              style={{ display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}
            >
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#475569',
                  fontSize: 16,
                  lineHeight: 1,
                }}
              >
                👤
              </span>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                style={{
                  width: '100%',
                  paddingLeft: 44,
                  paddingRight: 16,
                  paddingTop: 12,
                  paddingBottom: 12,
                  background: 'rgba(30,41,59,0.8)',
                  border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(71,85,105,0.6)'}`,
                  borderRadius: 10,
                  color: '#f1f5f9',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(6,182,212,0.6)')}
                onBlur={(e) => (e.target.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'rgba(71,85,105,0.6)')}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label
              htmlFor="password"
              style={{ display: 'block', color: '#94a3b8', fontSize: 12, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#475569',
                  fontSize: 16,
                  lineHeight: 1,
                }}
              >
                🔒
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{
                  width: '100%',
                  paddingLeft: 44,
                  paddingRight: 46,
                  paddingTop: 12,
                  paddingBottom: 12,
                  background: 'rgba(30,41,59,0.8)',
                  border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(71,85,105,0.6)'}`,
                  borderRadius: 10,
                  color: '#f1f5f9',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(6,182,212,0.6)')}
                onBlur={(e) => (e.target.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'rgba(71,85,105,0.6)')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#475569',
                  fontSize: 16,
                  padding: 2,
                  lineHeight: 1,
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Error message */}
          <div
            style={{
              height: error ? 'auto' : 0,
              overflow: 'hidden',
              marginBottom: error ? 16 : 0,
              transition: 'all 0.2s',
            }}
          >
            {error && (
              <div
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  color: '#fca5a5',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading || !username || !password}
            style={{
              width: '100%',
              padding: '13px 0',
              background: isLoading || !username || !password
                ? 'rgba(71,85,105,0.5)'
                : 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              border: 'none',
              borderRadius: 10,
              color: isLoading || !username || !password ? '#64748b' : '#fff',
              fontSize: 15,
              fontWeight: 600,
              cursor: isLoading || !username || !password ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              letterSpacing: '0.3px',
              boxShadow: isLoading || !username || !password ? 'none' : '0 4px 20px rgba(6,182,212,0.3)',
            }}
            onMouseOver={(e) => {
              if (!isLoading && username && password) {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 28px rgba(6,182,212,0.4)';
              }
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = isLoading || !username || !password ? 'none' : '0 4px 20px rgba(6,182,212,0.3)';
            }}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span className="spinner" />
                Authenticating...
              </span>
            ) : (
              'Sign In to Dashboard'
            )}
          </button>
        </form>

        {/* Hint */}
        <p style={{ textAlign: 'center', color: '#334155', fontSize: 11, marginTop: 24, marginBottom: 0 }}>
          Protected admin area · Unauthorized access is prohibited
        </p>
      </div>

      {/* CSS for shake + spinner animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15%       { transform: translateX(-8px); }
          30%       { transform: translateX(8px); }
          45%       { transform: translateX(-6px); }
          60%       { transform: translateX(6px); }
          75%       { transform: translateX(-3px); }
          90%       { transform: translateX(3px); }
        }
        .shake { animation: shake 0.5s ease; }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        input::placeholder { color: #475569; }
      `}</style>
    </div>
  );
}