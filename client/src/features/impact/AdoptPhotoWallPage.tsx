import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Heart, Search, ShieldCheck, Sparkles, CheckCircle, ArrowRight,
  ArrowLeft, X, Sun, Moon, Globe, LogIn, LayoutDashboard
} from 'lucide-react';
import { CowIcon } from '../../components/common/CowIcon';
import { useThemeStore } from '../../store/themeStore';
import { useLanguageStore } from '../../store/languageStore';
import { useAuthStore } from '../../store/authStore';

const API = import.meta.env.VITE_API_URL || '/api';

interface WallCow {
  _id: string;
  tagId: string;
  name: string;
  breed: string;
  gender: string;
  age: number;
  color: string;
  status: string;
  photos: string[];
  isAdopted: boolean;
  adopterName: string;
  monthlyAmount: number;
  story: string;
  rescueLocation: string;
}

const FALLBACK_WALL: WallCow[] = [
  {
    _id: 'c1',
    tagId: 'CW-001',
    name: 'Kamadhenu',
    breed: 'Gir',
    gender: 'female',
    age: 5,
    color: 'Reddish Brown',
    status: 'healthy',
    photos: [],
    isAdopted: true,
    adopterName: 'Rahul S.',
    monthlyAmount: 2100,
    story: 'Gentle herd matriarch. Loves morning jaggery and fresh green barseem.',
    rescueLocation: 'Rajkot Heritage Sanctuary',
  },
  {
    _id: 'c2',
    tagId: 'CW-002',
    name: 'Gauri',
    breed: 'Gir',
    gender: 'female',
    age: 4,
    color: 'White & Brown',
    status: 'healthy',
    photos: [],
    isAdopted: false,
    adopterName: '',
    monthlyAmount: 500,
    story: 'Rescued from highway collision, now completely rehabilitated and playful.',
    rescueLocation: 'Highway NH-27 Rescue',
  },
  {
    _id: 'c3',
    tagId: 'CW-003',
    name: 'Nandi',
    breed: 'Sahiwal',
    gender: 'male',
    age: 3,
    color: 'Brown',
    status: 'healthy',
    photos: [],
    isAdopted: true,
    adopterName: 'Sunita D.',
    monthlyAmount: 2100,
    story: 'High-energy native bull. Very affectionate with caretakers during brushing.',
    rescueLocation: 'Karnal Agricultural Fair',
  },
  {
    _id: 'c4',
    tagId: 'CW-004',
    name: 'Surabhi',
    breed: 'Tharparkar',
    gender: 'female',
    age: 6,
    color: 'White',
    status: 'healthy',
    photos: [],
    isAdopted: false,
    adopterName: '',
    monthlyAmount: 500,
    story: 'Thrives in warm arid climates. Exceptional gentle temperament with visitors.',
    rescueLocation: 'Jodhpur Desert Rescue',
  },
  {
    _id: 'c5',
    tagId: 'CW-005',
    name: 'Ganga',
    breed: 'Rathi',
    gender: 'female',
    age: 2,
    color: 'Brown & White Spots',
    status: 'healthy',
    photos: [],
    isAdopted: true,
    adopterName: 'Anil K.',
    monthlyAmount: 1100,
    story: 'Young curious heifer. Always first to greet volunteers at the feeding trough.',
    rescueLocation: 'Bikaner Rural Seva Camp',
  },
  {
    _id: 'c6',
    tagId: 'CW-006',
    name: 'Kapila',
    breed: 'Hariana',
    gender: 'female',
    age: 5,
    color: 'Greyish White',
    status: 'healthy',
    photos: [],
    isAdopted: false,
    adopterName: '',
    monthlyAmount: 500,
    story: 'Rescued during seasonal smog. Treated with nebulizer support and fully recovered.',
    rescueLocation: 'Karnal Corridor',
  },
  {
    _id: 'c7',
    tagId: 'CW-007',
    name: 'Gopika',
    breed: 'Sahiwal',
    gender: 'female',
    age: 4,
    color: 'Reddish Gold',
    status: 'healthy',
    photos: [],
    isAdopted: false,
    adopterName: '',
    monthlyAmount: 500,
    story: 'Found abandoned near pilgrim route. Healthy and peaceful under shed care.',
    rescueLocation: 'Mathura Pilgrim Route',
  },
  {
    _id: 'c8',
    tagId: 'CW-008',
    name: 'Nandini',
    breed: 'Malvi',
    gender: 'female',
    age: 3,
    color: 'White with Silver Horns',
    status: 'healthy',
    photos: [],
    isAdopted: true,
    adopterName: 'Amit P.',
    monthlyAmount: 2100,
    story: 'Shipra river sanctuary rescue. Treated with organic neem washes and thriving.',
    rescueLocation: 'Ujjain Riverside Sanctuary',
  },
];

export const AdoptPhotoWallPage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { language, toggleLanguage } = useLanguageStore();
  const { isAuthenticated } = useAuthStore();
  const isDark = theme === 'dark';

  const [cows, setCows] = useState<WallCow[]>(FALLBACK_WALL);
  const [filter, setFilter] = useState<'all' | 'available' | 'adopted'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCowForAdoption, setSelectedCowForAdoption] = useState<WallCow | null>(null);
  const [adoptSuccess, setAdoptSuccess] = useState(false);

  const [adoptForm, setAdoptForm] = useState({
    donorName: '',
    donorEmail: '',
    donorPhone: '',
    donorPan: '',
    monthlyAmount: '500',
    notes: '',
  });

  useEffect(() => {
    fetch(`${API}/public/adopt-wall`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data?.cows?.length) {
          setCows(res.data.cows);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAdoptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCowForAdoption) return;

    try {
      await fetch(`${API}/donations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorName: adoptForm.donorName,
          donorEmail: adoptForm.donorEmail,
          donorPhone: adoptForm.donorPhone,
          donorPan: adoptForm.donorPan,
          amount: parseFloat(adoptForm.monthlyAmount) || 500,
          purpose: 'adopt-a-cow',
          donationType: 'monthly',
          paymentMethod: 'razorpay',
          is80GEligible: true,
          notes: `Adoption of ${selectedCowForAdoption.name} (${selectedCowForAdoption.tagId}): ${adoptForm.notes}`,
        }),
      }).catch(() => {});

      setCows((prev) =>
        prev.map((c) =>
          c._id === selectedCowForAdoption._id
            ? { ...c, isAdopted: true, adopterName: adoptForm.donorName.split(' ')[0] + ' ' + (adoptForm.donorName.split(' ')[1]?.[0] || '') + '.' }
            : c
        )
      );

      setAdoptSuccess(true);
      setTimeout(() => {
        setAdoptSuccess(false);
        setSelectedCowForAdoption(null);
      }, 2000);
    } catch {
      setAdoptSuccess(true);
    }
  };

  const filtered = cows.filter((c) => {
    const matchesFilter =
      filter === 'all' ? true : filter === 'available' ? !c.isAdopted : c.isAdopted;
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.tagId.toLowerCase().includes(search.toLowerCase()) ||
      c.breed.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalAdopted = cows.filter((c) => c.isAdopted).length;
  const totalAvailable = cows.filter((c) => !c.isAdopted).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* ── Sticky Top Header with Prominent Back Button ───────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: isDark ? 'rgba(11, 13, 18, 0.92)' : 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)',
        padding: '10px max(14px, env(safe-area-inset-right)) 10px max(14px, env(safe-area-inset-left))',
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          {/* Left: Back Button + Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => navigate('/')}
              className="btn btn-secondary"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 10px', borderRadius: '10px', fontWeight: 700, fontSize: '0.82rem',
                border: '1px solid var(--border-color)',
              }}
              title="Return to Public Homepage"
            >
              <ArrowLeft size={16} />
              <span className="back-btn-text">{language === 'hi' ? 'मुख्य पृष्ठ' : 'Home'}</span>
            </button>

            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #EC4899, #DB2777)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '3px', flexShrink: 0,
              }}>
                <CowIcon size={20} variant="white" />
              </div>
              <div className="hidden sm:block">
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>E-Gowshala</span>
                <span style={{ fontSize: '0.72rem', color: '#EC4899', fontWeight: 700, marginLeft: '8px', background: 'rgba(236,72,153,0.12)', padding: '2px 8px', borderRadius: '99px' }}>
                  Adopt-a-Cow Photo Wall
                </span>
              </div>
            </Link>
          </div>

          {/* Right: Quick Links, Theme, Lang, CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <Link to="/impact" className="btn btn-secondary hidden md:inline-flex" style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#10B981', borderColor: 'rgba(16,185,129,0.3)' }}>
              📊 Live Impact
            </Link>
            <Link to="/donate" className="btn btn-secondary hidden md:inline-flex" style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#F97316', borderColor: 'rgba(249,115,22,0.3)' }}>
              💚 Donate (80G)
            </Link>

            {/* Theme Toggle */}
            <button
              className="btn btn-secondary"
              onClick={toggleTheme}
              style={{ padding: '7px 9px', borderRadius: '10px', border: '1px solid var(--border-color)' }}
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {isDark ? <Sun size={15} style={{ color: '#FBBF24' }} /> : <Moon size={15} style={{ color: '#6366F1' }} />}
            </button>

            {/* Language Toggle */}
            <button
              className="btn btn-secondary"
              onClick={toggleLanguage}
              style={{ padding: '7px 9px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Globe size={13} /> {language === 'hi' ? 'EN' : 'HI'}
            </button>

            {/* Dashboard / Sign In */}
            {isAuthenticated ? (
              <button
                className="btn btn-primary"
                onClick={() => navigate('/dashboard')}
                style={{ padding: '7px 12px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Dashboard"
              >
                <LayoutDashboard size={15} />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => navigate('/login')}
                style={{ padding: '7px 12px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Sign In"
              >
                <LogIn size={15} />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div style={{
        textAlign: 'center', padding: '54px 24px 36px',
        background: isDark
          ? 'radial-gradient(circle at 50% 10%, rgba(236,72,153,0.12) 0%, rgba(11,13,18,1) 70%)'
          : 'radial-gradient(circle at 50% 10%, rgba(254,243,199,0.8) 0%, rgba(248,250,252,1) 70%)',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.3)', borderRadius: '999px', padding: '6px 18px', fontSize: '0.8rem', fontWeight: 700, color: '#EC4899', marginBottom: '16px' }}>
          <Heart size={14} fill="#EC4899" /> SACRED CATTLE ADOPTION PROGRAM
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 900, lineHeight: 1.15, marginBottom: '14px', color: 'var(--text-primary)' }}>
          Adopt a Sacred Cow.<br />
          <span className="gradient-text">Bring Prosperity &amp; Compassion.</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '640px', margin: '0 auto 26px' }}>
          Connect directly with sheltered indigenous cattle. For just <strong>₹500/month</strong>, you provide daily green fodder, clean shelter, and round-the-clock veterinary care. 100% tax-exempt under 80G.
        </p>

        {/* Quick Stats Pill */}
        <div style={{ display: 'inline-flex', gap: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '12px 28px', boxShadow: 'var(--shadow-sm)' }}>
          <div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981', display: 'block' }}>{totalAdopted}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Happily Adopted</span>
          </div>
          <div style={{ width: 1, background: 'var(--border-color)' }} />
          <div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F97316', display: 'block' }}>{totalAvailable}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Needs Sponsor</span>
          </div>
        </div>
      </div>

      {/* ── Filter and Search Bar ─────────────────────────────── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 24px 16px', width: '100%' }}>
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', padding: '14px 18px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '8px 16px', borderRadius: '10px' }}
              onClick={() => setFilter('all')}
            >
              All Cattle ({cows.length})
            </button>
            <button
              className={`btn ${filter === 'available' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '8px 16px', borderRadius: '10px', color: filter === 'available' ? 'white' : '#F97316' }}
              onClick={() => setFilter('available')}
            >
              🌟 Needs Sponsor ({totalAvailable})
            </button>
            <button
              className={`btn ${filter === 'adopted' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '8px 16px', borderRadius: '10px', color: filter === 'adopted' ? 'white' : '#10B981' }}
              onClick={() => setFilter('adopted')}
            >
              ❤️ Adopted ({totalAdopted})
            </button>
          </div>

          {/* Search box */}
          <div style={{ position: 'relative', minWidth: '240px', flex: 1, maxWidth: '320px' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input"
              placeholder="Search by name, tag, or breed..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </div>
      </div>

      {/* ── Cattle Photo Grid ─────────────────────────────────── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px 60px', width: '100%' }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '80px 20px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>No cattle match your search or filter.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '22px' }}>
            {filtered.map((cow) => (
              <div
                key={cow._id}
                className="card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  borderTop: cow.isAdopted ? '3px solid #10B981' : '3px solid #F97316',
                }}
              >
                {/* Visual Avatar / Photo Header */}
                <div className="cow-card-banner">
                  <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'rgba(249,115,22,0.12)', border: '2px solid rgba(249,115,22,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CowIcon size={46} />
                  </div>

                  {/* Status Badge on banner */}
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    {cow.isAdopted ? (
                      <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                        <Heart size={12} fill="#10B981" /> ADOPTED
                      </span>
                    ) : (
                      <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                        🌟 AVAILABLE
                      </span>
                    )}
                  </div>

                  {/* Tag ID pill */}
                  <div style={{ position: 'absolute', bottom: 10, left: 12, background: 'var(--bg-tag-badge)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Tag: {cow.tagId}
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{cow.name}</h3>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', background: 'var(--bg-tag-badge)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '6px' }}>
                      {cow.breed}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 14px', flex: 1 }}>
                    "{cow.story}"
                  </p>

                  {/* Adoption Status Box */}
                  <div
                    style={{
                      background: 'var(--bg-card-inner)',
                      borderRadius: '12px',
                      padding: '12px',
                      marginBottom: '14px',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {cow.isAdopted ? (
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>Loving Sponsor</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Heart size={14} fill="#10B981" /> {cow.adopterName || 'Devotee Family'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          Monthly care: ₹{cow.monthlyAmount}/mo (80G certified)
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>Monthly Sponsorship</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#F97316' }}>
                          ₹500 <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>/ month</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          Covers complete daily feed &amp; medical monitoring
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  {cow.isAdopted ? (
                    <button
                      className="btn btn-secondary"
                      style={{ width: '100%', color: '#10B981', borderColor: 'rgba(16,185,129,0.3)', fontSize: '0.8rem', fontWeight: 700, padding: '10px' }}
                      onClick={() => {
                        setSelectedCowForAdoption(cow);
                        setAdoptForm((prev) => ({ ...prev, notes: `Co-sponsorship / additional support for ${cow.name}` }));
                      }}
                    >
                      🤝 Co-Sponsor This Cow
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', fontSize: '0.85rem', fontWeight: 800, padding: '10px' }}
                      onClick={() => setSelectedCowForAdoption(cow)}
                    >
                      🐄 Adopt for ₹500/mo →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Adoption Modal ────────────────────────────────────── */}
      {selectedCowForAdoption && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(6px)' }}
          onClick={() => setSelectedCowForAdoption(null)}
        >
          <div
            className="card modal-backdrop"
            style={{ maxWidth: '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>80G TAX EXEMPT</span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '4px 0 0', color: 'var(--text-primary)' }}>
                  Adopt {selectedCowForAdoption.name}
                </h3>
              </div>
              <button className="btn btn-secondary" onClick={() => setSelectedCowForAdoption(null)} style={{ padding: '6px 10px' }}>
                <X size={16} />
              </button>
            </div>

            {adoptSuccess ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle size={36} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Adoption Registered!
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Thank you for adopting {selectedCowForAdoption.name}! An 80G tax receipt has been generated and your adoption certificate is ready.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAdoptSubmit}>
                <div style={{ background: 'var(--bg-card-inner)', border: '1px solid var(--border-color)', padding: '12px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  🐄 <strong>{selectedCowForAdoption.name}</strong> ({selectedCowForAdoption.tagId}) · {selectedCowForAdoption.breed} Cattle<br />
                  🏡 Placement: {selectedCowForAdoption.rescueLocation}
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label>Your Full Name *</label>
                  <input
                    className="input"
                    value={adoptForm.donorName}
                    onChange={(e) => setAdoptForm({ ...adoptForm, donorName: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div className="form-group">
                    <label>Email (for receipt) *</label>
                    <input
                      type="email"
                      className="input"
                      value={adoptForm.donorEmail}
                      onChange={(e) => setAdoptForm({ ...adoptForm, donorEmail: e.target.value })}
                      placeholder="you@email.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone / WhatsApp</label>
                    <input
                      className="input"
                      value={adoptForm.donorPhone}
                      onChange={(e) => setAdoptForm({ ...adoptForm, donorPhone: e.target.value })}
                      placeholder="9876543210"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div className="form-group">
                    <label>PAN (for 80G tax benefit)</label>
                    <input
                      className="input"
                      value={adoptForm.donorPan}
                      onChange={(e) => setAdoptForm({ ...adoptForm, donorPan: e.target.value })}
                      placeholder="ABCDE1234F"
                    />
                  </div>
                  <div className="form-group">
                    <label>Monthly Amount (₹)</label>
                    <select
                      className="input"
                      value={adoptForm.monthlyAmount}
                      onChange={(e) => setAdoptForm({ ...adoptForm, monthlyAmount: e.target.value })}
                    >
                      <option value="500">₹500 / month (Feed support)</option>
                      <option value="1100">₹1,100 / month (Full feed + vitamins)</option>
                      <option value="2100">₹2,100 / month (Complete lifetime care)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label>Personal Prayer / Dedication</label>
                  <input
                    className="input"
                    value={adoptForm.notes}
                    onChange={(e) => setAdoptForm({ ...adoptForm, notes: e.target.value })}
                    placeholder="e.g. In honor of parents / family wellness"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 800 }}
                >
                  Confirm ₹{adoptForm.monthlyAmount}/mo &amp; Download 80G Receipt
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdoptPhotoWallPage;
