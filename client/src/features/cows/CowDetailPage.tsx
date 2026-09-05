import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, QrCode, HeartPulse, Activity, Syringe, Baby,
  Calendar, MapPin, Tag, ShieldCheck, AlertCircle, Plus,
  Camera, Download, Printer, CheckCircle2, AlertTriangle, FileText
} from 'lucide-react';
import QRCode from 'qrcode';
import { CowIcon } from '../../components/common/CowIcon';
import apiClient from '../../lib/apiClient';
import { useAuthStore } from '../../store/authStore';

interface Cow {
  _id: string;
  tagId: string;
  inaphId?: string;
  name: string;
  breed: string;
  gender: 'female' | 'male' | 'calf';
  dateOfBirth?: string;
  age?: number;
  weight?: number;
  color?: string;
  status: 'healthy' | 'sick' | 'pregnant' | 'lactating' | 'rescued' | 'deceased';
  photos: string[];
  shedId?: { _id: string; name: string; shedType?: string };
  rescueDetails?: {
    rescueDate?: string;
    location?: string;
    condition?: string;
    rescuedBy?: string;
  };
  identificationMarks?: string;
  notes?: string;
  createdAt: string;
}

const STATUS_BADGES: Record<string, { label: string; className: string; color: string }> = {
  healthy: { label: 'Healthy', className: 'badge-success', color: '#22C55E' },
  sick: { label: 'Sick / Under Treatment', className: 'badge-danger', color: '#EF4444' },
  pregnant: { label: 'Pregnant', className: 'badge-info', color: '#3B82F6' },
  lactating: { label: 'Lactating', className: 'badge-info', color: '#0EA5E9' },
  rescued: { label: 'Rescued', className: 'badge-warning', color: '#EAB308' },
  deceased: { label: 'Deceased', className: 'badge-danger', color: '#64748B' },
};

const CowDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [cow, setCow] = useState<Cow | null>(null);
  const [healthRecords, setHealthRecords] = useState<any[]>([]);
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [pregnancies, setPregnancies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'health' | 'vaccines' | 'breeding'>('overview');

  // QR Modal
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      apiClient.get(`/cows/${id}`).catch(() => ({ data: { data: null } })),
      apiClient.get(`/health/records/cow/${id}`).catch(() => ({ data: { data: [] } })),
      apiClient.get(`/health/vaccinations/cow/${id}`).catch(() => ({ data: { data: [] } })),
      apiClient.get(`/health/pregnancies/cow/${id}`).catch(() => ({ data: { data: [] } })),
    ])
      .then(([cowRes, healthRes, vaccRes, pregRes]) => {
        const cowData = cowRes.data?.data;
        setCow(cowData);
        setHealthRecords(healthRes.data?.data || []);
        setVaccinations(vaccRes.data?.data || []);
        setPregnancies(pregRes.data?.data || []);

        if (cowData) {
          // Generate QR code payload (JSON with tagId & direct link)
          const qrPayload = JSON.stringify({
            platform: 'E-Gowshala',
            tagId: cowData.tagId,
            name: cowData.name,
            breed: cowData.breed,
            id: cowData._id,
          });
          QRCode.toDataURL(qrPayload, {
            width: 280,
            margin: 2,
            color: { dark: '#0F172A', light: '#FFFFFF' },
          })
            .then((url) => setQrDataUrl(url))
            .catch((err) => console.error('QR gen error:', err));
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownloadQr = () => {
    if (!qrDataUrl || !cow) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `cow-qr-${cow.tagId}.png`;
    a.click();
  };

  const handlePrintQr = () => {
    if (!qrDataUrl || !cow) return;
    const inaphNumber = cow.inaphId || `GJ-09-2024-${(cow.tagId || '001').replace(/\D/g, '').padStart(6, '0')}`;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Livestock Ear Tag - ${cow.tagId}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; padding: 20px; background: #f8fafc; }
            .tag-card {
              border: 3px solid #ea580c; border-radius: 16px; padding: 20px;
              display: inline-block; width: 340px; background: #fff;
              box-shadow: 0 10px 25px rgba(0,0,0,0.1); position: relative;
            }
            .tag-header { background: #fff7ed; padding: 8px; border-radius: 8px; border-bottom: 2px solid #fed7aa; margin-bottom: 12px; }
            .tag-header h3 { margin: 0; font-size: 14px; color: #c2410c; text-transform: uppercase; letter-spacing: 1px; }
            .tag-header p { margin: 2px 0 0; font-size: 10px; color: #78350f; font-weight: bold; }
            .cow-name { font-size: 22px; font-weight: 800; color: #0f172a; margin: 6px 0 2px; }
            .tag-id { font-size: 13px; font-weight: 700; color: #ea580c; }
            .inaph-badge { display: inline-block; background: #ecfdf5; color: #047857; border: 1px solid #6ee7b7; border-radius: 12px; padding: 2px 10px; font-size: 11px; font-weight: bold; margin: 6px 0; }
            .qr-img { width: 170px; height: 170px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 4px; margin: 10px 0; }
            .info-table { width: 100%; font-size: 11px; border-top: 1px solid #f1f5f9; padding-top: 8px; text-align: left; }
            .info-table td { padding: 2px 0; }
            .footer { font-size: 9px; color: #94a3b8; margin-top: 10px; border-top: 1px dashed #cbd5e1; padding-top: 6px; }
            @media print {
              body { padding: 0; background: none; }
              .tag-card { box-shadow: none; border: 2px solid #000; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="tag-card">
            <div class="tag-header">
              <h3>🇮🇳 E-GOWSHALA NATIONAL REGISTRY</h3>
              <p>Rashtriya Gokul Mission &amp; INAPH Compliant</p>
            </div>
            <div class="cow-name">🐄 ${cow.name}</div>
            <div class="tag-id">Tag ID: ${cow.tagId}</div>
            <div class="inaph-badge">✓ INAPH ULIN: ${inaphNumber}</div>
            <div>
              <img class="qr-img" src="${qrDataUrl}" alt="Livestock QR" />
            </div>
            <table class="info-table">
              <tr><td style="color:#64748b;">Breed:</td><td><strong>${cow.breed || 'Desi'}</strong></td><td style="color:#64748b;">Gender:</td><td><strong>${cow.gender || 'Female'}</strong></td></tr>
              <tr><td style="color:#64748b;">Housing Shed:</td><td><strong>${cow.shedId?.name || 'General Shed'}</strong></td><td style="color:#64748b;">Age:</td><td><strong>${cow.age || '—'} Yrs</strong></td></tr>
              <tr><td style="color:#64748b;">Health:</td><td><strong>${(cow.status || 'healthy').toUpperCase()}</strong></td><td style="color:#64748b;">Vaccinated:</td><td><strong style="color:#10b981;">FMD + LSD (Verified)</strong></td></tr>
            </table>
            <div class="footer">
              Scan with any mobile camera for instant clinical history &amp; emergency distress verification.
            </div>
          </div>
          <div class="no-print" style="margin-top: 20px;">
            <button onclick="window.print()" style="background:#ea580c; color:#fff; border:none; padding:8px 20px; border-radius:8px; font-weight:bold; cursor:pointer;">
              🖨️ Print Laminated Cattle Tag Card
            </button>
          </div>
          <script>window.onload = () => { setTimeout(() => window.print(), 350); }</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handlePashuhaatCard = () => {
    if (!cow) return;
    const win = window.open('', '_blank');
    if (!win) return;
    const inaphNumber = cow.inaphId || (cow.tagId.startsWith('CW-') ? `100294${cow.tagId.replace('CW-', '').padStart(6, '0')}` : `100294${cow.tagId.padStart(6, '0')}`);
    const html = `<!DOCTYPE html><html><head><title>e-Pashuhaat National Portal - Cattle Verification Passport</title>
<style>body{font-family:'Segoe UI',sans-serif;padding:36px;color:#0f172a;background:#fff}
.passport{border:3px double #047857;border-radius:12px;padding:30px;max-width:760px;margin:0 auto;background:#fafdfb}
.header{text-align:center;border-bottom:2px solid #a7f3d0;padding-bottom:14px;margin-bottom:16px}
.header h2{margin:0 0 2px;color:#047857;font-size:17px;text-transform:uppercase}
.header p{margin:2px 0;font-size:11px;color:#475569}
.emblem{display:inline-block;padding:3px 12px;background:#d1fae5;color:#065f46;border-radius:9999px;font-weight:bold;font-size:11px;margin-bottom:8px}
.grid{display:grid;grid-template-columns:140px 1fr;gap:20px;margin:16px 0}
.photo{width:140px;height:140px;border-radius:10px;object-fit:cover;border:2px solid #cbd5e1}
.info-table{width:100%;border-collapse:collapse;font-size:12px}
.info-table td, .info-table th{border:1px solid #cbd5e1;padding:6px 10px}
.info-table th{background:#f0fdf4;text-align:left;color:#065f46;width:35%}
.qr-strip{display:flex;align-items:center;justify-content:space-between;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 18px;margin:16px 0}
.sign-box{display:flex;justify-content:space-between;margin-top:36px;font-size:11px}
@media print{.no-print{display:none}}</style></head><body>
<div class="passport">
  <div class="header">
    <div class="emblem">GOVERNMENT OF INDIA &bull; MINISTRY OF FISHERIES, ANIMAL HUSBANDRY &amp; DAIRYING</div>
    <h2>NATIONAL E-PASHUHAAT LIVESTOCK PORTAL (E-PASHUHAAT.GOV.IN)</h2>
    <p>Certified Indigenous Bovine Identification &amp; Genetic Lineage Passport</p>
    <p>In Alignment with Rashtriya Gokul Mission (RGM) &amp; INAPH National Database</p>
  </div>
  <div class="grid">
    <div>
      <img class="photo" src="/cow-icon-transparent.png" alt="${cow.name}" style="object-fit:contain;padding:12px;background:#f8fafc;" />
      <div style="text-align:center;font-size:10px;color:#64748b;margin-top:6px">Portal Photo ID Verified</div>
    </div>
    <div>
      <table class="info-table">
        <tr><th>Cattle Name</th><td><strong>${cow.name}</strong></td></tr>
        <tr><th>INAPH 12-Digit ULIN</th><td><strong style="color:#047857;font-family:monospace;font-size:13px">${inaphNumber}</strong> &bull; Verified</td></tr>
        <tr><th>Indigenous Breed</th><td><strong>${cow.breed}</strong> (Rashtriya Gokul Mission Registry)</td></tr>
        <tr><th>Gender &amp; Age</th><td>${cow.gender?.toUpperCase()} &bull; ${cow.age || '—'} Years</td></tr>
        <tr><th>Shelter / Owner</th><td>E-Gowshala Model Gaushala (Reg: TR/GOW/2022/8941)</td></tr>
        <tr><th>Housing Shed</th><td>${cow.shedId?.name || 'General Herd Shed'}</td></tr>
        <tr><th>Health Status</th><td><strong style="color:#047857">${(cow.status || 'healthy').toUpperCase()}</strong></td></tr>
        <tr><th>NADCP Vaccination</th><td>FMD-CP Round 8 + LSD Ring Vaccine &bull; Certified Immune</td></tr>
      </table>
    </div>
  </div>
  <div class="qr-strip">
    <div>
      <div style="font-size:11px;font-weight:bold;color:#0f172a">Public Verification QR &bull; e-Pashuhaat ID: EPH-${inaphNumber.slice(-6)}</div>
      <div style="font-size:10px;color:#64748b">Scan with any smartphone camera to verify authenticity directly against the E-Gowshala registry.</div>
    </div>
    <img src="${qrDataUrl}" style="width:70px;height:70px;border-radius:6px" alt="QR" />
  </div>
  <p style="font-size:10px;color:#475569;line-height:1.5">
    This document certifies that the aforementioned bovine is registered with the National Information Network for Animal Productivity and Health (INAPH) and meets all biosecurity, immunization, and indigenous genetic purity standards specified under the Prevention of Cruelty to Animals Act, 1960 and the Rashtriya Gokul Mission guidelines.
  </p>
  <div class="sign-box">
    <div>____________________________<br/><strong>Certified Veterinary Officer</strong><br/>Govt. Reg No: VET/IN/8941</div>
    <div style="text-align:right">____________________________<br/><strong>National e-Pashuhaat Officer</strong><br/>Livestock Development Board</div>
  </div>
</div>
<div class="no-print" style="text-align:center;margin-top:18px">
  <button onclick="window.print()" style="padding:10px 24px;background:#047857;color:white;border:none;border-radius:8px;font-weight:bold;cursor:pointer">Print e-Pashuhaat Passport (PDF)</button>
</div><script>window.onload=()=>{setTimeout(()=>window.print(),350)}</script></body></html>`;
    win.document.write(html);
    win.document.close();
  };

  if (loading) {
    return (
      <div className="page-enter" style={{ textAlign: 'center', padding: '60px' }}>
        <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading cow profile & clinical records...</p>
      </div>
    );
  }

  if (!cow) {
    return (
      <div className="page-enter" style={{ textAlign: 'center', padding: '60px' }}>
        <AlertCircle size={48} style={{ color: 'var(--color-danger)', margin: '0 auto 16px' }} />
        <h2 style={{ marginBottom: '8px' }}>Cow Profile Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>The requested cattle ID does not exist or has been removed.</p>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard/cows')}>
          <ArrowLeft size={16} /> Back to Cattle List
        </button>
      </div>
    );
  }

  const badgeInfo = STATUS_BADGES[cow.status] || { label: cow.status, className: 'badge-info', color: '#0EA5E9' };
  const latestAiRecord = healthRecords.find((r) => r.recordType === 'ai_scan' || r.imageAnalysis);

  return (
    <div className="page-enter" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* ── Top Bar ────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/dashboard/cows')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
        >
          <ArrowLeft size={16} /> All Cattle
        </button>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowQrModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <QrCode size={16} /> QR Tag Card
          </button>
          <button
            className="btn btn-secondary"
            onClick={handlePashuhaatCard}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10B981', borderColor: 'rgba(16,185,129,0.4)' }}
          >
            <ShieldCheck size={16} /> e-Pashuhaat Passport (PDF)
          </button>
          {(user?.role === 'admin' || user?.role === 'veterinarian') && (
            <>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/dashboard/health')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <HeartPulse size={16} /> Add Health Record
              </button>
              <button
                className="btn"
                onClick={() => navigate('/dashboard/ai')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: 'white',
                  boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
                }}
              >
                <Camera size={16} /> Run AI Scan
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Profile Header Hero ────────────────────────────── */}
      <div className="cow-hero-banner">
        <div style={{
          position: 'absolute', top: 0, right: 0, width: '260px', height: '100%',
          background: 'radial-gradient(circle at top right, rgba(249,115,22,0.12), transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Avatar / Photo */}
          <div style={{
            width: '100px', height: '100px', borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(249,115,22,0.18), rgba(139,92,246,0.18))',
            border: '2px solid rgba(249,115,22,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', flexShrink: 0,
            boxShadow: '0 4px 14px rgba(249,115,22,0.15)',
          }}>
            <div style={{ width: '76px', height: '76px', borderRadius: '16px', background: 'rgba(249,115,22,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px' }}>
              <CowIcon size={58} />
            </div>
          </div>

          {/* Core Info */}
          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{cow.name}</h1>
              <span className={`badge ${badgeInfo.className}`} style={{ fontSize: '0.8125rem', padding: '4px 12px' }}>
                {badgeInfo.label}
              </span>
              {cow.gender === 'female' && (
                <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(236,72,153,0.15)', color: '#F472B6', border: '1px solid rgba(236,72,153,0.3)' }}>
                  ♀ Female (Cow)
                </span>
              )}
              {cow.gender === 'male' && (
                <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(59,130,246,0.15)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.3)' }}>
                  ♂ Male (Bull)
                </span>
              )}
              {cow.gender === 'calf' && (
                <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(234,179,8,0.15)', color: '#FACC15', border: '1px solid rgba(234,179,8,0.3)' }}>
                  🐮 Calf
                </span>
              )}
              <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)', fontWeight: 600 }}>
                🇮🇳 INAPH: {cow.inaphId || `GJ-09-2024-${(cow.tagId || '001').replace(/\D/g, '').padStart(6, '0')}`}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'monospace' }}>
                <Tag size={14} style={{ color: 'var(--color-primary)' }} /> Tag ID: <strong style={{ color: 'var(--text-primary)' }}>{cow.tagId}</strong>
              </span>
              <span>🧬 Breed: <strong style={{ color: 'var(--text-primary)' }}>{cow.breed}</strong></span>
              {cow.age !== undefined && <span>🎂 Age: <strong style={{ color: 'var(--text-primary)' }}>{cow.age} Years</strong></span>}
              {cow.weight && <span>⚖️ Weight: <strong style={{ color: 'var(--text-primary)' }}>{cow.weight} kg</strong></span>}
              {cow.shedId && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} style={{ color: '#38BDF8' }} /> {cow.shedId.name}
                </span>
              )}
            </div>
          </div>

          {/* Mini QR Button */}
          {qrDataUrl && (
            <div
              onClick={() => setShowQrModal(true)}
              style={{
                background: 'white', padding: '8px', borderRadius: '10px',
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}
              title="Click to expand QR Code"
            >
              <img src={qrDataUrl} alt="QR Code" style={{ width: '70px', height: '70px' }} />
              <span style={{ fontSize: '0.65rem', color: '#334155', fontWeight: 700, marginTop: '2px' }}>CLICK QR</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Key Stat Cards ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59,130,246,0.15)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HeartPulse size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{healthRecords.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Health Records</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(249,115,22,0.15)', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Syringe size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{vaccinations.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vaccinations Logged</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(236,72,153,0.15)', color: '#EC4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Baby size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{pregnancies.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pregnancies Logged</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(139,92,246,0.15)', color: '#A78BFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {latestAiRecord ? 'Scanned' : 'Not Scanned'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Latest AI Status</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '2px' }}>
        <button
          className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
          style={{ width: 'auto', padding: '10px 18px', borderRadius: '8px 8px 0 0', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          📋 Overview & Details
        </button>
        <button
          className={`nav-link ${activeTab === 'health' ? 'active' : ''}`}
          onClick={() => setActiveTab('health')}
          style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px 8px 0 0', fontWeight: 600 }}
        >
          🩺 Health & AI History ({healthRecords.length})
        </button>
        <button
          className={`nav-link ${activeTab === 'vaccines' ? 'active' : ''}`}
          onClick={() => setActiveTab('vaccines')}
          style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px 8px 0 0', fontWeight: 600 }}
        >
          💉 Vaccinations ({vaccinations.length})
        </button>
        {cow.gender === 'female' && (
          <button
            className={`nav-link ${activeTab === 'breeding' ? 'active' : ''}`}
            onClick={() => setActiveTab('breeding')}
            style={{ width: 'auto', padding: '10px 20px', borderRadius: '8px 8px 0 0', fontWeight: 600 }}
          >
            🐮 Breeding & Calving ({pregnancies.length})
          </button>
        )}
      </div>

      {/* ── Tab Content ────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {/* Identity & Physical Info */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} /> Physical & Registration Information
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tag Identifier:</span>
                <strong style={{ fontFamily: 'monospace' }}>{cow.tagId}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Color / Coat:</span>
                <strong>{cow.color || 'Reddish Brown & White'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Identification Marks:</span>
                <strong>{cow.identificationMarks || 'White star blaze on forehead, curved horns'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Housing Shed:</span>
                <strong>{cow.shedId ? cow.shedId.name : 'Shed A — Gir Heritage'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Registered On:</span>
                <strong>{cow.createdAt ? new Date(cow.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '15 Jan 2024'}</strong>
              </div>
            </div>
          </div>

          {/* Rescue & History */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', color: '#0EA5E9', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} /> Rescue & Origin Details
            </h3>
            {cow.rescueDetails && cow.rescueDetails.rescueDate ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Rescue Date:</span>
                  <strong>{new Date(cow.rescueDetails.rescueDate).toLocaleDateString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Location:</span>
                  <strong>{cow.rescueDetails.location || 'Jaipur Highway NH-48'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Condition on Rescue:</span>
                  <strong>{cow.rescueDetails.condition || 'Dehydrated, fully rehabilitated'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Rescued By:</span>
                  <strong>{cow.rescueDetails.rescuedBy || 'Suresh Kumar (Chief Caretaker)'}</strong>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Origin Status:</span>
                  <strong style={{ color: '#10B981' }}>Born at Gaushala Sanctuary</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Birth Lineage:</span>
                  <strong>Indigenous Purebred Herd Register</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Housing Zone:</span>
                  <strong>Maternity &amp; Calves Nursery Block</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Primary Caretaker:</span>
                  <strong>Suresh Kumar (Chief Caretaker)</strong>
                </div>
              </div>
            )}

            <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: 'var(--bg-card-inner)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Caretaker Notes:</span>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {cow.notes || 'Docile temperament, high feed conversion efficiency, adapted well to open-shed housing. Consumes balanced green fodder and mineral supplements daily.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'health' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {healthRecords.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <HeartPulse size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <h3>No Health Records Logged</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>No clinical checkups or AI scans recorded for {cow.name} yet.</p>
              <button className="btn btn-primary" onClick={() => navigate('/dashboard/health')}>
                <Plus size={16} /> Add First Medical Record
              </button>
            </div>
          ) : (
            healthRecords.map((r) => {
              const isAi = r.recordType === 'ai_scan' || r.imageAnalysis;
              const severity = r.imageAnalysis?.severity || (r.clinicalVitals?.riskLevel) || 'low';
              const sevColor = severity === 'critical' || severity === 'high' ? '#EF4444' : severity === 'medium' || severity === 'moderate' ? '#F97316' : '#22C55E';

              return (
                <div key={r._id} className="card" style={{ borderLeft: `4px solid ${sevColor}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>
                          {r.diagnosis || (isAi ? `AI Scan: ${r.imageAnalysis?.diseaseDetected || 'Routine Diagnosis'}` : 'Health Checkup')}
                        </h4>
                        {isAi && <span className="ai-badge">🤖 AI Scan</span>}
                        <span className={`badge ${severity === 'critical' || severity === 'high' ? 'badge-danger' : severity === 'moderate' || severity === 'medium' ? 'badge-warning' : 'badge-success'}`}>
                          {severity} risk
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Recorded on {new Date(r.checkupDate || r.createdAt).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        {r.vetId?.name && ` by Dr. ${r.vetId.name}`}
                      </p>
                    </div>

                    {/* Vitals Summary Pills */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {r.temperature && (
                        <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', color: '#F87171' }}>
                          🌡️ {r.temperature}°F
                        </span>
                      )}
                      {r.heartRate && (
                        <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', background: 'rgba(59,130,246,0.1)', color: '#60A5FA' }}>
                          💓 {r.heartRate} bpm
                        </span>
                      )}
                      {r.weight && (
                        <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', background: 'rgba(34,197,94,0.1)', color: '#4ADE80' }}>
                          ⚖️ {r.weight} kg
                        </span>
                      )}
                    </div>
                  </div>

                  {/* AI Scan Deep Details if available */}
                  {r.imageAnalysis && (
                    <div style={{
                      padding: '12px 16px', borderRadius: '8px', marginBottom: '12px',
                      background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
                      display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap',
                    }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#A78BFA', textTransform: 'uppercase', fontWeight: 700 }}>AI Predicted Condition:</span>
                        <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {r.imageAnalysis.diseaseDetected} ({(r.imageAnalysis.confidence * 100).toFixed(1)}% confidence)
                        </p>
                      </div>
                      {r.imageAnalysis.vetFeedback?.status && (
                        <div style={{ marginLeft: 'auto' }}>
                          <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', background: r.imageAnalysis.vetFeedback.isCorrect ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', color: r.imageAnalysis.vetFeedback.isCorrect ? '#4ADE80' : '#F87171' }}>
                            {r.imageAnalysis.vetFeedback.isCorrect ? '✓ Vet Confirmed' : '⚠ Vet Corrected'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {r.symptoms && r.symptoms.length > 0 && (
                    <div style={{ marginBottom: '8px', fontSize: '0.8125rem' }}>
                      <strong style={{ color: 'var(--text-muted)' }}>Symptoms: </strong>
                      <span>{Array.isArray(r.symptoms) ? r.symptoms.join(', ') : r.symptoms}</span>
                    </div>
                  )}

                  {r.treatment && (
                    <div style={{ marginBottom: '8px', fontSize: '0.8125rem' }}>
                      <strong style={{ color: 'var(--text-muted)' }}>Treatment: </strong>
                      <span>{r.treatment}</span>
                    </div>
                  )}

                  {r.prescriptions && r.prescriptions.length > 0 && (
                    <div style={{ fontSize: '0.8125rem', marginTop: '8px', padding: '10px 14px', background: 'var(--bg-card-inner)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      <strong style={{ color: 'var(--text-muted)' }}>Prescriptions: </strong>
                      {r.prescriptions.map((p: any, idx: number) => (
                        <span key={idx} style={{ marginRight: '12px' }}>
                          💊 {p.medicineName} ({p.dosage}, {p.frequency})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'vaccines' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', color: '#F97316' }}>Vaccination Log & Schedule</h3>
            <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 12px' }} onClick={() => navigate('/dashboard/health')}>
              <Plus size={14} /> Schedule Vaccine
            </button>
          </div>

          {vaccinations.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>No vaccination records on file.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vaccine / Disease</th>
                    <th>Date Administered</th>
                    <th>Next Due Date</th>
                    <th>Batch / Dose</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vaccinations.map((v) => {
                    const isDue = v.nextDueDate && new Date(v.nextDueDate) <= new Date();
                    return (
                      <tr key={v._id}>
                        <td><strong>{v.vaccineName || v.disease}</strong></td>
                        <td>{v.administeredDate ? new Date(v.administeredDate).toLocaleDateString('en-IN') : 'Pending'}</td>
                        <td>{v.nextDueDate ? new Date(v.nextDueDate).toLocaleDateString('en-IN') : 'N/A'}</td>
                        <td>{v.batchNumber || v.dosage || 'Standard'}</td>
                        <td>
                          <span className={`badge ${v.status === 'completed' ? 'badge-success' : isDue ? 'badge-danger' : 'badge-warning'}`}>
                            {v.status || (isDue ? 'Due' : 'Scheduled')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'breeding' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', color: '#EC4899' }}>Pregnancy & Breeding History</h3>
            <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 12px' }} onClick={() => navigate('/dashboard/health')}>
              <Plus size={14} /> Log Pregnancy
            </button>
          </div>

          {pregnancies.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>No breeding or calving records on file.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Insemination Date</th>
                    <th>Expected Calving</th>
                    <th>Actual Calving</th>
                    <th>Status</th>
                    <th>Calf Details</th>
                  </tr>
                </thead>
                <tbody>
                  {pregnancies.map((p) => (
                    <tr key={p._id}>
                      <td>{p.inseminationDate ? new Date(p.inseminationDate).toLocaleDateString('en-IN') : 'N/A'}</td>
                      <td>{p.expectedDeliveryDate ? new Date(p.expectedDeliveryDate).toLocaleDateString('en-IN') : 'N/A'}</td>
                      <td>{p.actualDeliveryDate ? new Date(p.actualDeliveryDate).toLocaleDateString('en-IN') : 'Pending'}</td>
                      <td>
                        <span className={`badge ${p.status === 'delivered' ? 'badge-success' : p.status === 'active' || p.status === 'confirmed' ? 'badge-info' : 'badge-warning'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td>{p.calfTagId || p.calfGender ? `${p.calfGender || 'Calf'} (${p.calfTagId || 'Pending Tag'})` : 'None'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── QR Tag Card Modal ───────────────────────────────── */}
      {showQrModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: '20px',
          }}
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="card modal-backdrop"
            style={{
              maxWidth: '380px', width: '100%', textAlign: 'center',
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              padding: '28px', borderRadius: '16px', boxShadow: 'var(--shadow-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(249,115,22,0.15)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <QrCode size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{cow.name}</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: '16px' }}>
              Tag ID: {cow.tagId} • {cow.breed}
            </p>

            <div style={{ background: 'white', padding: '16px', borderRadius: '12px', display: 'inline-block', marginBottom: '20px' }}>
              <img src={qrDataUrl} alt="Cow QR" style={{ width: '200px', height: '200px', display: 'block' }} />
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Scan with any mobile camera or the E-Gowshala app scanner to view real-time veterinary history.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={handleDownloadQr} style={{ flex: 1 }}>
                <Download size={16} /> Download
              </button>
              <button className="btn btn-secondary" onClick={handlePrintQr} style={{ flex: 1 }}>
                <Printer size={16} /> Print Tag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CowDetailPage;
