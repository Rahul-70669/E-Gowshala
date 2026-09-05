import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, Eye, EyeOff, Sparkles, Shield, UserCheck, Stethoscope, UserCog, HeartHandshake, Heart, Landmark, ArrowLeft, Sun, Moon } from 'lucide-react';
import { CowIcon } from '../../components/common/CowIcon';
import apiClient from '../../lib/apiClient';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

const QUICK_TEST_ACCOUNTS = [
  { role: 'Admin', email: 'admin@egowshala.org', icon: UserCog, color: '#F97316' },
  { role: 'Veterinarian', email: 'vet@egowshala.org', icon: Stethoscope, color: '#38BDF8' },
  { role: 'Caretaker', email: 'caretaker@egowshala.org', icon: UserCheck, color: '#10B981' },
  { role: 'Volunteer', email: 'volunteer@egowshala.org', icon: HeartHandshake, color: '#A855F7' },
  { role: 'Donor', email: 'donor@egowshala.org', icon: Heart, color: '#EC4899' },
  { role: 'Government', email: 'govt@egowshala.org', icon: Landmark, color: '#EAB308' },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  const [email, setEmail] = useState('admin@egowshala.org');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuickFill = (accEmail: string) => {
    setEmail(accEmail);
    setPassword('admin123');
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { user, token } = res.data.data;
      setAuth(user, token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please verify email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient background glow orbs */}
      <div style={{
        position: 'absolute', top: '10%', left: '20%',
        width: '380px', height: '380px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(249, 115, 22, 0.12), transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '20%',
        width: '380px', height: '380px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12), transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Main Glass Card */}
      <div className="card" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '36px 32px',
        borderRadius: '24px',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Top Controls: Back to Home + Theme Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Link
            to="/"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 700 }}
          >
            <ArrowLeft size={16} /> Home
          </Link>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={toggleTheme}
            style={{ padding: '6px 10px', borderRadius: '8px' }}
            title="Toggle theme"
          >
            {isDark ? <Sun size={15} style={{ color: '#FBBF24' }} /> : <Moon size={15} style={{ color: '#6366F1' }} />}
          </button>
        </div>

        {/* Brand Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '64px', height: '64px', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #FB923C 0%, #F97316 50%, #9333EA 100%)',
            borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(249, 115, 22, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            padding: '6px',
          }}>
            <CowIcon size={44} variant="white" />
          </div>

          <h2 style={{ fontSize: '1.625rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>
            Welcome Back
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Sign in to <strong style={{ color: 'var(--text-primary)' }}>E-Gowshala Platform</strong>
          </p>
        </div>

        {/* Quick Role Fill Chips */}
        <div style={{ marginBottom: '22px' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', textAlign: 'center' }}>
            1-Click Demo Logins
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {QUICK_TEST_ACCOUNTS.map((acc) => {
              const isSelected = email === acc.email;
              return (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickFill(acc.email)}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: isSelected ? `${acc.color}22` : 'var(--bg-hover)',
                    color: isSelected ? acc.color : 'var(--text-secondary)',
                    border: isSelected ? `1px solid ${acc.color}66` : '1px solid var(--border-color)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <acc.icon size={14} style={{ color: acc.color }} />
                  <span>{acc.role}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            padding: '12px 14px', borderRadius: '10px', marginBottom: '18px',
            background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#F87171', fontSize: '0.8125rem', lineHeight: 1.4,
          }}>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="login-email"
                type="email"
                className="input"
                placeholder="admin@egowshala.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: '40px', paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                  padding: '4px',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '12px', fontSize: '0.9375rem', marginTop: '10px' }}
          >
            {loading ? <span className="spinner" /> : <LogIn size={18} />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ margin: '24px 0', borderTop: '1px solid var(--border-color)' }} />

        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
