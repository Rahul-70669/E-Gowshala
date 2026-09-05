import { useState, useEffect } from 'react';
import { Plus, Users, UserCheck, UserX, Star, Calendar, Clock } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { useLanguageStore } from '../../store/languageStore';

const VisitorsPage = () => {
  const { language, t } = useLanguageStore();
  const [visitors, setVisitors] = useState<any[]>([]);
  const [todayVisitors, setTodayVisitors] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'all'>('today');
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', visitType: 'individual', purpose: 'tour', groupSize: '1', scheduledDate: new Date().toISOString().split('T')[0], scheduledTime: '10:00', notes: '' });

  const fetchData = async () => {
    try {
      const [visitorsRes, todayRes, statsRes] = await Promise.all([
        apiClient.get('/visitors?limit=50').catch(() => ({ data: { data: { visitors: [] } } })),
        apiClient.get('/visitors/today').catch(() => ({ data: { data: [] } })),
        apiClient.get('/visitors/stats').catch(() => ({ data: { data: null } })),
      ]);
      setVisitors(visitorsRes.data.data.visitors || []);
      setTodayVisitors(todayRes.data.data || []);
      setStats(statsRes.data.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/visitors', { ...form, groupSize: parseInt(form.groupSize) });
      setShowAddForm(false);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleCheckIn = async (id: string) => {
    try { await apiClient.post(`/visitors/${id}/check-in`); fetchData(); } catch (err) { console.error(err); }
  };

  const handleCheckOut = async (id: string) => {
    const rating = prompt(language === 'hi' ? 'दर्शन अनुभव रेटिंग (1-5):' : 'Rate the visit (1-5):');
    const comment = prompt(language === 'hi' ? 'कोई टिप्पणी या फीडबैक?' : 'Any feedback?') || '';
    try {
      await apiClient.post(`/visitors/${id}/check-out`, {
        feedback: rating ? { rating: parseInt(rating), comment } : undefined,
      });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const STATUS_BADGE: Record<string, string> = {
    scheduled: 'badge-info', 'checked-in': 'badge-warning', completed: 'badge-success', cancelled: 'badge-danger', 'no-show': 'badge-danger',
  };

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h1 className="page-header-title">{t('visitors.title', 'Visitor Management')}</h1>
          <p className="page-header-sub">{t('visitors.subtitle', 'Schedule, track and manage gaushala visits & feedback')}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}><Plus size={18} /> {t('visitors.bookVisit', 'Schedule Visit')}</button>
        </div>
      </div>

      {/* Stats Strip */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          <div className="stat-card blue">
            <div className="icon-wrap blue" style={{ width:36, height:36, borderRadius:10, marginBottom:10 }}><Users size={18} /></div>
            <div style={{ fontSize:'1.75rem', fontWeight:800, fontFamily:'var(--font-heading)', color:'var(--text-primary)', lineHeight:1 }}>{stats.todayVisitors}</div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:6, fontWeight:600 }}>{language === 'hi' ? 'आज के आगंतुक' : "Today's Visitors"}</div>
          </div>
          <div className="stat-card green">
            <div className="icon-wrap green" style={{ width:36, height:36, borderRadius:10, marginBottom:10 }}><UserCheck size={18} /></div>
            <div style={{ fontSize:'1.75rem', fontWeight:800, fontFamily:'var(--font-heading)', color:'var(--text-primary)', lineHeight:1 }}>{stats.monthlyVisitors}</div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:6, fontWeight:600 }}>{language === 'hi' ? 'इस माह' : 'This Month'}</div>
          </div>
          <div className="stat-card orange">
            <div className="icon-wrap orange" style={{ width:36, height:36, borderRadius:10, marginBottom:10 }}><Calendar size={18} /></div>
            <div style={{ fontSize:'1.75rem', fontWeight:800, fontFamily:'var(--font-heading)', color:'var(--text-primary)', lineHeight:1 }}>{stats.scheduledToday}</div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:6, fontWeight:600 }}>{language === 'hi' ? 'आज के दर्शन' : 'Scheduled Today'}</div>
          </div>
          <div className="stat-card purple">
            <div className="icon-wrap purple" style={{ width:36, height:36, borderRadius:10, marginBottom:10 }}><Star size={18} /></div>
            <div style={{ fontSize:'1.75rem', fontWeight:800, fontFamily:'var(--font-heading)', color:'var(--text-primary)', lineHeight:1 }}>{stats.averageRating || '—'}</div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:6, fontWeight:600 }}>{language === 'hi' ? `औसत रेटिंग (${stats.totalFeedbacks})` : `Avg Rating (${stats.totalFeedbacks})`}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
        <button className={`btn ${activeTab === 'today' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: '8px 8px 0 0', fontSize: '0.8125rem' }} onClick={() => setActiveTab('today')}><Clock size={16} /> {language === 'hi' ? 'आज के दर्शन' : 'Today'}</button>
        <button className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: '8px 8px 0 0', fontSize: '0.8125rem' }} onClick={() => setActiveTab('all')}><Users size={16} /> {language === 'hi' ? 'सभी आगंतुक' : 'All Visitors'}</button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 14 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 10 }} />)}
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Type</th><th>Purpose</th><th>Date/Time</th><th>Group</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {(activeTab === 'today' ? todayVisitors : visitors).length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  {activeTab === 'today' ? 'No visitors today' : 'No visitors found'}
                </td></tr>
              ) : (activeTab === 'today' ? todayVisitors : visitors).map((v: any) => (
                <tr key={v._id}>
                  <td><strong>{v.name}</strong><br /><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{v.phone}</span></td>
                  <td><span className="badge badge-info">{v.visitType}</span></td>
                  <td>{v.purpose}</td>
                  <td>{new Date(v.scheduledDate).toLocaleDateString('en-IN')}<br /><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{v.scheduledTime}</span></td>
                  <td>{v.groupSize}</td>
                  <td><span className={`badge ${STATUS_BADGE[v.status] || 'badge-info'}`}>{v.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {v.status === 'scheduled' && (
                        <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.7rem' }} onClick={() => handleCheckIn(v._id)}>Check In</button>
                      )}
                      {v.status === 'checked-in' && (
                        <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem' }} onClick={() => handleCheckOut(v._id)}>Check Out</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Add Visitor Modal */}
      {showAddForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setShowAddForm(false)}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
          <h3 style={{ marginBottom: '20px', fontWeight: 800, color: 'var(--text-primary)', padding: '0 4px' }}>Schedule Visit</h3>
            <form onSubmit={handleAdd}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group"><label>Name *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="form-group"><label>Phone *</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div>
              </div>
              <div className="form-group"><label>Email</label><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group"><label>Visit Type</label><select className="input" value={form.visitType} onChange={(e) => setForm({ ...form, visitType: e.target.value })}>
                  <option value="individual">Individual</option><option value="group">Group</option><option value="school">School</option><option value="ngo">NGO</option><option value="government">Government</option><option value="media">Media</option>
                </select></div>
                <div className="form-group"><label>Purpose</label><select className="input" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}>
                  <option value="tour">Tour</option><option value="donation">Donation</option><option value="adoption">Adoption</option><option value="volunteering">Volunteering</option><option value="inspection">Inspection</option><option value="media-coverage">Media Coverage</option><option value="other">Other</option>
                </select></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group"><label>Group Size</label><input type="number" className="input" value={form.groupSize} onChange={(e) => setForm({ ...form, groupSize: e.target.value })} min={1} /></div>
                <div className="form-group"><label>Date *</label><input type="date" className="input" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} required /></div>
                <div className="form-group"><label>Time</label><input type="time" className="input" value={form.scheduledTime} onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Notes</label><textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule Visit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorsPage;
