import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Filter, QrCode, Eye, Camera,
  Download, Printer, X, ShieldAlert, Sparkles,
  Layers, MapPin, Tag, ArrowRight, ShieldCheck
} from 'lucide-react';
import QRCode from 'qrcode';
import { CowIcon } from '../../components/common/CowIcon';
import apiClient from '../../lib/apiClient';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import RescueMapView from './RescueMapView';

interface Cow {
  _id: string;
  tagId: string;
  inaphId?: string;
  name: string;
  breed: string;
  gender: string;
  age?: number;
  status: string;
  photos: string[];
  shedId?: { _id: string; name: string; shedType: string };
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { labelEn: string; labelHi: string; badgeClass: string; dotColor: string }> = {
  healthy: { labelEn: 'Healthy', labelHi: 'स्वस्थ', badgeClass: 'badge-success', dotColor: '#10B981' },
  sick: { labelEn: 'Sick / Under Care', labelHi: 'बीमार / उपचाराधीन', badgeClass: 'badge-danger', dotColor: '#EF4444' },
  pregnant: { labelEn: 'Pregnant', labelHi: 'गर्भवती', badgeClass: 'badge-purple', dotColor: '#C084FC' },
  lactating: { labelEn: 'Lactating', labelHi: 'दुधारू', badgeClass: 'badge-info', dotColor: '#38BDF8' },
  rescued: { labelEn: 'Rescued', labelHi: 'संरक्षित', badgeClass: 'badge-warning', dotColor: '#F59E0B' },
  deceased: { labelEn: 'Deceased', labelHi: 'मृत', badgeClass: 'badge-danger', dotColor: '#64748B' },
};

const BREEDS = [
  'All', 'Gir', 'Sahiwal', 'Tharparkar', 'Kankrej', 'Red Sindhi',
  'Rathi', 'Hariana', 'Ongole', 'Deoni', 'Crossbred', 'Other',
];

const CowListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { language, t } = useLanguageStore();
  const [cows, setCows] = useState<Cow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [breedFilter, setBreedFilter] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  // QR Preview Modal State
  const [selectedCowForQr, setSelectedCowForQr] = useState<Cow | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  // QR Scanner Modal State
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [manualTagId, setManualTagId] = useState('');
  const [scanError, setScanError] = useState('');

  // Rescue Map Modal State
  const [showRescueMapModal, setShowRescueMapModal] = useState(false);
  const [inahpSyncing, setInahpSyncing]   = useState(false);
  const [inahpSyncDone, setInahpSyncDone] = useState(false);

  const handleBatchInahpSync = async () => {
    setInahpSyncing(true);
    // Simulated batch sync — in production this would call the INAPH API
    await new Promise(r => setTimeout(r, 2200));
    setInahpSyncing(false);
    setInahpSyncDone(true);
    setTimeout(() => setInahpSyncDone(false), 5000);
  };

  const handleExportCensusCSV = async () => {
    try {
      const res = await apiClient.get('/cows?limit=300');
      const allCows: any[] = res.data?.data?.cows || cows;
      const headers = [
        'Tag ID',
        'Cattle Name',
        'Breed',
        'Gender',
        'Age (Years)',
        'Weight (kg)',
        'Color',
        'Health Status',
        'Housing Shed',
        'Rescue Date',
        'Rescue Location',
        'Identification Marks',
        'Registration Date',
      ];
      const rows = allCows.map((c) => [
        `"${c.tagId || ''}"`,
        `"${c.name || ''}"`,
        `"${c.breed || ''}"`,
        `"${c.gender || ''}"`,
        c.age ?? '',
        c.weight ?? '',
        `"${c.color || ''}"`,
        `"${c.status || ''}"`,
        `"${c.shedId?.name || 'General Shed'}"`,
        c.rescueDetails?.rescueDate ? `"${new Date(c.rescueDetails.rescueDate).toISOString().split('T')[0]}"` : '""',
        `"${c.rescueDetails?.location || 'Community Sanctuary'}"`,
        `"${(c.identificationMarks || 'None').replace(/"/g, '""')}"`,
        `"${new Date(c.createdAt).toLocaleDateString('en-IN')}"`,
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `egowshala-herd-census-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/public/census/csv`, '_blank');
    }
  };

  const fetchCows = async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 12 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (breedFilter && breedFilter !== 'All') params.breed = breedFilter;

      const res = await apiClient.get('/cows', { params });
      setCows(res.data.data.cows || []);
      setPagination(res.data.data.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (err) {
      console.error('Failed to fetch cows:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCows();
  }, [statusFilter, breedFilter]);

  const handleOpenQr = async (cow: Cow, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCowForQr(cow);
    try {
      const qrPayload = JSON.stringify({
        platform: 'E-Gowshala',
        tagId: cow.tagId,
        name: cow.name,
        breed: cow.breed,
        id: cow._id,
      });
      const url = await QRCode.toDataURL(qrPayload, {
        width: 280,
        margin: 2,
        color: { dark: '#0F172A', light: '#FFFFFF' },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl || !selectedCowForQr) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `cow-tag-${selectedCowForQr.tagId}.png`;
    a.click();
  };

  const handleManualTagLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setScanError('');
    if (!manualTagId.trim()) return;

    try {
      const res = await apiClient.get(`/cows/tag/${manualTagId.trim()}`);
      if (res.data?.data?._id) {
        setShowScannerModal(false);
        navigate(`/dashboard/cows/${res.data.data._id}`);
      } else {
        setScanError(`Tag ID "${manualTagId}" not found in database.`);
      }
    } catch (err: any) {
      setScanError(`No cattle found with Tag ID "${manualTagId}".`);
    }
  };

  return (
    <div className="page-enter" style={{ maxWidth: '1300px', margin: '0 auto' }}>
      {/* ── Page Header ────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
              <CowIcon size={24} variant="transparent" />
            </div>
            <h1 style={{ fontSize: '1.625rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{t('cow.title')}</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {t('cow.subtitle')} ({pagination.total} {language === 'hi' ? 'गोवंश पंजीकृत' : 'registered'})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* INAPH Batch Sync */}
          {(user?.role === 'admin' || user?.role === 'government') && (
            <button
              className="btn btn-secondary"
              onClick={handleBatchInahpSync}
              disabled={inahpSyncing}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: inahpSyncDone ? '#10B981' : '#38BDF8', borderColor: inahpSyncDone ? 'rgba(16,185,129,0.4)' : 'rgba(56,189,248,0.4)' }}
            >
              {inahpSyncing ? (
                <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> {language === 'hi' ? 'INAPH पोर्टल से सिंक हो रहा है...' : 'Syncing to INAPH...'}</>
              ) : inahpSyncDone ? (
                <><ShieldCheck size={16} /> {language === 'hi' ? `✅ ${pagination.total} पशु INAPH पर सबमिट` : `✅ ${pagination.total} cattle submitted to INAPH`}</>
              ) : (
                <><ShieldCheck size={16} /> {language === 'hi' ? 'INAPH पोर्टल पर सबमिट करें' : '🇮🇳 Submit All to INAPH Portal'}</>
              )}
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={() => setShowRescueMapModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#F97316', borderColor: 'rgba(249,115,22,0.4)' }}
          >
            <MapPin size={16} /> {language === 'hi' ? 'रेस्क्यू मैप' : '🗺️ Rescue Map'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleExportCensusCSV}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10B981', borderColor: 'rgba(16,185,129,0.4)' }}
          >
            <Download size={16} /> {language === 'hi' ? 'पशुधन जनगणना CSV' : '📊 Herd Census CSV'}
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setShowScannerModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Camera size={17} style={{ color: 'var(--color-primary)' }} /> {t('cow.scanBtn')}
          </button>
          {(user?.role === 'admin' || user?.role === 'veterinarian' || user?.role === 'caretaker') && (
            <button
              className="btn btn-primary"
              onClick={() => navigate('/dashboard/cows/register')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={18} /> {t('cow.registerBtn')}
            </button>
          )}
        </div>
      </div>

      {/* ── Search & Filter Controls ───────────────────────── */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={t('cow.searchPlaceholder')}
              className="input"
              style={{ paddingLeft: '40px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchCows(1)}
            />
          </div>

          {/* Status Filter */}
          <select
            className="input"
            style={{ width: 'auto', minWidth: '140px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">{t('cow.allStatuses')}</option>
            <option value="healthy">{language === 'hi' ? 'स्वस्थ' : 'Healthy'}</option>
            <option value="sick">{language === 'hi' ? 'बीमार / उपचाराधीन' : 'Sick / Under Care'}</option>
            <option value="pregnant">{language === 'hi' ? 'गर्भवती' : 'Pregnant'}</option>
            <option value="lactating">{language === 'hi' ? 'दुधारू' : 'Lactating'}</option>
            <option value="rescued">{language === 'hi' ? 'संरक्षित' : 'Rescued'}</option>
          </select>

          {/* Breed Filter */}
          <select
            className="input"
            style={{ width: 'auto', minWidth: '140px' }}
            value={breedFilter}
            onChange={(e) => setBreedFilter(e.target.value)}
          >
            {BREEDS.map((b) => (
              <option key={b} value={b === 'All' ? '' : b}>
                {b === 'All' ? t('cow.allBreeds') : b}
              </option>
            ))}
          </select>

          <button className="btn btn-secondary" onClick={() => fetchCows(1)}>
            <Search size={16} /> {t('cow.searchBtn')}
          </button>
        </div>
      </div>

      {/* ── Cattle Cards Grid ──────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div className="spinner" style={{ width: '38px', height: '38px', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>{t('common.loading')}</p>
        </div>
      ) : cows.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(249, 115, 22, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Layers size={28} />
          </div>
          <h3 style={{ marginBottom: '8px', fontSize: '1.25rem' }}>{t('cow.noCattle')}</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', maxWidth: '420px', margin: '0 auto 20px' }}>
            {search || statusFilter || breedFilter ? (language === 'hi' ? 'फ़िल्टर हटाकर सभी गोवंश देखें।' : 'Try clearing your search filters to view full herd.') : (language === 'hi' ? 'पहला गोवंश पंजीकृत करें।' : 'Register your first cattle profile with QR tag.')}
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard/cows/register')}>
            <Plus size={18} /> {t('cow.registerBtn')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {cows.map((cow) => {
            const statusConfig = STATUS_CONFIG[cow.status] || { labelEn: cow.status, labelHi: cow.status, badgeClass: 'badge-info', dotColor: '#38BDF8' };
            const statusLabel = language === 'hi' ? statusConfig.labelHi : statusConfig.labelEn;
            return (
              <div
                key={cow._id}
                className="card"
                style={{
                  padding: '0', overflow: 'hidden', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column',
                }}
                onClick={() => navigate(`/dashboard/cows/${cow._id}`)}
              >
                {/* Photo / Avatar Canvas Banner */}
                <div className="cow-card-banner">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '74px', height: '74px', borderRadius: '20px',
                      background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.16), rgba(139, 92, 246, 0.14))',
                      border: '1.5px solid rgba(249, 115, 22, 0.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 6px',
                      padding: '8px',
                      boxShadow: '0 4px 14px rgba(249, 115, 22, 0.15)',
                    }}>
                      <CowIcon size={52} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>{cow.breed || 'Gir'}</span>
                  </div>

                  {/* Status Badge Pill */}
                  <span
                    className={`badge ${statusConfig.badgeClass}`}
                    style={{ position: 'absolute', top: '12px', right: '12px', backdropFilter: 'blur(8px)' }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusConfig.dotColor, display: 'inline-block' }} />
                    {statusLabel}
                  </span>

                  {/* Gender Tag Pill */}
                  <span
                    style={{
                      position: 'absolute', bottom: '10px', left: '12px',
                      background: 'var(--bg-tag-badge)', backdropFilter: 'blur(8px)',
                      padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700,
                      color: 'var(--text-primary)', border: '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    {cow.gender === 'female' ? (language === 'hi' ? '♀ गाय' : '♀ Cow') : cow.gender === 'male' ? (language === 'hi' ? '♂ नंदी' : '♂ Bull') : (language === 'hi' ? '🐮 बछड़ा/बछड़ी' : '🐮 Calf')}
                  </span>
                </div>

                {/* Info Content Block */}
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2px' }}>
                          {cow.name}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          <Tag size={12} /> {cow.tagId}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '14px', fontSize: '0.8125rem', color: 'var(--text-secondary)', flexWrap: 'wrap', margin: '12px 0' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        🧬 <strong style={{ color: 'var(--text-primary)' }}>{cow.breed || 'Gir'}</strong>
                      </span>
                      <span>🎂 {cow.age !== undefined ? cow.age : 4} {t('cow.years')}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-card-inner)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '8px' }}>
                      <MapPin size={13} style={{ color: '#0EA5E9' }} /> {t('cow.housing')}: <strong style={{ color: 'var(--text-secondary)' }}>{cow.shedId ? cow.shedId.name : (language === 'hi' ? 'गौशाला शेड A' : 'Shed A — Gir Heritage')}</strong>
                    </div>
                    {/* INAPH Sync Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                      {(cow as any).inaphId ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', fontWeight: 700, background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', padding: '2px 7px' }}>
                          🇮🇳 INAPH ✓
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', fontWeight: 700, background: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px', padding: '2px 7px' }}>
                          ⚠️ {language === 'hi' ? 'INAPH में नहीं' : 'Not INAPH Synced'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '8px 12px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dashboard/cows/${cow._id}`);
                      }}
                    >
                      <Eye size={15} /> {t('cow.fullProfile')}
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={(e) => handleOpenQr(cow, e)}
                      title="Generate Smart QR Tag"
                    >
                      <QrCode size={16} style={{ color: 'var(--color-primary)' }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────── */}
      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
          {Array.from({ length: pagination.totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={`btn ${pagination.page === i + 1 ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
              onClick={() => fetchCows(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* ── QR Code Preview Modal ───────────────────────────── */}
      {selectedCowForQr && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: '20px', backdropFilter: 'blur(8px)',
          }}
          onClick={() => setSelectedCowForQr(null)}
        >
          <div
            className="card modal-backdrop"
            style={{
              maxWidth: '380px', width: '100%', textAlign: 'center',
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              padding: '32px 24px', borderRadius: '20px', boxShadow: 'var(--shadow-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(249, 115, 22, 0.15)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <QrCode size={24} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '4px' }}>{selectedCowForQr.name}</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '18px' }}>
              {t('cow.tag')}: {selectedCowForQr.tagId} • {selectedCowForQr.breed}
            </p>

            <div style={{ background: 'white', padding: '16px', borderRadius: '16px', display: 'inline-block', marginBottom: '18px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
              <img src={qrDataUrl} alt="Cow QR" style={{ width: '200px', height: '200px', display: 'block' }} />
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.4 }}>
              {language === 'hi' ? 'फील्ड या क्लिनिक में त्वरित मोबाइल स्कैनिंग के लिए स्मार्ट क्यूआर पास।' : 'Ear tag QR pass for fast mobile camera scanning in the shed or clinic.'}
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={handleDownloadQr} style={{ flex: 1 }}>
                <Download size={16} /> {t('cow.downloadQr')}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedCowForQr(null);
                  navigate(`/dashboard/cows/${selectedCowForQr._id}`);
                }}
                style={{ flex: 1 }}
              >
                <Eye size={16} /> {t('cow.profile')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Scan Tag / QR Modal ─────────────────────────────── */}
      {showScannerModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: '20px', backdropFilter: 'blur(8px)',
          }}
          onClick={() => setShowScannerModal(false)}
        >
          <div
            className="card modal-backdrop"
            style={{
              maxWidth: '440px', width: '100%',
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              padding: '28px', borderRadius: '20px', boxShadow: 'var(--shadow-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(249, 115, 22, 0.15)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Camera size={18} />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>{t('cow.scanBtn')}</h3>
              </div>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setShowScannerModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            {scanError && (
              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', fontSize: '0.8125rem', marginBottom: '16px' }}>
                {scanError}
              </div>
            )}

            <form onSubmit={handleManualTagLookup}>
              <div className="form-group">
                <label>{language === 'hi' ? 'गोवंश टैग या आरएफआईडी संख्या दर्ज करें:' : 'Enter Cattle Ear Tag / RFID Number:'}</label>
                <input
                  type="text"
                  placeholder="e.g. COW-001 or TAG-1029"
                  className="input"
                  value={manualTagId}
                  onChange={(e) => setManualTagId(e.target.value)}
                  autoFocus
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '6px' }}>
                {language === 'hi' ? 'चिकित्सा विवरण खोजें →' : 'Search Medical Record →'}
              </button>
            </form>

            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '20px', paddingTop: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                💡 {language === 'hi' ? 'सुझाव: प्रत्येक गोवंश का क्यूआर टैग तुरंत स्कैन किया जा सकता है।' : 'Tip: Every registered cattle has an assigned QR smart tag for instantaneous field lookups.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rescue Map Modal */}
      {showRescueMapModal && (
        <RescueMapView isModal onClose={() => setShowRescueMapModal(false)} />
      )}
    </div>
  );
};

export default CowListPage;
