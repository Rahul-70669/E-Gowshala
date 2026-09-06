import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useLanguageStore } from '../../store/languageStore';
import { useThemeStore } from '../../store/themeStore';
import apiClient from '../../lib/apiClient';
import {
  HeartPulse, HandCoins, Sparkles,
  AlertTriangle, Activity, ShieldCheck, ArrowRight,
  Layers, CalendarPlus, Stethoscope, ChevronRight,
  Cpu, Users, IndianRupee, Syringe, TrendingUp, PieChart as PieIcon,
  FileText, Download, Bell, X, Printer, Shield, Ambulance, MapPin
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { CowIcon } from '../../components/common/CowIcon';
import VaccinationDueWidget from './VaccinationDueWidget';
import AIWeeklyInsightsWidget from './AIWeeklyInsightsWidget';
import RescueMapView from '../cows/RescueMapView';

const DashboardHome = () => {
  const { user } = useAuthStore();
  const { t } = useLanguageStore();
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [cowStats, setCowStats]           = useState<any>(null);
  const [healthStats, setHealthStats]     = useState<any>(null);
  const [opsStats, setOpsStats]           = useState<any>(null);
  const [donationStats, setDonationStats] = useState<any>(null);
  const [financeSummary, setFinanceSummary] = useState<any>(null);
  const [loading, setLoading]             = useState(true);
  const [urgentTasks, setUrgentTasks]     = useState<any[]>([]);
  const [activeSosAlerts, setActiveSosAlerts] = useState<any[]>([]);
  const [sosDismissed, setSosDismissed]   = useState(false);
  const [pendingRescueAlerts, setPendingRescueAlerts] = useState<any[]>([]);
  const [showRescueMapModal, setShowRescueMapModal]   = useState(false);
  const [selectedRescueId, setSelectedRescueId]       = useState<string | null>(null);
  const [subsidyState, setSubsidyState]   = useState<'up' | 'rj' | 'gj' | 'mp' | 'hr'>('up');
  const [subsidyCattleCount, setSubsidyCattleCount] = useState(48);

  const fetchDashboardData = () => {
    Promise.all([
      apiClient.get('/cows/stats').catch(() => ({ data: { data: null } })),
      apiClient.get('/health/stats').catch(() => ({ data: { data: null } })),
      apiClient.get('/operations/stats').catch(() => ({ data: { data: null } })),
      apiClient.get('/donations/stats').catch(() => ({ data: { data: null } })),
      apiClient.get('/finance/summary').catch(() => ({ data: { data: null } })),
      // Issue 8: Fetch urgent tasks for SOS banner
      apiClient.get('/operations/tasks').catch(() => ({ data: { data: [] } })),
      // Live Citizen Rescue Requests
      apiClient.get('/public/rescue-requests').catch(() => ({ data: { data: [] } })),
      // Live Emergency SOS alerts
      apiClient.get('/health/sos/active').catch(() => ({ data: { data: [] } })),
    ]).then(([cowRes, healthRes, opsRes, donRes, finRes, tasksRes, rescueRes, sosRes]) => {
      setCowStats(cowRes.data?.data);
      setHealthStats(healthRes.data?.data);
      setOpsStats(opsRes.data?.data);
      setDonationStats(donRes.data?.data);
      setFinanceSummary(finRes.data?.data);
      const allTasks = tasksRes.data?.data || [];
      setUrgentTasks(allTasks.filter((t: any) => t.priority === 'urgent' && t.status !== 'completed'));
      const allRescues = rescueRes.data?.data || [];
      setPendingRescueAlerts(allRescues.filter((r: any) => r.status === 'pending'));
      setActiveSosAlerts(sosRes.data?.data || []);
      setLoading(false);
    });
  };


  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleDispatchRescue = async (id: string) => {
    try {
      await apiClient.patch(`/public/rescue-requests/${id}`, {
        status: 'dispatched',
        dispatchedTo: 'Gaushala Rapid Response Ambulance',
      });
      setPendingRescueAlerts(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      console.error('Dispatch error:', e);
    }
  };

  const handleAcknowledgeSos = async (alertId: string) => {
    try {
      await apiClient.patch(`/health/sos/${alertId}/acknowledge`);
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to acknowledge SOS:', err);
    }
  };

  const handleResolveSos = async (alertId: string) => {
    try {
      await apiClient.patch(`/health/sos/${alertId}/resolve`);
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to resolve SOS:', err);
    }
  };

  const userRole = user?.role || 'admin';


  const { language } = useLanguageStore();

  const greeting = () => {
    const h = new Date().getHours();
    if (language === 'hi') {
      if (h < 12) return 'सुप्रभात';
      if (h < 17) return 'शुभ दोपहर';
      return 'शुभ संध्या';
    }
    if (h < 12) return t('home.goodMorning', 'Good Morning');
    if (h < 17) return t('home.goodAfternoon', 'Good Afternoon');
    return t('home.goodEvening', 'Good Evening');
  };

  const STATE_RATES: Record<string, { name: string; ratePerMonth: number; scheme: string }> = {
    up: { name: 'Uttar Pradesh', ratePerMonth: 900, scheme: 'Mukhyamantri Nirashrit Govansh Sahbhagita Yojna (₹30/day)' },
    rj: { name: 'Rajasthan', ratePerMonth: 450, scheme: 'Rajasthan Gaushala Vikas Yojna (₹450/month)' },
    gj: { name: 'Gujarat', ratePerMonth: 400, scheme: 'Mukhyamantri Gaumata Poshan Yojna (₹400/month)' },
    mp: { name: 'Madhya Pradesh', ratePerMonth: 250, scheme: 'MP Gau Sanvardhan Board Fodder Grant (₹250/month)' },
    hr: { name: 'Haryana', ratePerMonth: 200, scheme: 'Haryana Gau Seva Aayog Subsidy (₹200/month)' },
  };

  const calculatedSubsidy = subsidyCattleCount * (STATE_RATES[subsidyState]?.ratePerMonth || 900);

  const handlePrintSubsidyVerification = () => {
    const st = STATE_RATES[subsidyState];
    const win = window.open('', '_blank');
    if (!win) return;
    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Government Subsidy Claim & Headcount Verification - E-Gowshala</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
          .sheet { border: 2px solid #0f172a; border-radius: 8px; padding: 36px; max-width: 740px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #cbd5e1; padding-bottom: 14px; margin-bottom: 20px; }
          .header h2 { margin: 0 0 4px; color: #0f172a; text-transform: uppercase; font-size: 18px; }
          .header p { margin: 2px 0; font-size: 11px; color: #64748b; }
          .meta-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
          .meta-table td, .meta-table th { border: 1px solid #cbd5e1; padding: 8px 10px; }
          .meta-table th { background: #f8fafc; text-align: left; }
          .sign-box { display: flex; justify-content: space-between; margin-top: 50px; font-size: 12px; }
          @media print { .no-print { display: none; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <h2>OFFICE OF THE DISTRICT ANIMAL HUSBANDRY OFFICER (DAHO)</h2>
            <p>Certified Livestock Census & Monthly Gaushala Subsidy Claim Statement</p>
            <p>Issued by: E-Gowshala Smart Management Platform • Reg No: TR/GOW/2022/8941</p>
          </div>

          <p style="font-size: 12px; line-height: 1.6;">
            To,<br/>
            <strong>The District Veterinary Officer / Member Secretary,</strong><br/>
            State Animal Welfare Board (${st.name})
          </p>

          <p style="font-size: 12px; line-height: 1.6;">
            <strong>Subject:</strong> Submission of Verified Livestock Census for release of monthly maintenance grant under <u>${st.scheme}</u> for the current billing cycle.
          </p>

          <table class="meta-table">
            <tr><th>Gaushala Name</th><td>E-Gowshala Model Sanctuary</td><th>Verification Date</th><td>${new Date().toLocaleDateString('en-IN')}</td></tr>
            <tr><th>State Jurisdiction</th><td>${st.name}</td><th>Applied Scheme</th><td>${st.scheme}</td></tr>
            <tr><th>Total Cattle Certified</th><td><strong>${subsidyCattleCount} Cattle</strong></td><th>INAPH Tagging Rate</th><td>46/48 (96% Compliant)</td></tr>
            <tr><th>FMD-CP Vaccination</th><td>100% Verified Clean</td><th>Approved Monthly Rate</th><td>₹${st.ratePerMonth}/cattle/month</td></tr>
            <tr><th colspan="2" style="font-size: 13px;">Total Monthly Subsidy Entitlement Claimed:</th><td colspan="2" style="font-size: 16px; font-weight: 800; color: #047857;">₹${calculatedSubsidy.toLocaleString('en-IN')}</td></tr>
          </table>

          <p style="font-size: 11px; color: #475569; line-height: 1.5;">
            It is solemnly affirmed that all ${subsidyCattleCount} bovines are housed, sheltered, provided green & dry fodder, and medically treated in compliance with the Animal Birth Control & Prevention of Cruelty to Animals Act, 1960. All individual ear tag records and digital health logs are synchronized on the E-Gowshala portal.
          </p>

          <div class="sign-box">
            <div>
              <br/><br/>
              ____________________________<br/>
              <strong>Authorized Gaushala Trustee</strong><br/>
              Seal &amp; Signature
            </div>
            <div style="text-align: right;">
              <br/><br/>
              ____________________________<br/>
              <strong>Veterinary Officer In-Charge</strong><br/>
              Govt. Veterinary Hospital Seal
            </div>
          </div>
        </div>
        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 24px; background: #047857; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
            🖨️ Print / Save as PDF
          </button>
        </div>
        <script>window.onload = () => { setTimeout(() => window.print(), 350); };</script>
      </body>
      </html>
    `;
    win.document.write(printHtml);
    win.document.close();
  };

  // ── Role-Specific Quick Actions ─────────────────────────
  const getQuickActions = () => {
    if (userRole === 'donor') {
      return [
        { label: language === 'hi' ? 'गाय गोद लें' : 'Adopt a Cow', desc: language === 'hi' ? 'मासिक सेवा प्रायोजित करें' : 'Sponsor cattle monthly', icon: Sparkles, isCow: false, path: '/adopt-wall', color: '#EC4899', gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)' },
        { label: language === 'hi' ? 'गौसेवा दान' : 'Give Gauseva', desc: language === 'hi' ? 'स्वेच्छा से सहयोग दें' : 'Contribute donation', icon: HandCoins, isCow: false, path: '/dashboard/donations', color: '#10B981', gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' },
        { label: language === 'hi' ? 'गोवंश दर्शन' : 'Meet the Herd', desc: language === 'hi' ? 'संरक्षित गायों की सूची' : 'View cattle stories', icon: CowIcon, isCow: true, path: '/dashboard/cows', color: '#F97316', gradient: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' },
        { label: language === 'hi' ? '80G कर रसीदें' : '80G Tax Receipts', desc: language === 'hi' ? 'प्रमाणपत्र डाउनलोड करें' : 'Download certificates', icon: FileText, isCow: false, path: '/dashboard/donations', color: '#38BDF8', gradient: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)' },
      ];
    }
    if (userRole === 'veterinarian') {
      return [
        { label: language === 'hi' ? 'स्वास्थ्य जांच' : 'Health Checkup', desc: language === 'hi' ? 'चिकित्सीय जांच दर्ज करें' : 'Record clinical vitals', icon: Stethoscope, isCow: false, path: '/dashboard/health', color: '#38BDF8', gradient: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)' },
        { label: language === 'hi' ? 'एआई रोग परीक्षण' : 'AI Disease Scan', desc: language === 'hi' ? 'मोबाइलनेटV2 विश्लेषण' : 'MobileNetV2 analysis', icon: Sparkles, isCow: false, path: '/dashboard/ai', color: '#A855F7', gradient: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)' },
        { label: language === 'hi' ? 'टीकाकरण अनुसूची' : 'Vaccination Due', desc: language === 'hi' ? 'निवारक टीके देखें' : 'Preventive schedules', icon: Syringe, isCow: false, path: '/dashboard/health', color: '#F97316', gradient: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' },
        { label: language === 'hi' ? 'पशुधन रजिस्टर' : 'Cattle Registry', desc: language === 'hi' ? 'गोवंश प्रोफाइल देखें' : 'Inspect herd profiles', icon: CowIcon, isCow: true, path: '/dashboard/cows', color: '#10B981', gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' },
      ];
    }
    if (userRole === 'caretaker' || userRole === 'volunteer') {
      return [
        { label: language === 'hi' ? 'चारा व पानी लॉग' : 'Log Feed & Water', desc: language === 'hi' ? 'दैनिक पोषण रिकॉर्ड' : 'Daily nutritional logs', icon: CalendarPlus, isCow: false, path: '/dashboard/operations', color: '#F97316', gradient: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' },
        { label: language === 'hi' ? 'दैनिक कार्य' : 'Daily Tasks', desc: language === 'hi' ? 'आवंटित शेड कार्य' : 'Assigned shed duties', icon: Layers, isCow: false, path: '/dashboard/operations', color: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' },
        { label: language === 'hi' ? 'गोवंश निरीक्षण' : 'Inspect Herd', desc: language === 'hi' ? 'प्रत्यक्ष गणना व देखरेख' : 'Cattle visual census', icon: CowIcon, isCow: true, path: '/dashboard/cows', color: '#38BDF8', gradient: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)' },
        { label: language === 'hi' ? 'दर्शनार्थी सहायता' : 'Visitor Tours', desc: language === 'hi' ? 'श्रद्धालु मार्गदर्शन' : 'Guide temple devotees', icon: Users, isCow: false, path: '/dashboard/visitors', color: '#10B981', gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' },
      ];
    }
    if (userRole === 'government') {
      return [
        { label: language === 'hi' ? 'पशुधन जनगणना CSV' : 'Census Export', desc: language === 'hi' ? 'सरकारी ऑडिट डेटा डाउनलोड' : 'Download CSV audit', icon: Download, isCow: false, path: '/dashboard/cows', color: '#F97316', gradient: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' },
        { label: language === 'hi' ? 'सरकारी अनुपालन' : 'Compliance Audit', desc: language === 'hi' ? 'AWBI व 80G रिपोर्ट' : 'AWBI & 80G reports', icon: ShieldCheck, isCow: false, path: '/dashboard/finance', color: '#10B981', gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' },
        { label: language === 'hi' ? 'महामारी निगरानी' : 'Disease Registry', desc: language === 'hi' ? 'क्वारंटाइन व अलर्ट ट्रैकिंग' : 'Quarantine monitoring', icon: Stethoscope, isCow: false, path: '/dashboard/health', color: '#EF4444', gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' },
        { label: language === 'hi' ? 'राष्ट्रीय RFID डेटा' : 'Inspect Cattle', desc: language === 'hi' ? 'INAPH टैग सत्यापन' : 'National RFID database', icon: CowIcon, isCow: true, path: '/dashboard/cows', color: '#38BDF8', gradient: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)' },
      ];
    }
    // Default Admin
    return [
      { label: t('action.registerCow', 'Register Cattle'), desc: t('action.registerCowDesc', 'Add new cattle'), icon: CowIcon, isCow: true, path: '/dashboard/cows/register', color: '#F97316', gradient: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' },
      { label: t('action.aiScan', 'AI Scan'), desc: t('action.aiScanDesc', 'Detect disease'), icon: Sparkles, isCow: false, path: '/dashboard/ai', color: '#A855F7', gradient: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)' },
      { label: t('action.clinicalCheckup', 'Health Check'), desc: t('action.clinicalCheckupDesc', 'View records'), icon: Stethoscope, isCow: false, path: '/dashboard/health', color: '#38BDF8', gradient: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)' },
      { label: t('action.recordDonation', 'Record Donation'), desc: t('action.recordDonationDesc', 'Add donation'), icon: HandCoins, isCow: false, path: '/dashboard/donations', color: '#10B981', gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' },
    ];
  };

  const quickActions = getQuickActions();

  // ── Role-Specific KPIs ──────────────────────────────────
  const getKpis = () => {
    if (userRole === 'donor') {
      return [
        { label: 'Total Contributed', value: `Rs.${((donationStats?.totalAmount || 25000)/1000).toFixed(0)}K`, color: 'green', icon: IndianRupee, isCow: false },
        { label: 'Cows Sponsored',   value: donationStats?.activeAdoptions ?? 2, color: 'orange', icon: CowIcon, isCow: true },
        { label: 'Fodder Funded',     value: '1,250 Kg', color: 'teal', icon: CalendarPlus, isCow: false },
        { label: '80G Certificates', value: '4 Ready', color: 'blue', icon: FileText, isCow: false },
      ];
    }
    if (userRole === 'veterinarian') {
      return [
        { label: 'Total Cattle',   value: cowStats?.total ?? '-',    color: 'orange', icon: CowIcon, isCow: true },
        { label: 'Herd Healthy',   value: cowStats?.healthy ?? '-',  color: 'green',  icon: ShieldCheck, isCow: false },
        { label: 'Under Treatment', value: cowStats?.sick ?? '-',     color: 'gold',   icon: AlertTriangle, isCow: false },
        { label: 'Vaccines Due',   value: healthStats?.vaccinationsDue ?? '-', color: 'teal', icon: Syringe, isCow: false },
        { label: 'Pregnant',       value: cowStats?.pregnant ?? '-', color: 'purple', icon: HeartPulse, isCow: false },
      ];
    }
    if (userRole === 'caretaker' || userRole === 'volunteer') {
      return [
        { label: 'Cattle in Care', value: cowStats?.total ?? '-',   color: 'orange', icon: CowIcon, isCow: true },
        { label: 'Pending Tasks',  value: opsStats?.pendingTasks ?? '-', color: 'purple', icon: Layers, isCow: false },
        { label: 'Feed Logs Today', value: opsStats?.todayFeedLogs ?? '24', color: 'green', icon: CalendarPlus, isCow: false },
        { label: 'Staff Present',  value: opsStats?.todayAttendance ?? '6', color: 'blue', icon: Users, isCow: false },
      ];
    }
    // Default Admin / Government
    return [
      { label: t('kpi.total', 'Total Cattle'),   value: cowStats?.total ?? '-',    color: 'orange', icon: CowIcon,      isCow: true  },
      { label: t('kpi.healthy', 'Healthy'),       value: cowStats?.healthy ?? '-',  color: 'green',  icon: ShieldCheck,  isCow: false },
      { label: t('kpi.vaccDue', 'Vaccines Due'),  value: healthStats?.vaccinationsDue ?? '-', color: 'gold', icon: Syringe, isCow: false },
      { label: t('kpi.donations', 'Donations'),   value: donationStats?.totalAmount ? `Rs.${(donationStats.totalAmount/1000).toFixed(0)}K` : '-', color: 'blue', icon: IndianRupee, isCow: false },
      { label: t('kpi.tasks', 'Tasks'),           value: opsStats?.pendingTasks ?? '-', color: 'purple', icon: Layers,   isCow: false },
      { label: t('kpi.donors', 'Donors'),         value: donationStats?.totalDonors ?? '-', color: 'teal', icon: Users,   isCow: false },
    ];
  };

  const kpis = getKpis();

  const ALL_OVERVIEW_CARDS = [
    { id: 'cows', title: t('card.cowOverview', 'Cattle Overview'), color: '#F97316', iconColor: 'orange', icon: CowIcon, isCow: true, path: '/dashboard/cows',
      stats: [
        { label: t('card.totalCattle', 'Total Cattle'), value: cowStats?.total    ?? 48, color: 'var(--text-primary)' },
        { label: t('card.healthy', 'Healthy'),           value: cowStats?.healthy  ?? 40, color: '#10B981' },
        { label: t('card.underCare', 'Sick'),            value: cowStats?.sick     ?? 4,  color: '#EF4444' },
        { label: t('card.pregnant', 'Pregnant'),         value: cowStats?.pregnant ?? 4,  color: '#8B5CF6' },
      ],
    },
    { id: 'health', title: t('card.healthOverview', 'Health Overview'), color: '#0EA5E9', iconColor: 'blue', icon: HeartPulse, isCow: false, path: '/dashboard/health',
      stats: [
        { label: t('card.clinicalRecords', 'Clinical Records'), value: healthStats?.totalRecords        ?? 26, color: 'var(--text-primary)' },
        { label: t('card.vaccinesDue', 'Vaccines Due'),         value: healthStats?.vaccinationsDue     ?? 16, color: '#F97316' },
        { label: t('card.activePregnancies', 'Pregnancies'),    value: healthStats?.activePregnancies   ?? 4,  color: '#EC4899' },
        { label: t('card.overdueVaccines', 'Overdue Vaccines'), value: healthStats?.overdueVaccinations ?? 0,  color: '#EF4444' },
      ],
    },
    { id: 'operations', title: t('card.opsOverview', 'Operations'), color: '#8B5CF6', iconColor: 'purple', icon: CalendarPlus, isCow: false, path: '/dashboard/operations',
      stats: [
        { label: t('card.tasksPending', 'Pending Tasks'), value: opsStats?.pendingTasks    ?? 7,  color: 'var(--text-primary)' },
        { label: t('card.overdueTasks', 'Overdue'),       value: opsStats?.overdueTasks    ?? 0,  color: '#EF4444' },
        { label: t('card.feedLogs', 'Feed Logs'),         value: opsStats?.todayFeedLogs   ?? 24, color: '#10B981' },
        { label: t('card.staffPresent', 'Staff Present'), value: opsStats?.todayAttendance ?? 6,  color: '#0EA5E9' },
      ],
    },
    { id: 'donations', title: t('card.donationOverview', 'Donation Overview'), color: '#10B981', iconColor: 'green', icon: HandCoins, isCow: false, path: '/dashboard/donations',
      stats: [
        { label: t('card.totalInflow', 'Total Raised'),   value: `Rs.${((donationStats?.totalAmount || 185000)/1000).toFixed(0)}K`, color: '#10B981' },
        { label: t('card.thisMonth', 'This Month'),        value: `Rs.${((donationStats?.thisMonthAmount || 45000)/1000).toFixed(0)}K`, color: '#0EA5E9' },
        { label: t('card.activeAdoptions', 'Adoptions'),  value: donationStats?.activeAdoptions ?? 5,  color: '#F97316' },
        { label: t('card.registeredDonors', 'Donors'),    value: donationStats?.totalDonors    ?? 18, color: 'var(--text-primary)' },
      ],
    },
  ];

  // Filter overview cards based on user's role
  const OVERVIEW_CARDS = ALL_OVERVIEW_CARDS.filter(c => {
    if (userRole === 'donor') return c.id === 'cows' || c.id === 'donations';
    if (userRole === 'veterinarian') return c.id === 'cows' || c.id === 'health';
    if (userRole === 'caretaker' || userRole === 'volunteer') return c.id === 'cows' || c.id === 'operations';
    return true; // admin & government see all
  });

  const hasAlerts = (healthStats?.overdueVaccinations ?? 0) > 0 || (opsStats?.overdueTasks ?? 0) > 0;

  const roleLabel = language === 'hi' ? {
    admin: 'गौशाला प्रशासक',
    veterinarian: 'पशु चिकित्सा अधिकारी',
    caretaker: 'वरिष्ठ गौसेवक',
    donor: 'गौसेवा दानी व संरक्षक',
    volunteer: 'गौशाला स्वयंसेवक',
    government: 'पशु कल्याण सरकारी निरीक्षक',
  }[userRole] || 'गौशाला सदस्य' : {
    admin: 'Gaushala Admin',
    veterinarian: 'Veterinary Officer',
    caretaker: 'Senior Caretaker',
    donor: 'Gauseva Devotee & Donor',
    volunteer: 'Community Volunteer',
    government: 'Animal Welfare Inspector',
  }[userRole] || 'Staff Member';

  const heroDescription = language === 'hi' ? {
    donor: 'आपके व्यक्तिगत गौसेवा एवं संरक्षण पोर्टल में स्वागत है। आपके द्वारा गोद ली गई गायों के स्वास्थ्य, सेवा विवरण एवं 80G आयकर छूट प्रमाण पत्र यहाँ उपलब्ध हैं।',
    veterinarian: 'पशु चिकित्सा कमांड सेंटर। मोबाइलनेटV2 रोग निदान, निवारक टीकाकरण समय सारणी, एवं पशुधन स्वास्थ्य का वास्तविक समय अवलोकन।',
    caretaker: 'दैनिक पशुधन संचालन केंद्र। दैनिक चारा-पानी वितरण, शेड क्षमता प्रबंधन एवं सौंपे गए कार्यों की निगरानी।',
    volunteer: 'सामुदायिक गौसेवा पोर्टल। अपनी सेवा पाली देखें, आगंतुक दर्शनार्थियों का मार्गदर्शन करें एवं गौसेवा में सहयोग दें।',
    government: 'राज्य गौशाला आयोग एवं राष्ट्रीय पशु कल्याण निरीक्षण पोर्टल। प्रमाणित पशुधन जनगणना, महामारी रोकथाम व सरकारी अनुदान सत्यापन।',
    admin: 'आपकी गौशाला का संपूर्ण डिजिटल रिकॉर्ड — गोवंश स्वास्थ्य, 80G दान, टीकाकरण एवं दैनिक संचालन एक ही स्थान पर।',
  }[userRole] || t('home.heroDesc', 'आपकी गौशाला का संपूर्ण डिजिटल रिकॉर्ड') : {
    donor: 'Welcome to your Personal Gauseva & Sponsorship Portal. Track the wellbeing of your adopted cattle, view health cards, and access instant 80G tax exemption certificates.',
    veterinarian: 'Clinical veterinary command center. Monitor MobileNetV2 diagnostic findings, preventive vaccination timelines, and herd disease incidence rates.',
    caretaker: 'Daily livestock operations center. Log daily feed, monitor watering troughs, track shed capacity, and complete assigned maintenance tasks.',
    volunteer: 'Community gauseva portal. View your assigned shifts, coordinate devotee visitor tours, and assist with cattle welfare activities.',
    government: 'State Gaushala Ayog & AWBI Regulatory Audit. Review certified livestock census data, epidemic prevention protocols, and legal compliance.',
    admin: t('home.heroDesc', 'Complete digital records for your Gaushala — cattle health, donations, vaccinations and operations in one place.'),
  }[userRole];

  return (
    <div className="page-enter">
      {/* Live Citizen Rescue Callout Alert Banner (Admin / Vet / Caretaker) */}
      {pendingRescueAlerts.length > 0 && (userRole === 'admin' || userRole === 'veterinarian' || userRole === 'caretaker') && (
        <div style={{
          background: 'linear-gradient(135deg, #B91C1C, #991B1B)',
          borderRadius: 'var(--border-radius)',
          padding: '16px 20px',
          marginBottom: '16px',
          color: 'white',
          boxShadow: '0 8px 24px rgba(185,28,28,0.4)',
          border: '1.5px solid rgba(254,202,202,0.4)',
          animation: 'notifPulse 1.8s infinite',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Ambulance size={24} style={{ color: 'white' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.04em' }}>
                    🚨 {language === 'hi' ? 'नागरिक आपातकालीन रेस्क्यू कॉलआउट!' : 'LIVE CITIZEN RESCUE ALERT!'}
                  </span>
                  <span style={{ background: '#FEF2F2', color: '#991B1B', fontWeight: 800, fontSize: '0.72rem', padding: '2px 8px', borderRadius: '99px' }}>
                    {pendingRescueAlerts.length} {language === 'hi' ? 'गाय संकट में' : 'Incident(s) Pending'}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.92)', marginTop: '4px' }}>
                  <strong>{pendingRescueAlerts[0]?.locationName}</strong> — {pendingRescueAlerts[0]?.condition}
                  {pendingRescueAlerts[0]?.reporterPhone && <span style={{ opacity: 0.85 }}> (📞 {pendingRescueAlerts[0].reporterPhone})</span>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn"
                style={{ background: 'white', color: '#B91C1C', fontWeight: 800, fontSize: '0.8rem', padding: '7px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                onClick={() => handleDispatchRescue(pendingRescueAlerts[0].id)}
              >
                🚑 {language === 'hi' ? 'एंबुलेंस रवाना करें' : 'Dispatch Rescue Van'}
              </button>
              <button
                className="btn"
                style={{ background: 'rgba(255,255,255,0.18)', color: 'white', border: '1px solid rgba(255,255,255,0.35)', fontSize: '0.8rem', padding: '7px 14px' }}
                onClick={() => {
                  const targetId = pendingRescueAlerts[0]?.id;
                  navigate(targetId ? `/dashboard/rescue-map?selectedId=${targetId}` : '/dashboard/rescue-map');
                }}
              >
                <MapPin size={14} /> {language === 'hi' ? 'रेस्क्यू मैप खोलें' : 'View on Rescue Map'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active SOS Emergency Alert System */}
      {activeSosAlerts.length > 0 && !sosDismissed && (
        <div style={{
          background: 'linear-gradient(135deg, #991B1B 0%, #7F1D1D 50%, #450A0A 100%)',
          borderRadius: 'var(--border-radius)',
          padding: '18px 22px',
          marginBottom: '20px',
          boxShadow: '0 8px 30px rgba(220,38,38,0.4)',
          border: '1px solid rgba(248,113,113,0.5)',
          position: 'relative',
          animation: 'notifPulse 2.5s infinite',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.25rem', flexShrink: 0, boxShadow: '0 0 14px rgba(239,68,68,0.8)' }}>
                🚨
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{language === 'hi' ? 'आपातकालीन पशु चिकित्सा अलर्ट!' : 'CRITICAL VETERINARY EMERGENCY SOS'}</span>
                  <span style={{ fontSize: '0.72rem', background: '#DC2626', color: 'white', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', fontWeight: 800, border: '1px solid rgba(255,255,255,0.3)' }}>
                    {activeSosAlerts.length} {activeSosAlerts.length > 1 ? 'Alerts Active' : 'Alert Active'}
                  </span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem', marginTop: '2px' }}>
                  {language === 'hi'
                    ? 'एडमिन पैनल से स्वास्थ्य मॉड्यूल में आपातकालीन अलर्ट भेजा गया है। पशु चिकित्सक का तत्काल पहुंचना अनिवार्य है।'
                    : 'Emergency broadcast triggered from Health Module. Immediate on-site veterinary response required.'}
                </div>
              </div>
            </div>
            <button
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
              onClick={() => setSosDismissed(true)}
              title="Dismiss banner"
            >
              <X size={20} />
            </button>
          </div>

          {/* Alert Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeSosAlerts.map((alert: any) => (
              <div
                key={alert.id || alert._id}
                style={{
                  background: 'rgba(0,0,0,0.35)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '14px',
                }}
              >
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>
                      {alert.title}
                    </span>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '8px',
                      background: alert.status === 'in-progress' ? 'rgba(59,130,246,0.35)' : 'rgba(239,68,68,0.35)',
                      color: alert.status === 'in-progress' ? '#93C5FD' : '#FCA5A5',
                      border: `1px solid ${alert.status === 'in-progress' ? 'rgba(59,130,246,0.6)' : 'rgba(239,68,68,0.6)'}`,
                    }}>
                      {alert.status === 'in-progress' ? '👨‍⚕️ IN PROGRESS / VET ATTENDING' : '⚠️ AWAITING VET RESPONSE'}
                    </span>
                  </div>

                  <div style={{ color: 'rgba(255,255,255,0.92)', fontSize: '0.8125rem', marginBottom: '8px', lineHeight: 1.45 }}>
                    {alert.description}
                  </div>

                  <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)' }}>
                    <span>📢 <strong>Reported By:</strong> {alert.triggeredBy || 'Admin'} ({alert.triggeredByRole || 'Admin'})</span>
                    {alert.cowName ? (
                      <span style={{ color: '#FCA5A5', fontWeight: 700 }}>🐄 <strong>Cattle:</strong> {alert.cowName} (Tag: {alert.cowTagId})</span>
                    ) : (
                      <span style={{ color: '#FCA5A5' }}>🐄 <strong>Cattle:</strong> General / Barn Facility</span>
                    )}
                    {alert.shedName && (
                      <span>📍 <strong>Location:</strong> {alert.shedName}</span>
                    )}
                    <span>🕒 <strong>Reported:</strong> {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {alert.acknowledgedBy && (
                      <span style={{ color: '#6EE7B7', fontWeight: 700 }}>👨‍⚕️ <strong>Attending:</strong> {alert.acknowledgedBy}</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {alert.status === 'pending' && (
                    <button
                      className="btn"
                      style={{
                        background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                        color: 'white',
                        border: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        padding: '8px 14px',
                        boxShadow: '0 2px 8px rgba(37,99,235,0.4)',
                      }}
                      onClick={() => handleAcknowledgeSos(alert.id || alert._id)}
                    >
                      👨‍⚕️ {language === 'hi' ? 'स्वीकार करें (मैं देख रहा हूँ)' : "Acknowledge (I'm Attending)"}
                    </button>
                  )}
                  <button
                    className="btn"
                    style={{
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      color: 'white',
                      border: 'none',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      padding: '8px 14px',
                      boxShadow: '0 2px 8px rgba(16,185,129,0.4)',
                    }}
                    onClick={() => handleResolveSos(alert.id || alert._id)}
                  >
                    ✅ {language === 'hi' ? 'समाधान चिह्नित करें' : 'Mark Resolved'}
                  </button>
                  <button
                    className="btn"
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      padding: '8px 12px',
                    }}
                    onClick={() => navigate('/dashboard/health')}
                  >
                    {language === 'hi' ? 'क्लिनिकल रिकॉर्ड्स' : 'Clinical Records'} →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallback Urgent Tasks Banner (if no dedicated SOS active) */}
      {activeSosAlerts.length === 0 && urgentTasks.length > 0 && !sosDismissed && (userRole === 'admin' || userRole === 'veterinarian' || userRole === 'caretaker') && (
        <div style={{
          background: 'linear-gradient(135deg, #DC2626, #991B1B)',
          borderRadius: 'var(--border-radius)',
          padding: '14px 20px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          animation: 'notifPulse 2s infinite',
          boxShadow: '0 4px 20px rgba(239,68,68,0.4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Bell size={20} style={{ color: 'white', flexShrink: 0 }} />
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: '0.95rem' }}>
                🚨 {language === 'hi' ? 'आपातकालीन अलर्ट सक्रिय!' : 'ACTIVE EMERGENCY ALERT!'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem', marginTop: '2px' }}>
                {urgentTasks.length} {language === 'hi' ? 'अत्यावश्यक पशु चिकित्सा कार्य लंबित हैं' : `urgent veterinary task${urgentTasks.length > 1 ? 's' : ''} require immediate attention`}
                {urgentTasks[0]?.title && ` — "${urgentTasks[0].title}"`}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
            <button
              className="btn"
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700 }}
              onClick={() => navigate('/dashboard/health')}
            >
              {language === 'hi' ? 'स्वास्थ्य मॉड्यूल खोलें' : 'Open Health Module'} →
            </button>
            <button
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
              onClick={() => setSosDismissed(true)}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}


      {/* Hero Banner */}
      <div style={{ background: isDark ? 'linear-gradient(135deg, #181C26 0%, #11141B 100%)' : 'linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 45%, #F0FDF4 100%)', border: isDark ? '1px solid var(--border-color)' : '1px solid rgba(234,88,12,0.22)', borderRadius: 'var(--border-radius)', marginBottom: '24px', padding: '32px', position: 'relative', overflow: 'hidden', boxShadow: isDark ? 'var(--shadow-md)' : '0 6px 24px rgba(234,88,12,0.08)' }}>
        <div style={{ position:'absolute', right:'-60px', top:'-60px', width:'280px', height:'280px', borderRadius:'50%', background:'radial-gradient(circle, rgba(249,115,22,0.15), transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ marginBottom:'6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize:'0.78rem', color:'var(--color-primary)', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase' }}>
              {t('home.welcomeBack', 'Welcome Back')} • {roleLabel}
            </span>
          </div>
          <h1 style={{ fontSize:'1.875rem', fontWeight:800, marginBottom:'8px', letterSpacing:'-0.02em', color:'var(--text-primary)' }}>
            {greeting()}, <span className="gradient-text">{user?.name || roleLabel}</span>
          </h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.9375rem', maxWidth:'640px', marginBottom:'20px', lineHeight:1.6 }}>
            {heroDescription}
          </p>
          <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'center' }}>
            <span className="ai-badge"><Sparkles size={13} /> MobileNetV2 Active</span>
            <span className="badge badge-success"><Activity size={12} /> {t('home.cattleTracked', 'Cattle Tracked')}</span>
            {hasAlerts
              ? <span className="badge badge-danger" style={{ animation:'notifPulse 2s infinite' }}><AlertTriangle size={12} /> {t('home.attentionPending', 'Attention Needed')}</span>
              : <span className="badge badge-info"><ShieldCheck size={12} /> {t('home.herdHealthy', 'Herd Healthy')}</span>
            }
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(148px,1fr))', gap:'14px', marginBottom:'24px' }}>
        {kpis.map((k) => (
          <div key={k.label} className={`stat-card ${k.color}`}>
            <div style={{ marginBottom:'12px' }}>
              <div className={`icon-wrap ${k.color}`} style={{ width:38, height:38, borderRadius:10 }}>
                {k.isCow ? <CowIcon size={20} variant="transparent" /> : <k.icon size={18} />}
              </div>
            </div>
            <div style={{ fontSize:'1.75rem', fontWeight:800, fontFamily:'var(--font-heading)', color:'var(--text-primary)', lineHeight:1 }}>
              {loading ? <span className="skeleton" style={{ display:'inline-block', width:40, height:28, borderRadius:6 }} /> : k.value}
            </div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:'6px', fontWeight:600 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:'12px', marginBottom:'24px' }}>
        {quickActions.map((a) => (
          <div key={a.path} className="card quick-action-card" onClick={() => navigate(a.path)} style={{ padding:'16px', cursor:'pointer', display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:a.gradient, display:'flex', alignItems:'center', justifyContent:'center', color:'white', flexShrink:0, boxShadow:`0 4px 14px ${a.color}45` }}>
              {a.isCow ? <CowIcon size={22} variant="white" /> : <a.icon size={18} />}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <h4 style={{ fontSize:'0.875rem', fontWeight:700, color:'var(--text-primary)', marginBottom:'2px' }}>{a.label}</h4>
              <p style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{a.desc}</p>
            </div>
            <ChevronRight size={15} style={{ color:'var(--text-muted)', flexShrink:0 }} />
          </div>
        ))}
      </div>

      {/* 4-card Overview Row — responsive multi-column on desktop/tablet/mobile */}
      <div style={{ display:'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap:'16px', marginBottom:'24px' }}>
        {OVERVIEW_CARDS.map((card) => (
          <div key={card.path} className="card" style={{ cursor:'pointer', borderTop:`3px solid ${card.color}`, paddingTop:'16px', padding:'16px' }} onClick={() => navigate(card.path)}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
              <div style={{ display:'flex', alignItems: 'center', gap:'8px' }}>
                <div className={`icon-wrap ${card.iconColor}`} style={{ width:34, height:34, borderRadius:10 }}>
                  {card.isCow ? <CowIcon size={18} variant="transparent" /> : <card.icon size={17} />}
                </div>
                <h3 style={{ fontSize:'0.875rem', fontWeight:700, color:'var(--text-primary)' }}>{card.title}</h3>
              </div>
              <span style={{ fontSize:'0.72rem', fontWeight:700, color:card.color, display:'flex', alignItems:'center', gap:'3px' }}>
                {t('common.viewModule', 'View')} <ArrowRight size={12} />
              </span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
              {card.stats.map((s) => (
                <div key={s.label} style={{ padding:'10px 12px', borderRadius:'10px', background:'var(--bg-card-inner)', border:'1px solid var(--border-color)' }}>
                  <div style={{ fontSize:'1.25rem', fontWeight:800, color:s.color, fontFamily:'var(--font-heading)', lineHeight:1 }}>
                    {loading ? <span className="skeleton" style={{ display:'inline-block', width:32, height:20, borderRadius:5 }} /> : s.value}
                  </div>
                  <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', marginTop:'4px', fontWeight:600, lineHeight:1.3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── DONOR ROLE SPECIALIZED DASHBOARD VIEW ────────── */}
      {userRole === 'donor' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px' }}>
          {/* My Sponsored Cattle Grid */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  🐄 My Sponsored Sacred Cattle
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Real-time welfare updates for cattle under your personal care
                </p>
              </div>
              <button className="btn btn-secondary" onClick={() => navigate('/adopt-wall')} style={{ fontSize: '0.8rem', padding: '6px 12px', color: '#EC4899', borderColor: 'rgba(236,72,153,0.3)' }}>
                <Sparkles size={14} /> Sponsor Another Cow
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '16px' }}>
              {/* Sponsored Cow 1 */}
              <div className="card" style={{ padding: '20px', borderTop: '3px solid #10B981' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(249,115,22,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CowIcon size={34} variant="transparent" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 2px', color: 'var(--text-primary)' }}>
                      Kamadhenu (Gir Cow)
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Ear Tag: CW-001 • Shed A (Main Barn)
                    </span>
                  </div>
                  <span className="badge badge-success" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
                    ✓ Vet Verified Healthy
                  </span>
                </div>
                <div style={{ background: 'var(--bg-card-inner)', borderRadius: '10px', padding: '12px', fontSize: '0.8rem', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Monthly Sponsorship:</span>
                    <strong style={{ color: '#10B981' }}>₹2,100 / month</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Sponsorship Active Since:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>October 2025</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Diet / Nutrition:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Green Fodder + Ayurvedic Mix</span>
                  </div>
                </div>
                <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.8rem' }} onClick={() => navigate('/dashboard/cows')}>
                  View Full Health Card &amp; Vitals ➔
                </button>
              </div>

              {/* Sponsored Cow 2 */}
              <div className="card" style={{ padding: '20px', borderTop: '3px solid #38BDF8' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(56,189,248,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CowIcon size={34} variant="transparent" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 2px', color: 'var(--text-primary)' }}>
                      Nandini (Malvi Cow)
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Ear Tag: CW-020 • Shed C (Recovery Wing)
                    </span>
                  </div>
                  <span className="badge badge-info" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
                    ✓ Rehabilitated
                  </span>
                </div>
                <div style={{ background: 'var(--bg-card-inner)', borderRadius: '10px', padding: '12px', fontSize: '0.8rem', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Monthly Sponsorship:</span>
                    <strong style={{ color: '#10B981' }}>₹2,100 / month</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Rescue Story:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Highway rescue in MP</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Current Status:</span>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>Fully Recovered &amp; Peaceful</span>
                  </div>
                </div>
                <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.8rem' }} onClick={() => navigate('/dashboard/cows')}>
                  View Full Health Card &amp; Vitals ➔
                </button>
              </div>
            </div>
          </div>

          {/* Section 80G Certificates & Impact Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '18px' }}>
            <div className="card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div className="icon-wrap blue" style={{ width: 34, height: 34, borderRadius: 10 }}>
                  <FileText size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Your 80G Tax Exemption Certificates
                  </h4>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                    Government of India Income Tax Dept Compliant
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { receiptNo: '80G-2026-0891', amount: '₹2,100', date: 'Feb 28, 2026', desc: 'Monthly Cow Adoption (Kamadhenu)' },
                  { receiptNo: '80G-2026-0644', amount: '₹5,000', date: 'Jan 15, 2026', desc: 'Winter Fodder & Medicine Seva' },
                  { receiptNo: '80G-2025-1102', amount: '₹2,100', date: 'Dec 01, 2025', desc: 'Monthly Cow Adoption (Kamadhenu)' },
                ].map((rec) => (
                  <div key={rec.receiptNo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-card-inner)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{rec.desc}</div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{rec.receiptNo} • {rec.date}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <strong style={{ color: '#10B981' }}>{rec.amount}</strong>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.72rem' }} onClick={() => alert(`Downloading official 80G Tax Certificate ${rec.receiptNo}...`)}>
                        <Download size={13} /> PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct Social Impact of Your Contributions */}
            <div className="card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div className="icon-wrap green" style={{ width: 34, height: 34, borderRadius: 10 }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Direct Impact of Your Gauseva
                  </h4>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                    Transparent tangible outcomes delivered
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Nutritional Green Fodder Provided</span>
                    <strong style={{ color: 'var(--text-primary)' }}>1,250 kg (100% of goal)</strong>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: '100%', background: '#10B981' }} /></div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Vaccines &amp; Clinical Preventatives</span>
                    <strong style={{ color: 'var(--text-primary)' }}>100% Completed</strong>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: '100%', background: '#38BDF8' }} /></div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Ayurvedic Mineral Salt Supplements</span>
                    <strong style={{ color: 'var(--text-primary)' }}>Active Daily</strong>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: '92%', background: '#F97316' }} /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CLINICAL & OPERATIONAL SUITE (For Staff, Vets & Admins) ── */}
      {userRole !== 'donor' && (
        <>
          {/* Vaccination Alerts + Herd Risk + AI Insights Row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(340px,1fr))', gap:'20px', marginBottom:'24px' }}>
            {userRole !== 'caretaker' && userRole !== 'volunteer' && <VaccinationDueWidget />}

            {/* Herd Health Summary Card */}
            <div className="card" style={{ borderTop:'3px solid #10B981' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <div className="icon-wrap green" style={{ width:36, height:36, borderRadius:10 }}><ShieldCheck size={18} /></div>
                <div>
                  <h3 style={{ fontSize:'0.95rem', fontWeight:700, color:'var(--text-primary)' }}>Herd Health Summary</h3>
                  <p style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Current status overview</p>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[
                  { label:'Healthy Cattle',    value: cowStats?.healthy  ?? '-', color:'#10B981', pct: cowStats ? Math.round((cowStats.healthy/Math.max(cowStats.total, 1))*100) : 84 },
                  { label:'Under Treatment',   value: cowStats?.sick     ?? '-', color:'#F97316', pct: cowStats ? Math.round((cowStats.sick/Math.max(cowStats.total, 1))*100)    : 8 },
                  { label:'Pregnant',          value: cowStats?.pregnant ?? '-', color:'#8B5CF6', pct: cowStats ? Math.round((cowStats.pregnant/Math.max(cowStats.total, 1))*100) : 8 },
                ].map(row => (
                  <div key={row.label}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.78rem', marginBottom:4 }}>
                      <span style={{ fontWeight:600, color:'var(--text-secondary)' }}>{row.label}</span>
                      <span style={{ fontWeight:800, color:row.color }}>{row.value}</span>
                    </div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width:`${row.pct}%`, background:row.color }} /></div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Weekly Insights (Vets, Admins, Govt) */}
            {(userRole === 'admin' || userRole === 'veterinarian' || userRole === 'government') && <AIWeeklyInsightsWidget />}
          </div>

          {/* ── Visual Analytics Charts Row ── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(360px, 1fr))', gap:'20px', marginBottom:'24px' }}>
            {/* Trend Area Chart (Admins & Govt only) */}
            {(userRole === 'admin' || userRole === 'government') && (
              <div className="card" style={{ padding:'22px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div className="icon-wrap orange" style={{ width:34, height:34, borderRadius:10 }}><TrendingUp size={18} /></div>
                    <div>
                      <h3 style={{ fontSize:'0.95rem', fontWeight:800, color:'var(--text-primary)' }}>Financial Cashflow Trend</h3>
                      <p style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Monthly Inflow vs Outflow</p>
                    </div>
                  </div>
                  <button className="btn btn-secondary" style={{ padding:'4px 10px', fontSize:'0.75rem' }} onClick={() => navigate('/dashboard/finance')}>
                    Details
                  </button>
                </div>

                <div style={{ height:'210px', width:'100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={(() => {
                        const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
                        return months.map((m, idx) => ({
                          month: m,
                          inflow: 25000 + (idx * 6000) + (Math.random() * 4000),
                          outflow: 18000 + (idx * 3500) + (Math.random() * 2000),
                        }));
                      })()}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                        </linearGradient>
                        <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F97316" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#F97316" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                      <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={10} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value: any, name: any) => [`₹${Math.round(Number(value)).toLocaleString('en-IN')}`, name === 'inflow' ? 'Donations Inflow' : 'Expenditure']}
                        contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.78rem' }}
                      />
                      <Area type="monotone" dataKey="inflow" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorInflow)" />
                      <Area type="monotone" dataKey="outflow" stroke="#F97316" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOutflow)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Herd Breakdown Donut Chart */}
            <div className="card" style={{ padding:'22px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div className="icon-wrap blue" style={{ width:34, height:34, borderRadius:10 }}><PieIcon size={18} /></div>
                  <div>
                    <h3 style={{ fontSize:'0.95rem', fontWeight:800, color:'var(--text-primary)' }}>Herd Demographics</h3>
                    <p style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Status &amp; health categorization</p>
                  </div>
                </div>
                <button className="btn btn-secondary" style={{ padding:'4px 10px', fontSize:'0.75rem' }} onClick={() => navigate('/dashboard/cows')}>
                  View All
                </button>
              </div>

              <div style={{ height:'210px', width:'100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Healthy', value: cowStats?.healthy || 38, color: '#10B981' },
                        { name: 'Sick/Treating', value: cowStats?.sick || 4, color: '#EF4444' },
                        { name: 'Pregnant', value: cowStats?.pregnant || 4, color: '#8B5CF6' },
                        { name: 'Lactating', value: cowStats?.lactating || 8, color: '#0EA5E9' },
                        { name: 'Rescued', value: cowStats?.rescued || 3, color: '#F59E0B' },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {[
                        { color: '#10B981' },
                        { color: '#EF4444' },
                        { color: '#8B5CF6' },
                        { color: '#0EA5E9' },
                        { color: '#F59E0B' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any) => [`${value} Cattle`, name]}
                      contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.78rem' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.72rem', paddingTop: '6px', color: 'var(--text-secondary)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── 🇮🇳 NATIONAL ANIMAL WELFARE & STATE SUBSIDY ENGINE ── */}
      {(userRole === 'admin' || userRole === 'government') && (
        <div className="card" style={{ marginBottom: '24px', borderTop: '3px solid #F97316', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(249,115,22,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F97316', fontSize: '1.4rem' }}>
                🇮🇳
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px' }}>
                  {language === 'hi' ? 'राज्य गौशाला अनुदान एवं राष्ट्रीय गोकुल मिशन अनुपालन' : 'State Gaushala Subsidy & National Yojna Compliance Engine'}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  {language === 'hi' ? 'विभिन्न राज्यों के गौशाला अनुदान की गणना एवं INAPH पशुधन सत्यापन' : 'Real-time state subsidy calculator, INAPH RFID tagging rate & RGM grant eligibility'}
                </p>
              </div>
            </div>

            <button
              className="btn btn-secondary"
              onClick={handlePrintSubsidyVerification}
              style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6, color: '#10B981', borderColor: 'rgba(16,185,129,0.3)' }}
            >
              <Printer size={14} /> {language === 'hi' ? 'अनुदान दावा प्रमाण पत्र (PDF)' : 'Download Subsidy Claim Verification'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Subsidy Calculator Card */}
            <div style={{ background: 'var(--bg-card-inner)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '10px' }}>
                {language === 'hi' ? 'राज्यवार अनुदान कैलकुलेटर' : 'State-wise Subsidy Calculator'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.72rem' }}>{language === 'hi' ? 'राज्य चुनें' : 'Select State'}</label>
                  <select
                    className="input"
                    value={subsidyState}
                    onChange={e => setSubsidyState(e.target.value as any)}
                    style={{ fontSize: '0.8rem', padding: '5px 8px' }}
                  >
                    <option value="up">Uttar Pradesh (₹30/cow/day)</option>
                    <option value="rj">Rajasthan (₹450/cow/mo)</option>
                    <option value="gj">Gujarat (₹400/cow/mo)</option>
                    <option value="mp">Madhya Pradesh (₹250/cow/mo)</option>
                    <option value="hr">Haryana (₹200/cow/mo)</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '0.72rem' }}>{language === 'hi' ? 'सत्यापित गोवंश संख्या' : 'Verified Cattle Count'}</label>
                  <input
                    type="number"
                    className="input"
                    value={subsidyCattleCount}
                    onChange={e => setSubsidyCattleCount(parseInt(e.target.value) || 0)}
                    style={{ fontSize: '0.8rem', padding: '5px 8px' }}
                  />
                </div>
              </div>

              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {language === 'hi' ? 'अनुमानित मासिक सरकारी अनुदान:' : 'Expected Monthly Govt Grant:'}
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981', fontFamily: 'var(--font-heading)' }}>
                  ₹{calculatedSubsidy.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* National Compliance Metrics */}
            <div style={{ background: 'var(--bg-card-inner)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '10px' }}>
                {language === 'hi' ? 'राष्ट्रीय अनुपालन स्थिति' : 'National Yojna Compliance Status'}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
                <div
                  style={{ padding: '8px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onClick={() => navigate('/dashboard/cows')}
                  title="View INAPH Tagged Herd"
                >
                  <span style={{ color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem' }}>
                    INAPH 12-Digit Tagging <span style={{ color: '#10B981' }}>↗</span>
                  </span>
                  <strong style={{ color: '#10B981', fontSize: '0.9rem' }}>46 / 48 (96%)</strong>
                </div>
                <div
                  style={{ padding: '8px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onClick={() => navigate('/dashboard/health')}
                  title="View NADCP Compliance"
                >
                  <span style={{ color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem' }}>
                    FMD-CP Bi-Annual Vaccine <span style={{ color: '#10B981' }}>↗</span>
                  </span>
                  <strong style={{ color: '#10B981', fontSize: '0.9rem' }}>100% Verified</strong>
                </div>
                <div
                  style={{ padding: '8px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onClick={() => navigate('/dashboard/gobar-dhan')}
                  title="Open GOBAR-DHAN Biogas Ledger"
                >
                  <span style={{ color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem' }}>
                    GOBAR-DHAN Biogas <span style={{ color: '#F97316' }}>↗</span>
                  </span>
                  <strong style={{ color: '#F97316', fontSize: '0.9rem' }}>720 kg/day dung</strong>
                </div>
                <div
                  style={{ padding: '8px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onClick={() => navigate('/dashboard/health')}
                  title="View RGM Purity Audit"
                >
                  <span style={{ color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem' }}>
                    RGM Desi Breed Purity <span style={{ color: '#8B5CF6' }}>↗</span>
                  </span>
                  <strong style={{ color: '#8B5CF6', fontSize: '0.9rem' }}>88% Indigenous</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Banner */}
      <div className="card" style={{ background: isDark ? 'linear-gradient(135deg, rgba(139,92,246,0.14), rgba(14,165,233,0.07))' : 'linear-gradient(135deg, #FAF5FF, #EFF6FF)', border: isDark ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(124,58,237,0.18)', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'20px', padding:'24px 28px', cursor:'pointer' }} onClick={() => navigate('/dashboard/ai')}>
        <div style={{ display:'flex', alignItems:'center', gap:'18px' }}>
          <div style={{ width:'54px', height:'54px', borderRadius:'16px', background:'linear-gradient(135deg, #A855F7, #6366F1)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', flexShrink:0, boxShadow:'0 6px 20px rgba(168,85,247,0.35)' }}>
            <Cpu size={26} />
          </div>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
              <h3 style={{ fontSize:'1.1rem', fontWeight:800, color:'var(--text-primary)' }}>{t('card.aiShowcaseTitle', 'AI Disease Diagnosis')}</h3>
              <span className="badge badge-purple" style={{ fontSize:'0.65rem' }}>MobileNetV2 CNN</span>
            </div>
            <p style={{ fontSize:'0.8125rem', color:'var(--text-secondary)' }}>{t('card.aiShowcaseDesc', 'Detect 5 diseases from cattle photos in under 120ms')}</p>
          </div>
        </div>
        <button className="btn btn-primary" style={{ background:'linear-gradient(135deg, #9333EA, #7C3AED)', boxShadow:'0 4px 16px rgba(147,51,234,0.4)', border:'1px solid rgba(168,85,247,0.5)' }}>
          {t('card.openAiSuite', 'Open AI Suite')} <Sparkles size={15} />
        </button>
      </div>

      {/* Live Rescue Map Modal triggered from Alert */}
      {showRescueMapModal && (
        <RescueMapView
          isModal={true}
          initialSelectedId={selectedRescueId || undefined}
          onClose={() => setShowRescueMapModal(false)}
        />
      )}
    </div>
  );
};

export default DashboardHome;
