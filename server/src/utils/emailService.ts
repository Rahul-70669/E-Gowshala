import nodemailer from 'nodemailer';

// ─── Transport ───────────────────────────────────────────────────────────────
const createTransport = () => {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS) {
    console.warn('[Email] Credentials not configured — email notifications disabled.');
    return null;
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(EMAIL_PORT || '587'),
    secure: parseInt(EMAIL_PORT || '587') === 465,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
};

// ─── Brand Header ────────────────────────────────────────────────────────────
const brandHeader = () => `
  <div style="background: linear-gradient(135deg, #F97316 0%, #EA580C 100%); padding: 28px 32px; border-radius: 12px 12px 0 0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <div style="font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.5px;">
            🐄 E-Gowshala
          </div>
          <div style="font-size: 12px; color: rgba(255,255,255,0.85); margin-top: 4px;">
            गौशाला प्रबंधन प्रणाली · Gaushala Management System
          </div>
        </td>
      </tr>
    </table>
  </div>
`;

// ─── Brand Footer ────────────────────────────────────────────────────────────
const brandFooter = () => `
  <div style="background: #F8FAFC; padding: 20px 32px; border-radius: 0 0 12px 12px; border-top: 1px solid #E2E8F0; text-align: center;">
    <p style="color: #64748B; font-size: 12px; margin: 0 0 6px;">
      This email was sent by E-Gowshala Management System
    </p>
    <p style="color: #94A3B8; font-size: 11px; margin: 0;">
      यह ईमेल ई-गौशाला प्रबंधन प्रणाली द्वारा भेजा गया था
    </p>
  </div>
`;

// ─── Email Wrapper ───────────────────────────────────────────────────────────
const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>E-Gowshala</title>
</head>
<body style="margin:0; padding:0; background:#F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <div style="max-width: 600px; margin: 32px auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
    ${brandHeader()}
    <div style="padding: 32px;">
      ${content}
    </div>
    ${brandFooter()}
  </div>
</body>
</html>
`;

// ─── Template 1: Donation Confirmation + 80G ─────────────────────────────────
export const sendDonationConfirmationEmail = async (opts: {
  to: string;
  donorName: string;
  amount: number;
  receiptNumber: string;
  purpose: string;
  paymentId: string;
  is80GEligible: boolean;
  receiptPdfUrl?: string;
}) => {
  const transport = createTransport();
  if (!transport) return;

  const amountFormatted = opts.amount.toLocaleString('en-IN');
  const date = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  const content = `
    <h2 style="color: #0F172A; font-size: 20px; font-weight: 700; margin: 0 0 8px;">
      🙏 Donation Received — Thank You!
    </h2>
    <p style="color: #475569; font-size: 15px; margin: 0 0 24px;">
      धन्यवाद, ${opts.donorName}! आपका दान प्राप्त हो गया है।<br/>
      <span style="color: #64748B; font-size: 13px;">Dear ${opts.donorName}, your generous donation has been received.</span>
    </p>

    <!-- Donation Summary Card -->
    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #E2E8F0;">
            <span style="color: #64748B; font-size: 13px;">Receipt No.</span>
            <span style="float: right; color: #0F172A; font-weight: 700; font-size: 13px;">${opts.receiptNumber}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #E2E8F0;">
            <span style="color: #64748B; font-size: 13px;">Amount</span>
            <span style="float: right; color: #10B981; font-weight: 800; font-size: 18px;">₹${amountFormatted}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #E2E8F0;">
            <span style="color: #64748B; font-size: 13px;">Purpose</span>
            <span style="float: right; color: #0F172A; font-size: 13px; text-transform: capitalize;">${opts.purpose.replace(/-/g, ' ')}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #E2E8F0;">
            <span style="color: #64748B; font-size: 13px;">Payment ID</span>
            <span style="float: right; color: #0F172A; font-size: 12px; font-family: monospace;">${opts.paymentId}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #64748B; font-size: 13px;">Date</span>
            <span style="float: right; color: #0F172A; font-size: 13px;">${date}</span>
          </td>
        </tr>
      </table>
    </div>

    ${opts.is80GEligible ? `
    <div style="background: linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(5,150,105,0.05) 100%); border: 1px solid rgba(16,185,129,0.2); border-radius: 10px; padding: 16px; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">✅</span>
        <div>
          <div style="color: #065F46; font-weight: 700; font-size: 14px;">80G Tax Exemption Eligible</div>
          <div style="color: #047857; font-size: 12px; margin-top: 2px;">
            आपका दान आयकर अधिनियम की धारा 80G के तहत कर छूट के लिए पात्र है।<br/>
            Your donation qualifies for tax deduction under Section 80G of the Income Tax Act.
          </div>
        </div>
      </div>
      ${opts.receiptPdfUrl ? `
      <div style="margin-top: 12px;">
        <a href="${opts.receiptPdfUrl}" style="display: inline-block; background: #10B981; color: white; padding: 8px 20px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600;">
          📄 Download 80G Receipt (PDF)
        </a>
      </div>
      ` : ''}
    </div>
    ` : ''}

    <p style="color: #64748B; font-size: 13px; line-height: 1.6;">
      Your contribution directly supports the care of rescued cows at our gaushala. We are deeply grateful for your generosity.<br/><br/>
      <span style="color: #94A3B8;">आपका योगदान सीधे हमारी गौशाला में आश्रय पाने वाली गायों की देखभाल में सहायता करता है।</span>
    </p>
  `;

  await transport.sendMail({
    from: `"E-Gowshala 🐄" <${process.env.EMAIL_USER}>`,
    to: opts.to,
    subject: `🙏 Donation Confirmed — ₹${amountFormatted} | ${opts.receiptNumber}`,
    html: emailWrapper(content),
  });

  console.log(`[Email] Donation confirmation sent to ${opts.to}`);
};

// ─── Template 2: Vaccination Due Reminder ────────────────────────────────────
export const sendVaccinationReminderEmail = async (opts: {
  to: string;
  staffName: string;
  vaccinations: Array<{ cowName: string; tagId: string; vaccineName: string; dueDate: string }>;
}) => {
  const transport = createTransport();
  if (!transport) return;

  const rows = opts.vaccinations.map(v => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; color: #0F172A; font-size: 13px;">
        ${v.cowName} <span style="color: #94A3B8; font-size: 11px;">#${v.tagId}</span>
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; color: #3B82F6; font-size: 13px; font-weight: 600;">${v.vaccineName}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0;">
        <span style="background: rgba(239,68,68,0.1); color: #DC2626; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
          ${new Date(v.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
      </td>
    </tr>
  `).join('');

  const content = `
    <h2 style="color: #0F172A; font-size: 20px; font-weight: 700; margin: 0 0 8px;">
      💉 Vaccination Due Reminder
    </h2>
    <p style="color: #475569; font-size: 14px; margin: 0 0 20px;">
      Dear ${opts.staffName}, the following ${opts.vaccinations.length} cattle have vaccinations due soon:<br/>
      <span style="color: #94A3B8; font-size: 12px;">प्रिय ${opts.staffName}, निम्नलिखित पशुओं के टीकाकरण की देय तिथि नजदीक है।</span>
    </p>

    <div style="background: #fff; border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <thead>
          <tr style="background: #F8FAFC;">
            <th style="padding: 10px 12px; text-align: left; font-size: 11px; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E2E8F0;">Cow</th>
            <th style="padding: 10px 12px; text-align: left; font-size: 11px; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E2E8F0;">Vaccine</th>
            <th style="padding: 10px 12px; text-align: left; font-size: 11px; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E2E8F0;">Due Date</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div style="background: rgba(249,115,22,0.08); border: 1px solid rgba(249,115,22,0.2); border-radius: 8px; padding: 14px;">
      <p style="color: #9A3412; font-size: 13px; margin: 0; font-weight: 600;">
        ⚠️ Please schedule these vaccinations in the E-Gowshala system to keep all cattle health records up to date.
      </p>
    </div>
  `;

  await transport.sendMail({
    from: `"E-Gowshala 🐄" <${process.env.EMAIL_USER}>`,
    to: opts.to,
    subject: `💉 ${opts.vaccinations.length} Vaccination(s) Due — Action Required`,
    html: emailWrapper(content),
  });

  console.log(`[Email] Vaccination reminder sent to ${opts.to}`);
};

// ─── Template 3: Health Alert ────────────────────────────────────────────────
export const sendHealthAlertEmail = async (opts: {
  to: string;
  staffName: string;
  cowName: string;
  tagId: string;
  condition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
}) => {
  const transport = createTransport();
  if (!transport) return;

  const severityColors: Record<string, { bg: string; color: string; text: string }> = {
    low:      { bg: 'rgba(34,197,94,0.1)',   color: '#15803D', text: 'Low Severity' },
    medium:   { bg: 'rgba(234,179,8,0.1)',   color: '#92400E', text: 'Medium Severity' },
    high:     { bg: 'rgba(249,115,22,0.1)',  color: '#9A3412', text: 'High Severity — Urgent' },
    critical: { bg: 'rgba(239,68,68,0.1)',   color: '#991B1B', text: '🚨 CRITICAL — Immediate Action Required' },
  };
  const sev = severityColors[opts.severity] || severityColors.medium;

  const content = `
    <h2 style="color: #0F172A; font-size: 20px; font-weight: 700; margin: 0 0 8px;">
      🏥 Health Alert — ${opts.cowName}
    </h2>
    <p style="color: #475569; font-size: 14px; margin: 0 0 20px;">
      Dear ${opts.staffName}, a health condition has been recorded for cattle under your care.<br/>
      <span style="color: #94A3B8; font-size: 12px;">प्रिय ${opts.staffName}, आपकी देखरेख में एक पशु के लिए स्वास्थ्य स्थिति दर्ज की गई है।</span>
    </p>

    <div style="background: ${sev.bg}; border-left: 4px solid ${sev.color}; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <div style="color: ${sev.color}; font-weight: 700; font-size: 14px; margin-bottom: 8px;">${sev.text}</div>
      <table cellpadding="0" cellspacing="0">
        <tr><td style="color: #64748B; font-size: 13px; padding: 4px 0; width: 100px;">Cow Name:</td><td style="color: #0F172A; font-weight: 600; font-size: 13px;">${opts.cowName} <span style="color: #94A3B8;">#${opts.tagId}</span></td></tr>
        <tr><td style="color: #64748B; font-size: 13px; padding: 4px 0;">Condition:</td><td style="color: #0F172A; font-weight: 600; font-size: 13px;">${opts.condition}</td></tr>
        ${opts.notes ? `<tr><td style="color: #64748B; font-size: 13px; padding: 4px 0; vertical-align: top;">Notes:</td><td style="color: #475569; font-size: 13px;">${opts.notes}</td></tr>` : ''}
      </table>
    </div>

    <p style="color: #64748B; font-size: 13px; line-height: 1.6;">
      Please review this health record in the E-Gowshala system and ensure the veterinarian is notified if needed.<br/>
      <span style="color: #94A3B8;">कृपया ई-गौशाला प्रणाली में इस स्वास्थ्य रिकॉर्ड की समीक्षा करें।</span>
    </p>
  `;

  await transport.sendMail({
    from: `"E-Gowshala 🐄" <${process.env.EMAIL_USER}>`,
    to: opts.to,
    subject: `🏥 Health Alert [${opts.severity.toUpperCase()}] — ${opts.cowName} (#${opts.tagId})`,
    html: emailWrapper(content),
  });

  console.log(`[Email] Health alert sent to ${opts.to}`);
};

// ─── Generic Send ────────────────────────────────────────────────────────────
export const sendEmail = async (opts: {
  to: string | string[];
  subject: string;
  html: string;
}) => {
  const transport = createTransport();
  if (!transport) return;
  await transport.sendMail({
    from: `"E-Gowshala 🐄" <${process.env.EMAIL_USER}>`,
    to: Array.isArray(opts.to) ? opts.to.join(',') : opts.to,
    subject: opts.subject,
    html: emailWrapper(opts.html),
  });
};
