import { useState, useEffect } from 'react';
import {
  Users, UserPlus, Shield, Activity, Phone, Mail,
  CheckCircle2, XCircle, Search, Filter, KeyRound, AlertTriangle
} from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'veterinarian' | 'caretaker' | 'volunteer';
  language?: string;
  isActive: boolean;
  createdAt: string;
}

const ROLE_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  admin: { label: 'Administrator', bg: 'rgba(239,68,68,0.15)', color: '#F87171' },
  veterinarian: { label: 'Veterinarian', bg: 'rgba(59,130,246,0.15)', color: '#60A5FA' },
  caretaker: { label: 'Caretaker / Staff', bg: 'rgba(249,115,22,0.15)', color: '#FB923C' },
  volunteer: { label: 'Volunteer', bg: 'rgba(34,197,94,0.15)', color: '#4ADE80' },
};

const UsersPage = () => {
  const { user: currentUser } = useAuthStore();
  const { language, t } = useLanguageStore();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);

  // New staff form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'caretaker' as StaffUser['role'],
    language: 'en',
  });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/auth/users');
      setUsers(res.data?.data || []);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);
    try {
      await apiClient.post('/auth/users', formData);
      setShowAddModal(false);
      setFormData({ name: '', email: '', phone: '', password: '', role: 'caretaker', language: 'en' });
      fetchUsers();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to register new staff member.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (targetUser: StaffUser) => {
    if (targetUser.id === currentUser?.id) {
      alert('You cannot deactivate your own administrative account.');
      return;
    }
    const confirmMsg = targetUser.isActive
      ? `Deactivate ${targetUser.name}'s account? They will not be able to log in.`
      : `Reactivate ${targetUser.name}'s account?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await apiClient.put(`/auth/users/${targetUser.id}`, { isActive: !targetUser.isActive });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleChangeRole = async (targetUser: StaffUser, newRole: StaffUser['role']) => {
    if (targetUser.id === currentUser?.id) {
      alert('You cannot change your own administrative role.');
      return;
    }
    try {
      await apiClient.put(`/auth/users/${targetUser.id}`, { role: newRole });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user role.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone && u.phone.includes(search));
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalAdmins = users.filter((u) => u.role === 'admin').length;
  const totalVets = users.filter((u) => u.role === 'veterinarian').length;
  const totalCaretakers = users.filter((u) => u.role === 'caretaker').length;
  const totalVolunteers = users.filter((u) => u.role === 'volunteer').length;

  return (
    <div className="page-enter" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">{t('users.title', 'Staff & User Management')}</h1>
          <p className="page-header-sub">{t('users.subtitle', 'Manage staff accounts, roles, access permissions & languages')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <UserPlus size={18} /> {t('users.addUser', 'Add Staff Member')}
        </button>
      </div>

      {/* Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div className="stat-card blue">
          <div className="icon-wrap blue" style={{ width:36, height:36, borderRadius:10, marginBottom:10 }}><Users size={18} /></div>
          <div style={{ fontSize:'1.75rem', fontWeight:800, fontFamily:'var(--font-heading)', color:'var(--text-primary)', lineHeight:1 }}>{users.length}</div>
          <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:6, fontWeight:600 }}>{language === 'hi' ? 'कुल कर्मचारी' : 'Total Staff'}</div>
        </div>
        <div className="stat-card red">
          <div className="icon-wrap red" style={{ width:36, height:36, borderRadius:10, marginBottom:10 }}><Shield size={18} /></div>
          <div style={{ fontSize:'1.75rem', fontWeight:800, fontFamily:'var(--font-heading)', color:'var(--text-primary)', lineHeight:1 }}>{totalAdmins}</div>
          <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:6, fontWeight:600 }}>{language === 'hi' ? 'प्रशासक' : 'Administrators'}</div>
        </div>
        <div className="stat-card blue">
          <div className="icon-wrap blue" style={{ width:36, height:36, borderRadius:10, marginBottom:10 }}><Activity size={18} /></div>
          <div style={{ fontSize:'1.75rem', fontWeight:800, fontFamily:'var(--font-heading)', color:'var(--text-primary)', lineHeight:1 }}>{totalVets}</div>
          <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:6, fontWeight:600 }}>{language === 'hi' ? 'पशु चिकित्सक' : 'Veterinarians'}</div>
        </div>
        <div className="stat-card orange">
          <div className="icon-wrap orange" style={{ width:36, height:36, borderRadius:10, marginBottom:10 }}><Users size={18} /></div>
          <div style={{ fontSize:'1.75rem', fontWeight:800, fontFamily:'var(--font-heading)', color:'var(--text-primary)', lineHeight:1 }}>{totalCaretakers}</div>
          <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:6, fontWeight:600 }}>{language === 'hi' ? 'गोसेवक / केयरटेकर' : 'Caretakers'}</div>
        </div>
        <div className="stat-card green">
          <div className="icon-wrap green" style={{ width:36, height:36, borderRadius:10, marginBottom:10 }}><CheckCircle2 size={18} /></div>
          <div style={{ fontSize:'1.75rem', fontWeight:800, fontFamily:'var(--font-heading)', color:'var(--text-primary)', lineHeight:1 }}>{totalVolunteers}</div>
          <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:6, fontWeight:600 }}>{language === 'hi' ? 'स्वयंसेवक' : 'Volunteers'}</div>
        </div>
      </div>

      {/* ── Filters Bar ────────────────────────────────────── */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              className="input"
              style={{ paddingLeft: '36px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['All', 'admin', 'veterinarian', 'caretaker', 'volunteer'].map((r) => (
              <button
                key={r}
                className={`btn ${roleFilter === r ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 14px', fontSize: '0.8125rem', textTransform: 'capitalize' }}
                onClick={() => setRoleFilter(r)}
              >
                {r === 'All' ? 'All Roles' : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Users Table ────────────────────────────────────── */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10 }} />)}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state" style={{ padding: '50px 24px' }}>
            <div className="empty-state-icon"><Users size={28} /></div>
            <h3>No staff members found</h3>
            <p>Try clearing filters or search terms.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Contact Info</th>
                  <th>System Role</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const roleStyle = ROLE_BADGES[u.role] || { label: u.role, bg: 'rgba(51,65,85,0.4)', color: '#94A3B8' };
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '0.875rem', color: 'white',
                          }}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{u.name}</strong>
                            {u.id === currentUser?.id && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600 }}>(You)</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8125rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                            <Mail size={13} style={{ color: 'var(--text-muted)' }} /> {u.email}
                          </div>
                          {u.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              <Phone size={13} /> {u.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u, e.target.value as StaffUser['role'])}
                          disabled={u.id === currentUser?.id}
                          className="input"
                          style={{
                            background: 'var(--bg-card-inner)',
                            color: roleStyle.color,
                            border: `1px solid ${roleStyle.color}55`,
                            borderRadius: '8px',
                            padding: '5px 10px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: u.id === currentUser?.id ? 'not-allowed' : 'pointer',
                            opacity: u.id === currentUser?.id ? 0.6 : 1,
                            minWidth: '140px',
                          }}
                        >
                          <option value="admin" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>🛡️ Administrator</option>
                          <option value="veterinarian" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>🩺 Veterinarian</option>
                          <option value="caretaker" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>🌿 Caretaker</option>
                          <option value="volunteer" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>🤝 Volunteer</option>
                        </select>
                      </td>
                      <td>
                        <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(u.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {u.id !== currentUser?.id && (
                          <button
                            className={`btn ${u.isActive ? 'btn-danger' : 'btn-secondary'}`}
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            onClick={() => handleToggleStatus(u)}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add Staff Modal ─────────────────────────────────── */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100, padding: '20px',
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '480px', width: '100%',
              padding: '28px', borderRadius: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(249,115,22,0.15)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserPlus size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem' }}>Register New Staff Member</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Create login credentials and assign system access level</p>
              </div>
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171', fontSize: '0.8125rem', marginBottom: '16px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="rajesh@egowshala.com"
                    className="input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    className="input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Temporary Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>System Role *</label>
                  <select
                    className="input"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as StaffUser['role'] })}
                  >
                    <option value="caretaker">Caretaker / Staff</option>
                    <option value="veterinarian">Veterinarian (Doctor)</option>
                    <option value="volunteer">Volunteer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Preferred Language</label>
                  <select
                    className="input"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  >
                    <option value="en">English (EN)</option>
                    <option value="hi">हिंदी (Hindi)</option>
                    <option value="gu">ગુજરાતી (Gujarati)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formSubmitting}>
                  {formSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
