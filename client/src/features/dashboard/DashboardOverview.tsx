import {
  Bug as Cow, HeartPulse, Syringe, HandCoins,
  Users, AlertTriangle, TrendingUp, Activity
} from 'lucide-react';

const STATS = [
  { label: 'Total Cows', value: '127', icon: Cow, color: 'orange', change: '+3 this week' },
  { label: 'Healthy Cows', value: '112', icon: HeartPulse, color: 'green', change: '88% healthy' },
  { label: 'Vaccinations Due', value: '14', icon: Syringe, color: 'blue', change: 'Next 7 days' },
  { label: 'Health Alerts', value: '5', icon: AlertTriangle, color: 'red', change: '2 critical' },
  { label: 'Monthly Donations', value: '₹1,45,000', icon: HandCoins, color: 'purple', change: '+12% vs last' },
  { label: 'Active Donors', value: '34', icon: Users, color: 'blue', change: '+5 this month' },
  { label: 'Feed Cost (Monthly)', value: '₹89,500', icon: TrendingUp, color: 'yellow', change: '-3% optimized' },
  { label: 'AI Risk Score', value: '23/100', icon: Activity, color: 'green', change: 'Low risk' },
];

const DashboardOverview = () => {
  return (
    <div>
      {/* Welcome Banner */}
      <div className="card" style={{
        marginBottom: '24px',
        background: 'linear-gradient(135deg, rgba(249,115,22,0.1), rgba(14,165,233,0.05))',
        borderColor: 'rgba(249,115,22,0.2)',
      }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>
          🙏 Namaste! Welcome to <span className="gradient-text">E-Gowshala</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Here's an overview of your Gaushala operations today.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="stats-grid">
        {STATS.map((stat) => (
          <div key={stat.label} className="card stat-card">
            <div className={`stat-icon ${stat.color}`}>
              <stat.icon size={22} />
            </div>
            <div className="stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-success)' }}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>⚡ Quick Actions</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary">🐄 Register Cow</button>
          <button className="btn btn-secondary">💉 Log Vaccination</button>
          <button className="btn btn-secondary">🍽️ Log Feed</button>
          <button className="btn btn-secondary">📋 Create Task</button>
          <button className="btn btn-secondary">🩺 Health Checkup</button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card" style={{ marginTop: '16px' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '16px' }}>📋 Recent Activity</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { time: '2 min ago', text: 'Vaccination administered to COW-2026-0045 (Lakshmi)', type: 'success' },
            { time: '15 min ago', text: 'Health alert: COW-2026-0012 (Nandi) showing low appetite', type: 'warning' },
            { time: '1 hour ago', text: 'Donation received: ₹5,000 from Rajesh Kumar', type: 'info' },
            { time: '2 hours ago', text: 'Feed log updated for Shed A — 120kg fodder distributed', type: 'success' },
            { time: '3 hours ago', text: 'New volunteer Priya Patel registered', type: 'info' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: '12px',
              padding: '10px', borderRadius: '8px', background: 'rgba(51,65,85,0.3)',
            }}>
              <span className={`badge badge-${item.type}`} style={{ flexShrink: 0, marginTop: '2px' }}>
                {item.time}
              </span>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
