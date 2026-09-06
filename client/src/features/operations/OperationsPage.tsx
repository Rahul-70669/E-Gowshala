import { useState, useEffect } from 'react';
import {
  Plus, CheckCircle, Clock, AlertTriangle, Utensils,
  ClipboardList, Users, Package, AlertCircle, RefreshCw,
  Search, LogIn, LogOut, UserCheck, Calendar
} from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';

const PRIORITY_COLORS: Record<string, string> = { low: '#22C55E', medium: '#EAB308', high: '#F97316', urgent: '#EF4444' };
const PRIORITY_LABELS: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

const INVENTORY_CATEGORIES = [
  { value: 'all', label: 'All Items' },
  { value: 'green-fodder', label: 'Green Fodder (हरा चारा)' },
  { value: 'dry-fodder', label: 'Dry Fodder (भूसा)' },
  { value: 'concentrate', label: 'Concentrate (खल/चूरी)' },
  { value: 'supplement', label: 'Supplements (सप्लीमेंट्स)' },
  { value: 'medicine', label: 'Medicines (दवाइयां)' },
];

const OperationsPage = () => {
  const { user } = useAuthStore();
  const { language, t } = useLanguageStore();
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState<'tasks' | 'feed' | 'inventory' | 'attendance'>('tasks');
  const [tasks, setTasks] = useState<any[]>([]);
  const [feedLogs, setFeedLogs] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [inventoryStats, setInventoryStats] = useState<any>(null);
  const [inventoryFilter, setInventoryFilter] = useState('all');
  const [inventorySearch, setInventorySearch] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Attendance state
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [attendanceDateFilter, setAttendanceDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [checkInLoading, setCheckInLoading] = useState(false);

  // Task update loading map
  const [taskUpdating, setTaskUpdating] = useState<Record<string, boolean>>({});
  const [taskFeedback, setTaskFeedback] = useState<Record<string, string>>({});

  // Modals
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [showAddInventory, setShowAddInventory] = useState(false);
  const [restockItem, setRestockItem] = useState<any>(null);
  const [restockAmount, setRestockAmount] = useState('');

  const [users, setUsers] = useState<any[]>([]);
  const [sheds, setSheds] = useState<any[]>([]);

  const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: '', priority: 'medium', category: 'other', dueDate: '' });
  const [newFeed, setNewFeed] = useState({ shedId: '', feedType: 'green-fodder', quantityKg: '', waterIntakeLiters: '', costIncurred: '', date: new Date().toISOString().split('T')[0] });
  const [newInventory, setNewInventory] = useState({
    name: '', nameHi: '', category: 'green-fodder', quantity: '', unit: 'kg', minThreshold: '', costPerUnit: '', supplier: '', location: 'Main Store'
  });

  const fetchInventory = async () => {
    try {
      const [itemsRes, statsRes] = await Promise.all([
        apiClient.get('/operations/inventory'),
        apiClient.get('/operations/inventory/stats'),
      ]);
      setInventoryItems(itemsRes.data?.data || []);
      setInventoryStats(statsRes.data?.data);
    } catch (err) { console.error('Error fetching inventory:', err); }
  };

  const fetchAttendance = async (date?: string) => {
    setAttendanceLoading(true);
    try {
      const d = date || attendanceDateFilter;
      const endpoint = isAdmin ? `/operations/attendance?date=${d}` : `/operations/attendance/my?date=${d}`;
      const res = await apiClient.get(endpoint).catch(() => apiClient.get('/operations/attendance'));
      const records = res.data?.data || [];
      setAttendanceRecords(Array.isArray(records) ? records : records.records || []);

      // Check if current user already checked in today
      const today = new Date().toISOString().split('T')[0];
      if (d === today) {
        const myRecord = (Array.isArray(records) ? records : records.records || [])
          .find((r: any) => r.userId === user?.id || r.staffId === user?.id || r.userId?._id === user?.id);
        setCheckedInToday(!!myRecord && !myRecord.checkOutTime);
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setAttendanceRecords([]);
    }
    setAttendanceLoading(false);
  };

  useEffect(() => {
    Promise.all([
      apiClient.get('/operations/tasks').catch(() => ({ data: { data: [] } })),
      apiClient.get('/operations/feed?limit=20').catch(() => ({ data: { data: { logs: [] } } })),
      apiClient.get('/operations/stats').catch(() => ({ data: { data: null } })),
      // Use /auth/users for admin, fall back to empty for non-admin roles
      apiClient.get('/auth/users').catch(() => ({ data: { data: [] } })),
      apiClient.get('/cows/sheds/all').catch(() => ({ data: { data: [] } })),
      apiClient.get('/operations/inventory').catch(() => ({ data: { data: [] } })),
      apiClient.get('/operations/inventory/stats').catch(() => ({ data: { data: null } })),
    ]).then(([tasksRes, feedRes, statsRes, usersRes, shedsRes, invRes, invStatsRes]) => {
      setTasks(tasksRes.data?.data || []);
      setFeedLogs(feedRes.data?.data?.logs || []);
      setStats(statsRes.data?.data);

      const fetchedUsers = usersRes.data?.data || [];
      // If users list is empty (non-admin), inject current user as fallback
      if (fetchedUsers.length === 0 && user) {
        setUsers([{ id: user.id, _id: user.id, name: user.name, role: user.role }]);
      } else {
        setUsers(fetchedUsers);
      }

      setSheds(shedsRes.data?.data || []);
      setInventoryItems(invRes.data?.data || []);
      setInventoryStats(invStatsRes.data?.data);
      setLoading(false);
    });
  }, []);

  // Fetch attendance when tab changes to attendance
  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendance();
    }
  }, [activeTab]);

  // Issue 9 fix: Task status update with loading state + feedback
  const updateTaskStatus = async (taskId: string, status: string) => {
    setTaskUpdating(prev => ({ ...prev, [taskId]: true }));
    try {
      await apiClient.put(`/operations/tasks/${taskId}`, { status });
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status } : t));
      setTaskFeedback(prev => ({ ...prev, [taskId]: status === 'in-progress' ? '▶ Started!' : '✓ Done!' }));
      setTimeout(() => setTaskFeedback(prev => { const n = { ...prev }; delete n[taskId]; return n; }), 2000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Update failed. Check permissions.';
      setTaskFeedback(prev => ({ ...prev, [taskId]: '✗ ' + msg }));
      setTimeout(() => setTaskFeedback(prev => { const n = { ...prev }; delete n[taskId]; return n; }), 3000);
    }
    setTaskUpdating(prev => ({ ...prev, [taskId]: false }));
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/operations/tasks', newTask);
      setTasks([res.data.data, ...tasks]);
      setShowAddTask(false);
      setNewTask({ title: '', description: '', assignedTo: '', priority: 'medium', category: 'other', dueDate: '' });
    } catch (err) { console.error(err); }
  };

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/operations/feed', {
        ...newFeed,
        quantityKg: parseFloat(newFeed.quantityKg),
        waterIntakeLiters: newFeed.waterIntakeLiters ? parseFloat(newFeed.waterIntakeLiters) : undefined,
        costIncurred: newFeed.costIncurred ? parseFloat(newFeed.costIncurred) : undefined,
      });
      setShowAddFeed(false);
      const res = await apiClient.get('/operations/feed?limit=20');
      setFeedLogs(res.data?.data?.logs || []);
      fetchInventory();
    } catch (err) { console.error(err); }
  };

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/operations/inventory', {
        ...newInventory,
        quantity: parseFloat(newInventory.quantity),
        minThreshold: parseFloat(newInventory.minThreshold),
        costPerUnit: newInventory.costPerUnit ? parseFloat(newInventory.costPerUnit) : undefined,
      });
      setShowAddInventory(false);
      setNewInventory({ name: '', nameHi: '', category: 'green-fodder', quantity: '', unit: 'kg', minThreshold: '', costPerUnit: '', supplier: '', location: 'Main Store' });
      fetchInventory();
    } catch (err) { console.error(err); }
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;
    const addQty = parseFloat(restockAmount);
    if (isNaN(addQty)) return;
    try {
      const newTotal = Math.max(0, (restockItem.quantity || 0) + addQty);
      await apiClient.put(`/operations/inventory/${restockItem._id}`, { quantity: newTotal });
      setRestockItem(null);
      setRestockAmount('');
      fetchInventory();
    } catch (err) { console.error(err); }
  };

  // Issue 10 fix: Check-in creates real record, then refreshes table
  const handleCheckIn = async () => {
    setCheckInLoading(true);
    try {
      await apiClient.post('/operations/attendance/check-in');
      setCheckedInToday(true);
      await fetchAttendance();
    } catch (err: any) {
      alert(err.response?.data?.message || (language === 'hi' ? 'चेक-इन विफल' : 'Check-in failed'));
    }
    setCheckInLoading(false);
  };

  const handleCheckOut = async () => {
    setCheckInLoading(true);
    try {
      await apiClient.post('/operations/attendance/check-out').catch(() =>
        apiClient.put('/operations/attendance/check-out')
      );
      setCheckedInToday(false);
      await fetchAttendance();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Check-out failed');
    }
    setCheckInLoading(false);
  };

  const tasksByStatus = {
    pending: tasks.filter(t => t.status === 'pending'),
    'in-progress': tasks.filter(t => t.status === 'in-progress'),
    completed: tasks.filter(t => t.status === 'completed'),
  };

  const getAssigneeName = (task: any): string => {
    if (!task.assignedTo) return '—';
    if (typeof task.assignedTo === 'object' && task.assignedTo.name) return task.assignedTo.name;
    const found = users.find(u => u.id === task.assignedTo || u._id === task.assignedTo);
    return found?.name || '—';
  };

  return (
    <div className="page-enter">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">{t('ops.title', 'Daily Shelter Operations')}</h1>
          <p className="page-header-sub">{t('ops.subtitle', 'Feed distribution, inventory tracking, task assignment & staff attendance')}</p>
        </div>
        <div className="page-header-actions">
          {activeTab === 'attendance' ? (
            checkedInToday ? (
              <button className="btn btn-secondary" onClick={handleCheckOut} disabled={checkInLoading}
                style={{ color: '#F97316', borderColor: 'rgba(249,115,22,0.35)' }}>
                <LogOut size={16} /> {checkInLoading ? 'Please wait...' : (language === 'hi' ? 'प्रस्थान दर्ज करें' : 'Check Out')}
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleCheckIn} disabled={checkInLoading}>
                <LogIn size={16} /> {checkInLoading ? 'Please wait...' : (language === 'hi' ? 'उपस्थिति दर्ज करें' : 'Check In')}
              </button>
            )
          ) : (
            <button className="btn btn-secondary" onClick={handleCheckIn}
              style={{ fontSize: '0.8rem' }}>
              <Clock size={16} /> {language === 'hi' ? 'उपस्थिति दर्ज करें' : 'Check In'}
            </button>
          )}
          {activeTab === 'inventory' ? (
            <button className="btn btn-primary" onClick={() => setShowAddInventory(true)}>
              <Plus size={18} /> {t('ops.addItem', 'Add Item')}
            </button>
          ) : activeTab === 'attendance' ? null : (
            <button className="btn btn-primary" onClick={() => activeTab === 'feed' ? setShowAddFeed(true) : setShowAddTask(true)}>
              <Plus size={18} /> {activeTab === 'feed' ? t('ops.logFeed', 'Log Feed') : t('ops.newTask', 'New Task')}
            </button>
          )}
        </div>
      </div>

      {/* Stats Strip */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          <div className="stat-card orange">
            <div className="icon-wrap orange" style={{ width:36, height:36, borderRadius:10, marginBottom:10 }}><ClipboardList size={18} /></div>
            <div style={{ fontSize:'1.75rem', fontWeight:800, fontFamily:'var(--font-heading)', color:'var(--text-primary)', lineHeight:1 }}>{stats.pendingTasks}</div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:6, fontWeight:600 }}>{language === 'hi' ? 'लंबित कार्य' : 'Pending Tasks'}</div>
          </div>
          <div className="stat-card red">
            <div className="icon-wrap red" style={{ width:36, height:36, borderRadius:10, marginBottom:10 }}><AlertTriangle size={18} /></div>
            <div style={{ fontSize:'1.75rem', fontWeight:800, fontFamily:'var(--font-heading)', color: stats.overdueTasks > 0 ? '#EF4444' : 'var(--text-primary)', lineHeight:1 }}>{stats.overdueTasks}</div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:6, fontWeight:600 }}>{language === 'hi' ? 'अतिदेय कार्य' : 'Overdue Tasks'}</div>
          </div>
          <div className="stat-card green">
            <div className="icon-wrap green" style={{ width:36, height:36, borderRadius:10, marginBottom:10 }}><Utensils size={18} /></div>
            <div style={{ fontSize:'1.75rem', fontWeight:800, fontFamily:'var(--font-heading)', color:'var(--text-primary)', lineHeight:1 }}>{stats.todayFeedLogs}</div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:6, fontWeight:600 }}>{language === 'hi' ? 'आज का चारा रिकॉर्ड' : "Today's Feed Logs"}</div>
          </div>
          <div className="stat-card blue">
            <div className="icon-wrap blue" style={{ width:36, height:36, borderRadius:10, marginBottom:10 }}><Users size={18} /></div>
            <div style={{ fontSize:'1.75rem', fontWeight:800, fontFamily:'var(--font-heading)', color:'var(--text-primary)', lineHeight:1 }}>{stats.todayAttendance}</div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:6, fontWeight:600 }}>{language === 'hi' ? 'उपस्थित कर्मचारी' : 'Present Today'}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', overflowX: 'auto' }}>
        {([
          ['tasks', language === 'hi' ? 'दैनिक कार्य' : 'Daily Tasks', ClipboardList],
          ['inventory', language === 'hi' ? 'भंडार' : 'Inventory & Stock', Package],
          ['feed', language === 'hi' ? 'चारा लॉग' : 'Feed Logs', Utensils],
          ['attendance', language === 'hi' ? 'उपस्थिति' : 'Staff Attendance', Users]
        ] as const).map(([key, label, Icon]) => (
          <button key={key} className={`btn ${activeTab === key ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '8px 8px 0 0', fontSize: '0.8125rem', whiteSpace: 'nowrap' }} onClick={() => setActiveTab(key as any)}>
            <Icon size={16} /> {label}
            {key === 'inventory' && inventoryStats?.lowStockCount > 0 && (
              <span className="badge badge-danger" style={{ marginLeft: 4, padding: '1px 6px', fontSize: '0.68rem' }}>
                {inventoryStats.lowStockCount} {language === 'hi' ? 'कम' : 'Low'}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 14 }} />)}
        </div>
      ) : activeTab === 'tasks' ? (
        /* Kanban Board */
        <div>
          {/* Issue 13: Admin summary strip */}
          {isAdmin && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {(['pending', 'in-progress', 'completed'] as const).map(s => (
                <span key={s} className={`badge ${s === 'pending' ? 'badge-warning' : s === 'in-progress' ? 'badge-info' : 'badge-success'}`}
                  style={{ fontSize: '0.8rem', padding: '6px 12px', fontWeight: 700 }}>
                  {s === 'pending' ? (language === 'hi' ? 'लंबित' : 'Pending') : s === 'in-progress' ? (language === 'hi' ? 'प्रगति में' : 'In Progress') : (language === 'hi' ? 'पूर्ण' : 'Completed')}: {tasksByStatus[s].length}
                </span>
              ))}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', minHeight: '400px' }}>
            {(['pending', 'in-progress', 'completed'] as const).map((status) => (
              <div key={status} style={{ background: 'var(--bg-card-inner)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '0.875rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {status === 'pending' && <Clock size={16} style={{ color: 'var(--color-warning)' }} />}
                  {status === 'in-progress' && <AlertTriangle size={16} style={{ color: 'var(--color-primary)' }} />}
                  {status === 'completed' && <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />}
                  {status === 'pending' ? (language === 'hi' ? 'लंबित' : 'Pending') : status === 'in-progress' ? (language === 'hi' ? 'प्रगति में' : 'In Progress') : (language === 'hi' ? 'पूर्ण' : 'Completed')}
                  <span className="badge badge-info" style={{ marginLeft: 'auto' }}>{tasksByStatus[status].length}</span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {tasksByStatus[status].length === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {language === 'hi' ? 'कोई कार्य नहीं' : 'No tasks'}
                    </div>
                  )}
                  {tasksByStatus[status].map((task: any) => (
                    <div key={task._id} className="card" style={{ padding: '12px', borderLeft: `3px solid ${PRIORITY_COLORS[task.priority] || '#999'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <h4 style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{task.title}</h4>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: PRIORITY_COLORS[task.priority], background: PRIORITY_COLORS[task.priority] + '22', padding: '2px 6px', borderRadius: 4, flexShrink: 0, marginLeft: 4 }}>
                          {PRIORITY_LABELS[task.priority] || task.priority}
                        </span>
                      </div>
                      {task.description && <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginBottom: '6px' }}>{task.description}</p>}

                      {/* Issue 13: Show assigned-to name on each task card */}
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <UserCheck size={11} />
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {language === 'hi' ? 'सौंपा गया: ' : 'Assigned: '}{getAssigneeName(task)}
                        </span>
                        {task.dueDate && (
                          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Calendar size={10} /> {new Date(task.dueDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}
                          </span>
                        )}
                      </div>

                      {/* Issue 9: Task action buttons with loading + feedback */}
                      <div style={{ display: 'flex', gap: '4px', fontSize: '0.7rem' }}>
                        {status !== 'completed' && (
                          <button
                            className={`btn ${taskFeedback[task._id]?.startsWith('✗') ? 'btn-secondary' : 'btn-primary'}`}
                            style={{
                              padding: '4px 10px',
                              fontSize: '0.72rem',
                              opacity: taskUpdating[task._id] ? 0.7 : 1,
                              background: taskFeedback[task._id]?.startsWith('✗') ? 'rgba(239,68,68,0.15)' : undefined,
                              color: taskFeedback[task._id]?.startsWith('✗') ? '#EF4444' : undefined,
                              borderColor: taskFeedback[task._id]?.startsWith('✗') ? 'rgba(239,68,68,0.3)' : undefined,
                            }}
                            disabled={taskUpdating[task._id]}
                            onClick={() => updateTaskStatus(task._id, status === 'pending' ? 'in-progress' : 'completed')}
                          >
                            {taskUpdating[task._id]
                              ? '⏳'
                              : taskFeedback[task._id]
                              ? taskFeedback[task._id]
                              : status === 'pending'
                              ? `▶ ${language === 'hi' ? 'शुरू करें' : 'Start'}`
                              : `✓ ${language === 'hi' ? 'पूर्ण' : 'Done'}`
                            }
                          </button>
                        )}
                        {status === 'completed' && (
                          <span style={{ fontSize: '0.7rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <CheckCircle size={11} /> {language === 'hi' ? 'पूर्ण हो गया' : 'Completed'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'inventory' ? (
        /* Inventory / Fodder Stock View */
        <div>
          {/* Inventory Top Metric Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <div className="stat-card blue">
              <div className="icon-wrap blue" style={{ width:34, height:34, borderRadius:10, marginBottom:8 }}><Package size={16} /></div>
              <div style={{ fontSize:'1.4rem', fontWeight:800, color:'var(--text-primary)' }}>{inventoryStats?.totalItems || inventoryItems.length}</div>
              <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Tracked Stock Items</div>
            </div>
            <div className="stat-card red">
              <div className="icon-wrap red" style={{ width:34, height:34, borderRadius:10, marginBottom:8 }}><AlertCircle size={16} /></div>
              <div style={{ fontSize:'1.4rem', fontWeight:800, color: (inventoryStats?.lowStockCount || 0) > 0 ? '#EF4444' : '#10B981' }}>
                {inventoryStats?.lowStockCount || 0}
              </div>
              <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Low Stock Warnings</div>
            </div>
            <div className="stat-card green">
              <div className="icon-wrap green" style={{ width:34, height:34, borderRadius:10, marginBottom:8 }}><CheckCircle size={16} /></div>
              <div style={{ fontSize:'1.4rem', fontWeight:800, color:'#10B981' }}>
                ₹{((inventoryStats?.totalValuation || 48000)/1000).toFixed(0)}K
              </div>
              <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Total Stock Valuation</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="card" style={{ padding: '14px 18px', marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
              {INVENTORY_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  className={`btn ${inventoryFilter === cat.value ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  onClick={() => setInventoryFilter(cat.value)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div style={{ position: 'relative', minWidth: '180px' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="input"
                placeholder="Search stock..."
                value={inventorySearch}
                onChange={e => setInventorySearch(e.target.value)}
                style={{ paddingLeft: '32px', fontSize: '0.8rem', padding: '6px 10px 6px 30px' }}
              />
            </div>
          </div>

          {/* Inventory Grid Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {inventoryItems
              .filter(item => inventoryFilter === 'all' || item.category === inventoryFilter)
              .filter(item => !inventorySearch || item.name.toLowerCase().includes(inventorySearch.toLowerCase()) || (item.nameHi && item.nameHi.includes(inventorySearch)))
              .map(item => {
                const isLow = item.quantity <= item.minThreshold;
                const pct = Math.min(100, Math.round((item.quantity / Math.max(item.minThreshold * 3, 1)) * 100));

                return (
                  <div key={item._id} className="card" style={{ padding: '18px', borderTop: `3px solid ${isLow ? '#EF4444' : '#10B981'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{item.name}</h4>
                        {item.nameHi && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{item.nameHi}</div>}
                      </div>
                      <span className={`badge ${isLow ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.7rem' }}>
                        {isLow ? '⚠️ Low Stock' : 'In Stock'}
                      </span>
                    </div>

                    <div style={{ margin: '14px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                        <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: isLow ? '#EF4444' : 'var(--text-primary)' }}>
                          {item.quantity.toLocaleString('en-IN')} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{item.unit}</span>
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Min Alert: {item.minThreshold} {item.unit}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: isLow ? '#EF4444' : '#10B981' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem', background: 'var(--bg-card-inner)', padding: '10px', borderRadius: '8px', marginBottom: '14px' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Cost/Unit:</span>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{item.costPerUnit || 0} / {item.unit}</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Location:</span>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.location || 'Store'}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                        onClick={() => { setRestockItem(item); setRestockAmount(''); }}
                      >
                        <RefreshCw size={13} /> Restock / Adjust
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ) : activeTab === 'feed' ? (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Shed</th><th>Feed Type</th><th>Quantity (kg)</th><th>Cost (₹)</th><th>Logged By</th></tr></thead>
              <tbody>
                {feedLogs.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No feed logs yet</td></tr>
                ) : feedLogs.map((log: any) => (
                  <tr key={log._id}>
                    <td>{new Date(log.date).toLocaleDateString('en-IN')}</td>
                    <td>{log.shedId?.name || '—'}</td>
                    <td><span className="badge badge-info">{log.feedType}</span></td>
                    <td>{log.quantityKg}</td>
                    <td>₹{log.costIncurred}</td>
                    <td>{log.loggedBy?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Issue 10: Full Attendance Tab with real records */
        <div>
          {/* Check-in status card */}
          <div className="card" style={{ padding: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: checkedInToday ? 'rgba(16,185,129,0.15)' : 'rgba(249,115,22,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {checkedInToday ? <UserCheck size={24} style={{ color: '#10B981' }} /> : <Clock size={24} style={{ color: '#F97316' }} />}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  {checkedInToday
                    ? (language === 'hi' ? '✅ आपने आज चेक-इन किया है' : '✅ You are checked in today')
                    : (language === 'hi' ? '⏰ आज चेक-इन नहीं किया' : '⏰ Not checked in today')}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {!checkedInToday ? (
                <button className="btn btn-primary" onClick={handleCheckIn} disabled={checkInLoading}>
                  <LogIn size={16} /> {checkInLoading ? 'Please wait...' : (language === 'hi' ? 'उपस्थिति दर्ज करें' : 'Check In Now')}
                </button>
              ) : (
                <button className="btn btn-secondary" onClick={handleCheckOut} disabled={checkInLoading}
                  style={{ color: '#F97316', borderColor: 'rgba(249,115,22,0.35)' }}>
                  <LogOut size={16} /> {checkInLoading ? 'Please wait...' : (language === 'hi' ? 'प्रस्थान दर्ज करें' : 'Check Out')}
                </button>
              )}
            </div>
          </div>

          {/* Date filter + records table */}
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={16} style={{ color: 'var(--color-primary)' }} />
                {isAdmin ? (language === 'hi' ? 'सभी कर्मचारी उपस्थिति' : 'All Staff Attendance') : (language === 'hi' ? 'मेरी उपस्थिति' : 'My Attendance Records')}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {language === 'hi' ? 'तारीख:' : 'Date:'}
                </label>
                <input
                  type="date"
                  className="input"
                  value={attendanceDateFilter}
                  onChange={e => { setAttendanceDateFilter(e.target.value); fetchAttendance(e.target.value); }}
                  style={{ padding: '5px 10px', fontSize: '0.8rem', width: 'auto' }}
                />
              </div>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{language === 'hi' ? 'तारीख' : 'Date'}</th>
                    <th>{language === 'hi' ? 'कर्मचारी' : 'Staff Member'}</th>
                    {isAdmin && <th>{language === 'hi' ? 'भूमिका' : 'Role'}</th>}
                    <th>{language === 'hi' ? 'चेक-इन समय' : 'Check-In Time'}</th>
                    <th>{language === 'hi' ? 'चेक-आउट समय' : 'Check-Out Time'}</th>
                    <th>{language === 'hi' ? 'अवधि' : 'Duration'}</th>
                    <th>{language === 'hi' ? 'स्थिति' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceLoading ? (
                    <tr><td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                    </td></tr>
                  ) : attendanceRecords.length === 0 ? (
                    <tr><td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      {language === 'hi' ? 'इस तारीख के लिए कोई रिकॉर्ड नहीं' : 'No attendance records for this date'}
                    </td></tr>
                  ) : attendanceRecords.map((record: any, idx: number) => {
                    const staffName = record.userId?.name || record.staffId?.name || record.name || user?.name || '—';
                    const staffRole = record.userId?.role || record.staffId?.role || record.role || '—';
                    const checkIn = record.checkInTime || record.createdAt;
                    const checkOut = record.checkOutTime;
                    const recordDate = record.date || checkIn;
                    const formattedDate = recordDate ? new Date(recordDate).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    }) : '—';
                    let duration = '—';
                    if (checkIn && checkOut) {
                      const mins = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 60000);
                      duration = `${Math.floor(mins / 60)}h ${mins % 60}m`;
                    } else if (checkIn && !checkOut) {
                      duration = language === 'hi' ? 'जारी...' : 'Ongoing...';
                    }
                    return (
                      <tr key={record._id || idx}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                            <Calendar size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                            <span>{formattedDate}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>
                              {staffName.charAt(0).toUpperCase()}
                            </div>
                            <strong style={{ color: 'var(--text-primary)' }}>{staffName}</strong>
                          </div>
                        </td>
                        {isAdmin && (
                          <td><span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{staffRole}</span></td>
                        )}
                        <td style={{ fontWeight: 600, color: '#10B981' }}>
                          {checkIn ? new Date(checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td style={{ color: checkOut ? '#F97316' : 'var(--text-muted)' }}>
                          {checkOut ? new Date(checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td style={{ fontWeight: 600 }}>{duration}</td>
                        <td>
                          <span className={`badge ${checkOut ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                            {checkOut ? (language === 'hi' ? 'पूर्ण' : 'Completed') : (language === 'hi' ? 'उपस्थित' : 'Present')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setShowAddTask(false)}>
          <div className="card" style={{ maxWidth: '500px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>📋 {language === 'hi' ? 'नया कार्य' : 'New Task'}</h3>
            <form onSubmit={handleAddTask}>
              <div className="form-group"><label>{language === 'hi' ? 'शीर्षक' : 'Title'} *</label><input className="input" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} required /></div>
              <div className="form-group"><label>{language === 'hi' ? 'विवरण' : 'Description'}</label><textarea className="input" rows={2} value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Issue 11: Assign To dropdown with fallback */}
                <div className="form-group">
                  <label>{language === 'hi' ? 'सौंपें' : 'Assign To'} *</label>
                  <select className="input" value={newTask.assignedTo} onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })} required>
                    <option value="">{language === 'hi' ? 'चुनें...' : 'Select staff...'}</option>
                    {users.length > 0
                      ? users.map((u: any) => <option key={u.id || u._id} value={u.id || u._id}>{u.name} ({u.role})</option>)
                      : <option value={user?.id || ''}>{user?.name || 'Myself'} ({user?.role})</option>
                    }
                  </select>
                </div>
                <div className="form-group">
                  <label>{language === 'hi' ? 'प्राथमिकता' : 'Priority'}</label>
                  <select className="input" value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>{language === 'hi' ? 'श्रेणी' : 'Category'}</label>
                  <select className="input" value={newTask.category} onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}>
                    <option value="feeding">{language === 'hi' ? 'चारा' : 'Feeding'}</option>
                    <option value="cleaning">{language === 'hi' ? 'सफाई' : 'Cleaning'}</option>
                    <option value="medical">{language === 'hi' ? 'चिकित्सा' : 'Medical'}</option>
                    <option value="maintenance">{language === 'hi' ? 'रखरखाव' : 'Maintenance'}</option>
                    <option value="administrative">{language === 'hi' ? 'प्रशासनिक' : 'Administrative'}</option>
                    <option value="other">{language === 'hi' ? 'अन्य' : 'Other'}</option>
                  </select>
                </div>
                <div className="form-group"><label>{language === 'hi' ? 'नियत तारीख' : 'Due Date'} *</label><input type="date" className="input" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} required /></div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddTask(false)}>{language === 'hi' ? 'रद्द करें' : 'Cancel'}</button>
                <button type="submit" className="btn btn-primary">{language === 'hi' ? 'कार्य बनाएं' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setRestockItem(null)}>
          <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '12px', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Restock {restockItem.name}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Current stock: <strong>{restockItem.quantity} {restockItem.unit}</strong>
            </p>
            <form onSubmit={handleRestock}>
              <div className="form-group">
                <label>Add / Deduct Quantity ({restockItem.unit}) *</label>
                <input type="number" step="any" placeholder="e.g. +100 or -20" className="input" value={restockAmount} onChange={e => setRestockAmount(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setRestockItem(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Inventory Item Modal */}
      {showAddInventory && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setShowAddInventory(false)}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>📦 Add New Inventory Item</h3>
            <form onSubmit={handleAddInventory}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group"><label>Item Name (English) *</label><input className="input" placeholder="e.g. Green Napier Grass" value={newInventory.name} onChange={e => setNewInventory({ ...newInventory, name: e.target.value })} required /></div>
                <div className="form-group"><label>Item Name (Hindi)</label><input className="input" placeholder="e.g. नेपियर घास" value={newInventory.nameHi} onChange={e => setNewInventory({ ...newInventory, nameHi: e.target.value })} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Category *</label>
                  <select className="input" value={newInventory.category} onChange={e => setNewInventory({ ...newInventory, category: e.target.value })}>
                    <option value="green-fodder">Green Fodder (हरा चारा)</option>
                    <option value="dry-fodder">Dry Fodder (भूसा)</option>
                    <option value="concentrate">Concentrate (खल/चूरी)</option>
                    <option value="supplement">Supplement (सप्लीमेंट्स)</option>
                    <option value="medicine">Medicine (दवाइयां)</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Unit *</label>
                  <select className="input" value={newInventory.unit} onChange={e => setNewInventory({ ...newInventory, unit: e.target.value })}>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="quintal">Quintal</option>
                    <option value="ton">Ton</option>
                    <option value="liter">Liter</option>
                    <option value="bag">Bag / बोरी</option>
                    <option value="bottle">Bottle</option>
                    <option value="packet">Packet</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group"><label>Initial Qty *</label><input type="number" className="input" placeholder="100" value={newInventory.quantity} onChange={e => setNewInventory({ ...newInventory, quantity: e.target.value })} required /></div>
                <div className="form-group"><label>Min Alert Qty *</label><input type="number" className="input" placeholder="20" value={newInventory.minThreshold} onChange={e => setNewInventory({ ...newInventory, minThreshold: e.target.value })} required /></div>
                <div className="form-group"><label>Cost / Unit (₹)</label><input type="number" className="input" placeholder="10" value={newInventory.costPerUnit} onChange={e => setNewInventory({ ...newInventory, costPerUnit: e.target.value })} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group"><label>Supplier</label><input className="input" placeholder="e.g. Kisan Mandi" value={newInventory.supplier} onChange={e => setNewInventory({ ...newInventory, supplier: e.target.value })} /></div>
                <div className="form-group"><label>Storage Location</label><input className="input" placeholder="e.g. Barn A" value={newInventory.location} onChange={e => setNewInventory({ ...newInventory, location: e.target.value })} /></div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddInventory(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Feed Modal */}
      {showAddFeed && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setShowAddFeed(false)}>
          <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px' }}>🌿 Log Feed Distribution</h3>
            <form onSubmit={handleAddFeed}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Shed *</label>
                  <select className="input" value={newFeed.shedId} onChange={e => setNewFeed({ ...newFeed, shedId: e.target.value })} required>
                    <option value="">Select shed...</option>
                    {sheds.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Feed Type *</label>
                  <select className="input" value={newFeed.feedType} onChange={e => setNewFeed({ ...newFeed, feedType: e.target.value })}>
                    <option value="green-fodder">Green Fodder (हरा चारा)</option>
                    <option value="dry-fodder">Dry Fodder (भूसा)</option>
                    <option value="concentrate">Concentrate</option>
                    <option value="supplement">Supplement</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group"><label>Quantity (kg) *</label><input type="number" step="any" className="input" value={newFeed.quantityKg} onChange={e => setNewFeed({ ...newFeed, quantityKg: e.target.value })} required /></div>
                <div className="form-group"><label>Water (liters)</label><input type="number" step="any" className="input" value={newFeed.waterIntakeLiters} onChange={e => setNewFeed({ ...newFeed, waterIntakeLiters: e.target.value })} /></div>
                <div className="form-group"><label>Cost (₹)</label><input type="number" step="any" className="input" value={newFeed.costIncurred} onChange={e => setNewFeed({ ...newFeed, costIncurred: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Date *</label><input type="date" className="input" value={newFeed.date} onChange={e => setNewFeed({ ...newFeed, date: e.target.value })} required /></div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddFeed(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Log Feed</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationsPage;
