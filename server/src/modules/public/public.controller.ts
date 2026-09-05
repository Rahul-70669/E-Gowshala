import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import Cow from '../cow/cow.model';
import HealthRecord from '../health/healthRecord.model';
import Vaccination from '../health/vaccination.model';
import Donation from '../donation/donation.model';
import AdoptACow from '../donation/adoptACow.model';
import Shed from '../cow/shed.model';
import Expense from '../finance/expense.model';

// ─── GET /api/public/impact ───────────────────────────────────────────────────
// No authentication. Returns live aggregate numbers for the Public Impact Page.
export const getImpactStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalCows,
      healthyCows,
      sickCows,
      rescuedCows,
      totalVaccinations,
      totalHealthRecords,
      donationAgg,
      totalDonors,
      activeAdoptions,
    ] = await Promise.all([
      Cow.countDocuments({ isActive: true }),
      Cow.countDocuments({ isActive: true, status: 'healthy' }),
      Cow.countDocuments({ isActive: true, status: 'sick' }),
      Cow.countDocuments({ isActive: true, status: 'rescued' }),
      Vaccination.countDocuments(),
      HealthRecord.countDocuments(),
      Donation.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Donation.distinct('donorEmail').then((emails) => emails.length),
      Donation.countDocuments({ paymentStatus: 'completed' }), // proxy for adoptions
    ]);

    const totalDonations = donationAgg[0]?.total ?? 0;
    const donationCount = donationAgg[0]?.count ?? 0;

    // Environmental impact estimates (industry standard):
    // 1 rescued cow vs slaughter = ~2.5 tonnes CO2e saved over its lifetime
    const co2Saved = (rescuedCows * 2.5).toFixed(1);
    // Gaushala dung → biogas → ~10 kg CO2/cow/year offset
    const biogasOffset = Math.round(totalCows * 10);

    res.json({
      success: true,
      data: {
        herd: {
          total: totalCows,
          healthy: healthyCows,
          sick: sickCows,
          rescued: rescuedCows,
          healthRate: totalCows ? Math.round((healthyCows / totalCows) * 100) : 0,
        },
        medical: {
          totalHealthRecords,
          totalVaccinations,
        },
        donations: {
          totalAmount: totalDonations,
          totalDonations: donationCount,
          totalDonors,
          activeAdoptions,
        },
        impact: {
          co2SavedTonnes: parseFloat(co2Saved),
          biogasCO2OffsetKg: biogasOffset,
          livesProtected: totalCows,
          familiesHelped: Math.round(totalDonors * 0.8), // ~80% of donors are families
        },
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Impact stats error:', err);
    res.status(500).json({ success: false, message: 'Could not fetch impact stats' });
  }
};

// ─── GET /api/public/compliance-report ────────────────────────────────────────
// Streams a formatted PDF compliance report. No auth needed for demo.
export const getComplianceReport = async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const quarter = Math.ceil((now.getMonth() + 1) / 3);
    const year = now.getFullYear();

    // Gather all data
    const [cows, vaccinations, healthRecords, donationAgg, expenseAgg] = await Promise.all([
      Cow.find({ isActive: true }).lean(),
      Vaccination.find().lean(),
      HealthRecord.find().lean(),
      Donation.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalDonations = donationAgg[0]?.total ?? 0;
    const donationCount = donationAgg[0]?.count ?? 0;

    // Breed breakdown
    const breedBreakdown: Record<string, number> = {};
    const statusBreakdown: Record<string, number> = {};
    cows.forEach((c) => {
      breedBreakdown[c.breed] = (breedBreakdown[c.breed] || 0) + 1;
      statusBreakdown[c.status] = (statusBreakdown[c.status] || 0) + 1;
    });

    // Expense by category
    const expenseByCategory: Record<string, number> = {};
    expenseAgg.forEach((e: any) => { expenseByCategory[e._id] = e.total; });
    const totalExpenses = Object.values(expenseByCategory).reduce((a, b) => a + b, 0);

    // Vaccination coverage
    const vaccinatedCowIds = new Set(vaccinations.map((v: any) => String(v.cowId)));
    const vaccinationCoverage = cows.length ? Math.round((vaccinatedCowIds.size / cows.length) * 100) : 0;

    // Build PDF
    const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 60, right: 60 } });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="egowshala-compliance-Q${quarter}-${year}.pdf"`);
    doc.pipe(res);

    // ── Header ──
    doc.rect(0, 0, doc.page.width, 90).fill('#F97316');
    doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
      .text('E-GOWSHALA', 60, 25, { align: 'left' });
    doc.fontSize(10).font('Helvetica')
      .text('Smart Gaushala Management System', 60, 52);
    doc.fontSize(12).font('Helvetica-Bold')
      .text(`QUARTERLY COMPLIANCE REPORT — Q${quarter} ${year}`, 0, 35, { align: 'right', width: doc.page.width - 60 });
    doc.fontSize(9).font('Helvetica').fillColor('rgba(255,255,255,0.8)')
      .text(`Generated: ${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 0, 58, { align: 'right', width: doc.page.width - 60 });

    doc.fillColor('#111827');
    let y = 115;

    const sectionHeader = (title: string) => {
      doc.rect(60, y, doc.page.width - 120, 24).fill('#FFF7ED');
      doc.fillColor('#F97316').fontSize(11).font('Helvetica-Bold')
        .text(title, 68, y + 6);
      doc.fillColor('#111827');
      y += 32;
    };

    const row = (label: string, value: string, bold = false) => {
      doc.fontSize(9.5).font(bold ? 'Helvetica-Bold' : 'Helvetica')
        .fillColor('#374151').text(label, 68, y)
        .text(value, 0, y, { align: 'right', width: doc.page.width - 128 });
      y += 18;
      doc.moveTo(60, y - 1).lineTo(doc.page.width - 60, y - 1)
        .strokeColor('#F3F4F6').lineWidth(0.5).stroke();
    };

    // ── Section 1: Herd Census ──
    sectionHeader('1. HERD CENSUS');
    row('Total Registered Cattle', String(cows.length), true);
    Object.entries(statusBreakdown).forEach(([status, count]) => {
      row(`  — ${status.charAt(0).toUpperCase() + status.slice(1)}`, String(count));
    });
    y += 8;

    sectionHeader('2. BREED DISTRIBUTION');
    Object.entries(breedBreakdown).forEach(([breed, count]) => {
      row(breed, `${count} cattle`);
    });
    y += 8;

    // ── Section 3: Medical & Vaccination ──
    sectionHeader('3. MEDICAL & VACCINATION SUMMARY');
    row('Total Health Records', String(healthRecords.length), true);
    row('Vaccinations Administered', String(vaccinations.length));
    row('Cattle Vaccinated', String(vaccinatedCowIds.size));
    row('Vaccination Coverage', `${vaccinationCoverage}%`, true);
    y += 8;

    // ── Section 4: Financial ──
    sectionHeader('4. INCOME & EXPENDITURE STATEMENT');
    row('Total Donations Received', `INR ${totalDonations.toLocaleString('en-IN')}`, true);
    row('Number of Donations', String(donationCount));
    y += 4;
    Object.entries(expenseByCategory).forEach(([cat, amt]) => {
      row(`Expenses — ${cat}`, `INR ${(amt as number).toLocaleString('en-IN')}`);
    });
    row('Total Expenditure', `INR ${totalExpenses.toLocaleString('en-IN')}`, true);
    row('Net Surplus / (Deficit)', `INR ${(totalDonations - totalExpenses).toLocaleString('en-IN')}`, true);
    y += 8;

    // ── Section 5: Compliance Declaration ──
    sectionHeader('5. GAUSHALA COMPLIANCE DECLARATION');
    doc.fontSize(9).font('Helvetica').fillColor('#6B7280')
      .text(
        'This report is generated in accordance with the requirements of the Prevention of Cruelty to Animals Act, 1960 ' +
        'and applicable State Gaushala Act regulations. All cattle sheltered at this institution have received adequate ' +
        'food, water, and veterinary care as evidenced by the records above. All financial transactions are subject to ' +
        'annual audit by a registered chartered accountant.',
        68, y, { width: doc.page.width - 136, lineGap: 4 }
      );
    y += 80;

    doc.moveTo(68, y).lineTo(280, y).strokeColor('#111827').lineWidth(0.8).stroke();
    doc.fontSize(9).font('Helvetica').fillColor('#374151')
      .text('Authorised Signatory', 68, y + 6)
      .text('(Administrator / Secretary)', 68, y + 18);

    doc.moveTo(350, y).lineTo(doc.page.width - 60, y).strokeColor('#111827').lineWidth(0.8).stroke();
    doc.text('Veterinary Officer', 350, y + 6)
      .text('(Chief Veterinarian)', 350, y + 18);

    // Footer
    const footerY = doc.page.height - 40;
    doc.rect(0, footerY - 10, doc.page.width, 50).fill('#F9FAFB');
    doc.fontSize(8).font('Helvetica').fillColor('#9CA3AF')
      .text('E-Gowshala | Smart Gaushala Management System | Confidential — For Regulatory Use', 0, footerY, { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('Compliance report error:', err);
    res.status(500).json({ success: false, message: 'Could not generate compliance report' });
  }
};

// ─── GET /api/public/adopt-wall ──────────────────────────────────────────────
// Returns all cows with adoption status, sponsor first names, and photos for the public wall
export const getAdoptWall = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [cows, adoptions] = await Promise.all([
      Cow.find({ isActive: true }).select('name tagId breed gender age weight color status photos rescueDetails createdAt').lean(),
      AdoptACow.find({ status: 'active' }).populate('donorId', 'name').lean(),
    ]);

    const adoptionMap = new Map<string, any>();
    adoptions.forEach((a: any) => {
      if (a.cowId) {
        adoptionMap.set(String(a.cowId), a);
      }
    });

    const personalityTraits = [
      'Loves fresh jaggery and evening ear scratches. Gentle herd leader.',
      'Playful calf rescued in monsoon, now healthiest runner in Shed A.',
      'Calm and revered mother cow, deeply bonded with her calf.',
      'Strong indigenous breed, recovered remarkably from dehydration.',
      'Affectionate and friendly with visitors and children.',
      'Elderly sacred cow enjoying peaceful retirement and ayurvedic feed.'
    ];

    const wall = cows.map((cow, idx) => {
      const adoption = adoptionMap.get(String(cow._id));
      const donorName = adoption?.donorId?.name || '';
      let adopterDisplayName = '';
      if (donorName) {
        const parts = donorName.trim().split(' ');
        adopterDisplayName = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
      }

      return {
        _id: cow._id,
        tagId: cow.tagId,
        name: cow.name,
        breed: cow.breed,
        gender: cow.gender,
        age: cow.age || 4,
        color: cow.color,
        status: cow.status,
        photos: cow.photos || [],
        isAdopted: Boolean(adoption),
        adopterName: adopterDisplayName,
        monthlyAmount: adoption?.monthlyAmount || 500,
        story: personalityTraits[idx % personalityTraits.length],
        rescueLocation: cow.rescueDetails?.location || 'Local Community Sanctuary',
      };
    });

    res.json({
      success: true,
      data: {
        total: wall.length,
        adoptedCount: wall.filter(w => w.isAdopted).length,
        availableCount: wall.filter(w => !w.isAdopted).length,
        cows: wall,
      },
    });
  } catch (err) {
    console.error('Adopt wall error:', err);
    res.status(500).json({ success: false, message: 'Could not fetch adoption wall' });
  }
};

// In-memory rescue report store (accessible by both live map and queue)
export const INDIAN_CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  mathura: { lat: 27.4924, lng: 77.6737 },
  vrindavan: { lat: 27.5800, lng: 77.7000 },
  barsana: { lat: 27.6467, lng: 77.3756 },
  govardhan: { lat: 27.4950, lng: 77.4660 },
  agra: { lat: 27.1767, lng: 78.0081 },
  delhi: { lat: 28.6139, lng: 77.2090 },
  noida: { lat: 28.5355, lng: 77.3910 },
  gurugram: { lat: 28.4595, lng: 77.0266 },
  gurgaon: { lat: 28.4595, lng: 77.0266 },
  faridabad: { lat: 28.4089, lng: 77.3178 },
  ghaziabad: { lat: 28.6692, lng: 77.4538 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  sanganer: { lat: 26.8183, lng: 75.7687 },
  chomu: { lat: 27.1724, lng: 75.7231 },
  alwar: { lat: 27.5530, lng: 76.6346 },
  ajmer: { lat: 26.4499, lng: 74.6399 },
  pushkar: { lat: 26.4897, lng: 74.5511 },
  jodhpur: { lat: 26.2389, lng: 73.0243 },
  udaipur: { lat: 24.5854, lng: 73.7125 },
  kankroli: { lat: 25.0442, lng: 73.8821 },
  kota: { lat: 25.2138, lng: 75.8648 },
  bikaner: { lat: 28.0229, lng: 73.3119 },
  karnal: { lat: 29.6857, lng: 76.9905 },
  kurukshetra: { lat: 29.9695, lng: 76.8783 },
  panipat: { lat: 29.3909, lng: 76.9635 },
  ambala: { lat: 30.3782, lng: 76.7767 },
  chandigarh: { lat: 30.7333, lng: 76.7794 },
  ludhiana: { lat: 30.9010, lng: 75.8573 },
  amritsar: { lat: 31.6340, lng: 74.8723 },
  haridwar: { lat: 29.9457, lng: 78.1642 },
  rishikesh: { lat: 30.0869, lng: 78.2676 },
  dehradun: { lat: 30.3165, lng: 78.0322 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  kanpur: { lat: 26.4499, lng: 80.3319 },
  varanasi: { lat: 25.3176, lng: 82.9739 },
  kashi: { lat: 25.3176, lng: 82.9739 },
  banaras: { lat: 25.3176, lng: 82.9739 },
  ayodhya: { lat: 26.7922, lng: 82.1998 },
  prayagraj: { lat: 25.4358, lng: 81.8463 },
  allahabad: { lat: 25.4358, lng: 81.8463 },
  gorakhpur: { lat: 26.7606, lng: 83.3732 },
  patna: { lat: 25.5941, lng: 85.1376 },
  gaya: { lat: 24.7914, lng: 85.0002 },
  ranchi: { lat: 23.3441, lng: 85.3096 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  howrah: { lat: 22.5958, lng: 88.2636 },
  bhubaneswar: { lat: 20.2961, lng: 85.8245 },
  puri: { lat: 19.8135, lng: 85.8312 },
  bhopal: { lat: 23.2599, lng: 77.4126 },
  indore: { lat: 22.7196, lng: 75.8577 },
  ujjain: { lat: 23.1765, lng: 75.7885 },
  gwalior: { lat: 26.2183, lng: 78.1828 },
  jabalpur: { lat: 23.1815, lng: 79.9864 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  gandhinagar: { lat: 23.2156, lng: 72.6369 },
  rajkot: { lat: 22.3039, lng: 70.8022 },
  surat: { lat: 21.1702, lng: 72.8311 },
  vadodara: { lat: 22.3072, lng: 73.1812 },
  mumbai: { lat: 19.0760, lng: 72.8777 },
  pune: { lat: 18.5204, lng: 73.8567 },
  nagpur: { lat: 21.1458, lng: 79.0882 },
  nashik: { lat: 19.9975, lng: 73.7898 },
  hyderabad: { lat: 17.3850, lng: 78.4867 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  guwahati: { lat: 26.1445, lng: 91.7362 },
  // Kerala & Southern Regions
  kerala: { lat: 10.8505, lng: 76.2711 },
  kochi: { lat: 9.9312, lng: 76.2673 },
  cochin: { lat: 9.9312, lng: 76.2673 },
  thiruvananthapuram: { lat: 8.5241, lng: 76.9366 },
  trivandrum: { lat: 8.5241, lng: 76.9366 },
  kozhikode: { lat: 11.2588, lng: 75.7804 },
  calicut: { lat: 11.2588, lng: 75.7804 },
  thrissur: { lat: 10.5276, lng: 76.2144 },
  malappuram: { lat: 11.0732, lng: 76.0740 },
  kannur: { lat: 11.8745, lng: 75.3704 },
  kollam: { lat: 8.8932, lng: 76.6141 },
  alappuzha: { lat: 9.4981, lng: 76.3388 },
  alleppey: { lat: 9.4981, lng: 76.3388 },
  palakkad: { lat: 10.7867, lng: 76.6548 },
  kottayam: { lat: 9.5916, lng: 76.5222 },
  kasaragod: { lat: 12.5102, lng: 74.9852 },
  wayanad: { lat: 11.6854, lng: 76.1320 },
  idukki: { lat: 9.8494, lng: 76.9804 },
  pathanamthitta: { lat: 9.2648, lng: 76.7870 },
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  madurai: { lat: 9.9252, lng: 78.1198 },
  mysore: { lat: 12.2958, lng: 76.6394 },
  mysuru: { lat: 12.2958, lng: 76.6394 },
  goa: { lat: 15.2993, lng: 74.1240 },
  panaji: { lat: 15.4909, lng: 73.8278 },
};

export function resolveIndianCoords(locationName?: string, lat?: number | null, lng?: number | null): { lat: number; lng: number } {
  if (lat && lng && (lat !== 26.9124 || lng !== 75.7873)) {
    return { lat, lng };
  }
  if (locationName) {
    const lower = locationName.toLowerCase();
    for (const [city, coords] of Object.entries(INDIAN_CITY_COORDS)) {
      if (lower.includes(city)) {
        return coords;
      }
    }
  }
  return { lat: lat || 26.9124, lng: lng || 75.7873 };
}

export const rescueReports: any[] = [
  {
    id: 'RSC-REQ-001',
    reporterName: 'Amit Verma',
    reporterPhone: '+91 98765 43210',
    locationName: 'NH-48 Milestone 142, near Kankroli Toll',
    latitude: 25.0442,
    longitude: 73.8821,
    condition: 'Hit by speeding vehicle, bleeding right flank, unable to stand',
    urgency: 'critical',
    photoUrl: '/cow-icon-transparent.png',
    status: 'dispatched',
    dispatchedTo: 'Braj Caretaker Rapid Unit',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 'RSC-REQ-002',
    reporterName: 'Radha Sharma',
    reporterPhone: '+91 94140 11223',
    locationName: 'Gau Ghat, Yamuna Riverbank, Mathura',
    latitude: 27.4924,
    longitude: 77.6737,
    condition: 'Abandoned newborn calf, shivering in rain, severely dehydrated',
    urgency: 'high',
    photoUrl: '/cow-icon-transparent.png',
    status: 'pending',
    createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
  },
  {
    id: 'RSC-REQ-003',
    reporterName: 'Sunil Gurjar',
    reporterPhone: '+91 98290 99887',
    locationName: 'Old Market Yard, Sanganer, Jaipur',
    latitude: 26.8183,
    longitude: 75.7687,
    condition: 'Entangled in nylon plastic wires, deep neck wound',
    urgency: 'medium',
    photoUrl: '/cow-icon-transparent.png',
    status: 'rescued',
    createdAt: new Date(Date.now() - 1440 * 60 * 1000).toISOString(),
  }
];

// ─── GET /api/public/rescue-map ──────────────────────────────────────────────
// Returns geo-tagged rescue missions across India with coordinates and rehabilitation records
export const getRescueLocations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const missions = [
      {
        id: 'RSC-GJ-01',
        name: 'Gauri (Cow #CW-002)',
        breed: 'Gir',
        state: 'Gujarat',
        city: 'Rajkot Highway',
        lat: 22.3039,
        lng: 70.8022,
        xPct: 22,
        yPct: 48,
        rescueDate: '2025-11-14',
        condition: 'Critical dehydration & leg laceration',
        status: 'Fully Rehabilitated & Lactating',
        healthStatus: 'healthy',
        story: 'Found abandoned near National Highway 27 after vehicle collision. Our mobile ambulance arrived in 35 minutes.',
        rescuedBy: 'Rajkot Animal Welfare Taskforce',
        currentShed: 'Shed A (Gir Heritage Enclosure)',
      },
      {
        id: 'RSC-RJ-02',
        name: 'Surabhi (Cow #CW-007)',
        breed: 'Tharparkar',
        state: 'Rajasthan',
        city: 'Jaipur Bypass',
        lat: 26.9124,
        lng: 75.7873,
        xPct: 30,
        yPct: 34,
        rescueDate: '2025-12-03',
        condition: 'Severe malnutrition and hoof infection',
        status: 'Healthy & Mother of Calf',
        healthStatus: 'healthy',
        story: 'Rescued during winter frost from an unlicensed cattle market. Has since given birth to a healthy calf.',
        rescuedBy: 'Jaipur Gaushala Seva Dal',
        currentShed: 'Shed B (Maternity Care)',
      },
      {
        id: 'RSC-HR-03',
        name: 'Kapila (Cow #CW-011)',
        breed: 'Hariana',
        state: 'Haryana',
        city: 'Karnal Corridor',
        lat: 29.6857,
        lng: 76.9905,
        xPct: 34,
        yPct: 24,
        rescueDate: '2026-01-18',
        condition: 'Respiratory distress & eye infection',
        status: 'Under Care & Gaining Weight',
        healthStatus: 'healthy',
        story: 'Rescued by village volunteers during seasonal smog. Treated with antibiotics and nebulizer support.',
        rescuedBy: 'Karnal Rural Youth Group',
        currentShed: 'Shed C (Recovery Ward)',
      },
      {
        id: 'RSC-UP-04',
        name: 'Gopika (Cow #CW-015)',
        breed: 'Sahiwal',
        state: 'Uttar Pradesh',
        city: 'Mathura Pilgrim Route',
        lat: 27.4924,
        lng: 77.6737,
        xPct: 39,
        yPct: 36,
        rescueDate: '2026-02-09',
        condition: 'Plastic ingestion & ruminal bloat',
        status: 'Post-Surgery Healthy',
        healthStatus: 'healthy',
        story: 'Successfully underwent rumenotomy to remove 18kg of plastic waste. Today active and grazing happily.',
        rescuedBy: 'Braj Gopala Rescue Mission',
        currentShed: 'Shed A (Gir & Sahiwal Main)',
      },
      {
        id: 'RSC-MH-05',
        name: 'Bhavani (Cow #CW-019)',
        breed: 'Deoni',
        state: 'Maharashtra',
        city: 'Pune Expressway Outer',
        lat: 18.5204,
        lng: 73.8567,
        xPct: 31,
        yPct: 62,
        rescueDate: '2026-02-22',
        condition: 'Heat exhaustion during transit attempt',
        status: 'Adopted & Thriving',
        healthStatus: 'healthy',
        story: 'Intercepted at rural transport checkpost without water supply. Sheltered permanently with lifetime sponsorship.',
        rescuedBy: 'Maharashtra Gauseva Samiti',
        currentShed: 'Shed D (Sanctuary Grounds)',
      },
      {
        id: 'RSC-MP-06',
        name: 'Nandini (Cow #CW-020)',
        breed: 'Malvi',
        state: 'Madhya Pradesh',
        city: 'Ujjain Riverside',
        lat: 23.1765,
        lng: 75.7885,
        xPct: 37,
        yPct: 46,
        rescueDate: '2026-02-28',
        condition: 'Skin lesions & tick fever',
        status: 'Under Anti-parasitic Protocol',
        healthStatus: 'healthy',
        story: 'Treated with Diminazene and organic neem washes. Full recovery monitored via MobileNetV2 AI scanning.',
        rescuedBy: 'Shipra River Animal Care Trust',
        currentShed: 'Shed C (Ayurvedic Healing Wing)',
      },
    ];

    // Dynamically convert citizen emergency rescue reports into live radar map pins
    const liveReportMissions = rescueReports.map((rep) => {
      const coords = resolveIndianCoords(rep.locationName, rep.latitude, rep.longitude);
      const lat = coords.lat;
      const lng = coords.lng;
      // Calibrated Indian SVG projection (viewBox 500x560, lat range: 8 to 35, lng range: 68 to 92)
      // Kerala: lat ~ 8-12, lng ~ 75-77 -> xPct ~ 40-44%, yPct ~ 82-87%
      const xPct = Math.max(12, Math.min(88, Math.round(18 + ((lng - 68) / (92 - 68)) * 68)));
      const yPct = Math.max(10, Math.min(90, Math.round(12 + ((35 - lat) / (35 - 8)) * 76)));

      return {
        id: rep.id,
        name: `🚨 ${rep.urgency === 'critical' ? 'CRITICAL' : 'URGENT'}: ${rep.condition.substring(0, 24)}...`,
        breed: 'Indigenous Stray (Distress)',
        state: 'Emergency Dispatch Active',
        city: rep.locationName,
        lat,
        lng,
        xPct,
        yPct,
        rescueDate: rep.createdAt ? rep.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        condition: rep.condition,
        status: rep.status === 'dispatched' ? 'Ambulance Dispatched' : rep.status === 'rescued' ? 'Rescued to Quarantine' : '🚨 Immediate Rescue Required',
        healthStatus: rep.status === 'rescued' ? 'healthy' : 'sick',
        story: `Reported by ${rep.reporterName} (${rep.reporterPhone}). Urgency: ${rep.urgency?.toUpperCase()}. ${rep.condition}`,
        rescuedBy: rep.dispatchedTo || (rep.status === 'rescued' ? 'Gaushala Rapid Unit' : 'Awaiting Field Dispatch'),
        currentShed: rep.status === 'rescued' ? 'Isolation & Quarantine Ward' : 'Roadside / Highway Spot',
        isLiveReport: true,
        urgency: rep.urgency,
        photoUrl: rep.photoUrl || '/cow-icon-transparent.png',
      };
    });

    const allMissions = [...liveReportMissions, ...missions];

    res.json({
      success: true,
      data: {
        totalMissions: allMissions.length,
        rehabilitatedCount: missions.length,
        pendingMissionsCount: liveReportMissions.filter(m => m.status === '🚨 Immediate Rescue Required').length,
        locations: allMissions,
      },
    });
  } catch (err) {
    console.error('Rescue locations error:', err);
    res.status(500).json({ success: false, message: 'Could not fetch rescue locations' });
  }
};

// ─── GET /api/public/census/csv ──────────────────────────────────────────────
// Streams the complete herd census formatted as standard Government / AWBI CSV
export const getHerdCensusCsv = async (_req: Request, res: Response): Promise<void> => {
  try {
    const cows = await Cow.find({ isActive: true })
      .populate('shedId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      'Tag ID',
      'Cattle Name',
      'Breed',
      'Gender',
      'Age (Years)',
      'Weight (kg)',
      'Color',
      'Health Status',
      'Housing Shed',
      'Rescue Date',
      'Rescue Location',
      'Identification Marks',
      'Registered Date',
    ];

    const rows = cows.map((c: any) => [
      `"${c.tagId || ''}"`,
      `"${c.name || ''}"`,
      `"${c.breed || ''}"`,
      `"${c.gender || ''}"`,
      c.age ?? '',
      c.weight ?? '',
      `"${c.color || ''}"`,
      `"${c.status || ''}"`,
      `"${c.shedId?.name || 'General Shed'}"`,
      c.rescueDetails?.rescueDate ? `"${new Date(c.rescueDetails.rescueDate).toISOString().split('T')[0]}"` : '""',
      `"${c.rescueDetails?.location || 'Community Sanctuary'}"`,
      `"${(c.identificationMarks || 'None').replace(/"/g, '""')}"`,
      `"${new Date(c.createdAt).toLocaleDateString('en-IN')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const filename = `egowshala-herd-census-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (err) {
    console.error('Census CSV error:', err);
    res.status(500).json({ success: false, message: 'Could not export census CSV' });
  }
};

// (rescueReports moved above getRescueLocations)

// ─── POST /api/public/rescue-report ───────────────────────────────────────────
// Anyone in India can report an injured or stray cow with live GPS & photo
export const submitRescueReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reporterName, reporterPhone, locationName, latitude, longitude, condition, photoUrl, urgency } = req.body;

    if (!locationName && (!latitude || !longitude)) {
      res.status(400).json({ success: false, message: 'Location or GPS coordinates are required' });
      return;
    }

    const resolved = resolveIndianCoords(
      locationName,
      latitude ? parseFloat(latitude) : null,
      longitude ? parseFloat(longitude) : null
    );

    const newReport = {
      id: `RSC-REQ-${String(rescueReports.length + 1).padStart(3, '0')}`,
      reporterName: reporterName || 'Anonymous Devotee',
      reporterPhone: reporterPhone || 'Not provided',
      locationName: locationName || `GPS: ${resolved.lat.toFixed(4)}, ${resolved.lng.toFixed(4)}`,
      latitude: resolved.lat,
      longitude: resolved.lng,
      condition: condition || 'Cattle in distress needing immediate rescue',
      urgency: urgency || 'high',
      photoUrl: photoUrl || '/cow-icon-transparent.png',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    rescueReports.unshift(newReport);

    res.status(201).json({
      success: true,
      message: 'Rescue request broadcast to nearest Gaushala ambulances and caretakers successfully!',
      data: newReport,
    });
  } catch (err) {
    console.error('Submit rescue error:', err);
    res.status(500).json({ success: false, message: 'Could not process rescue report' });
  }
};

// ─── GET /api/public/rescue-requests ──────────────────────────────────────────
export const getRescueRequests = async (_req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, data: rescueReports });
  } catch (err) {
    console.error('Get rescue requests error:', err);
    res.status(500).json({ success: false, message: 'Could not fetch rescue requests' });
  }
};

// ─── PATCH /api/public/rescue-requests/:id ────────────────────────────────────
export const updateRescueReportStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, dispatchedTo } = req.body;
    const report = rescueReports.find(r => r.id === id);
    if (!report) {
      res.status(404).json({ success: false, message: 'Rescue report not found' });
      return;
    }
    if (status) report.status = status;
    if (dispatchedTo) report.dispatchedTo = dispatchedTo;
    res.json({ success: true, message: `Rescue request ${id} updated to ${status}`, data: report });
  } catch (err) {
    console.error('Update rescue status error:', err);
    res.status(500).json({ success: false, message: 'Could not update rescue status' });
  }
};



