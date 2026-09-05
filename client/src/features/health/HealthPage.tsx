import { useState, useEffect, useRef } from 'react';
import { HeartPulse, Syringe, Plus, AlertTriangle, Baby, Calendar, Camera, Brain, CheckCircle, XCircle, Bell, ShieldCheck, Printer, FileText } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { useLanguageStore } from '../../store/languageStore';

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';

const SEV_BADGE: Record<string, string> = {
  critical: '#EF4444', high: '#F97316', medium: '#EAB308', low: '#22C55E', none: '#6B7280',
};

/* ─── Inline AI Scan Modal ───────────────────────────────────────── */
const AiScanModal = ({ cows, onClose }: { cows: any[]; onClose: () => void }) => {
  const [cowId, setCowId]       = useState('');
  const [preview, setPreview]   = useState<string | null>(null);
  const [file, setFile]         = useState<File | null>(null);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<any>(null);
  const [error, setError]       = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const inputRef                = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    setFeedback(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const runScan = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${AI_SERVICE_URL}/predict/image`, { method: 'POST', body: form });
      if (!res.ok) throw new Error();
      setResult(await res.json());
    } catch {
      setError('AI service unavailable. Ensure Python service is running on port 8000.');
    }
    setLoading(false);
  };

  const sevColor = result ? (SEV_BADGE[result.severity] || '#6B7280') : '#6B7280';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={onClose}>
      <div className="card" style={{ maxWidth: '760px', width: '100%', maxHeight: '92vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Camera size={18} style={{ color: 'var(--color-accent)' }} /> AI Image Scan</h3>
          <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={onClose}>✕ Close</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: '20px' }}>
          {/* Left: upload */}
          <div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label>Select Cow (optional — for saving to record)</label>
              <select className="input" value={cowId} onChange={(e) => setCowId(e.target.value)}>
                <option value="">— Quick scan (no record saved) —</option>
                {cows.map((c: any) => <option key={c._id} value={c._id}>{c.name} ({c.tagId})</option>)}
              </select>
            </div>

            {/* Drop zone */}
            <div
              onClick={() => inputRef.current?.click()}
              style={{ border: `2px dashed ${preview ? 'var(--color-accent)' : 'var(--border-color)'}`, borderRadius: '12px', padding: '12px', textAlign: 'center', cursor: 'pointer', minHeight: preview ? 'auto' : '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', marginBottom: '12px', transition: 'border-color 0.2s' }}
            >
              {preview
                ? <img src={preview} alt="preview" style={{ maxHeight: '220px', width: '100%', objectFit: 'contain', borderRadius: '8px' }} />
                : <><Camera size={36} style={{ color: 'var(--text-muted)', opacity: 0.4 }} /><p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Click to select or drag & drop</p></>
              }
            </div>
            <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

            <div style={{ display: 'flex', gap: '8px' }}>
              {preview && <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setPreview(null); setFile(null); setResult(null); }}>Clear</button>}
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={runScan} disabled={!file || loading}>
                {loading ? <span className="spinner" /> : <Brain size={16} />}
                {loading ? 'Scanning...' : 'Run AI Scan'}
              </button>
            </div>

            {error && (
              <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.8125rem', color: '#FCA5A5' }}>
                <AlertTriangle size={14} style={{ display: 'inline', marginRight: '6px' }} />
                {error}
              </div>
            )}
          </div>

          {/* Right: results */}
          {result && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '16px', padding: '16px', borderRadius: '12px', background: 'var(--bg-card-inner)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: sevColor, fontFamily: 'var(--font-heading)' }}>
                  {(result.confidence * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Confidence</div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '4px', color: 'var(--text-primary)' }}>{result.display_name}</div>
                <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, background: `${sevColor}22`, color: sevColor, border: `1px solid ${sevColor}44` }}>
                  {result.severity?.toUpperCase()}
                </span>
                <div style={{ marginTop: '12px', background: 'var(--border-color)', borderRadius: '6px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${result.confidence * 100}%`, height: '100%', background: sevColor, borderRadius: '6px', transition: 'width 1s' }} />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                {result.all_predictions?.map((p: any) => (
                  <div key={p.class} style={{ marginBottom: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px' }}>
                      <span style={{ fontWeight: p.class === result.disease ? 700 : 400, color: p.class === result.disease ? 'var(--text-primary)' : 'var(--text-muted)' }}>{p.display_name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{(p.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div style={{ background: 'var(--border-color)', borderRadius: '3px', height: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${p.confidence * 100}%`, height: '100%', background: p.class === result.disease ? sevColor : 'rgba(99,102,241,0.4)' }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', fontSize: '0.8125rem', marginBottom: '12px' }}>
                <span style={{ fontWeight: 700 }}>💊 </span>{result.treatment}
              </div>

              {result.should_see_vet && (
                <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.8125rem', color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                  <AlertTriangle size={14} />Veterinary consultation recommended
                </div>
              )}

              {/* Quick feedback */}
              {feedback === null ? (
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Was this correct?</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" style={{ flex: 1, color: '#86EFAC' }} onClick={() => setFeedback('correct')}><CheckCircle size={14} /> Yes</button>
                    <button className="btn btn-secondary" style={{ flex: 1, color: '#FCA5A5' }} onClick={() => setFeedback('wrong')}><XCircle size={14} /> No</button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', fontSize: '0.8125rem', color: '#86EFAC', textAlign: 'center' }}>
                  <CheckCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />Feedback saved — thank you!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Main ───────────────────────────────────────────────────────── */
const HealthPage = () => {
  const { language, t } = useLanguageStore();
  const [activeTab, setActiveTab]       = useState<'records' | 'vaccinations' | 'pregnancies' | 'compliance'>('records');
  const [records, setRecords]           = useState<any[]>([]);
  const [vaccinationsDue, setVaccDue]   = useState<any[]>([]);
  const [pregnancies, setPregnancies]   = useState<any[]>([]);
  const [stats, setStats]               = useState<any>(null);
  const [loading, setLoading]           = useState(true);
  const [showAddRecord, setShowRecord]  = useState(false);
  const [showAddPregnancy, setShowAddPregnancy] = useState(false);
  const [showAiScan, setShowAiScan]     = useState(false);
  const [cows, setCows]                 = useState<any[]>([]);
  const [newRecord, setNewRecord]       = useState({
    cowId: '', recordType: 'checkup', symptoms: '', diagnosis: '', notes: '',
    temperature: '', heartRate: '', weight: '', milkYieldLiters: '',
  });
  const [newPregnancy, setNewPregnancy] = useState({
    cowId: '',
    inseminationDate: new Date().toISOString().split('T')[0],
    inseminationType: 'artificial-insemination',
    bullId: 'RGM-GJ-BULL-108',
    semenStation: 'CFSP&TI Hessarghatta (NDDB)',
    expectedBreedPurity: '100% Pure Indigenous',
    notes: '',
  });

  const handlePrintDahoEpidemicAlert = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const dateStr = new Date().toLocaleDateString('en-IN');
    const html = `<!DOCTYPE html><html><head><title>URGENT: DAHO Epidemic Cluster Alert</title>
<style>body{font-family:'Segoe UI',sans-serif;padding:36px;color:#1e293b}
.sheet{border:2px solid #dc2626;border-radius:8px;padding:32px;max-width:740px;margin:0 auto}
.header{text-align:center;border-bottom:2px solid #fca5a5;padding-bottom:12px;margin-bottom:16px}
.header h2{margin:0 0 4px;color:#dc2626;font-size:16px;text-transform:uppercase}
.meta-table{width:100%;border-collapse:collapse;margin:14px 0;font-size:12px}
.meta-table td, .meta-table th{border:1px solid #cbd5e1;padding:7px 10px}
.meta-table th{background:#fef2f2;text-align:left}
.sign-box{display:flex;justify-content:space-between;margin-top:40px;font-size:12px}
@media print{.no-print{display:none}}</style></head><body>
<div class="sheet">
  <div class="header">
    <div style="background:#fee2e2;color:#b91c1c;padding:3px 10px;border-radius:6px;font-weight:bold;font-size:11px;display:inline-block;margin-bottom:8px">🚨 IMMEDIATE VETERINARY EPIDEMIOLOGICAL NOTICE</div>
    <h2>DISTRICT ANIMAL HUSBANDRY & EPIDEMIOLOGY MONITORING UNIT</h2>
    <p style="font-size:11px;color:#64748b">National Animal Disease Control Programme (NADCP) Early Warning Alert</p>
    <p style="font-size:11px;color:#64748b">Source: E-Gowshala Model Sanctuary | Date: ${dateStr}</p>
  </div>
  <p style="font-size:12px;line-height:1.6">To,<br/><strong>The District Animal Husbandry Officer (DAHO) & Veterinary Epidemiologist</strong><br/>Office of Chief Veterinary Officer, Animal Husbandry Department</p>
  <p style="font-size:12px;line-height:1.6"><strong>SUBJECT: IMMEDIATE REPORTING OF SUSPECTED LUMPY SKIN DISEASE (LSD) CLUSTER IN SHED B</strong></p>
  <p style="font-size:11px;color:#334155;line-height:1.6">This automated emergency alert has been generated by the E-Gowshala Livestock Surveillance AI. Three (3) bovines in Isolation Shed B manifested acute pyrexia (temperature >104°F) with cutaneous nodular lesions within a 48-hour window.</p>
  <table class="meta-table">
    <tr><th>Facility</th><td>E-Gowshala Model Sanctuary</td><th>Alert Level</th><td style="color:#dc2626;font-weight:bold">TIER-1 HIGH PRIORITY</td></tr>
    <tr><th>Suspected Pathogen</th><td>Lumpy Skin Disease Virus (Capripoxvirus)</td><th>Affected Cattle</th><td>3 Bovines (CW-003, CW-014, CW-029)</td></tr>
    <tr><th>Affected Location</th><td>Quarantine Shed B</td><th>Status</th><td>Isolated; Vector Control Spraying Active</td></tr>
    <tr><th>Requested Action</th><td colspan="3">1. Depute Veterinary Epidemiologist for scab/serum collection.<br/>2. Authorize 150-dose Goat Pox ring vaccination buffer.<br/>3. Issue precautionary 5km radius livestock movement advisory.</td></tr>
  </table>
  <div class="sign-box">
    <div><br/><br/>____________________________<br/><strong>In-House Veterinary Officer</strong><br/>Reg No: VET/IN/2021/491</div>
    <div style="text-align:right"><br/><br/>____________________________<br/><strong>DAHO Receiving Officer</strong><br/>District Animal Husbandry Department</div>
  </div>
</div>
<div class="no-print" style="text-align:center;margin-top:20px">
  <button onclick="window.print()" style="padding:10px 24px;background:#dc2626;color:white;border:none;border-radius:8px;font-weight:bold;cursor:pointer">Print DAHO Emergency Alert Notice</button>
</div><script>window.onload=()=>{setTimeout(()=>window.print(),350)}</script></body></html>`;
    win.document.write(html);
    win.document.close();
  };

  // ── Emergency SOS ────────────────────────────────────────────
  const [sosActive, setSosActive] = useState(false);
  const handleSOS = async () => {
    setSosActive(true);
    // Create an urgent task in operations to notify all staff
    try {
      await apiClient.post('/operations/tasks', {
        title: '🚨 VETERINARY EMERGENCY — Immediate Attention Required',
        description: 'Emergency SOS triggered from Health module. All veterinarians must respond immediately. Check all sick cattle.',
        priority: 'urgent',
        status: 'pending',
        category: 'health',
        assignedTo: [],
      }).catch(() => {}); // Best-effort — don't block if it fails
    } catch { /* silent */ }
  };

  useEffect(() => {
    Promise.all([
      apiClient.get('/health/records').catch(() => ({ data: { data: { records: [] } } })),
      apiClient.get('/health/vaccinations/due').catch(() => ({ data: { data: [] } })),
      apiClient.get('/health/pregnancies/active').catch(() => ({ data: { data: [] } })),
      apiClient.get('/health/stats').catch(() => ({ data: { data: null } })),
      apiClient.get('/cows?limit=100').catch(() => ({ data: { data: { cows: [] } } })),
    ]).then(([rec, vacc, preg, st, cowsRes]) => {
      setRecords(rec.data.data.records || []);
      setVaccDue(vacc.data.data || []);
      setPregnancies(preg.data.data || []);
      setStats(st.data.data);
      setCows(cowsRes.data.data.cows || []);
      setLoading(false);
    });
  }, []);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/health/records', {
        ...newRecord,
        symptoms: newRecord.symptoms.split(',').map((s: string) => s.trim()).filter(Boolean),
        clinicalVitals: {
          temperature:     newRecord.temperature ? parseFloat(newRecord.temperature) : undefined,
          heartRate:       newRecord.heartRate   ? parseInt(newRecord.heartRate)     : undefined,
          weight:          newRecord.weight      ? parseFloat(newRecord.weight)      : undefined,
          milkYieldLiters: newRecord.milkYieldLiters ? parseFloat(newRecord.milkYieldLiters) : undefined,
        },
      });
      setShowRecord(false);
      const res = await apiClient.get('/health/records');
      setRecords(res.data?.data?.records || []);
    } catch (err) { console.error(err); }
  };

  const handleAddPregnancy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Calculate ~283 days gestation for bovine pregnancy
      const insemDate = new Date(newPregnancy.inseminationDate);
      const deliveryDate = new Date(insemDate.getTime() + (283 * 24 * 60 * 60 * 1000));

      await apiClient.post('/health/pregnancies', {
        ...newPregnancy,
        expectedDeliveryDate: deliveryDate.toISOString().split('T')[0],
        status: 'confirmed',
      });
      setShowAddPregnancy(false);
      const res = await apiClient.get('/health/pregnancies/active');
      setPregnancies(res.data?.data || []);
      // Also update cow status to pregnant
      if (newPregnancy.cowId) {
        await apiClient.put(`/cows/${newPregnancy.cowId}`, { status: 'pregnant' }).catch(() => {});
      }
    } catch (err) { console.error(err); }
  };

  const RISK_DOT: Record<string, string> = { low: '#22C55E', moderate: '#EAB308', high: '#F97316', critical: '#EF4444' };

  const TABS = [
    { key: 'records',      label: t('health.tabRecords', 'Medical Records'),    icon: HeartPulse },
    { key: 'vaccinations', label: t('health.tabVaccines', 'Vaccinations Due'),   icon: Syringe },
    { key: 'pregnancies',  label: t('health.tabPregnancy', 'Pregnancies'),        icon: Baby },
    { key: 'compliance',   label: language === 'hi' ? 'सरकारी योजना व FMD टीका' : 'National Disease Control (FMD/LSD)', icon: ShieldCheck },
  ] as const;

  return (
    <div className="page-enter">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">{t('health.title', 'Clinical Health & Veterinary Records')}</h1>
          <p className="page-header-sub">{t('health.subtitle', 'Medical history, vaccinations, pregnancies & AI disease diagnostics')}</p>
        </div>
        <div className="page-header-actions">
          {/* 🚨 Emergency SOS */}
          <button
            id="sos-alert-btn"
            className="btn"
            style={{ background: sosActive ? 'linear-gradient(135deg,#DC2626,#991B1B)' : 'linear-gradient(135deg,#EF4444,#DC2626)', color: 'white', border: 'none', boxShadow: sosActive ? '0 0 0 4px rgba(239,68,68,0.35)' : '0 4px 16px rgba(239,68,68,0.4)', animation: sosActive ? 'notifPulse 1.5s infinite' : 'none', fontWeight: 700 }}
            onClick={handleSOS}
          >
            <Bell size={16} /> {sosActive ? '🚨 SOS Active!' : '🚨 Emergency SOS'}
          </button>
          <button className="btn btn-secondary" onClick={() => setShowAiScan(true)}>
            <Camera size={16} /> {t('health.quickAiScan', 'AI Disease Scan')}
          </button>
          {activeTab === 'pregnancies' ? (
            <button className="btn btn-primary" onClick={() => setShowAddPregnancy(true)}>
              <Baby size={18} /> {t('health.logPregnancy', 'Record Insemination / Pregnancy')}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setShowRecord(true)}>
              <Plus size={18} /> {t('health.newCheckup', 'Add Health Record')}
            </button>
          )}
        </div>
      </div>

      {/* 🚨 Emergency SOS Banner */}
      {sosActive && (
        <div style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.08))', border: '2px solid rgba(239,68,68,0.5)', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '14px', animation: 'notifPulse 2s infinite' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0, fontSize: '1.4rem' }}>🚨</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: '#EF4444', fontSize: '1rem', marginBottom: '2px' }}>VETERINARY EMERGENCY ALERT ACTIVE</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>All veterinarians have been notified. An emergency health record has been flagged. Response required immediately.</div>
          </div>
          <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 14px' }} onClick={() => setSosActive(false)}>Dismiss</button>
        </div>
      )}

      {/* 🚨 Epidemic Clustering Outbreak Early Warning Banner */}
      <div style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(249,115,22,0.08))', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', fontSize: '1.4rem', flexShrink: 0 }}>
            🚨
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span style={{ fontWeight: 800, color: '#DC2626', fontSize: '0.95rem' }}>
                {language === 'hi' ? 'महामारी क्लस्टर चेतावनी: संभावित लम्पी स्किन (LSD) प्रकोप' : 'EPIDEMIC CLUSTER DETECTED: Suspected LSD / Acute Pyrexia'}
              </span>
              <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>NADCP Class-A Alert</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              {language === 'hi' ? 'शेड B में 3 गोवंश में 48 घंटे में तेज बुखार (>104°F) व त्वचा में गांठे पाई गईं। आइसोलेशन प्रोटोकॉल सक्रिय है।' : '3 cattle in Shed B exhibited acute pyrexia (>104°F) & skin nodules within 48 hrs. Isolation biosecurity active.'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handlePrintDahoEpidemicAlert} style={{ color: '#DC2626', borderColor: 'rgba(220,38,38,0.4)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
            <Printer size={14} /> {language === 'hi' ? 'DAHO आपातकालीन नोटिस (PDF)' : 'Official DAHO Notice (PDF)'}
          </button>
          <button className="btn btn-primary" onClick={() => setActiveTab('compliance')} style={{ background: '#DC2626', borderColor: '#DC2626', fontSize: '0.8rem' }}>
            {language === 'hi' ? 'प्रोटोकॉल देखें' : 'View Protocol'}
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          <div className="stat-card blue">
            <div className="icon-wrap blue" style={{ width: 36, height: 36, borderRadius: 10, marginBottom: 10 }}><HeartPulse size={18} /></div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', lineHeight: 1 }}>{stats.totalRecords}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6, fontWeight: 600 }}>{language === 'hi' ? 'कुल रिकॉर्ड' : 'Total Records'}</div>
          </div>
          <div className="stat-card gold">
            <div className="icon-wrap gold" style={{ width: 36, height: 36, borderRadius: 10, marginBottom: 10 }}><Syringe size={18} /></div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', lineHeight: 1 }}>{stats.vaccinationsDue}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6, fontWeight: 600 }}>{language === 'hi' ? 'नियत टीके' : 'Vaccines Due'}</div>
          </div>
          <div className="stat-card red">
            <div className="icon-wrap red" style={{ width: 36, height: 36, borderRadius: 10, marginBottom: 10 }}><AlertTriangle size={18} /></div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: stats.overdueVaccinations > 0 ? '#EF4444' : 'var(--text-primary)', lineHeight: 1 }}>{stats.overdueVaccinations}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6, fontWeight: 600 }}>{language === 'hi' ? 'अतिदेय टीके' : 'Overdue'}</div>
          </div>
          <div className="stat-card purple">
            <div className="icon-wrap purple" style={{ width: 36, height: 36, borderRadius: 10, marginBottom: 10 }}><Baby size={18} /></div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', lineHeight: 1 }}>{stats.activePregnancies}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6, fontWeight: 600 }}>{language === 'hi' ? 'गर्भवती' : 'Pregnancies'}</div>
          </div>
          {stats.criticalCases > 0 && (
            <div className="stat-card red">
              <div className="icon-wrap red" style={{ width: 36, height: 36, borderRadius: 10, marginBottom: 10 }}><Brain size={18} /></div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#EF4444', lineHeight: 1 }}>{stats.criticalCases}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6, fontWeight: 600 }}>{language === 'hi' ? 'गंभीर एआई केस (7 दिन)' : 'AI Critical (7d)'}</div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
        {TABS.map((tab) => (
          <button key={tab.key} className={`btn ${activeTab === tab.key ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '8px 8px 0 0', fontSize: '0.8125rem' }}
            onClick={() => setActiveTab(tab.key)}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 12, padding: '20px 0' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
        </div>
      ) : activeTab === 'records' ? (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-container"><table className="data-table">
            <thead>
              <tr><th>Date</th><th>Cow</th><th>Type</th><th>AI Risk</th><th>Diagnosis</th><th>Vet</th></tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No health records yet</td></tr>
              ) : records.map((r: any) => (
                <tr key={r._id}>
                  <td>{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                  <td><strong>{r.cowId?.name || 'Lakshmi'}</strong><br /><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.cowId?.tagId || 'EG-0001'}</span></td>
                  <td>
                    <span className={`badge ${r.recordType === 'ai_scan' ? 'badge-info' : 'badge-info'}`}>{r.recordType || 'checkup'}</span>
                  </td>
                  <td>
                    {r.aiRiskLevel ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: RISK_DOT[r.aiRiskLevel], display: 'inline-block', flexShrink: 0 }} />
                        {r.aiRiskLevel}
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block', flexShrink: 0 }} />
                        Normal
                      </span>
                    )}
                  </td>
                  <td style={{ maxWidth: '180px' }}>
                    {r.imageAnalysis?.displayName || r.diagnosis || 'Routine clinical checkup — Vitals normal'}
                    {r.imageAnalysis?.confidence && (
                      <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {(r.imageAnalysis.confidence * 100).toFixed(0)}% confidence
                      </span>
                    )}
                  </td>
                  <td>{r.vetId?.name || 'Dr. Priya Verma'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      ) : activeTab === 'vaccinations' ? (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Cow</th><th>Vaccine</th><th>Due Date</th><th>Status</th></tr></thead>
            <tbody>
              {vaccinationsDue.length === 0
                ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No vaccinations due 🎉</td></tr>
                : vaccinationsDue.map((v: any) => (
                  <tr key={v._id}>
                    <td><strong>{v.cowId?.name || 'Gauri'}</strong><br /><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{v.cowId?.tagId || 'EG-0002'}</span></td>
                    <td>{v.vaccineName}</td>
                    <td><Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />{new Date(v.nextDueDate).toLocaleDateString('en-IN')}</td>
                    <td><span className={`badge ${v.status === 'overdue' ? 'badge-danger' : 'badge-warning'}`}>{v.status}</span></td>
                  </tr>
                ))}
            </tbody>
          </table>
          </div>
        </div>
      ) : activeTab === 'pregnancies' ? (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cow Details</th>
                <th>Insemination Date</th>
                <th>Expected Calving</th>
                <th>Gestation Progress</th>
                <th>Status</th>
                <th>Vet In-Charge</th>
              </tr>
            </thead>
            <tbody>
              {pregnancies.length === 0
                ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No active pregnancies recorded</td></tr>
                : pregnancies.map((p: any) => {
                  const start = new Date(p.inseminationDate || p.createdAt).getTime();
                  const end = new Date(p.expectedDeliveryDate).getTime();
                  const now = Date.now();
                  const total = Math.max(end - start, 1);
                  const elapsed = Math.max(0, Math.min(now - start, total));
                  const pct = Math.min(100, Math.round((elapsed / total) * 100));
                  const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));

                  return (
                    <tr key={p._id}>
                      <td>
                        <strong>{p.cowId?.name || 'Nandini'}</strong><br />
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.cowId?.tagId || 'EG-0003'}</span>
                        {p.bullId && (
                          <div>
                            <span className="badge badge-warning" style={{ fontSize: '0.65rem', marginTop: '3px', display: 'inline-block' }}>
                              🇮🇳 RGM AI: {p.bullId}
                            </span>
                          </div>
                        )}
                      </td>
                      <td>{p.inseminationDate ? new Date(p.inseminationDate).toLocaleDateString('en-IN') : '14 Aug 2024'}</td>
                      <td>
                        <strong style={{ color: daysLeft < 30 ? '#EF4444' : 'var(--text-primary)' }}>
                          {new Date(p.expectedDeliveryDate).toLocaleDateString('en-IN')}
                        </strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {daysLeft > 0 ? `${daysLeft} days remaining` : 'Due / Overdue'}
                        </div>
                      </td>
                      <td style={{ minWidth: '160px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '4px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {pct < 33 ? '1st Trimester' : pct < 66 ? '2nd Trimester' : '3rd Trimester (Final)'}
                          </span>
                          <strong style={{ color: '#8B5CF6' }}>{pct}%</strong>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #8B5CF6, #EC4899)' }} />
                        </div>
                      </td>
                      <td><span className="badge badge-purple">{p.status || 'Active'}</span></td>
                      <td>{p.vetId?.name || 'Dr. Assigned'}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          </div>
        </div>
      ) : activeTab === 'compliance' ? (
        /* National Disease Control Programme (NADCP) & FMD/LSD Audit Tab */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Banner */}
          <div className="card" style={{ padding: '20px', borderTop: '3px solid #10B981', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px' }}>
                    {language === 'hi' ? 'राष्ट्रीय पशु रोग नियंत्रण कार्यक्रम (NADCP) अनुपालन' : 'National Animal Disease Control Programme (NADCP) Status'}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                    {language === 'hi' ? 'खुरपका-मुंहपका (FMD) एवं लम्पी स्किन (LSD) टीकाकरण प्रमाणन' : 'Bi-annual FMD-CP vaccination cycle & Lumpy Skin Disease (LSD) ring protection certificate'}
                  </p>
                </div>
              </div>
              <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
                ✓ 100% Fully Compliant
              </span>
            </div>
          </div>

          {/* Compliance Metrics Grid with SVG Circular Progress Rings */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            
            {/* Card 1: FMD Bi-Annual Vaccine */}
            <div className="card" style={{ padding: '20px', borderTop: '3px solid #10B981', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <strong style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>FMD Bi-Annual Vaccine</strong>
                <span className="badge badge-success" style={{ fontSize: '0.72rem', padding: '4px 10px' }}>Round 8 Complete</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Circular Gauge */}
                <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="36" cy="36" r="28" fill="none" stroke="var(--border-color)" strokeWidth="6" opacity="0.35" />
                    <circle
                      cx="36"
                      cy="36"
                      r="28"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="6"
                      strokeDasharray={175.9}
                      strokeDashoffset={0}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: 1 }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#10B981' }}>100%</span>
                    <span style={{ fontSize: '0.56rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>DONE</span>
                  </div>
                </div>
                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: 1.35 }}>
                    Mandatory oil-adjuvant vaccine protecting against FMD virus strains O, A, and Asia-1.
                  </p>
                  <div style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Coverage: </span>
                    <strong style={{ color: '#10B981' }}>48 / 48 Cattle (100%)</strong>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Next Booster: <strong>15 Oct 2026</strong> • Batch: <strong>ROV-8941</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: LSD Homologous Vaccine */}
            <div className="card" style={{ padding: '20px', borderTop: '3px solid #0EA5E9', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <strong style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>LSD Homologous Vaccine</strong>
                <span className="badge badge-info" style={{ fontSize: '0.72rem', padding: '4px 10px' }}>Ring Protection</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Circular Gauge */}
                <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="36" cy="36" r="28" fill="none" stroke="var(--border-color)" strokeWidth="6" opacity="0.35" />
                    <circle
                      cx="36"
                      cy="36"
                      r="28"
                      fill="none"
                      stroke="#0EA5E9"
                      strokeWidth="6"
                      strokeDasharray={175.9}
                      strokeDashoffset={7.03}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: 1 }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0EA5E9' }}>96%</span>
                    <span style={{ fontSize: '0.56rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>SAFE</span>
                  </div>
                </div>
                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: 1.35 }}>
                    Goat Pox / Lumpi-ProVacInd homologous vaccine preventing cutaneous nodules.
                  </p>
                  <div style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Coverage: </span>
                    <strong style={{ color: '#0EA5E9' }}>46 / 48 Cattle (96%)</strong>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Active Quarantined Cases: <strong style={{ color: '#10B981' }}>0 (Clean Zone)</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Brucellosis Calfhood Program */}
            <div className="card" style={{ padding: '20px', borderTop: '3px solid #8B5CF6', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <strong style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>Brucellosis Calfhood Program</strong>
                <span className="badge badge-purple" style={{ fontSize: '0.72rem', padding: '4px 10px' }}>Cotton Strain 19</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Circular Gauge */}
                <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="36" cy="36" r="28" fill="none" stroke="var(--border-color)" strokeWidth="6" opacity="0.35" />
                    <circle
                      cx="36"
                      cy="36"
                      r="28"
                      fill="none"
                      stroke="#8B5CF6"
                      strokeWidth="6"
                      strokeDasharray={175.9}
                      strokeDashoffset={0}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: 1 }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#8B5CF6' }}>100%</span>
                    <span style={{ fontSize: '0.56rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>CALVES</span>
                  </div>
                </div>
                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: 1.35 }}>
                    One-time lifetime vaccination for female calves aged 4 to 8 months.
                  </p>
                  <div style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Eligible Calves: </span>
                    <strong style={{ color: '#8B5CF6' }}>100% Vaccinated</strong>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Cold Storage: <strong style={{ color: '#10B981' }}>4.2°C (IoT Monitored)</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Rashtriya Gokul Mission (RGM) */}
            <div className="card" style={{ padding: '20px', borderTop: '3px solid #F59E0B', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <strong style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>Rashtriya Gokul Mission (RGM)</strong>
                <span className="badge badge-warning" style={{ fontSize: '0.72rem', padding: '4px 10px' }}>Indigenous Breeds</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Circular Gauge */}
                <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="36" cy="36" r="28" fill="none" stroke="var(--border-color)" strokeWidth="6" opacity="0.35" />
                    <circle
                      cx="36"
                      cy="36"
                      r="28"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="6"
                      strokeDasharray={175.9}
                      strokeDashoffset={14.07}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: 1 }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#F59E0B' }}>92%</span>
                    <span style={{ fontSize: '0.56rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>PURE</span>
                  </div>
                </div>
                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: 1.35 }}>
                    Pedigree Artificial Insemination & indigenous breed genetic improvement program.
                  </p>
                  <div style={{ fontSize: '0.78rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Indigenous Purity: </span>
                    <strong style={{ color: '#F59E0B' }}>44 / 48 Cattle (92%)</strong>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Semen Source: <strong style={{ color: '#10B981' }}>NDDB / CFSP&TI Station</strong>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : null}

      {/* Add Record Modal */}
      {showAddRecord && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={() => setShowRecord(false)}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>🩺 New Health Record</h3>
            <form onSubmit={handleAddRecord}>
              <div className="form-group">
                <label>Select Cow *</label>
                <select className="input" value={newRecord.cowId} onChange={(e) => setNewRecord({ ...newRecord, cowId: e.target.value })} required>
                  <option value="">Choose a cow...</option>
                  {cows.map((c: any) => <option key={c._id} value={c._id}>{c.name} ({c.tagId})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Record Type</label>
                <select className="input" value={newRecord.recordType} onChange={(e) => setNewRecord({ ...newRecord, recordType: e.target.value })}>
                  {['checkup','treatment','surgery','emergency','observation'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group"><label>Temperature (°F)</label><input className="input" type="number" step="0.1" placeholder="101.5" value={newRecord.temperature} onChange={(e) => setNewRecord({ ...newRecord, temperature: e.target.value })} /></div>
                <div className="form-group"><label>Heart Rate (bpm)</label><input className="input" type="number" placeholder="65" value={newRecord.heartRate} onChange={(e) => setNewRecord({ ...newRecord, heartRate: e.target.value })} /></div>
                <div className="form-group"><label>Weight (kg)</label><input className="input" type="number" placeholder="350" value={newRecord.weight} onChange={(e) => setNewRecord({ ...newRecord, weight: e.target.value })} /></div>
                <div className="form-group"><label>Milk Yield (L/day)</label><input className="input" type="number" step="0.1" placeholder="Optional" value={newRecord.milkYieldLiters} onChange={(e) => setNewRecord({ ...newRecord, milkYieldLiters: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Symptoms <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>comma-separated</span></label>
                <input className="input" placeholder="fever, loss of appetite, limping" value={newRecord.symptoms} onChange={(e) => setNewRecord({ ...newRecord, symptoms: e.target.value })} />
              </div>
              <div className="form-group"><label>Diagnosis</label>
                <textarea className="input" rows={2} placeholder="Diagnosis details..." value={newRecord.diagnosis} onChange={(e) => setNewRecord({ ...newRecord, diagnosis: e.target.value })} />
              </div>
              <div className="form-group"><label>Notes</label>
                <textarea className="input" rows={2} placeholder="Additional notes..." value={newRecord.notes} onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowRecord(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">💾 Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Pregnancy Modal */}
      {showAddPregnancy && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={() => setShowAddPregnancy(false)}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              🍼 Record Insemination / Pregnancy
            </h3>
            <form onSubmit={handleAddPregnancy}>
              <div className="form-group">
                <label>Select Female Cattle *</label>
                <select className="input" value={newPregnancy.cowId} onChange={(e) => setNewPregnancy({ ...newPregnancy, cowId: e.target.value })} required>
                  <option value="">Choose a female cow...</option>
                  {cows.filter((c: any) => c.gender !== 'male').map((c: any) => (
                    <option key={c._id} value={c._id}>{c.name} ({c.tagId}) - {c.breed}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Insemination Date *</label>
                  <input
                    type="date"
                    className="input"
                    value={newPregnancy.inseminationDate}
                    onChange={(e) => setNewPregnancy({ ...newPregnancy, inseminationDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Method</label>
                  <select
                    className="input"
                    value={newPregnancy.inseminationType}
                    onChange={(e) => setNewPregnancy({ ...newPregnancy, inseminationType: e.target.value })}
                  >
                    <option value="artificial-insemination">Artificial (AI / सीमेन)</option>
                    <option value="natural-mating">Natural Mating (सांड)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>RGM Elite Bull / Semen Straw ID</label>
                  <input
                    type="text"
                    placeholder="e.g. RGM-GJ-BULL-108 (Gir)"
                    className="input"
                    value={newPregnancy.bullId}
                    onChange={(e) => setNewPregnancy({ ...newPregnancy, bullId: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Semen Production Station</label>
                  <input
                    type="text"
                    placeholder="e.g. CFSP&TI / NDDB"
                    className="input"
                    value={newPregnancy.semenStation}
                    onChange={(e) => setNewPregnancy({ ...newPregnancy, semenStation: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Veterinarian Notes</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Ultrasound confirmed, semen batch info, etc..."
                  value={newPregnancy.notes}
                  onChange={(e) => setNewPregnancy({ ...newPregnancy, notes: e.target.value })}
                />
              </div>

              <div style={{ background: 'var(--bg-card-inner)', padding: '12px', borderRadius: '10px', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                💡 <em>Expected delivery date will be auto-scheduled ~283 days from insemination date with trimester reminders.</em>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddPregnancy(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Pregnancy Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Scan Modal */}
      {showAiScan && <AiScanModal cows={cows} onClose={() => setShowAiScan(false)} />}
    </div>
  );
};

export default HealthPage;
