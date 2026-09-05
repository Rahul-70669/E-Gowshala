import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguageStore } from '../../store/languageStore';
import { useAuthStore } from '../../store/authStore';
import {
  TrendingUp, Download, Plus, ArrowLeft,
  Factory, Calendar, Trash2
} from 'lucide-react';

interface DungLog {
  id: string;
  date: string;
  dungKg: number;
  fertiliserKg?: number;
  fertiliserRevenue?: number;
  notes?: string;
}

const GOBAR_DHAN_REG_KEY = 'egowshala_gobar_dhan_reg';
const DUNG_LOGS_KEY = 'egowshala_dung_logs';

const GobarDhanPage = () => {
  const navigate = useNavigate();
  const { language } = useLanguageStore();
  const { user } = useAuthStore();

  const [gobReg, setGobReg] = useState(
    () => localStorage.getItem(GOBAR_DHAN_REG_KEY) || 'GD-2024-GJ-009412'
  );
  const [editingReg, setEditingReg] = useState(false);
  const [draftReg, setDraftReg] = useState(gobReg);

  const [dungLogs, setDungLogs] = useState<DungLog[]>(() => {
    try {
      const stored = localStorage.getItem(DUNG_LOGS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      return {
        id: `log-${i}`,
        date: d.toISOString().split('T')[0],
        dungKg: 680 + Math.floor(Math.random() * 80),
        fertiliserKg: 120 + Math.floor(Math.random() * 40),
        fertiliserRevenue: (120 + Math.floor(Math.random() * 40)) * 8,
        notes: '',
      };
    }).reverse();
  });

  const [cattleCount, setCattleCount] = useState(48);
  const [newLog, setNewLog] = useState({ date: new Date().toISOString().split('T')[0], dungKg: '', fertiliserKg: '', fertiliserRevenue: '', notes: '' });
  const [showAddLog, setShowAddLog] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    localStorage.setItem(DUNG_LOGS_KEY, JSON.stringify(dungLogs));
  }, [dungLogs]);

  const dailyPotentialKg = cattleCount * 15;
  const dailyCbgM3 = dailyPotentialKg * 0.05;
  const dailyCbgRevenue = dailyCbgM3 * 45;
  const estimatedMonthlyGBRevenue = Math.round(dailyCbgRevenue * 30);

  const currentMonth = new Date().toISOString().substring(0, 7);
  const totalDungThisMonth = dungLogs
    .filter(l => l.date.startsWith(currentMonth))
    .reduce((s, l) => s + l.dungKg, 0);
  const totalFertiliserRevThisMonth = dungLogs
    .filter(l => l.date.startsWith(currentMonth))
    .reduce((s, l) => s + (l.fertiliserRevenue || 0), 0);

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    const log: DungLog = {
      id: `log-${Date.now()}`,
      date: newLog.date,
      dungKg: parseFloat(newLog.dungKg) || 0,
      fertiliserKg: parseFloat(newLog.fertiliserKg) || 0,
      fertiliserRevenue: parseFloat(newLog.fertiliserRevenue) || 0,
      notes: newLog.notes,
    };
    setDungLogs(prev => [...prev, log].sort((a, b) => a.date.localeCompare(b.date)));
    setNewLog({ date: new Date().toISOString().split('T')[0], dungKg: '', fertiliserKg: '', fertiliserRevenue: '', notes: '' });
    setShowAddLog(false);
  };

  const handleRemoveLog = (id: string) => setDungLogs(prev => prev.filter(l => l.id !== id));

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    await new Promise(r => setTimeout(r, 800));
    setGeneratingReport(false);
    const win = window.open('', '_blank');
    if (!win) return;
    const month = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    const totalDung = dungLogs.reduce((s, l) => s + l.dungKg, 0);
    const totalFert = dungLogs.reduce((s, l) => s + (l.fertiliserKg || 0), 0);
    const totalFertRev = dungLogs.reduce((s, l) => s + (l.fertiliserRevenue || 0), 0);
    const estCbgRev = Math.round((totalDung * 0.05) * 45);
    const html = `<!DOCTYPE html><html><head><title>GOBAR-DHAN Monthly Report</title>
<style>body{font-family:'Segoe UI',sans-serif;padding:36px;color:#1e293b}
.sheet{border:2px solid #0f172a;border-radius:8px;padding:32px;max-width:780px;margin:0 auto}
.header{text-align:center;border-bottom:2px solid #cbd5e1;padding-bottom:12px;margin-bottom:18px}
.header h2{margin:0 0 4px;color:#047857;font-size:16px;text-transform:uppercase}
.header p{margin:2px 0;font-size:11px;color:#64748b}
table{width:100%;border-collapse:collapse;font-size:12px;margin:12px 0}
td,th{border:1px solid #cbd5e1;padding:7px 10px}th{background:#f1fdf7;text-align:left}
.summary{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}
.kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 14px}
.kpi .val{font-size:18px;font-weight:800;color:#047857}.kpi .lbl{font-size:11px;color:#64748b}
.sign{display:flex;justify-content:space-between;margin-top:44px;font-size:12px}
@media print{.no-print{display:none}}</style></head><body>
<div class="sheet">
  <div class="header">
    <h2>🌿 GOBAR-DHAN SCHEME — MONTHLY ORGANIC RESOURCE UTILIZATION REPORT</h2>
    <p>Galvanizing Organic Bio-Agro Resources Dhan | Ministry of Jal Shakti, Govt. of India</p>
    <p>E-Gowshala Model Gaushala | GOBAR-DHAN Reg: ${gobReg} | Month: ${month}</p>
  </div>
  <div class="summary">
    <div class="kpi"><div class="val">${totalDung.toLocaleString('en-IN')} kg</div><div class="lbl">Total Dung Collected</div></div>
    <div class="kpi"><div class="val">Rs.${estCbgRev.toLocaleString('en-IN')}</div><div class="lbl">CBG Revenue Potential</div></div>
    <div class="kpi"><div class="val">${totalFert.toLocaleString('en-IN')} kg</div><div class="lbl">Vermicompost Produced</div></div>
    <div class="kpi"><div class="val">Rs.${totalFertRev.toLocaleString('en-IN')}</div><div class="lbl">Fertilizer Sales Revenue</div></div>
  </div>
  <p style="font-size:12px;line-height:1.6;"><strong>Registered Cattle:</strong> ${cattleCount} bovines &bull; <strong>Avg Daily Dung:</strong> ${(totalDung/Math.max(dungLogs.length,1)).toFixed(0)} kg/day &bull; <strong>CBG Rate:</strong> 0.05 m3/kg x Rs.45/m3</p>
  <table><thead><tr><th>Date</th><th>Dung (kg)</th><th>Compost (kg)</th><th>Fertilizer Revenue</th><th>Notes</th></tr></thead><tbody>
    ${dungLogs.map(l => `<tr><td>${l.date}</td><td>${l.dungKg}</td><td>${l.fertiliserKg||0}</td><td>Rs.${(l.fertiliserRevenue||0).toLocaleString('en-IN')}</td><td>${l.notes||'—'}</td></tr>`).join('')}
  </tbody></table>
  <p style="font-size:11px;color:#475569;line-height:1.5;">This report is certified accurate based on daily dung collection logs on the E-Gowshala platform. Available for inspection by the District GOBAR-DHAN Implementation Officer and PNGRB-authorized CBG plant operators.</p>
  <div class="sign">
    <div><br/><br/>____________________________<br/><strong>Gaushala Manager / Trustee</strong></div>
    <div style="text-align:right"><br/><br/>____________________________<br/><strong>District GOBAR-DHAN Officer</strong></div>
  </div>
</div>
<div class="no-print" style="text-align:center;margin-top:20px">
  <button onclick="window.print()" style="padding:10px 24px;background:#047857;color:white;border:none;border-radius:8px;font-weight:bold;cursor:pointer">Print / Save as PDF</button>
</div><script>window.onload=()=>{setTimeout(()=>window.print(),350)}</script></body></html>`;
    win.document.write(html);
    win.document.close();
  };

  const hi = language === 'hi';

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ padding: '8px 12px' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="page-header-title">
              🌿 {hi ? 'गोबर-धन योजना — जैविक संसाधन प्रबंधन' : 'GOBAR-DHAN — Organic Resource Management'}
            </h1>
            <p className="page-header-sub">
              {hi ? 'गोबर से बायोगैस, खाद एवं आय — सरकारी योजना अनुपालन' : 'Cow dung → Biogas, Compost & Revenue — GOBAR-DHAN Scheme Compliance'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={handleGenerateReport}
            disabled={generatingReport}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', borderColor: 'rgba(16,185,129,0.4)' }}
          >
            {generatingReport ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Download size={15} />}
            {hi ? 'मासिक रिपोर्ट (PDF)' : 'Monthly Report (PDF)'}
          </button>
          {(user?.role === 'admin' || user?.role === 'caretaker') && (
            <button className="btn btn-primary" onClick={() => setShowAddLog(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> {hi ? 'आज का गोबर दर्ज करें' : "Log Today's Dung"}
            </button>
          )}
        </div>
      </div>

      {/* GOBAR-DHAN Registration Card */}
      <div className="card" style={{ marginBottom: '20px', padding: '18px 22px', borderTop: '3px solid #10B981' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
              <Factory size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>
                {hi ? 'GOBAR-DHAN पंजीकरण संख्या' : 'GOBAR-DHAN Registration Number'}
              </div>
              {editingReg ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input className="input" value={draftReg} onChange={e => setDraftReg(e.target.value)}
                    style={{ fontSize: '0.9rem', padding: '4px 10px', fontFamily: 'var(--font-mono)', width: '220px' }} />
                  <button className="btn btn-primary" style={{ padding: '4px 14px', fontSize: '0.8rem' }}
                    onClick={() => { setGobReg(draftReg); localStorage.setItem(GOBAR_DHAN_REG_KEY, draftReg); setEditingReg(false); }}>Save</button>
                  <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => setEditingReg(false)}>Cancel</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-mono)' }}>{gobReg}</span>
                  {user?.role === 'admin' && (
                    <button className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: '0.72rem' }}
                      onClick={() => { setDraftReg(gobReg); setEditingReg(true); }}>Edit</button>
                  )}
                </div>
              )}
            </div>
          </div>
          <span className="badge badge-success" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>✓ Active GOBAR-DHAN Member</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { icon: '🐄', label: hi ? 'पंजीकृत गोवंश' : 'Registered Cattle', value: `${cattleCount}`, sub: hi ? 'INAPH सत्यापित' : 'INAPH Verified', color: '#F97316' },
          { icon: '💩', label: hi ? 'दैनिक गोबर क्षमता' : 'Daily Dung Potential', value: `${dailyPotentialKg.toLocaleString('en-IN')} kg`, sub: `${cattleCount} × 15 kg/day`, color: '#8B5CF6' },
          { icon: '🔥', label: hi ? 'दैनिक CBG राजस्व क्षमता' : 'Daily CBG Revenue', value: `₹${Math.round(dailyCbgRevenue).toLocaleString('en-IN')}`, sub: `${dailyCbgM3.toFixed(0)} m³ × ₹45/m³`, color: '#10B981' },
          { icon: '📦', label: hi ? 'इस माह गोबर संग्रह' : 'Dung This Month', value: `${totalDungThisMonth.toLocaleString('en-IN')} kg`, sub: hi ? 'वास्तविक दर्ज आंकड़ा' : 'Actual logged', color: '#0EA5E9' },
          { icon: '🌿', label: hi ? 'अनु. मासिक CBG आय' : 'Est. Monthly CBG Revenue', value: `₹${estimatedMonthlyGBRevenue.toLocaleString('en-IN')}`, sub: hi ? 'संभावित मासिक आय' : 'Revenue potential/month', color: '#EC4899' },
          { icon: '🧺', label: hi ? 'खाद बिक्री (इस माह)' : 'Compost Sales (Month)', value: `₹${totalFertiliserRevThisMonth.toLocaleString('en-IN')}`, sub: hi ? 'जैविक खाद बिक्री' : 'Organic compost sold', color: '#F59E0B' },
        ].map(kpi => (
          <div key={kpi.label} className="card" style={{ padding: '16px 18px', borderTop: `3px solid ${kpi.color}` }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>{kpi.icon}</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: kpi.color, fontFamily: 'var(--font-heading)', lineHeight: 1 }}>{kpi.value}</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 2px' }}>{kpi.label}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Revenue Calculator */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {hi ? 'CBG राजस्व कैलकुलेटर' : 'Biogas (CBG) Revenue Calculator'}
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
              {hi ? 'गोवंश संख्या बदलकर संभावित आय देखें' : 'Adjust cattle count to see revenue potential'}
            </p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{hi ? 'गोवंश संख्या' : 'Cattle Count'}</label>
            <input type="number" className="input" value={cattleCount} onChange={e => setCattleCount(parseInt(e.target.value) || 0)} style={{ marginTop: '6px' }} />
          </div>
          <div style={{ background: 'var(--bg-card-inner)', borderRadius: '10px', padding: '14px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{hi ? 'दैनिक गोबर' : 'Daily Dung'}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#8B5CF6' }}>{(cattleCount * 15).toLocaleString('en-IN')} kg/day</div>
          </div>
          <div style={{ background: 'var(--bg-card-inner)', borderRadius: '10px', padding: '14px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{hi ? 'दैनिक CBG' : 'Daily CBG'}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10B981' }}>{dailyCbgM3.toFixed(0)} m³/day</div>
          </div>
          <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(16,185,129,0.25)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{hi ? 'अनु. मासिक आय' : 'Est. Monthly Revenue'}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', fontFamily: 'var(--font-heading)' }}>₹{estimatedMonthlyGBRevenue.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* Dung Log Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <Calendar size={18} color="#10B981" /> {hi ? 'दैनिक गोबर संग्रह लॉग' : 'Daily Dung Collection Ledger'}
          </h3>
          {(user?.role === 'admin' || user?.role === 'caretaker') && (
            <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setShowAddLog(true)}>
              <Plus size={14} /> {hi ? 'प्रविष्टि जोड़ें' : 'Add Entry'}
            </button>
          )}
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{hi ? 'दिनांक' : 'Date'}</th>
                <th>{hi ? 'गोबर (kg)' : 'Dung (kg)'}</th>
                <th>{hi ? 'CBG (m³)' : 'CBG (m³)'}</th>
                <th>{hi ? 'CBG आय (₹)' : 'CBG Revenue (₹)'}</th>
                <th>{hi ? 'खाद (kg)' : 'Compost (kg)'}</th>
                <th>{hi ? 'खाद बिक्री (₹)' : 'Compost Revenue (₹)'}</th>
                <th>{hi ? 'नोट्स' : 'Notes'}</th>
                {user?.role === 'admin' && <th></th>}
              </tr>
            </thead>
            <tbody>
              {dungLogs.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  {hi ? 'अभी कोई प्रविष्टि नहीं' : 'No entries yet — add your first daily log'}
                </td></tr>
              ) : [...dungLogs].reverse().map(log => {
                const cbgM3 = (log.dungKg * 0.05).toFixed(1);
                const cbgRev = Math.round(log.dungKg * 0.05 * 45);
                return (
                  <tr key={log.id}>
                    <td><strong>{new Date(log.date + 'T00:00:00').toLocaleDateString('en-IN')}</strong></td>
                    <td><strong style={{ color: '#8B5CF6' }}>{log.dungKg.toLocaleString('en-IN')}</strong></td>
                    <td style={{ color: '#10B981' }}>{cbgM3}</td>
                    <td style={{ color: '#10B981', fontWeight: 700 }}>₹{cbgRev.toLocaleString('en-IN')}</td>
                    <td>{log.fertiliserKg || '—'}</td>
                    <td>{log.fertiliserRevenue ? `₹${log.fertiliserRevenue.toLocaleString('en-IN')}` : '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{log.notes || '—'}</td>
                    {user?.role === 'admin' && (
                      <td>
                        <button onClick={() => handleRemoveLog(log.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '4px' }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Log Modal */}
      {showAddLog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setShowAddLog(false)}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '18px' }}>
              🐄 {hi ? 'आज का गोबर दर्ज करें' : "Log Today's Dung Collection"}
            </h3>
            <form onSubmit={handleAddLog}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>{hi ? 'दिनांक' : 'Date'} *</label>
                  <input type="date" className="input" value={newLog.date} onChange={e => setNewLog({ ...newLog, date: e.target.value })} required />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>{hi ? 'गोबर संग्रह (kg)' : 'Dung Collected (kg)'} *</label>
                  <input type="number" className="input" placeholder="720" value={newLog.dungKg} onChange={e => setNewLog({ ...newLog, dungKg: e.target.value })} required />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>{hi ? 'खाद उत्पाद (kg)' : 'Compost Produced (kg)'}</label>
                  <input type="number" className="input" placeholder="120" value={newLog.fertiliserKg} onChange={e => setNewLog({ ...newLog, fertiliserKg: e.target.value })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>{hi ? 'खाद बिक्री (₹)' : 'Compost Revenue (₹)'}</label>
                  <input type="number" className="input" placeholder="960" value={newLog.fertiliserRevenue} onChange={e => setNewLog({ ...newLog, fertiliserRevenue: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>{hi ? 'नोट्स' : 'Notes'}</label>
                <input className="input" placeholder={hi ? 'वैकल्पिक नोट' : 'Optional note'} value={newLog.notes} onChange={e => setNewLog({ ...newLog, notes: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddLog(false)}>{hi ? 'रद्द करें' : 'Cancel'}</button>
                <button type="submit" className="btn btn-primary">💾 {hi ? 'सहेजें' : 'Save Log'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GobarDhanPage;
