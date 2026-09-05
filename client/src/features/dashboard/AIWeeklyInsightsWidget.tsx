/**
 * AIWeeklyInsightsWidget
 * Generates intelligent health insights by analyzing data from the existing APIs.
 * No new backend endpoint needed — it computes insights from existing stats.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import apiClient from '../../lib/apiClient';

interface Insight {
  level: 'critical' | 'warning' | 'good' | 'info';
  icon: string;
  title: string;
  detail: string;
  action?: string;
  actionPath?: string;
}

const LEVEL_COLOR: Record<string, string> = {
  critical: '#EF4444',
  warning:  '#F97316',
  good:     '#10B981',
  info:     '#38BDF8',
};

const AIWeeklyInsightsWidget = () => {
  const navigate = useNavigate();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekLabel] = useState(() => {
    const d = new Date();
    return `Week of ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
  });

  useEffect(() => {
    Promise.all([
      apiClient.get('/cows/stats').catch(() => ({ data: { data: null } })),
      apiClient.get('/health/stats').catch(() => ({ data: { data: null } })),
      apiClient.get('/operations/stats').catch(() => ({ data: { data: null } })),
      apiClient.get('/health/vaccinations/due').catch(() => ({ data: { data: [] } })),
    ]).then(([cowRes, healthRes, opsRes, vaccRes]) => {
      const cow    = cowRes.data?.data;
      const health = healthRes.data?.data;
      const ops    = opsRes.data?.data;
      const vaccDue: any[] = vaccRes.data?.data || [];

      const generated: Insight[] = [];

      // ── Insight 1: Overdue vaccinations
      const overdue = vaccDue.filter((v: any) => v.status === 'overdue');
      if (overdue.length > 0) {
        generated.push({
          level: 'critical',
          icon: '💉',
          title: `${overdue.length} vaccination${overdue.length > 1 ? 's' : ''} overdue`,
          detail: `${overdue.map((v: any) => v.cowId?.name || 'Unknown').slice(0, 2).join(', ')} and others need immediate attention.`,
          action: 'View Vaccinations',
          actionPath: '/dashboard/health',
        });
      }

      // ── Insight 2: Herd health rate
      if (cow) {
        const total = cow.total || 1;
        const healthRate = Math.round(((cow.healthy || 0) / total) * 100);
        if (healthRate >= 85) {
          generated.push({ level: 'good', icon: '🐄', title: `Herd health excellent — ${healthRate}% healthy`, detail: `${cow.healthy} of ${cow.total} cattle are in good health. Continue current care protocols.` });
        } else if (healthRate >= 65) {
          generated.push({ level: 'warning', icon: '🐄', title: `Herd health at ${healthRate}% — monitor closely`, detail: `${cow.sick || 0} cattle currently under treatment. Schedule a herd review this week.`, action: 'View Herd', actionPath: '/dashboard/cows' });
        } else {
          generated.push({ level: 'critical', icon: '🐄', title: `Herd health low — only ${healthRate}% healthy`, detail: `${cow.sick || 0} sick cattle detected. Consider a full veterinary audit.`, action: 'Health Records', actionPath: '/dashboard/health' });
        }
      }

      // ── Insight 3: Pending tasks
      if (ops) {
        if ((ops.overdueTasks || 0) > 0) {
          generated.push({ level: 'warning', icon: '📋', title: `${ops.overdueTasks} overdue tasks need attention`, detail: `Tasks past their deadline may affect feeding schedules and animal care quality.`, action: 'Open Tasks', actionPath: '/dashboard/operations' });
        } else if ((ops.pendingTasks || 0) === 0) {
          generated.push({ level: 'good', icon: '✅', title: 'All daily tasks completed', detail: 'No pending operations this week. Staff performance is excellent.' });
        }
      }

      // ── Insight 4: AI scan reminder
      const vaccCoverage = health && cow ? Math.round(((vaccDue.length > 0 ? vaccDue.length : 0) / Math.max(cow.total, 1)) * 100) : 0;
      if ((health?.overdueVaccinations || 0) === 0 && overdue.length === 0) {
        generated.push({ level: 'good', icon: '🛡️', title: 'Vaccination schedule on track', detail: 'No overdue vaccinations detected. Great preventive care by the veterinary team.' });
      }

      // ── Insight 5: AI scan call-to-action
      if ((cow?.sick || 0) > 0) {
        generated.push({ level: 'info', icon: '🤖', title: 'AI disease scan recommended', detail: `${cow?.sick || 0} cattle are sick — use the AI scanner to get instant disease diagnosis from photos.`, action: 'Open AI Scanner', actionPath: '/dashboard/ai' });
      }

      // Fallback if no insights generated
      if (generated.length === 0) {
        generated.push({ level: 'good', icon: '🌟', title: 'Gaushala is in great shape!', detail: 'All systems normal. Cattle healthy, tasks on track, vaccinations current.' });
      }

      setInsights(generated.slice(0, 4)); // max 4 insights
      setLoading(false);
    });
  }, []);

  return (
    <div className="card" style={{ borderTop: '3px solid #A855F7' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="icon-wrap purple" style={{ width: 36, height: 36, borderRadius: 10 }}>
            <Brain size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>AI Health Insights</h3>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>{weekLabel}</p>
          </div>
        </div>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, background: 'rgba(168,85,247,0.12)', color: '#A855F7', border: '1px solid rgba(168,85,247,0.25)', borderRadius: '99px', padding: '3px 10px' }}>
          Auto-Generated
        </span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {insights.map((ins, i) => (
            <div
              key={i}
              style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', borderRadius: '12px', background: `${LEVEL_COLOR[ins.level]}10`, border: `1px solid ${LEVEL_COLOR[ins.level]}25`, cursor: ins.actionPath ? 'pointer' : 'default' }}
              onClick={() => ins.actionPath && navigate(ins.actionPath)}
            >
              <span style={{ fontSize: '1.25rem', flexShrink: 0, marginTop: '1px' }}>{ins.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: LEVEL_COLOR[ins.level], marginBottom: '2px' }}>{ins.title}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{ins.detail}</div>
                {ins.action && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 6, fontSize: '0.72rem', fontWeight: 700, color: LEVEL_COLOR[ins.level] }}>
                    {ins.action} <ChevronRight size={12} />
                  </div>
                )}
              </div>
              {ins.level === 'critical' && <AlertTriangle size={16} style={{ color: LEVEL_COLOR[ins.level], flexShrink: 0, marginTop: 2 }} />}
              {ins.level === 'good' && <CheckCircle size={16} style={{ color: LEVEL_COLOR[ins.level], flexShrink: 0, marginTop: 2 }} />}
              {ins.level === 'warning' && <TrendingDown size={16} style={{ color: LEVEL_COLOR[ins.level], flexShrink: 0, marginTop: 2 }} />}
              {ins.level === 'info' && <TrendingUp size={16} style={{ color: LEVEL_COLOR[ins.level], flexShrink: 0, marginTop: 2 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIWeeklyInsightsWidget;
