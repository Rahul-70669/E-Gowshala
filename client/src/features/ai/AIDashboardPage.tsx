import { useState, useRef } from 'react';
import {
  Brain, AlertTriangle, Activity, Search,
  Camera, Upload, CheckCircle, XCircle, BarChart2,
  Thermometer, Heart,
} from 'lucide-react';
import { useLanguageStore } from '../../store/languageStore';

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000';

/* ─── helpers ────────────────────────────────────────────────────── */
const RISK_COLORS: Record<string, string> = {
  low: '#22C55E', moderate: '#EAB308', high: '#F97316', critical: '#EF4444', none: '#6B7280',
};
const SEV_BADGE: Record<string, string> = {
  critical: '#EF4444', high: '#F97316', medium: '#EAB308', low: '#22C55E', none: '#6B7280',
};

const DISEASE_NAMES_HI: Record<string, string> = {
  'Foot & Mouth Disease (FMD)': 'खुरपका-मुंहपका रोग (FMD)',
  'foot_and_mouth_disease': 'खुरपका-मुंहपका रोग (FMD)',
  'foot_mouth_disease': 'खुरपका-मुंहपका रोग (FMD)',
  'Lumpy Skin Disease (LSD)': 'लम्पी स्किन रोग (LSD)',
  'lumpy_skin_disease': 'लम्पी स्किन रोग (LSD)',
  'Mastitis (Udder Infection)': 'थनैला रोग (थन संक्रमण)',
  'mastitis': 'थनैला रोग (थन संक्रमण)',
  'Skin Disease (Ringworm / Warts)': 'त्वचा रोग (दाद / मस्से)',
  'skin_disease': 'त्वचा रोग (दाद / मस्से)',
  'Healthy Cow': 'स्वस्थ गोवंश',
  'healthy': 'स्वस्थ गोवंश',
};

const SEV_NAMES_HI: Record<string, string> = {
  critical: 'गंभीर',
  high: 'उच्च',
  medium: 'मध्यम',
  moderate: 'मध्यम',
  low: 'कम',
  none: 'सामान्य',
};

/* ─── Image Scan Tab ─────────────────────────────────────────────── */
const ImageScanTab = () => {
  const { language, t } = useLanguageStore();
  const [preview, setPreview]     = useState<string | null>(null);
  const [file, setFile]           = useState<File | null>(null);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<any>(null);
  const [error, setError]         = useState<string | null>(null);
  const [feedback, setFeedback]   = useState<'correct' | 'wrong' | null>(null);
  const inputRef                  = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    setFeedback(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) handleFile(f);
  };

  const runScan = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setFeedback(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`${AI_SERVICE_URL}/predict/image`, { method: 'POST', body: form });
      if (!res.ok) throw new Error('Prediction failed');
      const data = await res.json();
      setResult(data);
    } catch {
      setError(language === 'hi' ? 'एआई सेवा अनुपलब्ध है। सुनिश्चित करें कि पायथन सेवा पोर्ट 8000 पर चल रही है।' : 'AI service unavailable. Make sure the Python service is running on port 8000.');
    }
    setLoading(false);
  };

  const sevColor = result ? (SEV_BADGE[result.severity] || '#6B7280') : '#6B7280';
  const confPct  = result ? (result.confidence * 100).toFixed(1) : '0';

  const formatDiseaseName = (name: string) => {
    if (language === 'hi' && DISEASE_NAMES_HI[name]) {
      return DISEASE_NAMES_HI[name];
    }
    return name;
  };

  const formatSeverity = (sev: string) => {
    if (language === 'hi' && SEV_NAMES_HI[sev?.toLowerCase()]) {
      return SEV_NAMES_HI[sev.toLowerCase()];
    }
    return sev?.toUpperCase() || 'UNKNOWN';
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '600px', gap: '20px', justifyContent: 'center' }}>
      {/* Upload panel */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Camera size={18} /> {t('ai.uploadTitle', 'Upload Cow Photo for Disease Detection')}
        </h3>

        {/* Drop zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${preview ? 'var(--color-accent)' : 'var(--border-color)'}`,
            borderRadius: '12px',
            padding: '12px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
            marginBottom: '16px',
            minHeight: preview ? 'auto' : '180px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {preview ? (
            <img src={preview} alt="preview" style={{ maxHeight: '260px', borderRadius: '8px', width: '100%', objectFit: 'contain' }} />
          ) : (
            <>
              <Upload size={40} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {t('ai.dragDrop', 'Drag & drop a cow photo here, or click to select')}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{t('ai.fileTypes', 'JPG, PNG up to 10MB')}</p>
            </>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

        {preview && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setPreview(null); setFile(null); setResult(null); setError(null); }}>
              {t('ai.clear', 'Clear')}
            </button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={runScan} disabled={loading}>
              {loading ? <span className="spinner" /> : <Brain size={16} />}
              {loading ? t('ai.scanning', 'Scanning...') : t('ai.runScan', 'Run AI Scan')}
            </button>
          </div>
        )}

        {error && (
          <div style={{ marginTop: '12px', padding: '12px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.8125rem', color: '#FCA5A5' }}>
            <AlertTriangle size={14} style={{ display: 'inline', marginRight: '6px' }} />
            {error}
          </div>
        )}

        {/* Tips */}
        <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>📸 {t('ai.photoTips', 'Photo Tips')}</p>
          <ul style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '16px', lineHeight: 1.7 }}>
            <li>{t('ai.tip1', 'Clear, well-lit side or front view of the animal')}</li>
            <li>{t('ai.tip2', 'For skin/udder issues, close-up of the affected area works best')}</li>
            <li>{t('ai.tip3', 'Avoid blurry or low-light images')}</li>
          </ul>
        </div>
      </div>

      {/* Results panel */}
      {result && (
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔬 {t('ai.scanResults', 'Scan Results')}
          </h3>

          {/* Top prediction */}
          <div style={{ textAlign: 'center', marginBottom: '20px', padding: '20px', borderRadius: '12px', background: 'var(--bg-card-inner)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '2.25rem', fontWeight: 800, color: sevColor, fontFamily: 'var(--font-heading)', lineHeight: 1 }}>
              {confPct}%
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', marginBottom: '10px' }}>{t('ai.confidence', 'Confidence')}</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>{formatDiseaseName(result.display_name || result.disease)}</div>
            <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, background: `${sevColor}22`, color: sevColor, border: `1px solid ${sevColor}44` }}>
              {formatSeverity(result.severity)}
            </span>

            {/* Confidence bar */}
            <div style={{ marginTop: '14px', background: 'var(--border-color)', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
              <div style={{ width: `${result.confidence * 100}%`, height: '100%', borderRadius: '8px', background: sevColor, transition: 'width 1s ease' }} />
            </div>
          </div>

          {/* All class probabilities */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '0.8125rem', marginBottom: '10px', color: 'var(--text-secondary)' }}>{t('ai.allPredictions', 'All Predictions')}</h4>
            {result.all_predictions?.map((p: any) => (
              <div key={p.class} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}>
                  <span style={{ color: p.class === result.disease ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: p.class === result.disease ? 700 : 400 }}>{formatDiseaseName(p.display_name || p.class)}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{(p.confidence * 100).toFixed(1)}%</span>
                </div>
                <div style={{ background: 'var(--border-color)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${p.confidence * 100}%`, height: '100%', borderRadius: '4px', background: p.class === result.disease ? sevColor : 'rgba(99,102,241,0.4)', transition: 'width 0.8s ease' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Treatment */}
          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', marginBottom: '16px' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px' }}>💊 {t('ai.recommendedAction', 'Recommended Action')}</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{result.treatment}</p>
          </div>

          {result.should_see_vet && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <AlertTriangle size={16} style={{ color: '#F87171', flexShrink: 0 }} />
              <p style={{ fontSize: '0.8125rem', color: '#FCA5A5' }}>{t('ai.vetRequired', 'Veterinary consultation required')}</p>
            </div>
          )}

          {/* Vet feedback buttons */}
          {feedback === null ? (
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{t('ai.correctQuestion', 'Was this prediction correct?')}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" style={{ flex: 1, gap: '6px', color: '#86EFAC', borderColor: 'rgba(134,239,172,0.3)' }} onClick={() => setFeedback('correct')}>
                  <CheckCircle size={15} /> {t('ai.correct', 'Correct')}
                </button>
                <button className="btn btn-secondary" style={{ flex: 1, gap: '6px', color: '#FCA5A5', borderColor: 'rgba(252,165,165,0.3)' }} onClick={() => setFeedback('wrong')}>
                  <XCircle size={15} /> {t('ai.incorrect', 'Incorrect')}
                </button>
              </div>
            </div>
          ) : feedback === 'correct' ? (
            <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', textAlign: 'center', fontSize: '0.8125rem', color: '#86EFAC' }}>
              <CheckCircle size={16} style={{ display: 'inline', marginRight: '6px' }} />
              {t('ai.feedbackThankYou', 'Thank you! Feedback logged to improve the model.')}
            </div>
          ) : (
            <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{t('ai.correctDiagnosisQuestion', 'What is the correct diagnosis?')}</p>
              <select className="input" style={{ marginBottom: '8px', fontSize: '0.8125rem' }}>
                <option value="foot_mouth_disease">{formatDiseaseName('Foot & Mouth Disease (FMD)')}</option>
                <option value="healthy">{formatDiseaseName('Healthy Cow')}</option>
                <option value="lumpy_skin_disease">{formatDiseaseName('Lumpy Skin Disease (LSD)')}</option>
                <option value="mastitis">{formatDiseaseName('Mastitis (Udder Infection)')}</option>
                <option value="skin_disease">{formatDiseaseName('Skin Disease (Ringworm / Warts)')}</option>
              </select>
              <button className="btn btn-primary" style={{ width: '100%', fontSize: '0.8125rem' }} onClick={() => setFeedback('correct')}>
                {t('ai.submitCorrection', 'Submit Correction')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Herd Risk Overview Card ────────────────────────────────────── */
export const HerdRiskCard = ({ data }: { data: any }) => {
  const { language, t } = useLanguageStore();
  if (!data) return null;
  const total = data.totalAiScans || 1;
  const risk  = data.riskDistribution || {};
  const levels = [
    { key: 'critical', label: t('ai.critical', 'Critical'), color: '#EF4444' },
    { key: 'high',     label: t('ai.high', 'High'),         color: '#F97316' },
    { key: 'moderate', label: t('ai.moderate', 'Moderate'), color: '#EAB308' },
    { key: 'low',      label: t('ai.low', 'Low'),           color: '#22C55E' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
      <div className="card">
        <h4 style={{ fontSize: '0.875rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={16} style={{ color: 'var(--color-accent)' }} /> {language === 'hi' ? 'गोवंश जोखिम वितरण (30 दिन)' : 'Herd Risk Distribution (30 days)'}
        </h4>
        {levels.map(({ key, label, color }) => {
          const count = risk[key] || 0;
          const pct   = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={key} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                <span style={{ color }}>{label}</span>
                <span style={{ color: 'var(--text-muted)' }}>{count} {language === 'hi' ? 'स्कैन' : 'scans'}</span>
              </div>
              <div style={{ background: 'rgba(51,65,85,0.5)', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', borderRadius: '6px', background: color, transition: 'width 1s ease' }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h4 style={{ fontSize: '0.875rem', marginBottom: '16px' }}>📊 {language === 'hi' ? 'रोग विवरण' : 'Disease Breakdown'}</h4>
        {data.diseaseBreakdown?.length > 0 ? (
          data.diseaseBreakdown.map((d: any) => (
            <div key={d.disease} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '0.8125rem', textTransform: 'capitalize' }}>
                {language === 'hi' && DISEASE_NAMES_HI[d.disease] ? DISEASE_NAMES_HI[d.disease] : d.disease?.replace(/_/g, ' ')}
              </span>
              <span className="badge badge-info">{d.count}</span>
            </div>
          ))
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center', paddingTop: '20px' }}>
            {language === 'hi' ? 'अभी कोई एआई स्कैन नहीं हुआ है।' : 'No AI scans yet. Run an image scan to see disease trends.'}
          </p>
        )}
        {data.followUpsPending > 0 && (
          <div style={{ marginTop: '12px', padding: '10px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.8125rem', color: '#FCA5A5' }}>
            <AlertTriangle size={14} style={{ display: 'inline', marginRight: '6px' }} />
            {data.followUpsPending} {language === 'hi' ? 'फॉलो-अप लंबित हैं' : 'follow-up(s) overdue'}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Main Page ──────────────────────────────────────────────────── */
const AIDashboardPage = () => {
  const { language, t } = useLanguageStore();
  const [activeTab, setActiveTab] = useState<'predict' | 'image' | 'behavior' | 'diseases'>('image');
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<any>(null);

  const [healthForm, setHealthForm] = useState({
    temperature: '101.5', heart_rate: '60', weight: '350', age: '5',
    breed: 'Gir', symptoms: '', is_pregnant: false, milk_yield_liters: '',
  });
  const [behaviorForm, setBehaviorForm] = useState({
    activity_level: 'normal', eating_pattern: 'normal', rumination_hours: '7',
    lying_time_hours: '12', water_intake_liters: '40', social_behavior: 'normal',
  });
  const [diseases, setDiseases] = useState<any[]>([]);

  const predictDisease = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setResult(null);
    try {
      const res = await fetch(`${AI_SERVICE_URL}/predict/disease`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...healthForm,
          temperature: parseFloat(healthForm.temperature),
          heart_rate: parseInt(healthForm.heart_rate),
          weight: parseFloat(healthForm.weight),
          age: parseInt(healthForm.age),
          symptoms: healthForm.symptoms.split(',').map(s => s.trim()).filter(Boolean),
          milk_yield_liters: healthForm.milk_yield_liters ? parseFloat(healthForm.milk_yield_liters) : null,
        }),
      });
      setResult({ type: 'disease', data: await res.json() });
    } catch { setResult({ type: 'error', message: language === 'hi' ? 'एआई सेवा अनुपलब्ध है।' : 'AI Service unavailable. Run: cd ai-service && uvicorn main:app' }); }
    setLoading(false);
  };

  const analyzeBehavior = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setResult(null);
    try {
      const res = await fetch(`${AI_SERVICE_URL}/analyze/behavior`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...behaviorForm,
          rumination_hours: parseFloat(behaviorForm.rumination_hours),
          lying_time_hours: parseFloat(behaviorForm.lying_time_hours),
          water_intake_liters: parseFloat(behaviorForm.water_intake_liters),
        }),
      });
      setResult({ type: 'behavior', data: await res.json() });
    } catch { setResult({ type: 'error', message: language === 'hi' ? 'एआई सेवा अनुपलब्ध है।' : 'AI Service unavailable.' }); }
    setLoading(false);
  };

  const fetchDiseases = async () => {
    try {
      const res = await fetch(`${AI_SERVICE_URL}/diseases`);
      setDiseases((await res.json()).diseases || []);
    } catch { setDiseases([]); }
  };

  const TABS = [
    { key: 'image',     label: t('ai.tabImage', 'Image Scan'),         icon: Camera },
    { key: 'predict',   label: t('ai.tabVitals', 'Vitals Prediction'), icon: Brain },
    { key: 'behavior',  label: t('ai.tabBehavior', 'Behavior Analysis'),  icon: Activity },
    { key: 'diseases',  label: t('ai.tabDiseases', 'Disease Database'),   icon: Search },
  ] as const;

  return (
    <div className="page-enter">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Brain size={28} style={{ color: 'var(--color-accent)' }} /> {t('ai.title', 'AI Health Intelligence')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {t('ai.subtitle', 'CNN image disease detection · ML vitals prediction · Behavior analysis')}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
        {TABS.map((tab) => (
          <button key={tab.key} className={`btn ${activeTab === tab.key ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '8px 8px 0 0', fontSize: '0.8125rem' }}
            onClick={() => { setActiveTab(tab.key); setResult(null); if (tab.key === 'diseases') fetchDiseases(); }}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Image Scan — full-width dedicated view */}
      {activeTab === 'image' && <ImageScanTab />}

      {/* Vitals Prediction */}
      {activeTab === 'predict' && (
        <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: '20px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--color-accent)' }}>🔬 {t('ai.enterHealthParams', 'Enter Health Parameters')}</h3>
            <form onSubmit={predictDisease}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group"><label><Thermometer size={12} style={{display:'inline',marginRight:'4px'}}/>{t('ai.temperature', 'Temperature (°F)')}</label><input type="number" step="0.1" className="input" value={healthForm.temperature} onChange={(e) => setHealthForm({ ...healthForm, temperature: e.target.value })} /></div>
                <div className="form-group"><label><Heart size={12} style={{display:'inline',marginRight:'4px'}}/>{t('ai.heartRate', 'Heart Rate (bpm)')}</label><input type="number" className="input" value={healthForm.heart_rate} onChange={(e) => setHealthForm({ ...healthForm, heart_rate: e.target.value })} /></div>
                <div className="form-group"><label>⚖️ {t('ai.weight', 'Weight (kg)')}</label><input type="number" className="input" value={healthForm.weight} onChange={(e) => setHealthForm({ ...healthForm, weight: e.target.value })} /></div>
                <div className="form-group"><label>📅 {t('ai.age', 'Age (years)')}</label><input type="number" className="input" value={healthForm.age} onChange={(e) => setHealthForm({ ...healthForm, age: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>🧬 {t('ai.breed', 'Breed')}</label>
                <select className="input" value={healthForm.breed} onChange={(e) => setHealthForm({ ...healthForm, breed: e.target.value })}>
                  {['Gir','Sahiwal','Tharparkar','Kankrej','Red Sindhi','Hariana','Ongole','Crossbred'].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div className="form-group"><label>🤒 {t('ai.symptoms', 'Symptoms')} <span style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>{t('ai.symptomsHint', 'comma-separated')}</span></label>
                <input className="input" placeholder="fever, drooling, lameness..." value={healthForm.symptoms} onChange={(e) => setHealthForm({ ...healthForm, symptoms: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group"><label>🥛 {t('ai.milkYield', 'Milk Yield (L/day)')}</label><input type="number" step="0.1" className="input" placeholder="Optional" value={healthForm.milk_yield_liters} onChange={(e) => setHealthForm({ ...healthForm, milk_yield_liters: e.target.value })} /></div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '24px' }}>
                  <input type="checkbox" id="pregnant" checked={healthForm.is_pregnant} onChange={(e) => setHealthForm({ ...healthForm, is_pregnant: e.target.checked })} />
                  <label htmlFor="pregnant" style={{ margin: 0 }}>🤰 {t('ai.pregnant', 'Pregnant')}</label>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
                {loading ? <span className="spinner" /> : <Brain size={18} />}
                {loading ? t('ai.analyzing', 'Analyzing...') : t('ai.predictDisease', 'Predict Disease')}
              </button>
            </form>
          </div>

          {result && (
            <div className="card">
              {result.type === 'error' ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <AlertTriangle size={48} style={{ color: 'var(--color-warning)', marginBottom: '16px' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>{result.message}</p>
                </div>
              ) : result.type === 'disease' ? (
                <>
                  <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>🔍 {t('ai.predictionResults', 'Prediction Results')}</h3>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 700, color: RISK_COLORS[result.data.risk_level], fontFamily: 'var(--font-heading)' }}>
                      {(result.data.risk_score * 100).toFixed(0)}%
                    </div>
                    <div style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: RISK_COLORS[result.data.risk_level], fontWeight: 600 }}>
                      {result.data.risk_level} {language === 'hi' ? 'जोखिम' : 'Risk'}
                    </div>
                    <div style={{ marginTop: '12px', background: 'rgba(51,65,85,0.5)', borderRadius: '8px', height: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${result.data.risk_score * 100}%`, height: '100%', borderRadius: '8px', background: RISK_COLORS[result.data.risk_level], transition: 'width 1s ease' }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '0.875rem', marginBottom: '8px' }}>{t('ai.predictedConditions', 'Predicted Conditions')}</h4>
                    {result.data.predicted_conditions.map((c: any, i: number) => (
                      <div key={i} className="card" style={{ padding: '12px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <strong style={{ fontSize: '0.8125rem' }}>{language === 'hi' && DISEASE_NAMES_HI[c.disease] ? DISEASE_NAMES_HI[c.disease] : c.disease}</strong>
                          <span style={{ fontSize: '0.75rem', color: RISK_COLORS[c.severity === 'high' ? 'high' : c.severity === 'medium' ? 'moderate' : 'low'] }}>
                            {(c.probability * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.treatment}</p>
                      </div>
                    ))}
                  </div>
                  <h4 style={{ fontSize: '0.875rem', marginBottom: '8px' }}>{t('ai.recommendations', 'Recommendations')}</h4>
                  {result.data.recommendations.map((r: string, i: number) => (
                    <p key={i} style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>• {r}</p>
                  ))}
                </>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Behavior Analysis */}
      {activeTab === 'behavior' && (
        <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: '20px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--color-accent)' }}>🐄 {t('ai.behaviorParams', 'Behavior Parameters')}</h3>
            <form onSubmit={analyzeBehavior}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group"><label>{t('ai.activityLevel', 'Activity Level')}</label>
                  <select className="input" value={behaviorForm.activity_level} onChange={(e) => setBehaviorForm({ ...behaviorForm, activity_level: e.target.value })}>
                    <option value="low">{language === 'hi' ? 'कम' : 'Low'}</option>
                    <option value="normal">{language === 'hi' ? 'सामान्य' : 'Normal'}</option>
                    <option value="high">{language === 'hi' ? 'उच्च' : 'High'}</option>
                  </select>
                </div>
                <div className="form-group"><label>{t('ai.eatingPattern', 'Eating Pattern')}</label>
                  <select className="input" value={behaviorForm.eating_pattern} onChange={(e) => setBehaviorForm({ ...behaviorForm, eating_pattern: e.target.value })}>
                    <option value="normal">{language === 'hi' ? 'सामान्य' : 'Normal'}</option>
                    <option value="reduced">{language === 'hi' ? 'कम' : 'Reduced'}</option>
                    <option value="excessive">{language === 'hi' ? 'अधिक' : 'Excessive'}</option>
                    <option value="none">{language === 'hi' ? 'कुछ नहीं' : 'None'}</option>
                  </select>
                </div>
                <div className="form-group"><label>{t('ai.rumination', 'Rumination (hours)')}</label><input type="number" step="0.5" className="input" value={behaviorForm.rumination_hours} onChange={(e) => setBehaviorForm({ ...behaviorForm, rumination_hours: e.target.value })} /></div>
                <div className="form-group"><label>{t('ai.lyingTime', 'Lying Time (hours)')}</label><input type="number" step="0.5" className="input" value={behaviorForm.lying_time_hours} onChange={(e) => setBehaviorForm({ ...behaviorForm, lying_time_hours: e.target.value })} /></div>
                <div className="form-group"><label>{t('ai.waterIntake', 'Water Intake (L)')}</label><input type="number" className="input" value={behaviorForm.water_intake_liters} onChange={(e) => setBehaviorForm({ ...behaviorForm, water_intake_liters: e.target.value })} /></div>
                <div className="form-group"><label>{t('ai.socialBehavior', 'Social Behavior')}</label>
                  <select className="input" value={behaviorForm.social_behavior} onChange={(e) => setBehaviorForm({ ...behaviorForm, social_behavior: e.target.value })}>
                    <option value="normal">{language === 'hi' ? 'सामान्य' : 'Normal'}</option>
                    <option value="isolated">{language === 'hi' ? 'अलग-थलग' : 'Isolated'}</option>
                    <option value="aggressive">{language === 'hi' ? 'आक्रामक' : 'Aggressive'}</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
                {loading ? <span className="spinner" /> : <Activity size={18} />}
                {loading ? t('ai.analyzing', 'Analyzing...') : t('ai.analyzeBehavior', 'Analyze Behavior')}
              </button>
            </form>
          </div>
          {result?.type === 'behavior' && (
            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>🐄 {t('ai.tabBehavior', 'Behavior Analysis')}</h3>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 700, color: RISK_COLORS[result.data.risk_level], fontFamily: 'var(--font-heading)' }}>{result.data.risk_level.toUpperCase()}</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{result.data.recommendation}</p>
              </div>
              {result.data.alerts.map((alert: any, i: number) => (
                <div key={i} style={{ padding: '12px', borderRadius: '8px', marginBottom: '8px', background: alert.type === 'danger' ? 'rgba(239,68,68,0.1)' : alert.type === 'warning' ? 'rgba(234,179,8,0.1)' : alert.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(59,130,246,0.1)', border: `1px solid ${alert.type === 'danger' ? 'rgba(239,68,68,0.2)' : alert.type === 'warning' ? 'rgba(234,179,8,0.2)' : alert.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)'}`, fontSize: '0.8125rem' }}>
                  {alert.message}
                </div>
              ))}
            </div>
          )}
          {result?.type === 'error' && (
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
              <AlertTriangle size={40} style={{ color: 'var(--color-warning)' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{result.message}</p>
            </div>
          )}
        </div>
      )}

      {/* Disease Database */}
      {activeTab === 'diseases' && (
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--color-accent)' }}>📚 {t('ai.diseaseKnowledgeBase', 'Disease Knowledge Base')}</h3>
          {diseases.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
              {language === 'hi' ? 'डेटाबेस लोड करने के लिए एआई सेवा कनेक्ट करें।' : 'Connect AI Service to load database. Run: cd ai-service && uvicorn main:app'}
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
              {diseases.map((d: any) => (
                <div key={d.id} className="card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '0.875rem' }}>{language === 'hi' && DISEASE_NAMES_HI[d.name] ? DISEASE_NAMES_HI[d.name] : d.name}</h4>
                    <span className={`badge ${d.severity === 'high' || d.severity === 'critical' ? 'badge-danger' : 'badge-warning'}`}>
                      {language === 'hi' && SEV_NAMES_HI[d.severity?.toLowerCase()] ? SEV_NAMES_HI[d.severity?.toLowerCase()] : d.severity}
                    </span>
                  </div>
                  {d.in_cnn_model && <span className="badge badge-info" style={{ fontSize: '0.65rem', marginBottom: '8px' }}>🤖 {language === 'hi' ? 'एआई मॉडल में शामिल' : 'CNN Detected'}</span>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {d.symptoms.map((s: string) => (
                      <span key={s} className="badge badge-info" style={{ fontSize: '0.6rem' }}>{s}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIDashboardPage;
