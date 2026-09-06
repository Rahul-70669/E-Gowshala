import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, HeartPulse, CalendarCheck,
  HandCoins, Users, WalletCards, Sparkles, Menu, X,
  LogOut, Bell, Globe, UserCog, AlertTriangle,
  Syringe, CheckCircle2, Activity, ArrowRight,
  Calendar, Layers, Sun, Moon, Home, ChevronRight as BreadcrumbArrow,
  Factory, Map, Ambulance, MapPin
} from 'lucide-react';
import { CowIcon } from '../common/CowIcon';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { useThemeStore } from '../../store/themeStore';
import apiClient from '../../lib/apiClient';

interface AlertItem {
  id: string;
  type: 'vaccine' | 'task' | 'health' | 'donation';
  title: string;
  subtitle: string;
  time?: string;
  link: string;
  severity: 'high' | 'warning' | 'info';
}

const NAV_CONFIG = [
  { path: '/dashboard', icon: LayoutDashboard, key: 'nav.dashboard' as const, badge: null, color: '#F97316' },
  { path: '/dashboard/cows', icon: CowIcon, key: 'nav.cows' as const, badge: '50', color: '#38BDF8', isCustomIcon: true },
  { path: '/dashboard/health', icon: HeartPulse, key: 'nav.health' as const, badge: null, color: '#10B981' },
  { path: '/dashboard/operations', icon: CalendarCheck, key: 'nav.operations' as const, badge: null, color: '#8B5CF6' },
  { path: '/dashboard/gobar-dhan', icon: Factory, key: 'nav.gobarDhan' as const, badge: 'Govt', color: '#10B981' },
  { path: '/dashboard/donations', icon: HandCoins, key: 'nav.donations' as const, badge: null, color: '#EC4899' },
  { path: '/dashboard/visitors', icon: Users, key: 'nav.visitors' as const, badge: null, color: '#F59E0B' },
  { path: '/dashboard/finance', icon: WalletCards, key: 'nav.finance' as const, badge: null, color: '#06B6D4' },
  { path: '/dashboard/ai', icon: Sparkles, key: 'nav.ai' as const, badge: 'AI', color: '#A855F7' },
  { path: '/dashboard/rescue-map', icon: Ambulance, key: 'nav.rescueMap' as const, badge: 'LIVE', color: '#EF4444' },
  { path: '/dashboard/national-map', icon: Map, key: 'nav.nationalMap' as const, badge: 'NEW', color: '#7C3AED' },
];

const ROLE_ALLOWED_PATHS: Record<string, string[]> = {
  admin: [
    '/dashboard',
    '/dashboard/cows',
    '/dashboard/health',
    '/dashboard/operations',
    '/dashboard/gobar-dhan',
    '/dashboard/donations',
    '/dashboard/visitors',
    '/dashboard/finance',
    '/dashboard/ai',
    '/dashboard/rescue-map',
    '/dashboard/users',
    '/dashboard/national-map',
  ],
  veterinarian: [
    '/dashboard',
    '/dashboard/cows',
    '/dashboard/health',
    '/dashboard/ai',
    '/dashboard/operations',
    '/dashboard/gobar-dhan',
    '/dashboard/rescue-map',
    '/dashboard/national-map',
  ],
  caretaker: [
    '/dashboard',
    '/dashboard/cows',
    '/dashboard/operations',
    '/dashboard/gobar-dhan',
    '/dashboard/visitors',
  ],
  donor: [
    '/dashboard',
    '/dashboard/donations',
    '/dashboard/cows',
  ],
  volunteer: [
    '/dashboard',
    '/dashboard/cows',
    '/dashboard/operations',
    '/dashboard/gobar-dhan',
    '/dashboard/visitors',
  ],
  government: [
    '/dashboard',
    '/dashboard/cows',
    '/dashboard/health',
    '/dashboard/gobar-dhan',
    '/dashboard/finance',
    '/dashboard/national-map',
  ],
};

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { language, toggleLanguage, t } = useLanguageStore();
  const { theme, toggleTheme } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  // Set initial data-theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Role-based navigation items
  const userRole = user?.role || 'volunteer';
  const allowedPaths = ROLE_ALLOWED_PATHS[userRole] || ROLE_ALLOWED_PATHS['volunteer'];

  const baseItems = user?.role === 'admin'
    ? [...NAV_CONFIG, { path: '/dashboard/users', icon: UserCog, key: 'nav.users' as const, badge: 'Admin', color: '#EF4444' }]
    : NAV_CONFIG;

  const allNavItems = baseItems.filter((item) => allowedPaths.includes(item.path));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const lastAlertsFetch = useRef<number>(0);

  // Fetch real-time alerts (throttled to at most once per 60 seconds or on mount/language change)
  useEffect(() => {
    const now = Date.now();
    if (now - lastAlertsFetch.current < 60000 && alerts.length > 0) {
      return;
    }

    const fetchAlerts = async () => {
      lastAlertsFetch.current = Date.now();
      setLoadingAlerts(true);
      try {
        const [vaccRes, cowsRes, tasksRes, invRes, sosRes] = await Promise.all([
          apiClient.get('/health/vaccinations/due').catch(() => ({ data: { data: [] } })),
          apiClient.get('/cows?status=sick&limit=5').catch(() => ({ data: { data: { cows: [] } } })),
          apiClient.get('/operations/tasks').catch(() => ({ data: { data: [] } })),
          apiClient.get('/operations/inventory?lowStock=true').catch(() => ({ data: { data: [] } })),
          apiClient.get('/health/sos/active').catch(() => ({ data: { data: [] } })),
        ]);

        const items: AlertItem[] = [];

        // 0. Active Veterinary SOS Alerts (Top Priority)
        const activeSos = sosRes.data?.data || [];
        activeSos.forEach((sos: any) => {
          items.push({
            id: `sos-${sos.id || sos._id}`,
            type: 'health',
            title: `🚨 ${sos.title || 'VETERINARY EMERGENCY SOS'}`,
            subtitle: `${sos.cowName ? `Cattle: ${sos.cowName} (${sos.cowTagId}) • ` : ''}${sos.shedName ? `Location: ${sos.shedName} • ` : ''}Reported by ${sos.triggeredBy || 'Admin'}`,
            link: '/dashboard/health',
            severity: 'high',
          });
        });

        // 1. Low Fodder / Inventory Alert
        const lowStockItems = invRes.data?.data || [];
        lowStockItems.slice(0, 3).forEach((item: any) => {
          items.push({
            id: `inv-${item._id}`,
            type: 'health',
            title: `Low Stock: ${item.name}`,
            subtitle: `Stock: ${item.quantity} ${item.unit} remaining (Threshold: ${item.minThreshold})`,
            link: '/dashboard/operations',
            severity: 'warning',
          });
        });


        // 2. Due/overdue vaccinations
        const dueVaccs = vaccRes.data?.data || [];
        dueVaccs.slice(0, 4).forEach((v: any) => {
          items.push({
            id: `vacc-${v._id}`,
            type: 'vaccine',
            title: `Vaccination Due: ${v.vaccineName || v.disease || 'Scheduled Dose'}`,
            subtitle: `Cattle: ${v.cowId?.name || 'Cow'} (${v.cowId?.tagId || 'Tag'}) • Due ${v.nextDueDate ? new Date(v.nextDueDate).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN') : 'Soon'}`,
            link: '/dashboard/health',
            severity: 'warning',
          });
        });

        // 3. Sick cattle alerts
        const sickCows = cowsRes.data?.data?.cows || [];
        sickCows.forEach((c: any) => {
          items.push({
            id: `sick-${c._id}`,
            type: 'health',
            title: `Critical Alert: ${c.name} (${c.tagId})`,
            subtitle: `Status: Sick / Under veterinary observation (${c.breed})`,
            link: `/dashboard/cows/${c._id}`,
            severity: 'high',
          });
        });

        // 4. Pending/Overdue Tasks
        const allTasks = tasksRes.data?.data || [];
        const pendingTasks = allTasks.filter((t: any) => t.status === 'pending' || t.status === 'in_progress');
        pendingTasks.slice(0, 3).forEach((t: any) => {
          items.push({
            id: `task-${t._id}`,
            type: 'task',
            title: `Task Pending: ${t.title}`,
            subtitle: `Priority: ${t.priority.toUpperCase()} • Assigned: ${t.assignedTo?.name || 'Staff Member'}`,
            link: '/dashboard/operations',
            severity: t.priority === 'urgent' || t.priority === 'high' ? 'high' : 'info',
          });
        });

        setAlerts(items);
      } catch (err) {
        console.error('Failed to load alerts:', err);
      } finally {
        setLoadingAlerts(false);
      }
    };

    fetchAlerts();

    // Auto refresh alerts every 90 seconds
    const interval = setInterval(fetchAlerts, 90000);
    return () => clearInterval(interval);
  }, [location.pathname, language]);

  return (
    <div className="layout">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Sidebar ────────────────────────────────────────── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Brand Logo Header */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon" style={{ padding: '4px' }}>
            <CowIcon size={30} variant="white" />
          </div>
          <div>
            <h1 className="gradient-text" style={{ fontSize: '1.25rem', letterSpacing: '-0.03em' }}>
              E-Gowshala
            </h1>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
              {language === 'hi' ? 'स्मार्ट गौशाला प्रबंधन' : 'SMART LIVESTOCK AI'}
            </p>
          </div>
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(false)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 14px 8px' }}>
            {t('nav.mainMenu')}
          </div>
          {allNavItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            const labelText = t(item.key);
            const IconComponent = item.icon;
            return (
              <button
                key={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.path)}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: isActive ? `${item.color}20` : 'var(--bg-hover)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isActive ? item.color : 'var(--text-muted)',
                  transition: 'all 0.2s ease',
                  border: isActive ? `1px solid ${item.color}40` : '1px solid var(--border-color)',
                  flexShrink: 0,
                }}>
                  {item.path === '/dashboard/cows' ? (
                    <CowIcon size={19} variant={isActive ? 'transparent' : 'white'} />
                  ) : (
                    <IconComponent size={17} />
                  )}
                </div>
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {labelText}
                </span>
                {item.badge && (
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 800, padding: '2px 7px', borderRadius: '9999px',
                    background: item.badge === 'AI' ? 'linear-gradient(135deg, #A855F7, #EC4899)' : item.badge === 'Admin' ? 'rgba(239,68,68,0.2)' : 'rgba(148,163,184,0.15)',
                    color: item.badge === 'AI' ? '#FFFFFF' : item.badge === 'Admin' ? '#F87171' : 'var(--text-muted)',
                    border: item.badge === 'Admin' ? '1px solid rgba(239,68,68,0.3)' : 'none',
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card */}
        <div style={{
          marginTop: '16px', padding: '12px 14px', borderRadius: '12px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #F97316 0%, #8B5CF6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '0.9375rem', color: 'white',
              boxShadow: '0 2px 10px rgba(249, 115, 22, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              flexShrink: 0,
            }}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'Authorized User'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'capitalize', fontWeight: 600 }}>
                  {user?.role || 'Volunteer'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title={t('nav.logout')}
              style={{
                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#F87171', borderRadius: '8px', padding: '6px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Shell ─────────────────────────────── */}
      <div className="main-content">
        {/* Header Bar */}
        <header className="header">
          <div className="header-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px' }}
            >
              <Menu size={22} />
            </button>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
              <div className="header-breadcrumb-path" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                <Home size={11} />
                <span>E-Gowshala</span>
                <BreadcrumbArrow size={10} />
                <span style={{ color: 'var(--color-primary)' }}>
                  {t(allNavItems.find((i) => i.path === location.pathname || (i.path !== '/dashboard' && location.pathname.startsWith(i.path)))?.key || 'nav.dashboard')}
                </span>
              </div>
              <h2 className="header-title-text" style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                {t(allNavItems.find((i) => i.path === location.pathname || (i.path !== '/dashboard' && location.pathname.startsWith(i.path)))?.key || 'nav.dashboard')}
              </h2>
            </div>
          </div>

          <div className="header-right">
            {/* Live Beacon */}
            <div className="header-live-badge" style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '0.72rem', fontWeight: 700, color: '#059669',
              padding: '6px 10px', borderRadius: '9999px',
              background: 'rgba(5, 150, 105, 0.10)',
              border: '1px solid rgba(5, 150, 105, 0.22)',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'pulse 2s infinite', flexShrink: 0 }} />
              <span className="header-live-text">{t('nav.liveMonitoring', 'Live')}</span>
            </div>

            {/* Quick SOS Trigger Button in Header for Admin / Vet */}
            {(userRole === 'admin' || userRole === 'veterinarian') && (
              <button
                id="header-sos-btn"
                type="button"
                className="btn"
                onClick={() => navigate('/dashboard/health?sos=true')}
                style={{
                  background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(239,68,68,0.35)',
                  whiteSpace: 'nowrap',
                }}
                title="Trigger Emergency SOS"
              >
                <span>🚨</span>
                <span>SOS</span>
              </button>
            )}

            {/* Notification Bell */}
            <div className="notif-bell">
              <button
                className="btn btn-secondary"
                onClick={() => setNotifOpen(true)}
                style={{ padding: '7px 10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title={t('nav.alerts', 'Alerts')}
              >
                <Bell size={16} style={{ color: alerts.length > 0 ? '#F97316' : 'var(--text-secondary)' }} />
              </button>
              {alerts.length > 0 && (
                <span className="notif-count">{alerts.length > 9 ? '9+' : alerts.length}</span>
              )}
            </div>


            {/* Theme Toggle */}
            <button
              className="btn btn-secondary"
              onClick={toggleTheme}
              style={{ padding: '7px 10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark'
                ? <Sun size={16} style={{ color: '#FBBF24' }} />
                : <Moon size={16} style={{ color: '#6366F1' }} />}
            </button>

            {/* Language Toggle */}
            <button
              className="btn btn-secondary"
              onClick={toggleLanguage}
              style={{
                padding: '6px 10px', borderRadius: '10px', fontSize: '0.78rem',
                display: 'flex', alignItems: 'center', gap: '4px',
                border: language === 'hi' ? '1px solid rgba(249,115,22,0.45)' : undefined,
                background: language === 'hi' ? 'rgba(249,115,22,0.10)' : undefined,
              }}
              title="Switch Language / भाषा बदलें"
            >
              <Globe size={13} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontWeight: 700, color: language === 'hi' ? 'var(--color-primary)' : 'var(--text-primary)' }}>
                {language === 'en' ? 'EN' : 'HI'}
              </span>
            </button>

            {/* Date Pill */}
            <div className="header-date-pill" style={{
              fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)',
              padding: '7px 12px', borderRadius: '10px',
              background: 'var(--bg-card-inner)', border: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <Calendar size={13} style={{ color: 'var(--color-primary)' }} />
              {new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>

            {/* User Avatar Pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '4px 10px 4px 4px', borderRadius: '9999px',
              background: 'var(--bg-card-inner)', border: '1px solid var(--border-color)',
              cursor: 'pointer', flexShrink: 0,
            }}
              onClick={handleLogout}
              title="Logout"
            >
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #F97316, #8B5CF6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.8rem', color: 'white', flexShrink: 0,
              }}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="header-user-info" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                {user?.name?.split(' ')[0] || 'User'}
              </span>
              <LogOut size={13} className="header-user-info" style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>
        </header>

        {/* Main View Shell */}
        <main className="page-content page-enter">
          <Outlet />
        </main>
      </div>

      {/* ── Slide-Over Notification Drawer ───────────────────── */}
      {notifOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)',
            zIndex: 100, display: 'flex', justifyContent: 'flex-end',
            backdropFilter: 'blur(8px)',
          }}
          onClick={() => setNotifOpen(false)}
        >
          <div
            style={{
              width: '100%', maxWidth: '420px', height: '100%',
              background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-color)',
              padding: '24px', display: 'flex', flexDirection: 'column',
              boxShadow: 'var(--shadow-lg)',
              animation: 'pageEnter 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(249, 115, 22, 0.15)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>{t('nav.alerts')}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{alerts.length} {language === 'hi' ? 'अलर्ट ध्यान देने योग्य हैं' : 'action items require attention'}</p>
                </div>
              </div>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
                onClick={() => setNotifOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loadingAlerts ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="spinner" style={{ width: '28px', height: '28px', margin: '0 auto 8px' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{t('common.loading')}</p>
                </div>
              ) : alerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={44} style={{ color: '#10B981', margin: '0 auto 12px' }} />
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '4px', fontSize: '1.125rem' }}>
                    {language === 'hi' ? 'सब कुछ ठीक है' : 'All Clear'}
                  </h4>
                  <p style={{ fontSize: '0.8125rem' }}>
                    {language === 'hi' ? 'कोई अतिदेय टीका या बीमार गोवंश नहीं है।' : 'No overdue vaccines, sick cattle, or critical tasks pending.'}
                  </p>
                </div>
              ) : (
                alerts.map((a) => {
                  const borderCol = a.severity === 'high' ? '#EF4444' : a.severity === 'warning' ? '#F97316' : '#38BDF8';
                  const bgTint = a.severity === 'high' ? 'rgba(239, 68, 68, 0.08)' : a.severity === 'warning' ? 'rgba(249, 115, 22, 0.08)' : 'rgba(14, 165, 233, 0.08)';
                  return (
                    <div
                      key={a.id}
                      className="card"
                      style={{
                        padding: '14px', borderLeft: `4px solid ${borderCol}`,
                        background: bgTint, cursor: 'pointer',
                      }}
                      onClick={() => {
                        setNotifOpen(false);
                        navigate(a.link);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        {a.type === 'vaccine' && <Syringe size={18} style={{ color: '#F97316', flexShrink: 0, marginTop: '2px' }} />}
                        {a.type === 'health' && <AlertTriangle size={18} style={{ color: '#EF4444', flexShrink: 0, marginTop: '2px' }} />}
                        {a.type === 'task' && <CalendarCheck size={18} style={{ color: '#38BDF8', flexShrink: 0, marginTop: '2px' }} />}

                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>
                            {a.title}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {a.subtitle}
                          </p>
                        </div>

                        <ArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '4px' }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Button */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '12px' }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => {
                  setNotifOpen(false);
                  navigate('/dashboard/health');
                }}
              >
                {t('nav.health')} →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
