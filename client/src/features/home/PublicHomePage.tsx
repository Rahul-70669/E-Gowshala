import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Heart, ShieldCheck, Sparkles, ArrowRight, Activity, MapPin,
  Calendar, CheckCircle, Download, FileText, Sun, Moon,
  Globe, LogIn, LayoutDashboard, Share2, Compass, Award, ExternalLink,
  Menu, X, Ambulance
} from 'lucide-react';
import { CowIcon } from '../../components/common/CowIcon';
import { useThemeStore } from '../../store/themeStore';
import { useLanguageStore } from '../../store/languageStore';
import { useAuthStore } from '../../store/authStore';
import RescueMapView from '../cows/RescueMapView';

const API = import.meta.env.VITE_API_URL || '/api';

export const PublicHomePage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { language, toggleLanguage } = useLanguageStore();
  const { isAuthenticated, user } = useAuthStore();
  const isDark = theme === 'dark';

  const [impactStats, setImpactStats] = useState<any>(null);
  const [featuredCows, setFeaturedCows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Fetch live public aggregates
    Promise.all([
      fetch(`${API}/public/impact`).then(r => r.json()).catch(() => ({ data: null })),
      fetch(`${API}/public/adopt-wall`).then(r => r.json()).catch(() => ({ data: { cows: [] } })),
    ]).then(([impRes, wallRes]) => {
      if (impRes?.data) setImpactStats(impRes.data);
      if (wallRes?.data?.cows) setFeaturedCows(wallRes.data.cows.slice(0, 3));
      setLoading(false);
    });
  }, []);

  const totalCows = impactStats?.stats?.totalCows ?? 50;
  const healthRate = impactStats?.stats?.herdHealthRate ?? 98;
  const totalDonations = impactStats?.stats?.totalDonationsAmount ?? 145000;
  const totalRescues = impactStats?.stats?.totalRescues ?? 12;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* ── Top Navigation Bar ───────────────────────────────── */}
      <header
        className="landing-header"
        style={{
          background: isDark ? 'rgba(11, 13, 18, 0.94)' : 'rgba(255, 255, 255, 0.94)',
        }}
      >
        <div className="landing-header-inner">
          {/* Logo Brand */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', flexShrink: 0 }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 50%, #7C3AED 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              flexShrink: 0, padding: '4px',
            }}>
              <CowIcon size={28} variant="white" />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }} className="gradient-text">
                E-Gowshala
              </div>
              <div className="landing-logo-subtitle" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {language === 'hi' ? 'स्मार्ट गौशाला प्रबंधन एवं गौसेवा' : 'SMART LIVESTOCK AI & GAUSEVA'}
              </div>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="landing-nav-menu">
            <a href="#impact" className="landing-nav-item">
              <Activity size={15} style={{ color: '#0EA5E9' }} />
              <span>{language === 'hi' ? 'सामाजिक प्रभाव' : 'Live Impact'}</span>
            </a>
            <Link to="/adopt-wall" className="landing-nav-item">
              <Sparkles size={15} style={{ color: '#EC4899' }} />
              <span>{language === 'hi' ? 'गौ गोद दीवार' : 'Adopt a Cow'}</span>
            </Link>
            <Link to="/rescue" className="landing-nav-item rescue">
              <span>🚨</span>
              <span>{language === 'hi' ? 'गाय रेस्क्यू करें' : 'Rescue Cow'}</span>
            </Link>
            <a href="#rescue-map" className="landing-nav-item">
              <MapPin size={15} style={{ color: '#F97316' }} />
              <span>{language === 'hi' ? 'रेस्क्यू मैप' : 'Rescue Map'}</span>
            </a>
            <a href="#technology" className="landing-nav-item">
              <Sparkles size={15} style={{ color: '#8B5CF6' }} />
              <span>{language === 'hi' ? 'एआई तकनीक' : 'AI Technology'}</span>
            </a>
            <Link to="/donate" className="landing-nav-item donate">
              <Heart size={15} />
              <span>{language === 'hi' ? 'दान (80G कर छूट)' : 'Donate (80G)'}</span>
            </Link>
          </nav>

          {/* Right Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* Theme Toggle */}
            <button
              className="landing-action-btn btn-secondary"
              onClick={toggleTheme}
              style={{ width: '40px', padding: 0 }}
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {isDark ? <Sun size={17} style={{ color: '#FBBF24' }} /> : <Moon size={17} style={{ color: '#6366F1' }} />}
            </button>

            {/* Language Toggle */}
            <button
              className="landing-action-btn btn-secondary"
              onClick={toggleLanguage}
              style={{ padding: '0 10px', fontSize: '0.8125rem', gap: '4px' }}
              title="Toggle Language"
            >
              <Globe size={14} />
              <span>{language === 'hi' ? 'EN' : 'HI'}</span>
            </button>

            {/* Dashboard / Sign-In Button */}
            {isAuthenticated ? (
              <button
                className="landing-action-btn btn-primary landing-auth-btn"
                onClick={() => navigate('/dashboard')}
                style={{ padding: '0 14px', gap: '6px' }}
                title="Go to Dashboard"
              >
                <LayoutDashboard size={16} />
                <span className="landing-auth-text">{language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}</span>
              </button>
            ) : (
              <button
                className="landing-action-btn btn-primary landing-auth-btn"
                onClick={() => navigate('/login')}
                style={{ padding: '0 14px', gap: '6px' }}
                title="Sign In"
              >
                <LogIn size={16} />
                <span className="landing-auth-text">{language === 'hi' ? 'लॉगिन' : 'Sign In'}</span>
              </button>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              className="landing-action-btn btn-secondary landing-mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ width: '40px', padding: 0 }}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <div className={`landing-mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <a
          href="#impact"
          className="landing-nav-item"
          style={{ width: '100%', padding: '10px 14px' }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <Activity size={16} style={{ color: '#0EA5E9' }} />
          <span>{language === 'hi' ? 'सामाजिक प्रभाव' : 'Live Impact'}</span>
        </a>
        <Link
          to="/adopt-wall"
          className="landing-nav-item"
          style={{ width: '100%', padding: '10px 14px' }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <Sparkles size={16} style={{ color: '#EC4899' }} />
          <span>{language === 'hi' ? 'गौ गोद दीवार' : 'Adopt a Cow'}</span>
        </Link>
        <Link
          to="/rescue"
          className="landing-nav-item rescue"
          style={{ width: '100%', padding: '10px 14px' }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <span>🚨</span>
          <span>{language === 'hi' ? 'गाय रेस्क्यू करें' : 'Rescue Cow'}</span>
        </Link>
        <a
          href="#rescue-map"
          className="landing-nav-item"
          style={{ width: '100%', padding: '10px 14px' }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <MapPin size={16} style={{ color: '#F97316' }} />
          <span>{language === 'hi' ? 'रेस्क्यू मैप' : 'Rescue Map'}</span>
        </a>
        <a
          href="#technology"
          className="landing-nav-item"
          style={{ width: '100%', padding: '10px 14px' }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <Sparkles size={16} style={{ color: '#8B5CF6' }} />
          <span>{language === 'hi' ? 'एआई तकनीक' : 'AI Technology'}</span>
        </a>
        <Link
          to="/donate"
          className="landing-nav-item donate"
          style={{ width: '100%', padding: '10px 14px' }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <Heart size={16} />
          <span>{language === 'hi' ? 'दान (80G कर छूट)' : 'Donate (80G)'}</span>
        </Link>
      </div>

      {/* ── Hero Section ─────────────────────────────────────── */}
      <section style={{
        position: 'relative', overflow: 'hidden', padding: '70px 24px 60px',
        borderBottom: '1px solid var(--border-color)',
        background: isDark
          ? 'radial-gradient(circle at 50% 10%, rgba(249,115,22,0.12) 0%, rgba(11,13,18,1) 70%)'
          : 'radial-gradient(circle at 50% 10%, rgba(254,243,199,0.8) 0%, rgba(248,250,252,1) 70%)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          {/* Trust Pill */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '99px', background: 'var(--bg-tag-badge)', border: '1px solid var(--border-color)', marginBottom: '22px', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              🇮🇳 {language === 'hi' ? 'भारत का प्रथम स्मार्ट गोशाला एआई प्लेटफ़ॉर्म' : "India's First Smart Livestock & Gaushala AI Platform"}
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 5.5vw, 3.6rem)', fontWeight: 900,
            letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '20px',
            color: 'var(--text-primary)',
          }}>
            {language === 'hi' ? 'भारतीय गोवंश संवर्धन एवं डिजिटल गौसेवा' : 'Protecting Indigenous Cattle With Artificial Intelligence & Public Transparency'}
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: 'var(--text-secondary)',
            maxWidth: '780px', margin: '0 auto 34px', lineHeight: 1.65,
          }}>
            {language === 'hi'
              ? 'मोबाइलनेटV2 एआई रोग निदान, डिजिटल क्यूआर पहचान, राष्ट्रीय हाईवे रेस्क्यू ट्रैकिंग और पूर्ण पारदर्शी 80G कर-मुक्त दान का संपूर्ण डिजिटल समाधान।'
              : 'Empowering animal shelters with MobileNetV2 computer vision diagnostics, QR code health tracking, real-time interstate highway rescue logistics, and automated 80G tax-exempt donor receipts.'}
          </p>

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center', marginBottom: '40px' }}>
            <Link
              to="/adopt-wall"
              className="btn btn-primary"
              style={{ padding: '14px 28px', fontSize: '1rem', fontWeight: 800, borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(249,115,22,0.4)' }}
            >
              <Sparkles size={18} />
              <span>{language === 'hi' ? 'गौ गोद लें (₹500/माह)' : 'Adopt a Sacred Cow (₹500/mo)'}</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/donate"
              className="btn btn-secondary"
              style={{ padding: '14px 24px', fontSize: '1rem', fontWeight: 700, borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#10B981', borderColor: 'rgba(16,185,129,0.3)' }}
            >
              <Heart size={18} />
              <span>{language === 'hi' ? 'दान करें (80G रसीद)' : 'Make a Donation (80G Tax Free)'}</span>
            </Link>

            <Link
              to="/rescue"
              className="btn btn-secondary"
              style={{ padding: '14px 22px', fontSize: '0.9375rem', fontWeight: 700, borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#EF4444', borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.06)' }}
            >
              <span>🚨</span>
              <span>{language === 'hi' ? 'घायल गाय रिपोर्ट करें' : 'Report Cow for Rescue'}</span>
            </Link>

            <Link
              to="/impact"
              className="btn btn-secondary"
              style={{ padding: '14px 22px', fontSize: '0.9375rem', fontWeight: 600, borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Activity size={16} />
              <span>{language === 'hi' ? 'लाइव प्रभाव देखें' : 'View Live Impact'}</span>
            </Link>
          </div>

          {/* Trust Strip */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={14} style={{ color: '#10B981' }} /> AWBI Standards Compliant</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={14} style={{ color: '#10B981' }} /> 100% Tax Deductible (Section 80G)</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={14} style={{ color: '#10B981' }} /> MobileNetV2 CNN 95%+ Accuracy</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={14} style={{ color: '#10B981' }} /> Open Data Transparency</span>
          </div>
        </div>
      </section>

      {/* ── Live Impact Metrics Ticker ───────────────────────── */}
      <section style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', padding: '28px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(56,189,248,0.15)', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CowIcon size={28} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, lineHeight: 1, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                {totalCows}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
                {language === 'hi' ? 'संरक्षित स्वदेशी गोवंश' : 'Indigenous Cattle Tracked'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Activity size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, lineHeight: 1, color: '#10B981', fontFamily: 'var(--font-heading)' }}>
                {healthRate}%
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
                {language === 'hi' ? 'स्वास्थ्य सुधार दर' : 'Herd Clinical Health Rate'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(249,115,22,0.15)', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MapPin size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, lineHeight: 1, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                {totalRescues}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
                {language === 'hi' ? 'सक्रिय हाईवे रेस्क्यू मिशन' : 'Inter-State Highway Rescues'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(236,72,153,0.15)', color: '#EC4899', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Award size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, lineHeight: 1, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                ₹{(totalDonations / 1000).toFixed(0)}k+
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
                {language === 'hi' ? 'प्राप्त 80G कर-मुक्त दान' : '80G Tax-Exempt Gauseva Funds'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Core Public Pillars (The 4 Interactive Portals) ── */}
      <section id="impact" style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            PUBLIC PLATFORMS
          </span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, marginTop: '6px', color: 'var(--text-primary)' }}>
            Transparent Civic &amp; Devotee Portals
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '640px', margin: '8px auto 0', fontSize: '0.95rem' }}>
            Explore our open public services with zero login required. Designed for donors, citizens, government evaluators, and cattle welfare advocates.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '22px' }}>
          {/* Pillar 1: Live Social Impact */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '26px' }}>
            <div>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Activity size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
                🌍 Live Impact Dashboard
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                Real-time herd clinical telemetry, biometrics, breed diversity metrics, and bio-gas environmental CO₂ offsets.
              </p>
            </div>
            <Link to="/impact" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'space-between', color: '#10B981', borderColor: 'rgba(16,185,129,0.3)' }}>
              <span>Open Impact Dashboard</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Pillar 2: Adopt Photo Wall */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '26px' }}>
            <div>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(236,72,153,0.15)', color: '#EC4899', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Heart size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
                📷 Adopt-a-Cow Photo Wall
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                Browse cattle photo cards, personal stories, and sponsor a cow for ₹500/month with automated 80G tax receipt issuance.
              </p>
            </div>
            <Link to="/adopt-wall" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'space-between', color: '#EC4899', borderColor: 'rgba(236,72,153,0.3)' }}>
              <span>View Photo Gallery</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Pillar 3: Rescue Operations */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '26px' }}>
            <div>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(249,115,22,0.15)', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <MapPin size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
                🗺️ National Rescue Map
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                Interactive spatial vector map tracking highway cattle rescues across Gujarat, Rajasthan, Haryana, UP, and Maharashtra.
              </p>
            </div>
            <a href="#rescue-map" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'space-between', color: '#F97316', borderColor: 'rgba(249,115,22,0.3)' }}>
              <span>Inspect Rescue Map</span>
              <ArrowRight size={16} />
            </a>
          </div>

          {/* Pillar 4: Public 80G Donation */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '26px' }}>
            <div>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(56,189,248,0.15)', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <FileText size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
                💚 Instant 80G Donations
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                Direct online donation with PAN verification, instant PDF certificate generation, and 1-click WhatsApp receipt sharing.
              </p>
            </div>
            <Link to="/donate" className="btn btn-primary" style={{ width: '100%', justifyContent: 'space-between' }}>
              <span>Donate for Gauseva</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── National Rescue Map Embed ───────────────────────── */}
      <section id="rescue-map" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              REAL-TIME HIGHWAY LOGISTICS
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, marginTop: '6px' }}>
              National Cattle Rescue &amp; Rehabilitation Map
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '640px', margin: '8px auto 0', fontSize: '0.95rem' }}>
              Select any of the 6 active highway rescue pins to inspect the animal's rescue dossier, clinical intake condition, and current shelter placement.
            </p>
          </div>

          <div className="card" style={{ padding: '24px', overflow: 'hidden' }}>
            <RescueMapView />
          </div>
        </div>
      </section>

      {/* ── Featured Cattle for Adoption ─────────────────────── */}
      {featuredCows.length > 0 && (
        <section style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                DIRECT SPONSORSHIP
              </span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px' }}>
                Meet Our Sacred Cattle
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Every cow adopted receives lifelong shelter, veterinarian checkups, green fodder, and ayurvedic care.
              </p>
            </div>
            <Link to="/adopt-wall" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span>View All 50 Cattle on Photo Wall</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {featuredCows.map((c) => (
              <div key={c._id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div className="cow-card-banner">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '68px', height: '68px', borderRadius: '18px',
                      background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.16), rgba(139, 92, 246, 0.14))',
                      border: '1.5px solid rgba(249, 115, 22, 0.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 6px',
                      padding: '8px',
                      boxShadow: '0 4px 12px rgba(249, 115, 22, 0.15)',
                    }}>
                      <CowIcon size={46} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>{c.breed} Cattle</span>
                  </div>
                  <span className={`badge ${c.isAdopted ? 'badge-success' : 'badge-warning'}`} style={{ position: 'absolute', top: 12, right: 12 }}>
                    {c.isAdopted ? '❤️ Adopted' : '🌟 Needs Sponsor'}
                  </span>
                </div>

                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '4px' }}>{c.name}</h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', fontWeight: 700, marginBottom: '10px' }}>
                      Tag: {c.tagId} • {c.breed}
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                      {c.story || 'Rescued indigenous cow now thriving under sanctuary care. In good health.'}
                    </p>
                  </div>

                  <Link to="/adopt-wall" className="btn btn-primary" style={{ width: '100%', fontSize: '0.875rem' }}>
                    {c.isAdopted ? 'View Sponsorship Story' : 'Adopt for ₹500/month'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── AI & Technology Deep Dive ────────────────────────── */}
      <section id="technology" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#A855F7', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              INTELLIGENT LIVESTOCK ARCHITECTURE
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, marginTop: '6px' }}>
              How Technology Protects Every Animal
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '8px auto 0', fontSize: '0.95rem' }}>
              Bridging traditional animal welfare with state-of-the-art artificial intelligence, IoT telemetry, and digital compliance.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(139,92,246,0.15)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Sparkles size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px' }}>MobileNetV2 CNN Diagnostics</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Custom fine-tuned convolutional neural network trained on indigenous cattle dermatological and clinical symptoms (FMD, Lumpy Skin, Mastitis) running in sub-100ms inference.
              </p>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(56,189,248,0.15)', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <ShieldCheck size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px' }}>Smart QR Tag Passes</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Every ear tag has an encrypted QR pass readable by any smartphone camera, instantly pulling complete EHR records, vaccination schedules, and housing shed assignments.
              </p>
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Award size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px' }}>Automated Legal Compliance</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                1-click automated PDF reports adhering to Animal Welfare Board of India (AWBI) audit specifications and state Gaushala Ayog census requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Call To Action Banner ────────────────────────────── */}
      <section style={{ padding: '80px 24px', textAlign: 'center', maxWidth: '840px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '16px' }}>
          Join the Movement for Digital Gauseva
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '32px' }}>
          Whether you are a devotee wanting to sponsor a cow, a veterinarian managing herd health, or an animal welfare organization, E-Gowshala provides complete transparency.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/adopt-wall" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1rem', fontWeight: 800 }}>
            <Sparkles size={18} /> Adopt a Cow
          </Link>
          <Link to="/donate" className="btn btn-secondary" style={{ padding: '14px 24px', fontSize: '1rem', fontWeight: 700, color: '#10B981' }}>
            <Heart size={18} /> Donate with 80G Exemption
          </Link>
          <Link to="/login" className="btn btn-secondary" style={{ padding: '14px 24px', fontSize: '1rem', fontWeight: 600 }}>
            <LogIn size={18} /> Sign In to Portal
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer style={{ marginTop: 'auto', background: isDark ? '#080A0E' : '#F1F5F9', borderTop: '1px solid var(--border-color)', padding: '40px 24px 30px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #F97316, #EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3px' }}>
              <CowIcon size={20} variant="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem' }}>E-Gowshala</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Smart Livestock AI &amp; Gaushala ERP</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', fontSize: '0.8125rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
            <Link to="/impact" style={{ color: 'var(--text-secondary)' }}>Live Impact</Link>
            <Link to="/adopt-wall" style={{ color: 'var(--text-secondary)' }}>Adopt-a-Cow</Link>
            <Link to="/donate" style={{ color: 'var(--text-secondary)' }}>Donate (80G)</Link>
            <Link to="/login" style={{ color: 'var(--text-secondary)' }}>Sign In</Link>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} E-Gowshala. Animal Welfare Board of India (AWBI) Aligned.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicHomePage;
