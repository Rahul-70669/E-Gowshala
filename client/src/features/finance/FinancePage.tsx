import { useState, useEffect } from 'react';
import {
  Plus, IndianRupee, TrendingUp, TrendingDown, PieChart as PieIcon,
  BarChart3, Download, Printer, Filter, Search, WalletCards, FileText
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts';
import apiClient from '../../lib/apiClient';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';

const CATEGORY_COLORS: Record<string, string> = {
  feed: '#22C55E',
  medical: '#EF4444',
  salary: '#3B82F6',
  utilities: '#EAB308',
  infrastructure: '#8B5CF6',
  transport: '#F97316',
  equipment: '#EC4899',
  miscellaneous: '#64748B',
};

const PIE_COLORS = ['#F97316', '#3B82F6', '#22C55E', '#8B5CF6', '#EF4444', '#EAB308', '#EC4899', '#64748B'];

const FinancePage = () => {
  const { user } = useAuthStore();
  const { language, t } = useLanguageStore();
  const [summary, setSummary] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    category: 'feed',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paidTo: '',
    paymentMode: 'upi',
    notes: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, expRes] = await Promise.all([
        apiClient.get('/finance/summary').catch(() => ({ data: { data: null } })),
        apiClient.get('/finance/expenses?limit=50').catch(() => ({ data: { data: { expenses: [] } } })),
      ]);
      setSummary(sumRes.data.data);
      setExpenses(expRes.data.data.expenses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/finance/expenses', { ...form, amount: parseFloat(form.amount) });
      setShowAddExpense(false);
      setForm({ category: 'feed', amount: '', description: '', date: new Date().toISOString().split('T')[0], paidTo: '', paymentMode: 'upi', notes: '' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) return;
    const headers = ['Date', 'Category', 'Description', 'Amount (INR)', 'Paid To', 'Payment Mode'];
    const rows = expenses.map((e) => [
      new Date(e.date).toLocaleDateString('en-IN'),
      e.category,
      `"${e.description.replace(/"/g, '""')}"`,
      e.amount,
      `"${(e.paidTo || '').replace(/"/g, '""')}"`,
      e.paymentMode,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `egowshala-expenses-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleComplianceReport = async () => {
    const API = import.meta.env.VITE_API_URL || '/api';
    const quarter = Math.ceil((new Date().getMonth() + 1) / 3);
    const year = new Date().getFullYear();
    try {
      const res = await fetch(`${API}/public/compliance-report`);
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `egowshala-compliance-Q${quarter}-${year}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Could not generate compliance report. Please ensure the server is running.');
    }
  };

  const filteredExpenses = expenses.filter((e) => {
    const matchesCat = categoryFilter === 'All' || e.category === categoryFilter;
    const matchesSearch =
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      (e.paidTo && e.paidTo.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Prepare Pie Chart Data
  const pieData = summary?.categoryBreakdown?.map((cat: any) => ({
    name: cat._id.charAt(0).toUpperCase() + cat._id.slice(1),
    value: cat.total,
  })) || [];

  // Prepare Bar Chart Trends
  const trendData = summary?.expenseTrends?.slice(-6).map((item: any) => ({
    month: item._id.slice(5),
    expense: item.total,
  })) || [];

  return (
    <div className="page-enter" style={{ maxWidth: '1200px', margin: '0 auto' }}>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">{t('finance.title', 'Financial Analytics')}</h1>
          <p className="page-header-sub">{t('finance.subtitle', 'Cashflow, expenses, category breakdown & spending trends')}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={handleComplianceReport} title="Download Government Quarterly Compliance Report PDF">
            <FileText size={16} /> {language === 'hi' ? 'अनुपालन रिपोर्ट' : 'Compliance PDF'}
          </button>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={16} /> {language === 'hi' ? 'सीएसवी डाउनलोड' : 'Export CSV'}
          </button>
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={16} /> {language === 'hi' ? 'प्रिंट' : 'Print'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddExpense(true)}>
            <Plus size={18} /> {t('finance.addExpense', 'Record Expense')}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 14, marginBottom: 24 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}
        </div>
      ) : (
        <>
          {/* ── KPI Strip ── */}
          {summary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>

              <div className="stat-card green">
                <div className="icon-wrap green" style={{ width:38, height:38, borderRadius:10, marginBottom:10 }}><TrendingUp size={18} /></div>
                <div style={{ fontSize:'1.5rem', fontWeight:800, fontFamily:'var(--font-heading)', color:'#10B981', lineHeight:1 }}>₹{((summary.yearlyIncome||0)/1000).toFixed(0)}K</div>
                <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:6, fontWeight:600 }}>{language === 'hi' ? 'वार्षिक आय' : 'Yearly Inflow'}</div>
              </div>

              <div className="stat-card red">
                <div className="icon-wrap red" style={{ width:38, height:38, borderRadius:10, marginBottom:10 }}><TrendingDown size={18} /></div>
                <div style={{ fontSize:'1.5rem', fontWeight:800, fontFamily:'var(--font-heading)', color:'#EF4444', lineHeight:1 }}>₹{((summary.yearlyExpense||0)/1000).toFixed(0)}K</div>
                <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:6, fontWeight:600 }}>{language === 'hi' ? 'वार्षिक व्यय' : 'Yearly Expenditure'}</div>
              </div>

              <div className={`stat-card ${(summary.netBalance||0) >= 0 ? 'green' : 'red'}`}>
                <div className={`icon-wrap ${(summary.netBalance||0) >= 0 ? 'green' : 'red'}`} style={{ width:38, height:38, borderRadius:10, marginBottom:10 }}><IndianRupee size={18} /></div>
                <div style={{ fontSize:'1.5rem', fontWeight:800, fontFamily:'var(--font-heading)', color:(summary.netBalance||0)>=0?'#10B981':'#EF4444', lineHeight:1 }}>₹{(Math.abs(summary.netBalance||0)/1000).toFixed(0)}K</div>
                <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:6, fontWeight:600 }}>{(summary.netBalance||0)>=0?(language==='hi'?'बचत / लाभ':'Surplus'):(language==='hi'?'घाटा':'Deficit')}</div>
              </div>

              <div className="stat-card orange">
                <div className="icon-wrap orange" style={{ width:38, height:38, borderRadius:10, marginBottom:10 }}><WalletCards size={18} /></div>
                <div style={{ fontSize:'1.5rem', fontWeight:800, fontFamily:'var(--font-heading)', color:'var(--text-primary)', lineHeight:1 }}>₹{((summary.monthlyExpense||0)/1000).toFixed(0)}K</div>
                <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:6, fontWeight:600 }}>This Month Spent</div>
              </div>

            </div>
          )}

          {/* ── Recharts Visual Section ─────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            {/* Expense Category Donut / Pie */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
                <PieIcon size={18} /> Category Breakdown
              </h3>
              {pieData.length > 0 ? (
                <div style={{ height: '240px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                        {pieData.map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [`₹${Number(value||0).toLocaleString('en-IN')}`, 'Amount']}
                        contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px', color: 'var(--text-secondary)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '60px 0' }}>No expense categories logged yet.</p>
              )}
            </div>

            {/* Monthly Expense Trend Bar Chart */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#38BDF8' }}>
                <BarChart3 size={18} /> Monthly Spending Trend
              </h3>
              {trendData.length > 0 ? (
                <div style={{ height: '240px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                      <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value: any) => [`₹${Number(value||0).toLocaleString('en-IN')}`, 'Expense']}
                        contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                      />
                      <Bar dataKey="expense" fill="#F97316" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '60px 0' }}>No trend data recorded yet.</p>
              )}
            </div>
          </div>

          {/* ── Filters & Expenses Ledger Table ─────────────────── */}
          <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search description, recipient..."
                  className="input"
                  style={{ paddingLeft: '36px' }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['All', 'feed', 'medical', 'salary', 'utilities', 'infrastructure'].map((c) => (
                  <button
                    key={c}
                    className={`btn ${categoryFilter === c ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px 12px', fontSize: '0.75rem', textTransform: 'capitalize' }}
                    onClick={() => setCategoryFilter(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Paid To</th>
                    <th>Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No matching expenses found.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((e: any) => (
                      <tr key={e._id}>
                        <td>{new Date(e.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                        <td>
                          <span className="badge" style={{ background: `${CATEGORY_COLORS[e.category] || '#64748B'}22`, color: CATEGORY_COLORS[e.category] || '#94A3B8' }}>
                            {e.category}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{e.description}</td>
                        <td style={{ fontWeight: 700, color: '#EF4444' }}>₹{e.amount.toLocaleString('en-IN')}</td>
                        <td>{e.paidTo || 'N/A'}</td>
                        <td><span className="badge badge-info">{e.paymentMode}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Add Expense Modal ───────────────────────────────── */}
      {showAddExpense && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => setShowAddExpense(false)}
        >
          <div className="card modal-card" style={{ maxWidth: '480px', width: '100%', padding: '24px', borderRadius: '16px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>Record New Expense</h3>
            <form onSubmit={handleAddExpense}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Category *</label>
                  <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {Object.keys(CATEGORY_COLORS).map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount (₹) *</label>
                  <input type="number" required placeholder="5000" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <input className="input" required placeholder="e.g. Green fodder 500kg procurement" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Paid To *</label>
                  <input className="input" required placeholder="Vendor / Staff" value={form.paidTo} onChange={(e) => setForm({ ...form, paidTo: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Payment Mode</label>
                  <select className="input" value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}>
                    <option value="upi">UPI</option>
                    <option value="cash">Cash</option>
                    <option value="bank-transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddExpense(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancePage;
