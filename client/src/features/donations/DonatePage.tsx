import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Heart, Shield, Leaf, Award, CheckCircle, ArrowRight,
  ArrowLeft, Sparkles, Sun, Moon, Globe, LogIn, LayoutDashboard
} from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { CowIcon } from '../../components/common/CowIcon';
import { useThemeStore } from '../../store/themeStore';
import { useLanguageStore } from '../../store/languageStore';
import { useAuthStore } from '../../store/authStore';

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000, 21000];
const PURPOSES = [
  { value: 'cow-care', label: 'Cow Care & Shelter', labelHi: 'गाय देखभाल और आश्रय', icon: '🐄' },
  { value: 'medical', label: 'Medical Treatment', labelHi: 'चिकित्सा उपचार', icon: '🏥' },
  { value: 'feed', label: 'Feed & Nutrition', labelHi: 'चारा और पोषण', icon: '🌾' },
  { value: 'infrastructure', label: 'Infrastructure', labelHi: 'बुनियादी ढांचा', icon: '🏗️' },
  { value: 'general', label: 'General Fund', labelHi: 'सामान्य निधि', icon: '💚' },
];

const IMPACT_CARDS = [
  { amount: 500,   impact: '1 cow fed for a week',         impactHi: '1 गाय का 1 सप्ताह का चारा',    icon: '🌾' },
  { amount: 1000,  impact: 'Routine health check-up',       impactHi: 'नियमित स्वास्थ्य जांच',          icon: '🩺' },
  { amount: 2500,  impact: 'Vaccination for 5 cattle',      impactHi: '5 पशुओं का टीकाकरण',             icon: '💉' },
  { amount: 5000,  impact: '1 month shelter for a cow',     impactHi: '1 गाय के लिए 1 माह का आश्रय',   icon: '🏠' },
  { amount: 10000, impact: 'Emergency medical treatment',   impactHi: 'आपातकालीन चिकित्सा उपचार',       icon: '🏥' },
  { amount: 21000, impact: 'Adopt a cow for 6 months',      impactHi: '6 महीने के लिए गाय गोद लें',    icon: '🐄' },
];

type Step = 'amount' | 'details' | 'success';

export const DonatePage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { language, toggleLanguage } = useLanguageStore();
  const { isAuthenticated } = useAuthStore();
  const isDark = theme === 'dark';

  const [step, setStep] = useState<Step>('amount');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState('cow-care');
  const [donationType, setDonationType] = useState<'one-time' | 'monthly'>('one-time');
  const [stats, setStats] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState('');

  const [form, setForm] = useState({
    donorName: '',
    donorEmail: '',
    donorPhone: '',
    donorPan: '',
    donorAddress: '',
  });

  const finalAmount = selectedAmount || parseInt(customAmount || '0');
  const impact = IMPACT_CARDS.find(c => c.amount === finalAmount);

  useEffect(() => {
    apiClient.get('/donations/stats')
      .then(res => setStats(res.data?.data))
      .catch(() => {});
  }, []);

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalAmount || finalAmount < 100) return;
    setSubmitting(true);
    try {
      const res = await apiClient.post('/donations', {
        ...form,
        amount: finalAmount,
        purpose: selectedPurpose,
        donationType,
        paymentMethod: 'razorpay',
        is80GEligible: true,
      });
      const donationId = res.data.data._id;
      // Complete with demo payment
      const completeRes = await apiClient.post(`/donations/${donationId}/complete`, {
        razorpayPaymentId: `pay_demo_${Date.now()}`,
        razorpaySignature: `sig_demo_${Date.now()}`,
      });
      setReceiptUrl(completeRes.data?.data?.receiptPdfUrl || '');
      setStep('success');
    } catch (err) {
      console.error(err);
      alert('Donation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* ── Sticky Top Header with Prominent Back Button ───────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: isDark ? 'rgba(11, 13, 18, 0.92)' : 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)',
        padding: '12px 24px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          {/* Left: Back Button + Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => navigate('/')}
              className="btn btn-secondary"
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 14px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem',
                border: '1px solid var(--border-color)',
              }}
              title="Return to Public Homepage"
            >
              <ArrowLeft size={16} />
              <span>{language === 'hi' ? 'मुख्य पृष्ठ' : 'Home'}</span>
            </button>

            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '3px',
              }}>
                <CowIcon size={22} variant="white" />
              </div>
              <div className="hidden sm:block">
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>E-Gowshala</span>
                <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700, marginLeft: '8px', background: 'rgba(16,185,129,0.12)', padding: '2px 8px', borderRadius: '99px' }}>
                  80G Gauseva Donation
                </span>
              </div>
            </Link>
          </div>

          {/* Right: Quick Links, Theme, Lang, CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link to="/impact" className="btn btn-secondary hidden md:inline-flex" style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#10B981', borderColor: 'rgba(16,185,129,0.3)' }}>
              📊 Live Impact
            </Link>
            <Link to="/adopt-wall" className="btn btn-secondary hidden md:inline-flex" style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#EC4899', borderColor: 'rgba(236,72,153,0.3)' }}>
              <Sparkles size={14} /> Adopt Wall
            </Link>

            {/* Theme Toggle */}
            <button
              className="btn btn-secondary"
              onClick={toggleTheme}
              style={{ padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {isDark ? <Sun size={16} style={{ color: '#FBBF24' }} /> : <Moon size={16} style={{ color: '#6366F1' }} />}
            </button>

            {/* Language Toggle */}
            <button
              className="btn btn-secondary"
              onClick={toggleLanguage}
              style={{ padding: '8px 10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Globe size={14} /> {language === 'hi' ? 'EN' : 'हिन्दी'}
            </button>

            {/* Dashboard / Sign In */}
            {isAuthenticated ? (
              <button
                className="btn btn-primary"
                onClick={() => navigate('/dashboard')}
                style={{ padding: '8px 14px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <LayoutDashboard size={15} />
                <span>Dashboard</span>
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => navigate('/login')}
                style={{ padding: '8px 14px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Container ───────────────────────────────────── */}
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '48px 24px 60px', width: '100%' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--bg-tag-badge)', border: '1px solid var(--border-color)',
            borderRadius: 100, padding: '6px 16px', marginBottom: 18,
          }}>
            <Sparkles size={14} style={{ color: '#10B981' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>
              100% Tax Deductible under Section 80G
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.15, margin: '0 0 14px' }}>
            Support Sacred Cattle,<br />
            <span className="gradient-text">Earn Divine Blessings 🙏</span>
          </h1>

          <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 580, margin: '0 auto', lineHeight: 1.65 }}>
            {language === 'hi'
              ? 'गायों की सेवा में आपका सहयोग करें। हर दान सीधे आश्रित गायों के चारा, उपचार और आश्रय में जाता है।'
              : 'Every rupee goes directly to rescued cow care, fresh green fodder, and veterinary hospital treatments. Instant 80G tax receipt generated.'}
          </p>

          {/* Stats strip */}
          {stats && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginTop: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'Total Raised', value: `₹${((stats.totalAmount || 185000) / 1000).toFixed(0)}K`, icon: '💚' },
                { label: 'Active Adopters', value: stats.activeAdoptions ?? 15, icon: '🐄' },
                { label: 'Generous Donors', value: stats.totalDonors ?? 32, icon: '🙏' },
              ].map(s => (
                <div key={s.label} className="card" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form and Right Sidebar Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 28, alignItems: 'start' }}>
          {/* ── Left: Donation Form Card ── */}
          <div className="card" style={{ padding: 32 }}>
            {step === 'amount' && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                  Choose Donation Amount
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 20px' }}>
                  {language === 'hi' ? 'अपनी इच्छानुसार राशि चुनें' : 'Select a preset amount or enter a custom sum'}
                </p>

                {/* Donation Type Toggle */}
                <div style={{ display: 'flex', background: 'var(--bg-card-inner)', border: '1px solid var(--border-color)', borderRadius: 10, padding: 4, marginBottom: 20 }}>
                  {(['one-time', 'monthly'] as const).map(type => (
                    <button key={type} onClick={() => setDonationType(type)} style={{
                      flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: donationType === type ? 'var(--bg-card)' : 'transparent',
                      color: donationType === type ? 'var(--color-primary)' : 'var(--text-muted)',
                      fontWeight: donationType === type ? 800 : 500, fontSize: 13,
                      boxShadow: donationType === type ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.2s',
                    }}>
                      {type === 'one-time' ? '💫 One-time Contribution' : '🔄 Monthly Gauseva'}
                    </button>
                  ))}
                </div>

                {/* Preset Amounts */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                  {PRESET_AMOUNTS.map(amt => {
                    const isSelected = selectedAmount === amt;
                    return (
                      <button
                        key={amt}
                        onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                        style={{
                          padding: '12px 8px', borderRadius: 12,
                          border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                          background: isSelected ? 'var(--bg-tag-badge)' : 'var(--bg-card-inner)',
                          cursor: 'pointer', textAlign: 'center', transition: 'all 0.18s',
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: 16, color: isSelected ? 'var(--color-primary)' : 'var(--text-primary)' }}>
                          ₹{amt.toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {IMPACT_CARDS.find(c => c.amount === amt)?.icon}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Amount */}
                <div style={{ position: 'relative', marginBottom: 20 }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 700 }}>₹</span>
                  <input
                    type="number"
                    className="input"
                    placeholder="Enter custom amount (min ₹100)"
                    value={customAmount}
                    onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                    style={{ paddingLeft: '32px' }}
                  />
                </div>

                {/* Impact Message */}
                {impact && (
                  <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
                    <span style={{ fontSize: 18 }}>{impact.icon}</span>
                    <span style={{ color: '#10B981', fontWeight: 700, fontSize: 13, marginLeft: 8 }}>{impact.impact}</span>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2, marginLeft: 26 }}>{impact.impactHi}</div>
                  </div>
                )}

                {/* Purpose */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                    Purpose / उद्देश्य
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {PURPOSES.map(p => (
                      <button
                        key={p.value}
                        onClick={() => setSelectedPurpose(p.value)}
                        style={{
                          padding: '10px 12px', borderRadius: 10,
                          border: selectedPurpose === p.value ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                          background: selectedPurpose === p.value ? 'var(--bg-tag-badge)' : 'var(--bg-card-inner)',
                          cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ fontSize: 14 }}>{p.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: selectedPurpose === p.value ? 700 : 500, color: selectedPurpose === p.value ? 'var(--color-primary)' : 'var(--text-primary)', marginLeft: 6 }}>
                          {p.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => { if (finalAmount >= 100) setStep('details'); }}
                  disabled={finalAmount < 100}
                  className="btn btn-primary"
                  style={{
                    width: '100%', padding: '14px', fontSize: 15, fontWeight: 800,
                    cursor: finalAmount >= 100 ? 'pointer' : 'not-allowed',
                    opacity: finalAmount >= 100 ? 1 : 0.5,
                  }}
                >
                  Donate ₹{finalAmount > 0 ? finalAmount.toLocaleString('en-IN') : '—'}
                  {donationType === 'monthly' ? '/month' : ''}
                  <ArrowRight size={18} />
                </button>
              </>
            )}

            {step === 'details' && (
              <form onSubmit={handleDonate}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <button type="button" onClick={() => setStep('amount')} className="btn btn-secondary" style={{ padding: '6px 10px' }}>
                    <ArrowLeft size={16} />
                  </button>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Donor Details</h2>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      Donating ₹{finalAmount.toLocaleString('en-IN')} {donationType === 'monthly' ? '/month' : ''}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 14 }}>
                  {[
                    { field: 'donorName', label: 'Full Name *', placeholder: 'Your full name', type: 'text', required: true },
                    { field: 'donorEmail', label: 'Email Address *', placeholder: 'your@email.com', type: 'email', required: true },
                    { field: 'donorPhone', label: 'Phone Number', placeholder: '+91 98765 43210', type: 'tel', required: false },
                    { field: 'donorPan', label: 'PAN Number (for 80G receipt)', placeholder: 'ABCDE1234F', type: 'text', required: false },
                    { field: 'donorAddress', label: 'Address (for receipt)', placeholder: 'City, State', type: 'text', required: false },
                  ].map(f => (
                    <div key={f.field}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {f.label}
                      </label>
                      <input
                        type={f.type}
                        required={f.required}
                        placeholder={f.placeholder}
                        value={(form as any)[f.field]}
                        onChange={e => setForm({ ...form, [f.field]: e.target.value })}
                        className="input"
                      />
                    </div>
                  ))}
                </div>

                <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '12px 14px', margin: '20px 0', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <CheckCircle size={16} style={{ color: '#10B981', marginTop: 2, flexShrink: 0 }} />
                  <div style={{ fontSize: 12, color: '#10B981', lineHeight: 1.5 }}>
                    <strong>80G Tax Exemption</strong> — An official receipt will be generated automatically after payment.
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: 14, fontSize: 15, fontWeight: 800 }}
                >
                  {submitting ? '⏳ Processing...' : `🙏 Complete Donation — ₹${finalAmount.toLocaleString('en-IN')}`}
                </button>
              </form>
            )}

            {step === 'success' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 32, color: 'white' }}>
                  🙏
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                  Thank You, {form.donorName.split(' ')[0]}!
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '0 0 6px' }}>
                  धन्यवाद! आपका दान सफलतापूर्वक प्राप्त हो गया।
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 24px' }}>
                  A confirmation with your 80G receipt has been recorded for <strong>{form.donorEmail}</strong>
                </p>

                <div style={{ background: 'var(--bg-card-inner)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#10B981' }}>
                    ₹{finalAmount.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Donated towards: {PURPOSES.find(p => p.value === selectedPurpose)?.label}
                  </div>
                </div>

                {receiptUrl && (
                  <a
                    href={receiptUrl}
                    download="80G-Receipt.pdf"
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', textDecoration: 'none', fontWeight: 700, fontSize: 14, marginBottom: 16 }}
                  >
                    📄 Download 80G Receipt (PDF)
                  </a>
                )}

                <div style={{ marginTop: 16 }}>
                  <button
                    onClick={() => {
                      setStep('amount');
                      setSelectedAmount(null);
                      setCustomAmount('');
                      setForm({ donorName: '', donorEmail: '', donorPhone: '', donorPan: '', donorAddress: '' });
                    }}
                    className="btn btn-secondary"
                  >
                    Make Another Donation
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Trust & Impact Sidebar ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Trust badges */}
            {[
              { icon: <Shield size={20} style={{ color: '#3B82F6' }} />, title: '80G Certified', sub: 'Tax exemption under Income Tax Act', subHi: 'आयकर अधिनियम के तहत कर छूट' },
              { icon: <Award size={20} style={{ color: '#F59E0B' }} />, title: 'Registered Gaushala Trust', sub: 'AWBI & state recognized gaushala', subHi: 'सरकारी पंजीकृत गौशाला ट्रस्ट' },
              { icon: <Leaf size={20} style={{ color: '#10B981' }} />, title: '100% Transparent', sub: 'Real-time fund tracking via digital ledger', subHi: 'पारदर्शी फंड ट्रैकिंग' },
            ].map(b => (
              <div key={b.title} className="card" style={{ padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-card-inner)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {b.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>{b.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{b.sub}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{b.subHi}</div>
                </div>
              </div>
            ))}

            {/* Impact Highlights */}
            <div className="card" style={{ padding: 20, borderTop: '3px solid var(--color-primary)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Heart size={14} style={{ color: '#F97316' }} />
                Your Donation Impact
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {IMPACT_CARDS.slice(0, 4).map(c => (
                  <div key={c.amount} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0 }}>{c.icon}</div>
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 700 }}>
                        ₹{c.amount.toLocaleString('en-IN')}
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: 12, marginLeft: 6 }}>→ {c.impact}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.impactHi}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment security */}
            <div className="card" style={{ padding: '14px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Secure Payment Options
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['UPI', 'Net Banking', 'Cards', 'Wallets'].map(m => (
                  <span key={m} style={{ background: 'var(--bg-card-inner)', border: '1px solid var(--border-color)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: 'var(--text-primary)', fontWeight: 600 }}>
                    {m}
                  </span>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Shield size={11} /> 256-Bit SSL Encrypted · Instant 80G Receipt
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonatePage;
