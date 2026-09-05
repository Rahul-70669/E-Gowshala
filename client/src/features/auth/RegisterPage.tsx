import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Phone, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { CowIcon } from '../../components/common/CowIcon';
import apiClient from '../../lib/apiClient';
import { useAuthStore } from '../../store/authStore';

const ROLES = [
  { value: 'admin', label: 'Administrator' },
  { value: 'veterinarian', label: 'Veterinarian' },
  { value: 'caretaker', label: 'Caretaker' },
  { value: 'donor', label: 'Donor' },
  { value: 'volunteer', label: 'Volunteer' },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'volunteer',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/auth/register', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,
      });
      const { user, token } = res.data.data;
      setAuth(user, token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
        maxWidth: '480px',
        width: '100%',
        padding: '36px 32px',
        borderRadius: '24px',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
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
            Create Account
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Register new user in E-Gowshala Platform
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px 14px', borderRadius: '10px', marginBottom: '18px',
            background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#F87171', fontSize: '0.8125rem', lineHeight: 1.4,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reg-name">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input id="reg-name" type="text" className="input" placeholder="Rajesh Sharma" value={form.name} onChange={(e) => updateField('name', e.target.value)} required style={{ paddingLeft: '40px' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label htmlFor="reg-email">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="reg-email" type="email" className="input" placeholder="you@email.com" value={form.email} onChange={(e) => updateField('email', e.target.value)} required style={{ paddingLeft: '40px' }} />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="reg-phone">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="reg-phone" type="tel" className="input" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} style={{ paddingLeft: '40px' }} />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-role">Account Role</label>
            <select id="reg-role" className="input" value={form.role} onChange={(e) => updateField('role', e.target.value)}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label htmlFor="reg-password">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="reg-password" type={showPassword ? 'text' : 'password'} className="input" placeholder="Min 6 chars" value={form.password} onChange={(e) => updateField('password', e.target.value)} required style={{ paddingLeft: '40px' }} />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="reg-confirm">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="reg-confirm" type={showPassword ? 'text' : 'password'} className="input" placeholder="Repeat password" value={form.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} required style={{ paddingLeft: '40px' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <input type="checkbox" id="show-pass" checked={showPassword} onChange={() => setShowPassword(!showPassword)} style={{ accentColor: 'var(--color-primary)' }} />
            <label htmlFor="show-pass" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>Show password</label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '12px', fontSize: '0.9375rem' }}>
            {loading ? <span className="spinner" /> : <UserPlus size={18} />}
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ margin: '24px 0', borderTop: '1px solid var(--border-color)' }} />

        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
