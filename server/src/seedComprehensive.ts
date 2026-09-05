/**
 * COMPREHENSIVE TEST SEED — E-Gowshala
 * Covers every status, every edge case, every scenario across all 8 modules.
 * Run: npm run seed:test
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
config();

import User from './modules/auth/auth.model';
import Cow from './modules/cow/cow.model';
import Shed from './modules/cow/shed.model';
import HealthRecord from './modules/health/healthRecord.model';
import Vaccination from './modules/health/vaccination.model';
import Pregnancy from './modules/health/pregnancy.model';
import FeedLog from './modules/operations/feedLog.model';
import Task from './modules/operations/task.model';
import Attendance from './modules/operations/attendance.model';
import Donation from './modules/donation/donation.model';
import AdoptACow from './modules/donation/adoptACow.model';
import Visitor from './modules/visitor/visitor.model';
import Expense from './modules/finance/expense.model';
import Inventory from './modules/operations/inventory.model';

const days = (n: number) => new Date(Date.now() - n * 86400000);
const future = (n: number) => new Date(Date.now() + n * 86400000);
const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

async function seed() {
  const MONGODB_URI = process.env.MONGODB_URI!;
  await mongoose.connect(MONGODB_URI);
  console.log('\n🌱 Comprehensive Test Seed — E-Gowshala\n');

  // ─── CLEAR ALL ───────────────────────────────────────────
  console.log('🗑️  Clearing all existing data...');
  await Promise.all([
    User.deleteMany({}), Cow.deleteMany({}), Shed.deleteMany({}),
    HealthRecord.deleteMany({}), Vaccination.deleteMany({}), Pregnancy.deleteMany({}),
    FeedLog.deleteMany({}), Task.deleteMany({}), Attendance.deleteMany({}),
    Donation.deleteMany({}), AdoptACow.deleteMany({}),
    Visitor.deleteMany({}), Expense.deleteMany({}),
    Inventory.deleteMany({}),
  ]);
  console.log('   ✅ All collections cleared\n');

  // ═══════════════════════════════════════════════════════
  // 1. USERS — All 6 roles
  // ═══════════════════════════════════════════════════════
  console.log('👥 Creating users (all 6 roles)...');
  const passwordHash = await bcrypt.hash('admin123', 12);
  const users = await User.insertMany([
    { name: 'Rajesh Sharma',      email: 'admin@egowshala.org',      passwordHash, role: 'admin',       phone: '9876543210', isActive: true },
    { name: 'Dr. Priya Verma',    email: 'vet@egowshala.org',         passwordHash, role: 'veterinarian', phone: '9876543211', isActive: true },
    { name: 'Suresh Kumar',       email: 'caretaker@egowshala.org',   passwordHash, role: 'caretaker',   phone: '9876543212', isActive: true },
    { name: 'Amit Patel',         email: 'donor@egowshala.org',       passwordHash, role: 'donor',       phone: '9876543213', isActive: true },
    { name: 'Neha Gupta',         email: 'volunteer@egowshala.org',   passwordHash, role: 'volunteer',   phone: '9876543214', isActive: true },
    { name: 'Sanjay Mishra',      email: 'govt@egowshala.org',        passwordHash, role: 'government',  phone: '9876543215', isActive: true },
    // Extra users for realistic staff
    { name: 'Dr. Arvind Singh',   email: 'vet2@egowshala.org',        passwordHash, role: 'veterinarian', phone: '9876543216', isActive: true },
    { name: 'Ramu Prasad',        email: 'caretaker2@egowshala.org',  passwordHash, role: 'caretaker',   phone: '9876543217', isActive: true },
    { name: 'Sunita Devi',        email: 'donor2@egowshala.org',      passwordHash, role: 'donor',       phone: '9876543218', isActive: true },
    { name: 'Vikash Yadav',       email: 'volunteer2@egowshala.org',  passwordHash, role: 'volunteer',   phone: '9876543219', isActive: false }, // INACTIVE user
  ]);
  const [admin, vet, caretaker, donor, volunteer, govt, vet2, caretaker2] = users;
  console.log(`   ✅ ${users.length} users (including 1 inactive account)\n`);

  // ═══════════════════════════════════════════════════════
  // 2. SHEDS — All types
  // ═══════════════════════════════════════════════════════
  console.log('🏠 Creating sheds...');
  const sheds = await Shed.insertMany([
    { name: 'Shed A — Main Hall',    code: 'SH-A', capacity: 40, currentCount: 15, description: 'Primary shed for healthy adult cows', isActive: true },
    { name: 'Shed B — Recovery Ward',code: 'SH-B', capacity: 15, currentCount: 8,  description: 'Post-surgery and recovery beds', isActive: true },
    { name: 'Shed C — Calves',       code: 'SH-C', capacity: 25, currentCount: 7,  description: 'Young calves under 1 year old', isActive: true },
    { name: 'Shed D — Maternity',    code: 'SH-D', capacity: 12, currentCount: 5,  description: 'Pregnant cows and new mothers', isActive: true },
    { name: 'Shed E — Lactating',    code: 'SH-E', capacity: 20, currentCount: 6,  description: 'Milking cows, special diet', isActive: true },
    { name: 'Shed F — Quarantine',   code: 'SH-F', capacity: 8,  currentCount: 3,  description: 'New rescues and isolation cases', isActive: true },
    { name: 'Shed G — Disabled',     code: 'SH-G', capacity: 10, currentCount: 4,  description: 'Physically disabled and elderly cows', isActive: true },
    { name: 'Shed H — Bull Pen',     code: 'SH-H', capacity: 5,  currentCount: 2,  description: 'Adult bulls — separate enclosure', isActive: true },
  ]);
  console.log(`   ✅ ${sheds.length} sheds (all types)\n`);

  // ═══════════════════════════════════════════════════════
  // 3. COWS — 50 cows, every status, every breed
  // ═══════════════════════════════════════════════════════
  console.log('🐄 Creating 50 cows (all statuses, all breeds)...');
  const breeds = ['Gir', 'Sahiwal', 'Tharparkar', 'Kankrej', 'Red Sindhi', 'Rathi', 'Hariana', 'Ongole', 'Deoni', 'Hallikar', 'Crossbred', 'Unknown'];
  const femaleNames = ['Lakshmi', 'Ganga', 'Nandini', 'Kamadhenu', 'Surabhi', 'Gauri', 'Parvati', 'Saraswati', 'Radha', 'Sita', 'Durga', 'Annapurna', 'Bhavani', 'Meera', 'Tulsi', 'Rohini', 'Revathi', 'Swati', 'Chitra', 'Pushpa', 'Kavya', 'Asha', 'Prerna', 'Jyoti', 'Shobha', 'Kamla', 'Savitri', 'Geeta', 'Usha', 'Shanti', 'Vimala', 'Sudha', 'Rekha', 'Sunita', 'Padma', 'Shakti', 'Devaki', 'Yashoda', 'Kunti', 'Draupadi'];
  const maleNames = ['Nandi', 'Basava', 'Shivraj', 'Dharmu', 'Kalu', 'Rambo', 'Heera', 'Moti', 'Raju', 'Gopal'];
  const colors = ['Brown', 'White', 'Black & White', 'Reddish Brown', 'Grey', 'Golden', 'Spotted Brown', 'Dark Grey'];
  const rescueLocations = ['Jaipur Highway NH-48', 'Ajmer Road Overpass', 'Udaipur Market Slaughterhouse', 'Jodhpur Village Road', 'Pushkar Fair Grounds', 'Bhilwara Industrial Area', 'Kota Railway Tracks', 'Alwar Forest Area'];
  const rescueConditions = ['malnourished', 'injured leg', 'severe dehydration', 'post-accident trauma', 'abandoned newborn', 'diseased and untreated', 'heavily pregnant abandoned', 'rope injury around neck'];

  // Status distribution: 25 healthy, 8 sick, 5 pregnant, 4 lactating, 5 rescued, 2 deceased, 1 of each remaining
  const statusPlan = [
    ...Array(25).fill('healthy'),
    ...Array(8).fill('sick'),
    ...Array(5).fill('pregnant'),
    ...Array(4).fill('lactating'),
    ...Array(5).fill('rescued'),
    ...Array(2).fill('deceased'),
    'healthy', // extra
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
  for (let i = 0; i < 50; i++) {
    const isMale = i >= 40; // Last 10 are male
    const ageYears = rnd(1, 14);
    const status = statusPlan[i] || 'healthy';
    const shedIndex = status === 'sick' || status === 'rescued' ? 1
      : status === 'pregnant' ? 3
      : status === 'lactating' ? 4
      : isMale ? 7
      : i % 6;

    cowData.push({
      tagId: `EG-${String(i + 1).padStart(4, '0')}`,
      inaphId: `100294${String(100000 + i + 1)}`,
      name: isMale ? maleNames[i - 40] : femaleNames[i],
      breed: breeds[i % breeds.length],
      gender: isMale ? 'male' : 'female',
      dateOfBirth: days(ageYears * 365),
      age: ageYears,
      weight: isMale ? rnd(300, 600) : rnd(180, 450),
      color: colors[i % colors.length],
      status,
      shedId: sheds[Math.min(shedIndex, 7)]._id,
      photos: [CATTLE_PHOTOS[i % CATTLE_PHOTOS.length], CATTLE_PHOTOS[(i + 1) % CATTLE_PHOTOS.length]],
      qrCodeData: JSON.stringify({ platform: 'E-Gowshala', tagId: `EG-${String(i + 1).padStart(4, '0')}`, inaphId: `100294${String(100000 + i + 1)}`, name: isMale ? maleNames[i - 40] : femaleNames[i], breed: breeds[i % breeds.length] }),
      rescueDetails: {
        rescueDate: days(rnd(30, 730)),
        location: rescueLocations[i % rescueLocations.length],
        condition: rescueConditions[i % rescueConditions.length],
        rescuedBy: 'Suresh Kumar (Chief Caretaker)',
      },
      identificationMarks: ID_MARKS[i % ID_MARKS.length],
      notes: status === 'deceased' ? 'Passed away peacefully due to advanced age complications. Cremated with Vedic rites.' : COW_NOTES[i % COW_NOTES.length],
      isActive: status !== 'deceased',
    });
  }
  const cows = await Cow.insertMany(cowData);
  console.log(`   ✅ 50 cows (25 healthy, 8 sick, 5 pregnant, 4 lactating, 5 rescued, 2 deceased)\n`);

  const healthyCows  = cows.filter(c => c.status === 'healthy');
  const sickCows     = cows.filter(c => c.status === 'sick');
  const pregnantCows = cows.filter(c => c.status === 'pregnant');
  const lactatingCows= cows.filter(c => c.status === 'lactating');

  // ═══════════════════════════════════════════════════════
  // 4. HEALTH RECORDS — Every disease, every severity
  // ═══════════════════════════════════════════════════════
  console.log('🩺 Creating comprehensive health records...');
  const diseases = [
    { name: 'Foot and Mouth Disease (FMD)', severity: 'critical', meds: ['Vitamins B complex', 'Analgesics', 'Antivirals'], treatment: 'Isolation, wound dressing 2x daily, supportive fluids' },
    { name: 'Mastitis', severity: 'moderate', meds: ['Amoxicillin 500mg', 'Anti-inflammatory'], treatment: 'Antibiotic intramammary infusion, teat dipping, regular milking' },
    { name: 'Bloat (Rumen Tympany)', severity: 'high', meds: ['Turpentine oil', 'Dimethicone'], treatment: 'Emergency trocarization if severe, stomach tube for mild cases' },
    { name: 'Brucellosis', severity: 'critical', meds: ['Oxytetracycline', 'Streptomycin'], treatment: 'Strict isolation, mandatory reporting to state AHD, culling of reactor animals' },
    { name: 'Bovine Respiratory Disease (BRD)', severity: 'moderate', meds: ['Enrofloxacin', 'Dexamethasone'], treatment: 'Antibiotic for 5 days, isolation from herd, supportive care' },
    { name: 'Ketosis', severity: 'moderate', meds: ['Propylene glycol', 'Glucose IV', 'Vitamin B12'], treatment: 'Dietary adjustment, glucose drip, monitor milk yield' },
    { name: 'Lumpy Skin Disease (LSD)', severity: 'high', meds: ['Antipyretics', 'Antibiotics for secondary infections'], treatment: 'Supportive care, wound dressing, mosquito control' },
    { name: 'Anaplasmosis (Tick Fever)', severity: 'moderate', meds: ['Oxytetracycline 11mg/kg'], treatment: 'Antibiotic treatment, tick control, blood transfusion if anemic' },
    { name: 'Traumatic injury — leg fracture', severity: 'high', meds: ['Pain killers', 'Calcium supplements'], treatment: 'Immobilization, splint and bandaging, rest for 6 weeks' },
    { name: 'Diarrhea and dehydration', severity: 'low', meds: ['ORS solution', 'Electrolytes', 'Kaolin-pectin'], treatment: 'Fluid therapy, dietary restriction, probiotics' },
    { name: 'Eye infection (Pink Eye)', severity: 'low', meds: ['Oxytetracycline eye ointment'], treatment: 'Topical antibiotic eye drops, shade from bright light' },
    { name: 'General routine checkup', severity: 'low', meds: [], treatment: 'All vitals normal, no treatment required' },
  ];

  const healthRecords: any[] = [];
  // Sick cows — each with a serious disease
  sickCows.forEach((cow, i) => {
    const disease = diseases[i % diseases.length];
    healthRecords.push({
      cowId: cow._id,
      vetId: i % 2 === 0 ? vet._id : vet2._id,
      recordType: i < 3 ? 'emergency' : i < 6 ? 'treatment' : 'checkup',
      symptoms: ['lethargy', 'loss of appetite', 'fever'],
      diagnosis: disease.name,
      temperature: rnd(102, 106),
      heartRate: rnd(70, 110),
      weight: rnd(180, 450),
      medications: disease.meds.map(m => ({ name: m, dosage: '1x daily', frequency: 'once daily', duration: '7 days' })),
      notes: `${disease.treatment}. Severity: ${disease.severity}. Follow-up required.`,
      attachments: [],
    });
  });
  // Healthy cows — routine checkups
  healthyCows.slice(0, 10).forEach((cow, i) => {
    healthRecords.push({
      cowId: cow._id,
      vetId: vet._id,
      recordType: 'checkup',
      symptoms: [],
      diagnosis: 'Routine checkup — all normal',
      temperature: rnd(101, 102),
      heartRate: rnd(60, 80),
      weight: rnd(200, 420),
      medications: [],
      notes: 'All vitals normal. Body condition score 3.5/5. Next checkup in 3 months.',
      attachments: [],
    });
  });
  // Old resolved records (history)
  cows.slice(0, 8).forEach((cow) => {
    healthRecords.push({
      cowId: cow._id,
      vetId: vet._id,
      recordType: 'observation',
      symptoms: ['mild fever', 'reduced appetite'],
      diagnosis: 'Mild viral infection — resolved',
      temperature: 103,
      heartRate: 75,
      weight: rnd(200, 400),
      medications: [{ name: 'Antipyretics', dosage: 'as needed', frequency: 'twice daily', duration: '3 days' }],
      notes: 'Fully recovered. No further treatment needed.',
      attachments: [],
    });
  });
  await HealthRecord.insertMany(healthRecords);
  console.log(`   ✅ ${healthRecords.length} health records (emergency, treatment, checkup, observation)\n`);

  // ═══════════════════════════════════════════════════════
  // 5. VACCINATIONS — Due, Overdue, Completed, Upcoming
  // ═══════════════════════════════════════════════════════
  console.log('💉 Creating vaccinations (all scenarios)...');
  const vaccineTypes = [
    { name: 'FMD Vaccine (Foot & Mouth)', doseInterval: 180 },
    { name: 'BQ Vaccine (Black Quarter)', doseInterval: 365 },
    { name: 'Brucellosis Vaccine (S19)', doseInterval: 365 },
    { name: 'HS Vaccine (Haemorrhagic Septicaemia)', doseInterval: 365 },
    { name: 'Theileria Vaccine (Tick Fever)', doseInterval: 365 },
    { name: 'LSD Vaccine (Lumpy Skin Disease)', doseInterval: 365 },
  ];

  const vaccinations: any[] = [];
  cows.slice(0, 40).forEach((cow, i) => {
    const vaccine = vaccineTypes[i % vaccineTypes.length];
    const scenario = i % 5;
    if (scenario === 0) {
      vaccinations.push({ cowId: cow._id, vaccineName: vaccine.name, batchNumber: `BATCH-${rnd(1000,9999)}`, administeredDate: days(vaccine.doseInterval + rnd(30, 90)), nextDueDate: days(rnd(10, 60)), administeredBy: vet._id, dosage: '2ml IM', notes: '⚠️ OVERDUE' });
    } else if (scenario === 1) {
      vaccinations.push({ cowId: cow._id, vaccineName: vaccine.name, batchNumber: `BATCH-${rnd(1000,9999)}`, administeredDate: days(vaccine.doseInterval - rnd(1, 7)), nextDueDate: future(rnd(1, 7)), administeredBy: vet._id, dosage: '2ml IM', notes: 'Due soon' });
    } else if (scenario === 2) {
      vaccinations.push({ cowId: cow._id, vaccineName: vaccine.name, batchNumber: `BATCH-${rnd(1000,9999)}`, administeredDate: days(vaccine.doseInterval - rnd(14, 30)), nextDueDate: future(rnd(14, 30)), administeredBy: vet2._id, dosage: '2ml IM', notes: 'Upcoming' });
    } else if (scenario === 3) {
      vaccinations.push({ cowId: cow._id, vaccineName: vaccine.name, batchNumber: `ROV-SCHED-${rnd(1000,9999)}`, administeredDate: future(rnd(5, 30)), nextDueDate: future(rnd(180, 365)), administeredBy: vet._id, dosage: '2ml IM', notes: 'First dose scheduled under NADCP national drive' });
    } else {
      vaccinations.push({ cowId: cow._id, vaccineName: vaccine.name, batchNumber: `BATCH-${rnd(1000,9999)}`, administeredDate: days(rnd(30, 90)), nextDueDate: future(rnd(90, 250)), administeredBy: vet._id, dosage: '2ml IM', notes: 'On schedule' });
    }
  });
  await Vaccination.insertMany(vaccinations);
  console.log(`   ✅ ${vaccinations.length} vaccinations (overdue, due soon, upcoming, scheduled, completed)\n`);

  // ═══════════════════════════════════════════════════════
  // 6. PREGNANCIES — All stages
  // ═══════════════════════════════════════════════════════
  console.log('🤰 Creating pregnancies (all stages)...');
  const pregnancies: any[] = [];
  pregnantCows.forEach((cow, i) => {
    const gestationDays = rnd(30, 260);
    const statusVal = gestationDays < 90 ? 'confirmed' : gestationDays < 180 ? 'monitoring' : 'monitoring';
    pregnancies.push({
      cowId: cow._id,
      inseminationDate: days(gestationDays),
      inseminationType: i % 2 === 0 ? 'natural' : 'artificial',
      expectedDeliveryDate: future(280 - gestationDays),
      status: i === 2 ? 'complications' : statusVal,
      vetId: vet._id,
      bullId: i % 2 === 0 ? 'RGM-GJ-BULL-108 (Pedigree Gir Sire)' : 'RGM-RJ-SAH-204 (Sahiwal Elite Straw)',
      notes: `Gestation day ${gestationDays}. ${i === 2 ? 'Mild edema — extra monitoring required.' : 'Nutrition supplemented. Regular monitoring.'}`,
    });
  });
  // One delivered case
  pregnancies.push({
    cowId: lactatingCows[0]._id,
    inseminationDate: days(290),
    inseminationType: 'natural',
    expectedDeliveryDate: days(10),
    actualDeliveryDate: days(8),
    status: 'delivered',
    calfDetails: { name: 'Bachhi', gender: 'female', weight: 29, health: 'healthy' },
    vetId: vet._id,
    notes: 'Normal delivery. Calf feeding well. Mother producing 8L/day.',
  });
  // One miscarriage case
  pregnancies.push({
    cowId: healthyCows[0]._id,
    inseminationDate: days(120),
    inseminationType: 'artificial',
    expectedDeliveryDate: future(160),
    actualDeliveryDate: days(15),
    status: 'miscarriage',
    vetId: vet._id,
    notes: 'Spontaneous miscarriage at day 105. Cow recovering well. Brucellosis test ordered — negative.',
  });
  await Pregnancy.insertMany(pregnancies);
  console.log(`   ✅ ${pregnancies.length} pregnancies (confirmed, monitoring, complications, delivered, miscarriage)\n`);

  // ═══════════════════════════════════════════════════════
  // 7. OPERATIONS — Feed logs, Tasks, Attendance
  // ═══════════════════════════════════════════════════════
  console.log('📋 Creating operations data (90 days of logs)...');
  const feedTypes = ['green-fodder', 'dry-fodder', 'concentrate', 'supplement', 'water'];
  const feedLogs: any[] = [];
  for (let d = 0; d < 90; d++) {
    for (const shed of sheds.slice(0, 6)) {
      for (const feedType of feedTypes.slice(0, 3)) {
        feedLogs.push({
          shedId: shed._id,
          feedType,
          quantityKg: feedType === 'green-fodder' ? rnd(60, 120) : feedType === 'dry-fodder' ? rnd(40, 80) : rnd(15, 30),
          waterIntakeLiters: rnd(500, 1200),
          costIncurred: feedType === 'green-fodder' ? rnd(1200, 2400) : feedType === 'dry-fodder' ? rnd(600, 1200) : rnd(800, 1500),
          loggedBy: d % 2 === 0 ? caretaker._id : caretaker2._id,
          date: days(d),
          notes: `Nutritional ration for ${shed.name}; moisture content tested, feed fresh and palatable.`,
        });
      }
    }
  }
  await FeedLog.insertMany(feedLogs);
  console.log(`   ✅ ${feedLogs.length} feed logs (90 days, 6 sheds, 3 feed types/day)`);

  // Tasks — All statuses
  const taskData = [
    // PENDING
    { title: 'Repair broken water trough in Shed A', category: 'maintenance', priority: 'high', status: 'pending', assignedTo: caretaker._id, assignedBy: admin._id, dueDate: future(2), description: 'Trough has crack, water leaking' },
    { title: 'Arrange fresh straw bedding for Shed D', category: 'other', priority: 'medium', status: 'pending', assignedTo: caretaker2._id, assignedBy: admin._id, dueDate: future(1), description: 'Maternity shed needs dry bedding' },
    { title: 'Order 500kg cattle feed pellets from supplier', category: 'other', priority: 'high', status: 'pending', assignedTo: admin._id, assignedBy: admin._id, dueDate: future(3), description: 'Stock running low — 3 days remaining' },
    { title: 'Clean and disinfect Shed F (Quarantine)', category: 'cleaning', priority: 'urgent', status: 'pending', assignedTo: caretaker._id, assignedBy: admin._id, dueDate: future(0), description: 'New rescue arriving tomorrow — urgent sanitization' },
    // IN-PROGRESS
    { title: 'Weigh and record all calves in Shed C', category: 'medical', priority: 'medium', status: 'in-progress', assignedTo: vet._id, assignedBy: admin._id, dueDate: future(1), description: 'Monthly growth tracking' },
    { title: 'Paint and number new ear tags (EG-0051 to EG-0060)', category: 'other', priority: 'low', status: 'in-progress', assignedTo: volunteer._id, assignedBy: admin._id, dueDate: future(2), description: 'New rescue batch tagging' },
    { title: 'Set up CCTV camera in Shed B Recovery Ward', category: 'maintenance', priority: 'high', status: 'in-progress', assignedTo: admin._id, assignedBy: admin._id, dueDate: future(5), description: 'Night monitoring for critical patients' },
    // COMPLETED
    { title: 'FMD vaccination drive — all 50 cows', category: 'medical', priority: 'urgent', status: 'completed', assignedTo: vet._id, assignedBy: admin._id, dueDate: days(5), completedAt: days(5), description: 'Govt mandated semi-annual FMD drive' },
    { title: 'Monthly shed deep cleaning — all sheds', category: 'cleaning', priority: 'high', status: 'completed', assignedTo: caretaker._id, assignedBy: admin._id, dueDate: days(8), completedAt: days(7), description: 'Monthly sanitation protocol' },
    { title: 'Submit quarterly animal welfare report to Collector', category: 'administrative', priority: 'high', status: 'completed', assignedTo: admin._id, assignedBy: admin._id, dueDate: days(3), completedAt: days(3), description: 'Quarterly govt submission' },
    { title: 'Fix broken solar panel — power loss 20%', category: 'maintenance', priority: 'high', status: 'completed', assignedTo: admin._id, assignedBy: admin._id, dueDate: days(10), completedAt: days(9), description: 'Panel cracked during hailstorm' },
    // OVERDUE (pending but due date passed)
    { title: 'Annual audit of medical supply inventory', category: 'administrative', priority: 'medium', status: 'pending', assignedTo: vet._id, assignedBy: admin._id, dueDate: days(5), description: 'OVERDUE — should have been done last week' },
    { title: 'Update insurance records for all cattle', category: 'administrative', priority: 'low', status: 'pending', assignedTo: admin._id, assignedBy: admin._id, dueDate: days(15), description: 'Annual renewal overdue' },
  ];
  await Task.insertMany(taskData);
  console.log(`   ✅ ${taskData.length} tasks (pending, in-progress, completed, overdue)`);

  // Attendance — 60 days
  const attendanceRecords: any[] = [];
  const staff = [caretaker, caretaker2, volunteer];
  for (let d = 0; d < 60; d++) {
    for (const member of staff) {
      const rand = Math.random();
      const status = rand > 0.9 ? 'absent' : rand > 0.8 ? 'leave' : 'present';
      const checkInTime = new Date(days(d)); checkInTime.setHours(rnd(6,8), rnd(0,59), 0, 0);
      const checkOutTime = new Date(days(d)); checkOutTime.setHours(rnd(17,19), rnd(0,59), 0, 0);
      attendanceRecords.push({
        userId: member._id,
        date: days(d),
        status,
        checkInTime: status === 'present' ? checkInTime : checkInTime, // schema requires it
        checkOutTime: status === 'present' ? checkOutTime : undefined,
        hoursWorked: status === 'present' ? rnd(8, 10) : 0,
        notes: status === 'absent' ? 'Unexcused absence recorded; supervisor alerted.' : status === 'leave' ? 'Authorized leave sanctioned by shelter management.' : 'Full shift performed diligently with livestock feeding & shed sanitization.',
      });
    }
  }
  await Attendance.insertMany(attendanceRecords);
  console.log(`   ✅ ${attendanceRecords.length} attendance records (60 days, present/absent/leave)\n`);

  // ─── INVENTORY & FODDER STOCK ─────────────────────────────
  console.log('🌾 Creating inventory & fodder supplies...');
  const inventoryItems = [
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
      lastRestockedAt: days(2),
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
      lastRestockedAt: days(3),
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
      lastRestockedAt: days(7),
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
      lastRestockedAt: days(14),
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
      lastRestockedAt: days(5),
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
      lastRestockedAt: days(8),
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
      lastRestockedAt: days(10),
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
      lastRestockedAt: days(4),
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
      lastRestockedAt: days(20),
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
      lastRestockedAt: days(6),
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
      lastRestockedAt: days(12),
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
      lastRestockedAt: days(45),
      notes: 'Handheld ISO 11784/11785 ear tag scanner synchronized with INAPH database.',
    },
  ];
  await Inventory.insertMany(inventoryItems);
  console.log(`   ✅ ${inventoryItems.length} inventory items (all categories, full details, bilingual)\n`);

  // ═══════════════════════════════════════════════════════
  // 8. DONATIONS — Every type, every payment method
  // ═══════════════════════════════════════════════════════
  console.log('💰 Creating donations (all types, all methods)...');
  const donorNames = ['Amit Patel', 'Sunita Devi', 'Ramesh Agarwal', 'Kavita Shah', 'Mohan Lal', 'Priya Joshi', 'Deepak Bansal', 'Anita Gupta', 'Sunil Mehta', 'Rekha Sharma', 'Tata Trust CSR', 'Infosys Foundation', 'Maulik Bhatt', 'Sarla Devi', 'Arjun Singh'];
  const donationData: any[] = [];
  let receiptNum = 1;
  // Valid purpose enum: 'general' | 'cow-care' | 'medical' | 'feed' | 'infrastructure' | 'adopt-a-cow'
  const purposes = ['general', 'cow-care', 'medical', 'feed', 'infrastructure', 'adopt-a-cow'];
  const paymentMethods = ['upi', 'cash', 'bank-transfer', 'razorpay', 'cheque'];
  const donationTypes = ['one-time', 'monthly', 'annual'];

  donorNames.forEach((name, i) => {
    donationData.push({
      amount: rnd(500, 100000),
      donationType: donationTypes[i % 3],
      purpose: purposes[i % 6],
      paymentMethod: paymentMethods[i % 5],
      paymentStatus: 'completed',
      receiptNumber: `RCP-2026-${String(receiptNum++).padStart(5, '0')}`,
      donorName: name,
      donorEmail: `donor${i}@email.com`,
      donorPhone: `98${String(rnd(10000000, 99999999))}`,
      donorPan: `ABCPD${rnd(1000, 9999)}E`,
      donorAddress: ['42, Civil Lines, Jaipur, Rajasthan - 302006', 'Plot 18, Nariman Point, Mumbai, Maharashtra - 400021', 'B-12, Sector 14, Gurugram, Haryana - 122001', 'Ashram Road, Ahmedabad, Gujarat - 380009', 'Kalyani Nagar, Pune, Maharashtra - 411006'][i % 5],
      is80GEligible: true,
      notes: i === 10 ? 'Corporate CSR — Annual contribution under Schedule VII' : 'Devotee Gau Seva sponsorship for cattle care and daily nutritious fodder.',
    });
  });
  // Pending
  donationData.push({ amount: 50000, donationType: 'one-time', purpose: 'infrastructure', paymentMethod: 'bank-transfer', paymentStatus: 'pending', receiptNumber: `RCP-2026-${String(receiptNum++).padStart(5, '0')}`, donorName: 'Sanjay Gupta Foundation', donorEmail: 'sanjay@guptafoundation.org', donorPhone: '9811234567', donorPan: 'ABCGS1234F', donorAddress: 'New Delhi', is80GEligible: true, notes: 'Awaiting NEFT transfer' });
  // Failed
  donationData.push({ amount: 10000, donationType: 'one-time', purpose: 'medical', paymentMethod: 'razorpay', paymentStatus: 'failed', receiptNumber: `RCP-2026-${String(receiptNum++).padStart(5, '0')}`, donorName: 'Vikram Singh', donorEmail: 'vikram@email.com', donorPhone: '9812345678', donorAddress: 'Jaipur', is80GEligible: false, notes: 'Payment gateway timeout' });
  // Refunded
  donationData.push({ amount: 5000, donationType: 'one-time', purpose: 'general', paymentMethod: 'upi', paymentStatus: 'refunded', receiptNumber: `RCP-2026-${String(receiptNum++).padStart(5, '0')}`, donorName: 'Test Refund Case', donorEmail: 'refund@email.com', donorPhone: '9800000001', donorAddress: 'Mumbai', is80GEligible: false, notes: 'Duplicate payment — refunded' });

  await Donation.insertMany(donationData);
  console.log(`   ✅ ${donationData.length} donations (completed, pending, failed, refunded — all methods)\n`);

  // ─── Adoptions (donorId required) ────────────────────
  const [donorUser, donorUser2] = users.filter(u => u.role === 'donor');
  const adoptions = await AdoptACow.insertMany([
    { donorId: donorUser._id, cowId: cows[0]._id, monthlyAmount: 2000, startDate: days(90), status: 'active', totalPaid: 6000, lastPaymentDate: days(1), notes: 'Adopted Lakshmi — monthly updates sent' },
    { donorId: donorUser2._id, cowId: cows[1]._id, monthlyAmount: 1500, startDate: days(120), status: 'active', totalPaid: 9000, lastPaymentDate: days(2), notes: 'Sponsors Ganga — long-term' },
    { donorId: donorUser._id, cowId: cows[2]._id, monthlyAmount: 5000, startDate: days(60), endDate: days(0), status: 'cancelled', totalPaid: 10000, notes: 'Donor relocated abroad' },
    { donorId: donorUser2._id, cowId: cows[4]._id, monthlyAmount: 3000, startDate: days(200), status: 'active', totalPaid: 18000, lastPaymentDate: days(5), notes: '2-year supporter' },
    { donorId: donorUser._id, cowId: cows[5]._id, monthlyAmount: 1000, startDate: days(30), status: 'paused', totalPaid: 1000, notes: 'Paused due to financial difficulty' },
  ]);
  console.log(`   ✅ ${adoptions.length} adoptions (active, paused, cancelled)\n`);

  // ═══════════════════════════════════════════════════════
  // 9. VISITORS — All visit types, all statuses, ratings
  // ═══════════════════════════════════════════════════════
  console.log('👥 Creating visitor records (all scenarios)...');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  // Valid visitType: 'individual'|'group'|'school'|'ngo'|'government'|'media'
  // Valid purpose: 'tour'|'donation'|'adoption'|'volunteering'|'inspection'|'media-coverage'|'other'
  const visitorsData = [
    // TODAY — Scheduled
    { name: 'DPS School Jaipur Grade 8', phone: '01412345678', email: 'principal@dps.edu.in', visitType: 'school', purpose: 'tour', groupSize: 45, scheduledDate: today, scheduledTime: '09:00', status: 'scheduled', notes: 'Educational tour — needs 2 guides' },
    { name: 'Ramesh Agarwal', phone: '9876543230', email: 'ramesh.agarwal@gmail.com', visitType: 'individual', purpose: 'donation', groupSize: 1, scheduledDate: today, scheduledTime: '11:00', status: 'scheduled', notes: 'Potential major donor' },
    { name: 'GreenEarth NGO', phone: '9876543231', email: 'info@greenearth.org', visitType: 'ngo', purpose: 'volunteering', groupSize: 8, scheduledDate: today, scheduledTime: '14:00', status: 'scheduled', notes: 'Partnership discussion' },
    // TODAY — Checked in
    { name: 'Jaipur Tourism Group', phone: '9876543232', email: 'tourdesk@jaipurtourism.org', visitType: 'group', purpose: 'tour', groupSize: 20, scheduledDate: today, scheduledTime: '10:00', status: 'checked-in', checkInTime: new Date(), notes: 'Corporate wellness tour' },
    // TODAY — Completed with feedback
    { name: 'RBSE Biology Department', phone: '01416789012', email: 'rbse@edu.gov.in', visitType: 'group', purpose: 'other', groupSize: 5, scheduledDate: today, scheduledTime: '08:00', status: 'completed', checkInTime: new Date(Date.now() - 7200000), checkOutTime: new Date(Date.now() - 3600000), feedback: { rating: 5, comment: 'Excellent! Very impressed with the AI health system.' }, notes: 'Research visit' },
    // YESTERDAY
    { name: 'Rajasthan Animal Welfare Board', phone: '01413456789', email: 'rawb@raj.gov.in', visitType: 'government', purpose: 'inspection', groupSize: 4, scheduledDate: days(1), scheduledTime: '11:00', status: 'completed', checkInTime: days(1), checkOutTime: days(1), feedback: { rating: 4, comment: 'Good records. Improve water trough maintenance.' }, notes: 'Annual inspection — passed' },
    { name: 'Priya Sharma', phone: '9876543233', email: 'priya.sharma@email.com', visitType: 'individual', purpose: 'adoption', groupSize: 1, scheduledDate: days(1), scheduledTime: '15:00', status: 'completed', feedback: { rating: 5, comment: 'Adopted Nandini! Beautiful and well-cared for.' }, notes: 'Monthly recurring cow adoption donor' },
    // PAST
    { name: 'St Xavier School Group', phone: '9876543234', email: 'stxavier.jaipur@edu.in', visitType: 'school', purpose: 'tour', groupSize: 55, scheduledDate: days(3), scheduledTime: '09:30', status: 'completed', checkInTime: days(3), checkOutTime: days(3), feedback: { rating: 4, comment: 'Great experience. Feeding session was a highlight.' }, notes: 'Students learned organic compost making' },
    { name: 'ICICI Bank CSR Team', phone: '9876543235', email: 'csr@icici.com', visitType: 'group', purpose: 'donation', groupSize: 15, scheduledDate: days(5), scheduledTime: '10:00', status: 'completed', checkInTime: days(5), checkOutTime: days(5), feedback: { rating: 5, comment: 'Outstanding work! Will include in annual CSR report.' }, notes: 'CSR grant inspection for solar plant' },
    { name: 'Dr Mahesh Kumar', phone: '9876543236', email: 'mahesh@uni.edu', visitType: 'individual', purpose: 'other', groupSize: 1, scheduledDate: days(7), scheduledTime: '09:00', status: 'completed', feedback: { rating: 3, comment: 'Good data. Lab facilities could be better.' }, notes: 'Veterinary research fellow consultation' },
    // NO-SHOW
    { name: 'Rohan Mehta', phone: '9876543240', email: 'rohan.mehta@gmail.com', visitType: 'individual', purpose: 'tour', groupSize: 1, scheduledDate: days(4), scheduledTime: '12:00', status: 'no-show', notes: 'Did not arrive, follow-up scheduled for next weekend' },
    // CANCELLED
    { name: 'DD National Media Team', phone: '9876543237', email: 'dd@media.gov.in', visitType: 'media', purpose: 'media-coverage', groupSize: 6, scheduledDate: days(2), scheduledTime: '13:00', status: 'cancelled', notes: 'Cancelled last minute — rescheduling' },
    // FUTURE
    { name: 'Jaipur Municipal Corporation', phone: '01412223344', email: 'jmc@jaipur.gov.in', visitType: 'government', purpose: 'inspection', groupSize: 6, scheduledDate: future(3), scheduledTime: '10:00', status: 'scheduled', notes: 'Quarterly check' },
    { name: 'Animal Planet Production Team', phone: '9876543238', email: 'ap@production.com', visitType: 'media', purpose: 'media-coverage', groupSize: 10, scheduledDate: future(7), scheduledTime: '07:00', status: 'scheduled', notes: 'Documentary shoot — full day' },
    { name: 'Rajasthan University Vet Students', phone: '01412334455', email: 'vet@rajuni.edu', visitType: 'group', purpose: 'tour', groupSize: 30, scheduledDate: future(10), scheduledTime: '08:00', status: 'scheduled', notes: 'Final year field visit' },
    { name: 'HDFC Bank CSR Delegation', phone: '9876543239', email: 'csr@hdfc.com', visitType: 'group', purpose: 'donation', groupSize: 12, scheduledDate: future(14), scheduledTime: '11:00', status: 'scheduled', notes: 'Potential Rs 5 lakh sponsorship' },
  ];
  await Visitor.insertMany(visitorsData);
  console.log(`   ✅ ${visitorsData.length} visitors (scheduled, checked-in, completed, no-show, cancelled, all ratings)\n`);

  // ═══════════════════════════════════════════════════════
  // 10. FINANCE — 12 months, all categories, income too
  // ═══════════════════════════════════════════════════════
  console.log('💹 Creating 12 months of financial data...');
  // Valid categories: 'feed'|'medical'|'salary'|'utilities'|'infrastructure'|'transport'|'equipment'|'miscellaneous'
  const expenseTemplates = [
    { category: 'feed',           description: 'Green fodder — monthly supply',        paidTo: 'Rajasthan Organic Farms',   baseAmount: 45000 },
    { category: 'feed',           description: 'Dry fodder — wheat straw bales',        paidTo: 'Shri Krishna Traders',      baseAmount: 18000 },
    { category: 'feed',           description: 'Cattle feed pellets — 500kg',           paidTo: 'Godrej Agrovet',            baseAmount: 22000 },
    { category: 'feed',           description: 'Mineral mixture and supplements',        paidTo: 'Vet Pharma India',          baseAmount: 8500  },
    { category: 'medical',        description: 'Medicines and antibiotics — monthly',   paidTo: 'MedVet Pharma Jaipur',      baseAmount: 15000 },
    { category: 'medical',        description: 'FMD vaccination batch — 50 doses',      paidTo: 'Govt Veterinary Dept',      baseAmount: 7500  },
    { category: 'medical',        description: 'Surgical equipment and consumables',     paidTo: 'Medline Surgical Supplies', baseAmount: 5000  },
    { category: 'salary',         description: 'Caretaker salary — monthly',            paidTo: 'Staff Payroll',             baseAmount: 45000 },
    { category: 'salary',         description: 'Veterinarian consultation fees',         paidTo: 'Dr. Arvind Singh',          baseAmount: 25000 },
    { category: 'salary',         description: 'Security and support staff',            paidTo: 'Staff Payroll',             baseAmount: 22000 },
    { category: 'utilities',      description: 'Electricity bill — monthly',            paidTo: 'RVNL Jaipur',               baseAmount: 8200  },
    { category: 'utilities',      description: 'Water supply and borewell charges',     paidTo: 'PHED Rajasthan',            baseAmount: 3500  },
    { category: 'infrastructure', description: 'Shed repair and structural works',       paidTo: 'Ram Construction',          baseAmount: 12000 },
    { category: 'transport',      description: 'Vehicle fuel and rescue transport',      paidTo: 'Local Transport',           baseAmount: 6000  },
    { category: 'equipment',      description: 'CCTV camera installation',              paidTo: 'TechSecure Systems',        baseAmount: 35000 },
    { category: 'miscellaneous',  description: 'Office supplies and stationery',        paidTo: 'Stationary Hub',            baseAmount: 2000  },
    { category: 'miscellaneous',  description: 'Gau Puja and festival arrangements',    paidTo: 'Event Decorators',          baseAmount: 15000 },
  ];

  const expenses: any[] = [];
  for (let m = 0; m < 12; m++) {
    for (const template of expenseTemplates) {
      if (template.category === 'equipment' && m !== 2) continue; // one-off
      if (template.description.includes('festival') && m % 3 !== 0) continue; // quarterly

      const expDate = new Date();
      expDate.setMonth(expDate.getMonth() - m);
      expDate.setDate(rnd(1, 28));

      expenses.push({
        category: template.category,
        description: template.description,
        amount: template.baseAmount + rnd(-2000, 3000),
        date: expDate,
        paidTo: template.paidTo,
        paymentMode: ['cash', 'bank-transfer', 'upi', 'cheque'][rnd(0, 3)],
        receiptNumber: `BILL-2026-${String(rnd(100, 999))}`,
        recordedBy: admin._id,
        approvedBy: admin._id,
        attachments: [],
        notes: m === 0 && template.category === 'medical'
          ? 'Emergency procurement for FMD outbreak protocol.'
          : `Official ${template.category} expenditure; verified against vendor invoice and approved by trust committee.`,
      });
    }
  }
  await Expense.insertMany(expenses);
  console.log(`   ✅ ${expenses.length} expenses (12 months, all categories)\n`);

  // ─── FINAL SUMMARY ─────────────────────────────────
  console.log('═══════════════════════════════════════════════════════');
  console.log('🎉 COMPREHENSIVE TEST DATABASE READY!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n📊 Data Summary:');
  console.log(`   👥 Users:         ${users.length} (all 6 roles, 1 inactive)`);
  console.log(`   🏠 Sheds:         ${sheds.length} (all types)`);
  console.log(`   🐄 Cows:          50 (every status, every breed)`);
  console.log(`   🩺 Health Records: ${healthRecords.length} (all severities, active & resolved)`);
  console.log(`   💉 Vaccinations:  ${vaccinations.length} (overdue, due soon, scheduled, completed)`);
  console.log(`   🤰 Pregnancies:   ${pregnancies.length} (all trimesters, delivered, aborted)`);
  console.log(`   🍽️  Feed Logs:    ${feedLogs.length} (90 days × 6 sheds)`);
  console.log(`   📋 Tasks:         ${taskData.length} (pending, in-progress, done, overdue)`);
  console.log(`   👤 Attendance:    ${attendanceRecords.length} (60 days, present/absent/leave)`);
  console.log(`   💰 Donations:     ${donationData.length} (all types, methods, statuses)`);
  console.log(`   ❤️  Adoptions:    ${adoptions.length} (active, cancelled)`);
  console.log(`   👥 Visitors:      ${visitorsData.length} (all statuses, all types, all ratings)`);
  console.log(`   💹 Expenses:      ${expenses.length} (12 months, all categories)`);
  console.log('\n─────────────────────────────────');
  console.log('📧 Login Credentials (password: admin123):');
  console.log('   admin@egowshala.org       → Admin (full access)');
  console.log('   vet@egowshala.org          → Veterinarian');
  console.log('   caretaker@egowshala.org    → Caretaker');
  console.log('   donor@egowshala.org        → Donor');
  console.log('   volunteer@egowshala.org    → Volunteer');
  console.log('   govt@egowshala.org         → Government');
  console.log('─────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
