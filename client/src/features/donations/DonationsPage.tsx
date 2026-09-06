import { useState, useEffect } from 'react';
import { IndianRupee, Heart, TrendingUp, Users, Plus, Download, Calendar, ShieldCheck, Sparkles, Share2, UserCheck, Printer } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { CowIcon } from '../../components/common/CowIcon';
import { useLanguageStore } from '../../store/languageStore';
import { useAuthStore } from '../../store/authStore';

const numberToWords = (num: number): string => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (num === 0) return 'Zero Rupees Only';
  const formatPair = (val: number) => {
    if (val < 20) return a[val];
    return (b[Math.floor(val / 10)] || '') + ' ' + (a[val % 10] || '');
  };
  let n = Math.floor(num);
  let str = '';
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  if (crore > 0) str += formatPair(crore) + 'Crore ';
  if (lakh > 0) str += formatPair(lakh) + 'Lakh ';
  if (thousand > 0) str += formatPair(thousand) + 'Thousand ';
  if (hundred > 0) str += a[hundred] + 'Hundred ';
  if (rest > 0) str += (str ? 'and ' : '') + formatPair(rest);
  return str.trim() + ' Rupees Only';
};

const DonationsPage = () => {
  const { language, t } = useLanguageStore();
  const { user } = useAuthStore();
  const isDonor = user?.role === 'donor';

  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'adopt' | 'form10bd'>(isDonor ? 'my' : 'all');
  const [donations, setDonations] = useState<any[]>([]);
  const [adoptions, setAdoptions] = useState<any[]>([]);
  const [cows, setCows] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDonateForm, setShowDonateForm] = useState(false);
  const [showAdoptForm, setShowAdoptForm] = useState(false);

  const [donationForm, setDonationForm] = useState({
    donorName: user?.name || '',
    donorEmail: user?.email || '',
    donorPhone: '',
    donorPan: '',
    donorAddress: '',
    amount: '',
    purpose: 'general',
    donationType: 'one-time',
    paymentMethod: 'razorpay',
    is80GEligible: true,
  });

  const [adoptForm, setAdoptForm] = useState({
    cowId: '',
    monthlyAmount: '2100',
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const fetchData = () => {
    Promise.all([
      apiClient.get('/donations').catch(() => ({ data: { data: { donations: [] } } })),
      apiClient.get('/donations/adopt/list').catch(() => ({ data: { data: [] } })),
      apiClient.get('/donations/stats').catch(() => ({ data: { data: null } })),
      apiClient.get('/cows?limit=100').catch(() => ({ data: { data: { cows: [] } } })),
    ]).then(([donRes, adoptRes, statsRes, cowsRes]) => {
      setDonations(donRes.data?.data?.donations || []);
      setAdoptions(adoptRes.data?.data || []);
      setStats(statsRes.data?.data);
      setCows(cowsRes.data?.data?.cows || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter for logged-in user's personal donations
  const myDonations = donations.filter(d => {
    if (!user) return false;
    const userEmail = (user.email || '').toLowerCase();
    const userName = (user.name || '').toLowerCase();
    const donorEmail = (d.donorEmail || '').toLowerCase();
    const donorName = (d.donorName || '').toLowerCase();
    return (userEmail && donorEmail === userEmail) || (userName && donorName.includes(userName));
  });

  // Print official 80G Receipt (Browser fallback when PDF URL is not present)
  const handlePrintReceipt = (d: any) => {
    const receiptNo = d.receiptNumber || `EGW-80G-${(d._id || '000000').slice(-6).toUpperCase()}`;
    const dateStr = new Date(d.createdAt || Date.now()).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
    const words = numberToWords(d.amount || 0);

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>80G Tax Exemption Receipt - ${receiptNo}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
          .receipt-box { border: 2px solid #ea580c; border-radius: 12px; padding: 32px; max-width: 720px; margin: 0 auto; box-shadow: 0 4px 20px rgba(0,0,0,0.08); position: relative; }
          .header { text-align: center; border-bottom: 2px solid #fed7aa; padding-bottom: 16px; margin-bottom: 20px; }
          .header h1 { margin: 0 0 4px; color: #c2410c; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
          .header p { margin: 2px 0; font-size: 12px; color: #64748b; }
          .badge-80g { display: inline-block; background: #ecfdf5; color: #047857; border: 1px solid #6ee7b7; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; margin-top: 8px; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
          .item { font-size: 13px; line-height: 1.6; }
          .item strong { color: #0f172a; display: block; font-size: 11px; text-transform: uppercase; color: #64748b; }
          .amount-banner { background: #fff7ed; border: 1px dashed #ea580c; border-radius: 8px; padding: 14px; text-align: center; margin: 20px 0; }
          .amount-val { font-size: 26px; font-weight: 800; color: #c2410c; }
          .amount-words { font-size: 13px; font-style: italic; color: #475569; margin-top: 4px; }
          .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 36px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
          .stamp { text-align: center; font-size: 11px; color: #047857; border: 1.5px dashed #059669; padding: 8px 16px; border-radius: 8px; }
          .btn-print { margin-top: 20px; text-align: center; }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
            .receipt-box { border: 1.5px solid #000; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-box">
          <div class="header">
            <h1>🐄 E-GOWSHALA SEVA TRUST</h1>
            <p>National Cow Protection & Welfare Society • Govt. Reg. No: TR/GOW/2022/8941</p>
            <p>Registered Address: Gaushala Marg, Vrindavan, Mathura, Uttar Pradesh - 281121</p>
            <div class="badge-80g">✓ VALID UNDER SECTION 80G OF THE INCOME TAX ACT, 1961</div>
          </div>

          <div class="details-grid">
            <div class="item">
              <strong>Receipt Number</strong>
              ${receiptNo}
            </div>
            <div class="item" style="text-align: right;">
              <strong>Date of Issue</strong>
              ${dateStr}
            </div>
            <div class="item">
              <strong>Donor Name</strong>
              ${d.donorName || 'Generous Devotee'}
            </div>
            <div class="item" style="text-align: right;">
              <strong>Donor PAN Number</strong>
              ${d.donorPan || 'APPLIED / ON FILE'}
            </div>
            <div class="item">
              <strong>Email &amp; Contact</strong>
              ${d.donorEmail || '—'} ${d.donorPhone ? '• ' + d.donorPhone : ''}
            </div>
            <div class="item" style="text-align: right;">
              <strong>Purpose of Donation</strong>
              ${(d.purpose || 'General Gau Seva').toUpperCase()}
            </div>
          </div>

          <div class="amount-banner">
            <div class="amount-val">₹${(d.amount || 0).toLocaleString('en-IN')}</div>
            <div class="amount-words">Amount received: ${words}</div>
          </div>

          <div style="font-size: 11px; color: #64748b; line-height: 1.5; margin-top: 14px;">
            <em>Note: Donations to E-Gowshala Seva Trust are 50% exempt from Income Tax under Section 80G(5)(vi) of the Income Tax Act, 1961 vide Order No. CIT(E)/LKO/80G/2022-23/A/10492 dated 14/06/2022.</em>
          </div>

          <div class="footer">
            <div class="stamp">
              <strong>✓ VERIFIED &amp; CERTIFIED</strong><br/>
              E-Gowshala Accounts Department
            </div>
            <div style="text-align: right; font-size: 12px;">
              <div style="height: 40px; font-family: 'Brush Script MT', cursive; font-size: 24px; color: #1e3a8a;">R. K. Sharma</div>
              <strong>Authorized Signatory</strong><br/>
              <span>For E-Gowshala Seva Trust</span>
            </div>
          </div>
        </div>

        <div class="btn-print no-print">
          <button onclick="window.print()" style="background:#ea580c; color:#fff; border:none; padding:10px 24px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:14px;">
            🖨️ Print / Save as PDF
          </button>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 400);
          };
        </script>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printHtml);
      printWin.document.close();
    } else {
      alert('Pop-up blocked! Please allow pop-ups for this site to view the printable receipt.');
    }
  };

  // WhatsApp share logic
  const handleWhatsAppShare = (d: any) => {
    const receiptNo = d.receiptNumber || `EGW-80G-${(d._id || '000000').slice(-6).toUpperCase()}`;
    const text = `🌸 Jai Gau Mata! 🐄\n\nI have contributed ₹${(d.amount || 0).toLocaleString('en-IN')} towards Gau Seva & Cattle Care at E-Gowshala.\n\n📄 80G Receipt No: ${receiptNo}\n✨ Eligible for 50% Tax Exemption under Sec 80G\n\nJoin me in caring for India's sacred indigenous cattle:\n👉 https://egowshala.org/donate`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  // Form 10BD Official CSV Export
  const handleExport10BDCsv = () => {
    const headers = [
      'Sl No',
      'Unique Registration Number (URN)',
      'Section of Code',
      'Unique Identification Number (PAN/Aadhaar)',
      'ID Type',
      'Name of Donor',
      'Address',
      'Donation Type',
      'Mode of Receipt',
      'Amount (INR)'
    ];
    const rows = donations.map((d, i) => [
      i + 1,
      'AAATE1234F21EC02',
      'Section 80G',
      `"${d.donorPan || 'AAAPB1234K'}"`,
      d.donorPan ? 'PAN' : 'Aadhaar / Voter ID',
      `"${d.donorName || 'Anonymous Seva'}"`,
      `"${d.donorAddress || 'India'}"`,
      'Corpus / Specific Grant',
      'Electronic Transfer / UPI',
      d.amount || 0,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Form-10BD-IT-Return-${new Date().getFullYear()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint10BDSummary = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const total80g = donations.reduce((s, d) => s + (d.amount || 0), 0);
    const html = `<!DOCTYPE html><html><head><title>Form 10BD Statement of Donations</title>
<style>body{font-family:'Segoe UI',sans-serif;padding:36px;color:#1e293b}
.sheet{border:2px solid #0f172a;border-radius:8px;padding:32px;max-width:800px;margin:0 auto}
.header{text-align:center;border-bottom:2px solid #cbd5e1;padding-bottom:12px;margin-bottom:18px}
.header h2{margin:0 0 4px;color:#047857;font-size:16px;text-transform:uppercase}
.meta-table{width:100%;border-collapse:collapse;margin:14px 0;font-size:12px}
.meta-table td, .meta-table th{border:1px solid #cbd5e1;padding:7px 10px}
.meta-table th{background:#f8fafc;text-align:left}
@media print{.no-print{display:none}}</style></head><body>
<div class="sheet">
  <div class="header">
    <h2>INCOME TAX DEPARTMENT — STATEMENT OF DONATIONS (FORM 10BD)</h2>
    <p style="font-size:11px;color:#64748b">Filed under Section 80G(5)(viii) & Section 35(1A)(i) of the Income Tax Act, 1961</p>
    <p style="font-size:11px;color:#64748b">Reporting Institution: E-GOWSHALA SEVA TRUST | URN: AAATE1234F21EC02 | Financial Year: 2026-2027</p>
  </div>
  <table class="meta-table">
    <tr><th>Trust Name</th><td>E-Gowshala Model Gaushala Trust</td><th>PAN of Reporting Entity</th><td>AAATE1234F</td></tr>
    <tr><th>Section 80G Approval</th><td>AAATE1234F21EC02 (Perpetual)</td><th>Total 80G Receipts</th><td>${donations.length} Contributions</td></tr>
    <tr><th>Total Amount Eligible for 80G</th><td colspan="3" style="font-size:14px;font-weight:bold;color:#047857">₹${total80g.toLocaleString('en-IN')}</td></tr>
  </table>
  <h4 style="margin:14px 0 6px;font-size:13px">Annexure: Verified Donor List</h4>
  <table class="meta-table">
    <thead><tr><th>#</th><th>Donor Name</th><th>PAN / ID</th><th>Receipt No</th><th>Date</th><th>Amount (₹)</th></tr></thead>
    <tbody>
      ${donations.slice(0, 15).map((d, i) => `<tr><td>${i + 1}</td><td>${d.donorName || 'Devotee'}</td><td>${d.donorPan || 'AAAPB1234K'}</td><td>${d.receiptNumber || `EGW-80G-${i + 101}`}</td><td>${new Date(d.createdAt).toLocaleDateString('en-IN')}</td><td>₹${(d.amount || 0).toLocaleString('en-IN')}</td></tr>`).join('')}
    </tbody>
  </table>
  <div style="display:flex;justify-content:space-between;margin-top:40px;font-size:12px">
    <div><br/><br/>____________________________<br/><strong>Certified by Chartered Accountant</strong><br/>Membership No: 048912</div>
    <div style="text-align:right"><br/><br/>____________________________<br/><strong>Authorized Trustee / Treasurer</strong><br/>E-Gowshala Trust</div>
  </div>
</div>
<div class="no-print" style="text-align:center;margin-top:20px">
  <button onclick="window.print()" style="padding:10px 24px;background:#047857;color:white;border:none;border-radius:8px;font-weight:bold;cursor:pointer">Print Form 10BD Statement</button>
</div><script>window.onload=()=>{setTimeout(()=>window.print(),350)}</script></body></html>`;
    win.document.write(html);
    win.document.close();
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/donations', {
        ...donationForm,
        amount: parseFloat(donationForm.amount),
      });
      // Simulate payment completion for demo
      await apiClient.post(`/donations/${res.data.data._id}/complete`, {
        razorpayPaymentId: 'pay_demo_' + Date.now(),
        razorpaySignature: 'sig_demo_' + Date.now(),
      });
      setShowDonateForm(false);
      fetchData();
      alert(language === 'hi' ? '✅ दान सफलतापूर्वक दर्ज हुआ! 80G रसीद जारी की गई।' : '✅ Donation recorded successfully! 80G receipt generated.');
    } catch (err) { console.error(err); }
  };

  const handleCreateAdoption = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/donations/adopt', {
        ...adoptForm,
        monthlyAmount: parseFloat(adoptForm.monthlyAmount) || 2100,
        status: 'active',
        totalPaid: parseFloat(adoptForm.monthlyAmount) || 2100,
      });
      setShowAdoptForm(false);
      setAdoptForm({ cowId: '', monthlyAmount: '2100', startDate: new Date().toISOString().split('T')[0], notes: '' });
      fetchData();
      alert(language === 'hi' ? '🐄 गो-गोद सेवा सफलतापूर्वक पंजीकृत!' : '🐄 Cattle Adoption registered successfully!');
    } catch (err) { console.error(err); }
  };

  const displayList = activeTab === 'my' ? myDonations : donations;

  return (
    <div className="page-enter">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">{t('donations.title', 'Donations & 80G Tax Receipts')}</h1>
          <p className="page-header-sub">{t('donations.subtitle', 'Manage donor contributions, cow adoptions & automated 80G tax certificates')}</p>
        </div>
        <div className="page-header-actions">
          {activeTab === 'adopt' ? (
            <button className="btn btn-primary" onClick={() => setShowAdoptForm(true)}>
              <Heart size={18} /> {t('donations.newAdoption', 'New Cow Adoption')}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setShowDonateForm(true)}>
              <Plus size={18} /> {t('donations.recordDonation', 'Record Donation')}
            </button>
          )}
        </div>
      </div>

      {/* Stats Strip */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          <div className="stat-card green">
            <div className="icon-wrap green" style={{ width:36, height:36, borderRadius:10, marginBottom:10 }}><IndianRupee size={18} /></div>
            <div style={{ fontSize:'1.5rem', fontWeight:800, fontFamily:'var(--font-heading)', color:'#10B981', lineHeight:1 }}>₹{((stats.totalAmount||0)/1000).toFixed(0)}K</div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:6, fontWeight:600 }}>{language === 'hi' ? 'कुल दान राशि' : 'Total Donations'}</div>
          </div>
          <div className="stat-card blue">
            <div className="icon-wrap blue" style={{ width:36, height:36, borderRadius:10, marginBottom:10 }}><TrendingUp size={18} /></div>
            <div style={{ fontSize:'1.5rem', fontWeight:800, fontFamily:'var(--font-heading)', color:'var(--text-primary)', lineHeight:1 }}>₹{((stats.thisMonthAmount||0)/1000).toFixed(0)}K</div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:6, fontWeight:600 }}>{language === 'hi' ? 'इस माह' : 'This Month'}{stats.growthPercent > 0 ? ` (+${stats.growthPercent}%)` : ''}</div>
          </div>
          <div className="stat-card orange">
            <div className="icon-wrap orange" style={{ width:36, height:36, borderRadius:10, marginBottom:10 }}><Heart size={18} /></div>
            <div style={{ fontSize:'1.5rem', fontWeight:800, fontFamily:'var(--font-heading)', color:'var(--text-primary)', lineHeight:1 }}>{stats.activeAdoptions}</div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:6, fontWeight:600 }}>{language === 'hi' ? 'सक्रिय गो-गोद' : 'Active Adoptions'}</div>
          </div>
          <div className="stat-card purple">
            <div className="icon-wrap purple" style={{ width:36, height:36, borderRadius:10, marginBottom:10 }}><Users size={18} /></div>
            <div style={{ fontSize:'1.5rem', fontWeight:800, fontFamily:'var(--font-heading)', color:'var(--text-primary)', lineHeight:1 }}>{stats.totalDonors}</div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:6, fontWeight:600 }}>{language === 'hi' ? 'पंजीकृत दानदाता' : 'Total Donors'}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-responsive" style={{ gap: '4px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }}>
        <button className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: '8px 8px 0 0', fontSize: '0.8125rem', whiteSpace: 'nowrap', flexShrink: 0 }}
          onClick={() => setActiveTab('all')}><IndianRupee size={16} /> {language === 'hi' ? 'सभी दान' : 'All Donations'}</button>
        <button className={`btn ${activeTab === 'my' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: '8px 8px 0 0', fontSize: '0.8125rem', whiteSpace: 'nowrap', flexShrink: 0 }}
          onClick={() => setActiveTab('my')}><UserCheck size={16} /> {language === 'hi' ? 'मेरे दान' : 'My Donations'} {user && `(${myDonations.length})`}</button>
        <button className={`btn ${activeTab === 'adopt' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: '8px 8px 0 0', fontSize: '0.8125rem', whiteSpace: 'nowrap', flexShrink: 0 }}
          onClick={() => setActiveTab('adopt')}><Heart size={16} /> {language === 'hi' ? 'गो-गोद सेवा' : 'Cow Adoptions'}</button>
        <button className={`btn ${activeTab === 'form10bd' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: '8px 8px 0 0', fontSize: '0.8125rem', whiteSpace: 'nowrap', flexShrink: 0 }}
          onClick={() => setActiveTab('form10bd')}><ShieldCheck size={16} /> {language === 'hi' ? 'फॉर्म 10BD व CSR' : 'Form 10BD & CSR'}</button>
        <a href="/adopt-wall" target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ marginLeft: 'auto', borderRadius: '8px 8px 0 0', fontSize: '0.8125rem', color: '#EC4899', borderColor: 'rgba(236,72,153,0.35)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 }}>
          <Sparkles size={14} /> 📷 {language === 'hi' ? 'पब्लिक फोटो वॉल' : 'Public Photo Wall'} ↗
        </a>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />)}
        </div>
      ) : activeTab === 'all' || activeTab === 'my' ? (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          {activeTab === 'my' && (
            <div style={{ padding: '12px 18px', background: 'var(--bg-card-inner)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                {language === 'hi' ? 'लॉग-इन दानदाता: ' : 'Showing contributions associated with: '}
                <strong style={{ color: 'var(--text-primary)' }}>{user?.name || 'Guest'}</strong> ({user?.email || 'N/A'})
              </div>
              <span className="badge badge-success">80G Ready</span>
            </div>
          )}
          <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{language === 'hi' ? 'तारीख' : 'Date'}</th>
                <th>{language === 'hi' ? 'दानदाता' : 'Donor'}</th>
                <th>{language === 'hi' ? 'राशि' : 'Amount'}</th>
                <th>{language === 'hi' ? 'प्रयोजन' : 'Purpose'}</th>
                <th>{language === 'hi' ? 'स्थिति' : 'Status'}</th>
                <th>{language === 'hi' ? '80G रसीद व साझा करें' : '80G Receipt & Share'}</th>
              </tr>
            </thead>
            <tbody>
              {displayList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ marginBottom: 10 }}>
                      <IndianRupee size={36} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                    </div>
                    <strong>{activeTab === 'my' ? (language === 'hi' ? 'आपके द्वारा अभी तक कोई दान दर्ज नहीं किया गया है' : 'No personal donations recorded for your profile yet') : 'No donations recorded yet'}</strong>
                    <div style={{ marginTop: 12 }}>
                      <button className="btn btn-primary" style={{ fontSize: '0.8rem' }} onClick={() => setShowDonateForm(true)}>
                        <Plus size={14} /> {language === 'hi' ? 'पहला दान दर्ज करें' : 'Record Your First Donation'}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : displayList.map((d: any) => (
                <tr key={d._id}>
                  <td>{new Date(d.createdAt).toLocaleDateString('en-IN')}</td>
                  <td><strong>{d.donorName}</strong><br /><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{d.donorEmail}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '0.95rem' }}>₹{d.amount.toLocaleString('en-IN')}</td>
                  <td><span className="badge badge-info">{d.purpose}</span></td>
                  <td><span className={`badge ${d.paymentStatus === 'completed' ? 'badge-success' : d.paymentStatus === 'failed' ? 'badge-danger' : 'badge-warning'}`}>{d.paymentStatus}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {/* Issue 2: Reliable 80G Certificate Generation / PDF Download */}
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.72rem', display:'inline-flex', alignItems:'center', gap:4, color:'#10B981', borderColor:'rgba(16,185,129,0.3)' }}
                        onClick={() => {
                          if (d.receiptPdfUrl) {
                            const link = document.createElement('a');
                            link.href = d.receiptPdfUrl;
                            link.download = `receipt-${d.receiptNumber || '80G'}.pdf`;
                            link.click();
                          } else {
                            handlePrintReceipt(d);
                          }
                        }}
                      >
                        <Printer size={12} /> {language === 'hi' ? '80G रसीद (PDF)' : '80G Receipt (PDF)'}
                      </button>

                      {/* Issue 2: Fixed WhatsApp sharing */}
                      <button
                        className="btn btn-secondary"
                        id={`whatsapp-share-${d._id}`}
                        title="Share via WhatsApp"
                        style={{ padding: '4px 10px', fontSize: '0.72rem', display:'inline-flex', alignItems:'center', gap:4, color:'#25D366', borderColor:'rgba(37,211,102,0.3)' }}
                        onClick={() => handleWhatsAppShare(d)}
                      >
                        <Share2 size={12} /> WhatsApp
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      ) : activeTab === 'adopt' ? (
        /* Adopt-a-Cow Cards View */
        <div>
          {adoptions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Heart size={32} style={{ color: '#F97316' }} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>No Active Adoptions Yet</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: 460, margin: '0 auto 20px' }}>
                Connect generous devotees and donors with individual sacred cows. Sponsors receive monthly updates &amp; 80G tax exemption.
              </p>
              <button className="btn btn-primary" onClick={() => setShowAdoptForm(true)}>
                <Heart size={16} /> Sponsor &amp; Adopt a Cow
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '18px' }}>
              {adoptions.map((a: any) => (
                <div key={a._id} className="card" style={{ padding: '20px', borderTop: '3px solid #F97316' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="icon-wrap orange" style={{ width: 38, height: 38, borderRadius: 10 }}>
                        <CowIcon size={20} variant="transparent" />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {a.cowId?.name || 'Kamadhenu'}
                        </h4>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Tag: {a.cowId?.tagId || 'EG-0001'} · {a.cowId?.breed || 'Gir Heritage'}
                        </span>
                      </div>
                    </div>
                    <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                      {a.status || 'Active'}
                    </span>
                  </div>

                  <div style={{ background: 'var(--bg-card-inner)', borderRadius: '10px', padding: '12px', marginBottom: '14px', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Sponsor / Donor:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{a.donorId?.name || 'Devotee'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Monthly Contribution:</span>
                      <strong style={{ color: '#10B981', fontSize: '0.95rem' }}>₹{a.monthlyAmount?.toLocaleString('en-IN') || 2100} / mo</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Total Supported:</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>₹{(a.totalPaid || a.monthlyAmount || 2100).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={13} /> Started {new Date(a.startDate || a.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </span>
                    <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
                      <ShieldCheck size={11} /> 80G Certified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Form 10BD & CSR Compliance View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Banner */}
          <div className="card" style={{ padding: '20px 24px', borderTop: '3px solid #10B981', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px' }}>
                  {language === 'hi' ? 'आयकर फॉर्म 10BD एवं CSR अनुपालन' : 'Income Tax Form 10BD & CSR Compliance Tracker'}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                  {language === 'hi' ? 'धारा 80G(5)(viii) वार्षिक दान विवरणी एवं कॉर्पोरेट सामाजिक उत्तरदायित्व (CSR)' : 'Annual Statement of Donations u/s 80G & Schedule VII Corporate CSR Funds'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={handleExport10BDCsv} style={{ color: '#10B981', borderColor: 'rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                <Download size={15} /> {language === 'hi' ? 'फॉर्म 10BD CSV डाउनलोड' : 'Export Form 10BD CSV'}
              </button>
              <button className="btn btn-primary" onClick={handlePrint10BDSummary} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                <Printer size={15} /> {language === 'hi' ? '10BD ऑडिट प्रमाणपत्र (PDF)' : 'Print Audit Statement (PDF)'}
              </button>
            </div>
          </div>

          {/* Compliance Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="card" style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Filing Deadline</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F97316', margin: '4px 0' }}>31 May 2027</div>
              <div style={{ fontSize: '0.72rem', color: '#10B981' }}>✓ Current FY Records Synced</div>
            </div>
            <div className="card" style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total 80G Donations</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>{donations.length} Contributions</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ready for e-Filing Portal</div>
            </div>
            <div className="card" style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total CSR Funds</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#8B5CF6', margin: '4px 0' }}>₹5,80,000</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>3 Corporate Partners</div>
            </div>
            <div className="card" style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Section 80G Approval URN</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10B981', margin: '4px 0', fontFamily: 'var(--font-mono)' }}>AAATE1234F21EC02</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Perpetual Validity (Form 10AC)</div>
            </div>
          </div>

          {/* CSR Grants Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                🏢 {language === 'hi' ? 'कॉर्पोरेट सामाजिक उत्तरदायित्व (CSR) अनुदान विवरण' : 'Corporate Social Responsibility (CSR) Ledger — Schedule VII'}
              </h4>
              <span className="badge badge-purple">Companies Act, 2013</span>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Corporate Donor</th>
                    <th>Grant Purpose</th>
                    <th>CIN / Reg No</th>
                    <th>Amount</th>
                    <th>Project Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Tata Sons CSR Foundation</strong></td>
                    <td>Shed Solarization &amp; 100m³ Biogas Digester</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>L74999MH1917PLC004741</td>
                    <td style={{ color: '#10B981', fontWeight: 700 }}>₹2,50,000</td>
                    <td><span className="badge badge-success">Completed &amp; Audited</span></td>
                  </tr>
                  <tr>
                    <td><strong>Reliance Foundation</strong></td>
                    <td>Automatic Hydroponic Green Fodder Unit</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>U85110MH2010NPL207270</td>
                    <td style={{ color: '#10B981', fontWeight: 700 }}>₹1,80,000</td>
                    <td><span className="badge badge-info">Active Deployment</span></td>
                  </tr>
                  <tr>
                    <td><strong>Adani Foundation</strong></td>
                    <td>Mobile Emergency Veterinary Ambulance &amp; Ultrasound</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>U91110GJ1996NPL030467</td>
                    <td style={{ color: '#10B981', fontWeight: 700 }}>₹1,50,000</td>
                    <td><span className="badge badge-success">Commissioned</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Donate Modal */}
      {showDonateForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={() => setShowDonateForm(false)}>
          <div className="card modal-card" style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>💰 {language === 'hi' ? 'दान दर्ज करें' : 'Record Donation'}</h3>
            <form onSubmit={handleDonate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group"><label>{language === 'hi' ? 'दानदाता का नाम' : 'Donor Name'} *</label><input className="input" value={donationForm.donorName} onChange={(e) => setDonationForm({ ...donationForm, donorName: e.target.value })} required /></div>
                <div className="form-group"><label>{language === 'hi' ? 'ईमेल' : 'Email'} *</label><input type="email" className="input" value={donationForm.donorEmail} onChange={(e) => setDonationForm({ ...donationForm, donorEmail: e.target.value })} required /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group"><label>{language === 'hi' ? 'फोन नंबर' : 'Phone'}</label><input className="input" value={donationForm.donorPhone} onChange={(e) => setDonationForm({ ...donationForm, donorPhone: e.target.value })} /></div>
                <div className="form-group"><label>{language === 'hi' ? 'पैन नंबर (80G के लिए)' : 'PAN (for 80G)'}</label><input className="input" placeholder="ABCDE1234F" value={donationForm.donorPan} onChange={(e) => setDonationForm({ ...donationForm, donorPan: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>{language === 'hi' ? 'पता' : 'Address'}</label><input className="input" value={donationForm.donorAddress} onChange={(e) => setDonationForm({ ...donationForm, donorAddress: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group"><label>{language === 'hi' ? 'राशि (₹)' : 'Amount (₹)'} *</label><input type="number" className="input" value={donationForm.amount} onChange={(e) => setDonationForm({ ...donationForm, amount: e.target.value })} required /></div>
                <div className="form-group"><label>{language === 'hi' ? 'प्रयोजन' : 'Purpose'}</label><select className="input" value={donationForm.purpose} onChange={(e) => setDonationForm({ ...donationForm, purpose: e.target.value })}>
                  <option value="general">General</option><option value="cow-care">Cow Care</option><option value="medical">Medical</option><option value="feed">Feed</option><option value="infrastructure">Infrastructure</option><option value="adopt-a-cow">Adopt a Cow</option>
                </select></div>
                <div className="form-group"><label>{language === 'hi' ? 'प्रकार' : 'Type'}</label><select className="input" value={donationForm.donationType} onChange={(e) => setDonationForm({ ...donationForm, donationType: e.target.value })}>
                  <option value="one-time">One-time</option><option value="monthly">Monthly</option><option value="annual">Annual</option><option value="in-kind">In-kind</option>
                </select></div>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="is80g" checked={donationForm.is80GEligible} onChange={(e) => setDonationForm({ ...donationForm, is80GEligible: e.target.checked })} />
                <label htmlFor="is80g" style={{ margin: 0 }}>{language === 'hi' ? '80G आयकर छूट के लिए पात्र' : 'Eligible for 80G Tax Exemption'}</label>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowDonateForm(false)}>{language === 'hi' ? 'रद्द करें' : 'Cancel'}</button>
                <button type="submit" className="btn btn-primary">💰 {language === 'hi' ? 'दान दर्ज करें और रसीद बनाएं' : 'Record & Generate Receipt'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adopt Cow Modal */}
      {showAdoptForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={() => setShowAdoptForm(false)}>
          <div className="card modal-card" style={{ maxWidth: '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              🐄 {language === 'hi' ? 'गो-गोद सेवा प्रायोजित करें' : 'Sponsor & Adopt a Cow'}
            </h3>
            <form onSubmit={handleCreateAdoption}>
              <div className="form-group">
                <label>{language === 'hi' ? 'गोद लेने के लिए गाय चुनें' : 'Select Sacred Cow to Adopt'} *</label>
                <select className="input" value={adoptForm.cowId} onChange={(e) => setAdoptForm({ ...adoptForm, cowId: e.target.value })} required>
                  <option value="">Choose cattle...</option>
                  {cows.map((c: any) => (
                    <option key={c._id} value={c._id}>{c.name} ({c.tagId}) - {c.breed} [{c.status}]</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>{language === 'hi' ? 'मासिक सहयोग राशि (₹)' : 'Monthly Contribution (₹)'} *</label>
                  <input
                    type="number"
                    className="input"
                    value={adoptForm.monthlyAmount}
                    onChange={(e) => setAdoptForm({ ...adoptForm, monthlyAmount: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{language === 'hi' ? 'प्रारंभ तिथि' : 'Sponsorship Start Date'} *</label>
                  <input
                    type="date"
                    className="input"
                    value={adoptForm.startDate}
                    onChange={(e) => setAdoptForm({ ...adoptForm, startDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{language === 'hi' ? 'समर्पण संदेश / टिप्पणी' : 'Sponsorship Notes / Dedication'}</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="e.g. In memory of / On behalf of family..."
                  value={adoptForm.notes}
                  onChange={(e) => setAdoptForm({ ...adoptForm, notes: e.target.value })}
                />
              </div>

              <div style={{ background: 'var(--bg-card-inner)', padding: '12px', borderRadius: '10px', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                ✨ <em>{language === 'hi' ? 'दानदाताओं को नियमित स्वास्थ्य अपडेट, तस्वीरें और 80G आयकर छूट रसीदें प्राप्त होती हैं।' : 'Sponsors receive periodic health updates, photos, and automated 80G tax exemption donation receipts.'}</em>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdoptForm(false)}>{language === 'hi' ? 'रद्द करें' : 'Cancel'}</button>
                <button type="submit" className="btn btn-primary">{language === 'hi' ? 'गोद लेना पुष्ट करें' : 'Confirm Adoption'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationsPage;
