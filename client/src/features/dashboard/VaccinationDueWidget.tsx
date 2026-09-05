import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Syringe, AlertTriangle, CheckCircle, ChevronRight, RefreshCw } from 'lucide-react';
import apiClient from '../../lib/apiClient';

interface VaccDue {
  _id: string;
  cowId: { _id: string; name: string; tagId: string };
  vaccineName: string;
  nextDueDate: string;
  status: 'due' | 'overdue';
}

const VaccinationDueWidget = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<VaccDue[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/health/vaccinations/due');
      setItems((res.data.data || []).slice(0, 6));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const overdue = items.filter(i => i.status === 'overdue');
  const due     = items.filter(i => i.status !== 'overdue');

  if (!loading && items.length === 0) return (
    <div className="card" style={{ borderTop: '3px solid #10B981' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div className="icon-wrap green" style={{ width: 36, height: 36, borderRadius: 10 }}><Syringe size={18} /></div>
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Vaccination Status</h3>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Upcoming doses</p>
        </div>
      </div>
      <div className="empty-state" style={{ padding: '20px 12px' }}>
        <div className="empty-state-icon" style={{ width: 56, height: 56, fontSize: '1.5rem', borderRadius: 16 }}>
          <CheckCircle size={28} style={{ color: '#10B981' }} />
        </div>
        <h3 style={{ fontSize: '0.9rem' }}>All vaccines up to date!</h3>
        <p style={{ fontSize: '0.78rem' }}>No due or overdue vaccinations.</p>
      </div>
    </div>
  );

  return (
    <div className="card" style={{ borderTop: `3px solid ${overdue.length > 0 ? '#EF4444' : '#F59E0B'}` }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className={`icon-wrap ${overdue.length > 0 ? 'red' : 'gold'}`} style={{ width: 36, height: 36, borderRadius: 10 }}>
            <Syringe size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Vaccination Alerts</h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {overdue.length > 0 && <span style={{ color: '#EF4444', fontWeight: 700 }}>{overdue.length} overdue · </span>}
              {due.length} due soon
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={fetch}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => navigate('/dashboard/health')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}
          >
            View All <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(item => {
            const isOverdue = item.status === 'overdue';
            const dueDate = new Date(item.nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            return (
              <div
                key={item._id}
                onClick={() => navigate('/dashboard/health')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 10,
                  background: isOverdue ? 'rgba(239,68,68,0.06)' : 'var(--bg-card-inner)',
                  border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.2)' : 'var(--border-color)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {isOverdue
                  ? <AlertTriangle size={16} style={{ color: '#EF4444', flexShrink: 0 }} />
                  : <Syringe size={16} style={{ color: '#F59E0B', flexShrink: 0 }} />
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.cowId?.name} <span style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.75rem' }}>({item.cowId?.tagId})</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>{item.vaccineName}</div>
                </div>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                  background: isOverdue ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                  color: isOverdue ? '#EF4444' : '#D97706',
                  flexShrink: 0,
                }}>
                  {isOverdue ? 'OVERDUE' : dueDate}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VaccinationDueWidget;
