import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../modules/auth/auth.model';
import Cow from '../modules/cow/cow.model';
import Shed from '../modules/cow/shed.model';
import HealthRecord from '../modules/health/healthRecord.model';
import Vaccination from '../modules/health/vaccination.model';
import Pregnancy from '../modules/health/pregnancy.model';
import Donation from '../modules/donation/donation.model';
import AdoptACow from '../modules/donation/adoptACow.model';
import Expense from '../modules/finance/expense.model';
import Task from '../modules/operations/task.model';
import FeedLog from '../modules/operations/feedLog.model';
import Attendance from '../modules/operations/attendance.model';
import Inventory from '../modules/operations/inventory.model';
import Visitor from '../modules/visitor/visitor.model';

export const autoSeedIfEmpty = async (): Promise<void> => {
  try {
    console.log('🔍 Checking database collections for test & demo data readiness...');

    // ── 1. Users & RBAC ─────────────────────────────────────────
    let users: any[] = await User.find();
    if (users.length === 0) {
      console.log('   🌱 Seeding 6 RBAC user accounts...');
      const passwordHash = await bcrypt.hash('admin123', 12);
      users = await User.insertMany([
        { name: 'Rajesh Sharma', email: 'admin@egowshala.org', passwordHash, role: 'admin', phone: '9876543210', language: 'en' },
        { name: 'Dr. Priya Verma', email: 'vet@egowshala.org', passwordHash, role: 'veterinarian', phone: '9876543211', language: 'en' },
        { name: 'Suresh Kumar', email: 'caretaker@egowshala.org', passwordHash, role: 'caretaker', phone: '9876543212', language: 'hi' },
        { name: 'Amit Patel', email: 'donor@egowshala.org', passwordHash, role: 'donor', phone: '9876543213', language: 'en' },
        { name: 'Neha Gupta', email: 'volunteer@egowshala.org', passwordHash, role: 'volunteer', phone: '9876543214', language: 'hi' },
        { name: 'Sanjay Mishra', email: 'govt@egowshala.org', passwordHash, role: 'government', phone: '9876543215', language: 'en' },
      ]);
      console.log(`   ✅ Created ${users.length} staff & stakeholder accounts (Password: admin123)`);
    }

    const adminUser = users.find(u => u.role === 'admin') || users[0];
    const vetUser = users.find(u => u.role === 'veterinarian') || users[0];
    const caretakerUser = users.find(u => u.role === 'caretaker') || users[0];
    const donorUser = users.find(u => u.role === 'donor') || users[0];

    // ── 2. Housing Sheds ────────────────────────────────────────
    let sheds: any[] = await Shed.find();
    if (sheds.length === 0) {
      console.log('   🌱 Seeding housing sheds...');
      sheds = await Shed.insertMany([
        { name: 'Shed A — Gir Heritage', code: 'SH-A', capacity: 30, currentCount: 8, description: 'Primary ventilated enclosure for indigenous Gir cows' },
        { name: 'Shed B — Maternity & Recovery', code: 'SH-B', capacity: 15, currentCount: 4, description: 'Specialized maternity ward with CCTV and non-slip bedding' },
        { name: 'Shed C — Calves Nursery', code: 'SH-C', capacity: 20, currentCount: 5, description: 'Young calves under 1 year with specialized nutritional feed' },
        { name: 'Shed D — Sahiwal & General', code: 'SH-D', capacity: 25, currentCount: 3, description: 'General herd accommodation with automated fresh water troughs' },
        { name: 'Open Pasture Sanctuary', code: 'SH-E', capacity: 60, currentCount: 0, description: '5-acre open grazing and sunlight rejuvenation grounds' },
        { name: 'Isolation & Quarantine Ward', code: 'SH-F', capacity: 8, currentCount: 0, description: 'Strict bio-security isolation for incoming rescue cattle' },
      ]);
      console.log(`   ✅ Created ${sheds.length} housing sheds`);
    }

    // ── 3. Cattle Registry ──────────────────────────────────────
    let cows: any[] = await Cow.find();
    if (cows.length === 0) {
      console.log('   🌱 Seeding 20 registered sacred cattle...');
      const breeds = ['Gir', 'Sahiwal', 'Tharparkar', 'Kankrej', 'Red Sindhi', 'Hariana', 'Ongole', 'Deoni'];
      const cowNames = [
        'Lakshmi', 'Ganga', 'Nandini', 'Kamadhenu', 'Surabhi',
        'Gauri', 'Parvati', 'Saraswati', 'Radha', 'Sita',
        'Durga', 'Annapurna', 'Bhavani', 'Meera', 'Tulsi',
        'Rohini', 'Revathi', 'Swati', 'Chitra', 'Pushpa'
      ];

      const CATTLE_PHOTOS = [
        '/cow-icon-transparent.png',
      ];

      const ID_MARKS = [
        'White star blaze on forehead, curved backward horns, deep dewlap fold.',
        'Left ear ear-tag notch, distinct white socks on hind legs, docile eyes.',
        'Convex broad forehead shield, light brown muzzle, dark dorsal stripe.',
        'Lyre-shaped upright horns, pure white coat, black tail switch.',
        'Drooping pendulous ears, prominent hump, white patch over bridge of nose.',
        'Curled horns pointing inwards, branded district veterinary mark on right shoulder.',
        'Slight slit in right ear margin, symmetrical dark grey muzzle markings.',
        'Broad pendulous dewlap, dark circles around both eyes, compact hooves.',
      ];

      const COW_NOTES = [
        'Gentle temperament, responsive to regular daily brushing and Vedic chanting. Peak health.',
        'Consumes 18kg green barseem fodder daily with eager appetite. High vitality herd leader.',
        'Calm disposition, cooperative during veterinary checkups. Fully rehabilitated post-rescue.',
        'High indigenous breed vigor, excellent maternal instincts, high fat percentage milk yield.',
        'Enjoys open pasture sunbathing, closely bonded with herd mates in Shed A.',
        'Regular participant in devotee visitor tours, extremely gentle around children.',
        'Robust rumen motility, verified 100% compliant with National Animal Disease Control Programme.',
        'Registered with National Livestock Database; ear tag scanning verified on INAPH portal.',
      ];

      const cowData: any[] = [];
      const now = Date.now();
      for (let i = 0; i < 20; i++) {
        const age = Math.floor(i % 8) + 2;
        const status = i === 1 ? 'sick' : i === 3 ? 'pregnant' : i === 7 ? 'pregnant' : i === 12 ? 'sick' : 'healthy';
        const shedIndex = i % 4;

        cowData.push({
          tagId: `EG-${String(i + 1).padStart(4, '0')}`,
          inaphId: `100294${String(100000 + i + 1)}`,
          name: cowNames[i],
          breed: breeds[i % breeds.length],
          gender: i === 18 ? 'male' : 'female',
          dateOfBirth: new Date(now - age * 365.25 * 24 * 60 * 60 * 1000),
          age,
          weight: 280 + (i * 12),
          color: ['Reddish Brown', 'Pristine White', 'Black & White', 'Dappled Grey', 'Light Fawn'][i % 5],
          status,
          shedId: sheds[shedIndex]._id,
          photos: [CATTLE_PHOTOS[i % CATTLE_PHOTOS.length], CATTLE_PHOTOS[(i + 1) % CATTLE_PHOTOS.length]],
          qrCodeData: JSON.stringify({ platform: 'E-Gowshala', tagId: `EG-${String(i + 1).padStart(4, '0')}`, inaphId: `100294${String(100000 + i + 1)}`, name: cowNames[i], breed: breeds[i % breeds.length] }),
          identificationMarks: ID_MARKS[i % ID_MARKS.length],
          rescueDetails: {
            rescueDate: new Date(now - (i + 1) * 35 * 24 * 60 * 60 * 1000),
            location: ['Rajkot Highway, Milestone 14', 'Jaipur Bypass Overpass', 'Karnal Toll Corridor', 'Mathura Pilgrim Route Gate 3', 'Pune Expressway Outer Ring'][i % 5],
            condition: i < 5 ? 'Roadside vehicular injury, dehydrated — fully rehabilitated' : 'Abandoned milch cow in market, restored to peak health',
            rescuedBy: 'Suresh Kumar (Chief Caretaker)',
          },
          notes: COW_NOTES[i % COW_NOTES.length],
          isActive: true,
        });
      }
      cows = await Cow.insertMany(cowData);
      console.log(`   ✅ Created ${cows.length} cattle records with breed classifications, INAPH IDs & photos`);
    }

    // ── 4. Clinical Health Records ──────────────────────────────
    const healthRecordCount = await HealthRecord.countDocuments();
    if (healthRecordCount === 0 && cows.length > 0) {
      console.log('   🌱 Seeding clinical veterinary health records...');
      const recordsToSeed = [
        {
          cowId: cows[0]._id,
          vetId: vetUser._id,
          recordType: 'checkup',
          diagnosis: 'Routine health checkup — Herd Matriarch in peak condition',
          symptoms: ['normal appetite', 'active grazing'],
          clinicalVitals: { temperature: 101.5, heartRate: 64, respiratoryRate: 30, weight: 360, milkYieldLiters: 9.5 },
          notes: 'Excellent coat condition, clear conjunctiva, rumen motility 3 contractions per 2 min.',
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        },
        {
          cowId: cows[1]._id,
          vetId: vetUser._id,
          recordType: 'treatment',
          diagnosis: 'Mild foot lesion & localized skin inflammation',
          symptoms: ['mild lameness', 'skin redness'],
          clinicalVitals: { temperature: 102.8, heartRate: 72, respiratoryRate: 34, weight: 310 },
          medications: [
            { name: 'Meloxicam injection', dosage: '15ml IM', frequency: 'Once daily', duration: '3 days' },
            { name: 'Antiseptic foot spray (Povidone Iodine)', dosage: 'Topical', frequency: 'Twice daily', duration: '5 days' },
          ],
          notes: 'Bandaged right hind hoof. Keep in dry bedding in Shed B. Healing nicely.',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          cowId: cows[3]._id,
          vetId: vetUser._id,
          recordType: 'observation',
          diagnosis: 'Healthy bovine pregnancy (Gestation ~5 months)',
          symptoms: ['normal rumination', 'increased resting time'],
          clinicalVitals: { temperature: 101.8, heartRate: 68, weight: 395 },
          notes: 'Fetal heartbeat confirmed via Doppler ultrasound. Calcium and mineral supplement recommended.',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
        {
          cowId: cows[5]._id,
          vetId: vetUser._id,
          recordType: 'checkup',
          diagnosis: 'Post-rescue evaluation and weight gain monitoring',
          symptoms: ['calm behavior', 'good water intake'],
          clinicalVitals: { temperature: 101.2, heartRate: 60, weight: 340 },
          notes: 'Weight has increased by 18kg since arrival. Fully integrated into Shed A.',
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        },
      ];
      await HealthRecord.insertMany(recordsToSeed);
      console.log('   ✅ Created clinical health records with vitals & prescriptions');
    }

    // ── 5. Vaccinations (Due, Overdue, and Completed) ───────────
    const vaccCount = await Vaccination.countDocuments();
    if (vaccCount === 0 && cows.length > 0) {
      console.log('   🌱 Seeding herd vaccination calendar...');
      const now = new Date();
      const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const inTwoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      const pastTwoWeeks = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const overdueDate = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

      await Vaccination.insertMany([
        {
          cowId: cows[0]._id,
          vaccineName: 'Foot & Mouth Disease (FMD) Bi-Annual',
          batchNumber: 'FMD-2025-99B',
          administeredBy: vetUser._id,
          administeredDate: pastTwoWeeks,
          nextDueDate: inTwoWeeks,
          status: 'scheduled',
          notes: 'Next booster scheduled per National Animal Disease Control Programme',
        },
        {
          cowId: cows[1]._id,
          vaccineName: 'Lumpy Skin Disease (Neethling Strain)',
          batchNumber: 'LSD-2026-04A',
          administeredBy: vetUser._id,
          administeredDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
          nextDueDate: inThreeDays,
          status: 'scheduled',
          notes: 'Annual immunity booster due shortly',
        },
        {
          cowId: cows[2]._id,
          vaccineName: 'Brucellosis (S19 Vaccine)',
          batchNumber: 'BRC-2025-11X',
          administeredBy: vetUser._id,
          administeredDate: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
          nextDueDate: overdueDate,
          status: 'overdue',
          notes: '⚠️ Overdue vaccination flagged on dashboard for immediate vet administration',
        },
        {
          cowId: cows[4]._id,
          vaccineName: 'Anthrax Spore Vaccine',
          batchNumber: 'ANT-2025-88K',
          administeredBy: vetUser._id,
          administeredDate: pastTwoWeeks,
          nextDueDate: new Date(now.getTime() + 350 * 24 * 60 * 60 * 1000),
          status: 'completed',
          notes: 'Administered successfully. No adverse reaction observed.',
        },
        {
          cowId: cows[5]._id,
          vaccineName: 'Black Quarter (BQ) Vaccine',
          batchNumber: 'BQ-2026-01Z',
          administeredBy: vetUser._id,
          administeredDate: pastTwoWeeks,
          nextDueDate: inTwoWeeks,
          status: 'scheduled',
          notes: 'Scheduled for young stock in Shed C',
        },
      ]);
      console.log('   ✅ Created vaccination records (scheduled, completed, and overdue alerts)');
    }

    // ── 6. Active Bovine Pregnancies ────────────────────────────
    const pregCount = await Pregnancy.countDocuments();
    if (pregCount === 0 && cows.length > 3) {
      console.log('   🌱 Seeding active bovine pregnancies...');
      const now = new Date();
      // ~283 days gestation
      const insemDate1 = new Date(now.getTime() - 150 * 24 * 60 * 60 * 1000);
      const deliveryDate1 = new Date(insemDate1.getTime() + 283 * 24 * 60 * 60 * 1000);

      const insemDate2 = new Date(now.getTime() - 210 * 24 * 60 * 60 * 1000);
      const deliveryDate2 = new Date(insemDate2.getTime() + 283 * 24 * 60 * 60 * 1000);

      await Pregnancy.insertMany([
        {
          cowId: cows[3]._id,
          inseminationDate: insemDate1,
          inseminationType: 'natural',
          expectedDeliveryDate: deliveryDate1,
          status: 'confirmed',
          vetId: vetUser._id,
          notes: 'Gir breed sire. Ultrasound scan reveals healthy fetal movements. Special diet in Shed D.',
        },
        {
          cowId: cows[7]._id,
          inseminationDate: insemDate2,
          inseminationType: 'artificial',
          expectedDeliveryDate: deliveryDate2,
          status: 'monitoring',
          vetId: vetUser._id,
          notes: 'Advanced gestation (~7 months). High genetic merit Sahiwal semen straw. Preparing nursery.',
        },
      ]);
      console.log('   ✅ Created active pregnancy monitoring records');
    }

    // ── 7. Donations & 80G Receipts ─────────────────────────────
    const donCount = await Donation.countDocuments();
    if (donCount === 0) {
      console.log('   🌱 Seeding donation ledger & 80G tax receipts...');
      await Donation.insertMany([
        {
          amount: 5000,
          donationType: 'one-time',
          purpose: 'general',
          paymentMethod: 'upi',
          paymentStatus: 'completed',
          receiptNumber: 'RCP-2026-00001',
          donorName: 'Amit Patel',
          donorEmail: 'donor@egowshala.org',
          donorPhone: '9876543213',
          donorPan: 'ABCPD1234E',
          donorAddress: 'Nariman Point, Mumbai, Maharashtra',
          is80GEligible: true,
          notes: 'Devotee monthly contribution for cattle protection and daily fresh fodder.',
          createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        },
        {
          amount: 25000,
          donationType: 'annual',
          purpose: 'medical',
          paymentMethod: 'bank-transfer',
          paymentStatus: 'completed',
          receiptNumber: 'RCP-2026-00002',
          donorName: 'Sunita Devi',
          donorEmail: 'sunita@yahoo.com',
          donorPhone: '9876543218',
          donorPan: 'XYZPS9876F',
          donorAddress: 'Civil Lines, Jaipur, Rajasthan',
          is80GEligible: true,
          notes: 'Annual sponsorship for veterinary hospital and emergency rescue operations.',
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        },
        {
          amount: 2100,
          donationType: 'monthly',
          purpose: 'adopt-a-cow',
          paymentMethod: 'razorpay',
          paymentStatus: 'completed',
          receiptNumber: 'RCP-2026-00003',
          donorName: 'Ramesh Agarwal',
          donorEmail: 'ramesh@gmail.com',
          donorPhone: '9876543230',
          donorPan: 'AGRPK4412B',
          donorAddress: 'Sector 14, Gurugram, Haryana',
          is80GEligible: true,
          notes: 'Adopt-a-cow monthly recurring debit for Kamadhenu.',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          amount: 1500,
          donationType: 'monthly',
          purpose: 'feed',
          paymentMethod: 'upi',
          paymentStatus: 'completed',
          receiptNumber: 'RCP-2026-00004',
          donorName: 'Kavita Iyer',
          donorEmail: 'kavita.iyer@gmail.com',
          donorPhone: '9876543231',
          donorPan: 'IYRPK9012M',
          donorAddress: 'Indiranagar, Bengaluru, Karnataka',
          is80GEligible: true,
          notes: 'Special Gau Grass feeding seva on family anniversary.',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      ]);
      console.log('   ✅ Created sample donations with automated 80G tax exemptions');
    }

    // ── 8. Adopt-a-Cow Monthly Sponsorships ─────────────────────
    const adoptCount = await AdoptACow.countDocuments();
    if (adoptCount === 0 && cows.length > 2) {
      console.log('   🌱 Seeding Adopt-a-Cow monthly sponsorships...');
      await AdoptACow.insertMany([
        {
          donorId: donorUser._id,
          cowId: cows[0]._id, // Kamadhenu
          monthlyAmount: 2100,
          startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          status: 'active',
          totalPaid: 6300,
          lastPaymentDate: new Date(),
          notes: 'Sponsored in memory of late grandfather. Devotee visits on Ekadashi.',
        },
        {
          donorId: donorUser._id,
          cowId: cows[2]._id, // Nandini
          monthlyAmount: 2100,
          startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          status: 'active',
          totalPaid: 4200,
          lastPaymentDate: new Date(),
          notes: 'Family annual pledge. Monthly updates and milk prasadam delivered.',
        },
      ]);
      console.log('   ✅ Created active cow adoption sponsorships');
    }

    // ── 9. Financial Expenses Ledger ────────────────────────────
    const expCount = await Expense.countDocuments();
    if (expCount === 0) {
      console.log('   🌱 Seeding financial expense ledger across categories...');
      const today = new Date();
      await Expense.insertMany([
        { category: 'feed', amount: 18500, description: 'Fresh green barseem & sorghum fodder (800kg)', date: today, paidTo: 'Kisan Fodder Mart', paymentMode: 'upi', recordedBy: adminUser._id, notes: 'Direct procurement from certified farmer collective; approved by trust.' },
        { category: 'medical', amount: 6200, description: 'Veterinary antibiotics, sterile bandages, and calcium drench', date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), paidTo: 'Dhanvantari Vet Care', paymentMode: 'bank-transfer', recordedBy: adminUser._id, notes: 'Emergency medical supplies for quarantine ward.' },
        { category: 'salary', amount: 28000, description: 'Monthly caretaker staff compensation & honorarium', date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), paidTo: 'Gaushala Staff Payroll', paymentMode: 'bank-transfer', recordedBy: adminUser._id, notes: 'Direct bank transfer to shelter caretakers.' },
        { category: 'utilities', amount: 3400, description: 'Solar water pump electricity bill & sanitization supplies', date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), paidTo: 'State Electricity Board', paymentMode: 'upi', recordedBy: adminUser._id, notes: 'Monthly utility charges verified.' },
        { category: 'infrastructure', amount: 12000, description: 'Rainproof tin shed extension & gutter repair for Shed B', date: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000), paidTo: 'Sharma Steel Works', paymentMode: 'cheque', recordedBy: adminUser._id, notes: 'Structural upgrade work inspected and signed off.' },
      ]);
      console.log('   ✅ Created financial expense ledger');
    }

    // ── 10. Operations Tasks (Kanban Board) ─────────────────────
    const taskCount = await Task.countDocuments();
    if (taskCount === 0) {
      console.log('   🌱 Seeding operations task workflow board...');
      const today = new Date();
      await Task.insertMany([
        { title: 'Morning Fresh Fodder Distribution', description: 'Distribute chopped green Napier grass & wheat straw in Shed A and B troughs', assignedTo: caretakerUser._id, assignedBy: adminUser._id, dueDate: today, priority: 'urgent', status: 'completed', category: 'feeding' },
        { title: 'Veterinary Hoof Trimming & Antiseptic Wash', description: 'Check and trim hooves for rescued cows in Shed B recovery ward', assignedTo: vetUser._id, assignedBy: adminUser._id, dueDate: today, priority: 'high', status: 'in-progress', category: 'medical' },
        { title: 'Sanitize Water Troughs & Lime Spraying', description: 'Scrub all 6 water troughs and spray agricultural lime for fly prevention', assignedTo: caretakerUser._id, assignedBy: adminUser._id, dueDate: today, priority: 'medium', status: 'pending', category: 'cleaning' },
        { title: 'Calf Nutrition & Weight Measurement', description: 'Record weekly weight logs of calves in Shed C using digital platform scale', assignedTo: caretakerUser._id, assignedBy: vetUser._id, dueDate: new Date(today.getTime() + 24 * 60 * 60 * 1000), priority: 'medium', status: 'pending', category: 'other' },
      ]);
      console.log('   ✅ Created operational task workflow board');
    }

    // ── 11. Daily Feed & Water Logs ─────────────────────────────
    const feedCount = await FeedLog.countDocuments();
    if (feedCount === 0 && sheds.length > 0) {
      console.log('   🌱 Seeding daily feed & water intake logs...');
      const today = new Date();
      await FeedLog.insertMany([
        { shedId: sheds[0]._id, feedType: 'green-fodder', quantityKg: 320, waterIntakeLiters: 450, costIncurred: 1600, loggedBy: caretakerUser._id, date: today, notes: 'Barseem + Hybrid Napier mix consumed eagerly' },
        { shedId: sheds[1]._id, feedType: 'concentrate', quantityKg: 45, waterIntakeLiters: 180, costIncurred: 1125, loggedBy: caretakerUser._id, date: today, notes: 'Mustard cake + crushed grain mix for recovering cattle' },
        { shedId: sheds[2]._id, feedType: 'supplement', quantityKg: 15, waterIntakeLiters: 90, costIncurred: 600, loggedBy: caretakerUser._id, date: today, notes: 'Calf starter pellets with mineral vitamins' },
      ]);
      console.log('   ✅ Created daily feed & water intake telemetry logs');
    }

    // ── 12. Visitors & Gaushala Tours ───────────────────────────
    const visitorCount = await Visitor.countDocuments();
    if (visitorCount === 0) {
      console.log('   🌱 Seeding visitor registry & educational tours...');
      const today = new Date();
      await Visitor.insertMany([
        {
          name: 'Delhi Public School Students',
          email: 'dps.eco@edu.in',
          phone: '9123456781',
          visitType: 'school',
          purpose: 'tour',
          groupSize: 32,
          scheduledDate: today,
          scheduledTime: '10:00 AM',
          status: 'checked-in',
          notes: 'Educational field trip on indigenous biodiversity, organic farming, and cow protection',
        },
        {
          name: 'Kapoor Family & Relatives',
          email: 'kapoor.family@gmail.com',
          phone: '9123456782',
          visitType: 'group',
          purpose: 'adoption',
          groupSize: 6,
          scheduledDate: today,
          scheduledTime: '03:30 PM',
          status: 'scheduled',
          notes: 'Visiting to meet cow Gauri (#CW-002) for annual birthday sponsorship',
        },
        {
          name: 'State Animal Husbandry Inspection Team',
          email: 'inspection@gov.in',
          phone: '9123456783',
          visitType: 'government',
          purpose: 'inspection',
          groupSize: 3,
          scheduledDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
          scheduledTime: '11:00 AM',
          status: 'scheduled',
          notes: 'Quarterly compliance audit and welfare standard certification inspection',
        },
      ]);
      console.log('   ✅ Created visitor and educational tour registry');
    }

    // ── 13. Staff Attendance ──────────────────────────────────
    const attCount = await Attendance.countDocuments();
    if (attCount === 0 && users.length > 0) {
      console.log('   🌱 Seeding staff attendance records...');
      const staffMembers = users.filter((u: any) => ['caretaker', 'volunteer', 'veterinarian'].includes(u.role));
      const attRecords: any[] = [];
      for (let d = 0; d < 14; d++) {
        const attDate = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
        for (const staff of staffMembers) {
          const status = (d + staff.name.length) % 7 === 0 ? 'leave' : 'present';
          const checkIn = new Date(attDate); checkIn.setHours(7, 30, 0, 0);
          const checkOut = new Date(attDate); checkOut.setHours(17, 0, 0, 0);
          attRecords.push({
            userId: staff._id,
            date: attDate,
            status,
            checkInTime: checkIn,
            checkOutTime: status === 'present' ? checkOut : undefined,
            hoursWorked: status === 'present' ? 9.5 : 0,
            notes: status === 'leave' ? 'Sanctioned leave approved by shelter manager.' : 'Daily cattle care, feeding and medication shift completed on schedule.',
          });
        }
      }
      await Attendance.insertMany(attRecords);
      console.log(`   ✅ Created ${attRecords.length} staff attendance records`);
    }

    // ── 14. Inventory & Feed Stocks ───────────────────────────
    const invCount = await Inventory.countDocuments();
    if (invCount === 0) {
      console.log('   🌱 Seeding inventory, fodder stocks & medical supplies...');
      await Inventory.insertMany([
        {
          name: 'Green Barseem Fodder',
          nameHi: 'हरा बरसीम चारा',
          category: 'green-fodder',
          quantity: 4500,
          unit: 'kg',
          minThreshold: 1000,
          costPerUnit: 4,
          supplier: 'Rajasthan Agro Greens Co-op, Jaipur',
          location: 'Open Silo Shed 1',
          lastRestockedAt: new Date(Date.now() - 2 * 86400000),
          notes: 'High-moisture protein-rich winter legume forage for lactating cows.',
        },
        {
          name: 'Hybrid Napier Grass (Super Napier)',
          nameHi: 'हाइब्रिड नेपियर घास',
          category: 'green-fodder',
          quantity: 3200,
          unit: 'kg',
          minThreshold: 800,
          costPerUnit: 3.5,
          supplier: 'Kisan Organic Farm, Sanganer',
          location: 'Green Fodder Bunk A',
          lastRestockedAt: new Date(Date.now() - 3 * 86400000),
          notes: 'Perennial fodder grass, rich in carbohydrates and digestible fiber.',
        },
        {
          name: 'Wheat Straw (Turi / Bhusa)',
          nameHi: 'गेहूं का सूखा भूसा',
          category: 'dry-fodder',
          quantity: 8500,
          unit: 'kg',
          minThreshold: 2000,
          costPerUnit: 9,
          supplier: 'Shri Krishna Agro Traders, Chomu',
          location: 'Dry Storage Godown B',
          lastRestockedAt: new Date(Date.now() - 7 * 86400000),
          notes: 'Dry roughage essential for ruminant fiber balance and cud chewing.',
        },
        {
          name: 'Paddy Straw Bales',
          nameHi: 'धान का पुआल बंडल',
          category: 'dry-fodder',
          quantity: 450,
          unit: 'piece',
          minThreshold: 100,
          costPerUnit: 45,
          supplier: 'Haryana Cattle Feeds, Karnal',
          location: 'Dry Storage Godown B',
          lastRestockedAt: new Date(Date.now() - 14 * 86400000),
          notes: 'Baled straw utilized for shed bedding and supplementary dry roughage.',
        },
        {
          name: 'Cattle Feed Pellets (20% Protein)',
          nameHi: 'पशु आहार पेलेट्स (20% प्रोटीन)',
          category: 'concentrate',
          quantity: 120,
          unit: 'bag',
          minThreshold: 30,
          costPerUnit: 1450,
          supplier: 'Godrej Agrovet Ltd',
          location: 'Feed Concentrate Store',
          lastRestockedAt: new Date(Date.now() - 5 * 86400000),
          notes: '50kg balanced feed bags fortified with bypass protein and essential trace minerals.',
        },
        {
          name: 'Mustard Oil Cake (Sarson Khali)',
          nameHi: 'शुद्ध सरसों की खल',
          category: 'concentrate',
          quantity: 85,
          unit: 'bag',
          minThreshold: 25,
          costPerUnit: 1650,
          supplier: 'Alwar Oil Mills, Alwar',
          location: 'Feed Concentrate Store',
          lastRestockedAt: new Date(Date.now() - 8 * 86400000),
          notes: '50kg unadulterated cold-pressed mustard cake for energy and fat enhancement.',
        },
        {
          name: 'Chelated Mineral Mixture Forte',
          nameHi: 'कीलेटेड मिनरल मिक्सचर',
          category: 'supplement',
          quantity: 45,
          unit: 'bag',
          minThreshold: 15,
          costPerUnit: 850,
          supplier: 'Vet Pharma India, New Delhi',
          location: 'Medical & Supplement Cabinet',
          lastRestockedAt: new Date(Date.now() - 10 * 86400000),
          notes: '25kg multi-mineral formula with zinc, copper, cobalt, selenium, and vitamins.',
        },
        {
          name: 'Calcium Tonic (Cal-Up Gel & Liquid)',
          nameHi: 'कैल्शियम टॉनिक लिक्विड',
          category: 'supplement',
          quantity: 60,
          unit: 'bottle',
          minThreshold: 20,
          costPerUnit: 280,
          supplier: 'Virbac Animal Health India',
          location: 'Medical & Supplement Cabinet',
          lastRestockedAt: new Date(Date.now() - 4 * 86400000),
          notes: '5L high-absorption oral calcium and phosphorus supplement for pregnant cows.',
        },
        {
          name: 'Himalayan Pink Rock Salt Licks',
          nameHi: 'सेंधा नमक चाटने वाले ढेले',
          category: 'supplement',
          quantity: 150,
          unit: 'piece',
          minThreshold: 40,
          costPerUnit: 60,
          supplier: 'Devbhumi Natural Minerals, Jaipur',
          location: 'Shed Trough Holders',
          lastRestockedAt: new Date(Date.now() - 20 * 86400000),
          notes: 'Natural mineral electrolyte blocks suspended in stalls for voluntary licking.',
        },
        {
          name: 'Oxytetracycline Broad Spectrum 100ml',
          nameHi: 'ऑक्सीटेट्रासाइक्लिन इंजेक्शन',
          category: 'medicine',
          quantity: 35,
          unit: 'bottle',
          minThreshold: 10,
          costPerUnit: 140,
          supplier: 'MedVet Distributors, Jaipur',
          location: 'Veterinary Pharmacy Fridge',
          lastRestockedAt: new Date(Date.now() - 6 * 86400000),
          notes: 'Long-acting injectable antimicrobial for respiratory and systemic infections.',
        },
        {
          name: 'Povidone Iodine 10% Solution 500ml',
          nameHi: 'पोविडोन आयोडीन घाव शोधक',
          category: 'medicine',
          quantity: 28,
          unit: 'bottle',
          minThreshold: 8,
          costPerUnit: 110,
          supplier: 'Medline Surgical Supplies',
          location: 'Treatment Station Shelf 1',
          lastRestockedAt: new Date(Date.now() - 12 * 86400000),
          notes: 'Broad-spectrum antiseptic for dressing rescue wounds, navels, and teat dips.',
        },
        {
          name: 'Digital Livestock RFID Reader & Pliers',
          nameHi: 'डिजिटल आरएफआईडी रीडर एवं टैग प्लायर',
          category: 'equipment',
          quantity: 6,
          unit: 'piece',
          minThreshold: 2,
          costPerUnit: 4200,
          supplier: 'Allflex Livestock Intelligence',
          location: 'Admin & Equipment Lockup',
          lastRestockedAt: new Date(Date.now() - 45 * 86400000),
          notes: 'Handheld ISO 11784/11785 ear tag scanner synchronized with INAPH database.',
        },
      ]);
      console.log('   ✅ Created inventory items with bilingual terms, thresholds & locations');
    }

    console.log('\n──────────────────────────────────────────────────────────');
    console.log('🎉 E-GOWSHALA DATABASE FULLY PREPARED & VALIDATED!');
    console.log('🔑 Login: admin@egowshala.org  |  Password: admin123');
    console.log('🔑 Other roles: vet@, caretaker@, donor@, volunteer@, govt@');
    console.log('──────────────────────────────────────────────────────────\n');
  } catch (err: any) {
    console.error('⚠️ Auto-seed encountered an issue (non-fatal):', err.message);
  }
};
