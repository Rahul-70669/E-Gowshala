import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
config();

// ─── Models ──────────────────────────────────────────
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

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/egowshala';

const seed = async () => {
  console.log('🌱 Seeding E-Gowshala Database...\n');
  await mongoose.connect(MONGO_URI);

  // ─── Clear existing data ───────────────────────────
  console.log('🗑️  Clearing existing data...');
  await Promise.all([
    User.deleteMany({}), Cow.deleteMany({}), Shed.deleteMany({}),
    HealthRecord.deleteMany({}), Vaccination.deleteMany({}), Pregnancy.deleteMany({}),
    FeedLog.deleteMany({}), Task.deleteMany({}), Attendance.deleteMany({}),
    Donation.deleteMany({}), AdoptACow.deleteMany({}),
    Visitor.deleteMany({}), Expense.deleteMany({}),
  ]);

  // ─── 1. Users ──────────────────────────────────────
  console.log('👥 Creating users...');
  const passwordHash = await bcrypt.hash('admin123', 12);
  const users = await User.insertMany([
    { name: 'Rajesh Sharma', email: 'admin@egowshala.org', passwordHash, role: 'admin', phone: '9876543210' },
    { name: 'Dr. Priya Verma', email: 'vet@egowshala.org', passwordHash, role: 'veterinarian', phone: '9876543211' },
    { name: 'Suresh Kumar', email: 'caretaker@egowshala.org', passwordHash, role: 'caretaker', phone: '9876543212' },
    { name: 'Amit Patel', email: 'donor@egowshala.org', passwordHash, role: 'donor', phone: '9876543213' },
    { name: 'Neha Gupta', email: 'volunteer@egowshala.org', passwordHash, role: 'volunteer', phone: '9876543214' },
    { name: 'Sanjay Mishra', email: 'govt@egowshala.org', passwordHash, role: 'government', phone: '9876543215' },
  ]);
  console.log(`   ✅ ${users.length} users created`);

  // ─── 2. Sheds ──────────────────────────────────────
  console.log('🏠 Creating sheds...');
  const sheds = await Shed.insertMany([
    { name: 'Shed A - General', shedType: 'general', capacity: 50, currentOccupancy: 0, caretakerInCharge: users[2]._id, location: 'East Wing' },
    { name: 'Shed B - General', shedType: 'general', capacity: 40, currentOccupancy: 0, location: 'West Wing' },
    { name: 'Sick Bay', shedType: 'sick-bay', capacity: 15, currentOccupancy: 0, caretakerInCharge: users[2]._id, location: 'Medical Block' },
    { name: 'Maternity Ward', shedType: 'maternity', capacity: 20, currentOccupancy: 0, location: 'South Wing' },
    { name: 'Calf Pen', shedType: 'calf-pen', capacity: 30, currentOccupancy: 0, location: 'North Wing' },
    { name: 'Quarantine Zone', shedType: 'quarantine', capacity: 10, currentOccupancy: 0, location: 'Isolation Block' },
  ]);
  console.log(`   ✅ ${sheds.length} sheds created`);

  // ─── 3. Cows ───────────────────────────────────────
  console.log('🐄 Creating cows...');
  const cowData = [
    { name: 'Lakshmi', breed: 'Gir', gender: 'female', age: 5, weight: 380, color: 'Reddish-Brown', status: 'healthy', shedId: sheds[0]._id },
    { name: 'Gauri', breed: 'Sahiwal', gender: 'female', age: 4, weight: 350, color: 'Reddish-Brown', status: 'lactating', shedId: sheds[0]._id },
    { name: 'Nandini', breed: 'Tharparkar', gender: 'female', age: 6, weight: 400, color: 'White', status: 'pregnant', shedId: sheds[3]._id },
    { name: 'Kamdhenu', breed: 'Kankrej', gender: 'female', age: 7, weight: 420, color: 'Silver-Grey', status: 'healthy', shedId: sheds[0]._id },
    { name: 'Sundar', breed: 'Gir', gender: 'male', age: 3, weight: 450, color: 'Red-Spotted', status: 'healthy', shedId: sheds[1]._id },
    { name: 'Radha', breed: 'Red Sindhi', gender: 'female', age: 3, weight: 310, color: 'Deep Red', status: 'healthy', shedId: sheds[0]._id },
    { name: 'Meera', breed: 'Sahiwal', gender: 'female', age: 5, weight: 360, color: 'Brown', status: 'sick', shedId: sheds[2]._id },
    { name: 'Ganga', breed: 'Hariana', gender: 'female', age: 8, weight: 380, color: 'White', status: 'healthy', shedId: sheds[1]._id },
    { name: 'Bhola', breed: 'Ongole', gender: 'male', age: 4, weight: 500, color: 'White', status: 'healthy', shedId: sheds[1]._id },
    { name: 'Sita', breed: 'Gir', gender: 'female', age: 2, weight: 280, color: 'Spotted-Red', status: 'healthy', shedId: sheds[0]._id },
    { name: 'Parvati', breed: 'Deoni', gender: 'female', age: 6, weight: 370, color: 'Black & White', status: 'lactating', shedId: sheds[0]._id },
    { name: 'Durga', breed: 'Rathi', gender: 'female', age: 4, weight: 340, color: 'Brown-White', status: 'healthy', shedId: sheds[1]._id },
    { name: 'Bittu', breed: 'Crossbred', gender: 'calf', age: 0, weight: 35, color: 'Brown', status: 'healthy', shedId: sheds[4]._id },
    { name: 'Chotu', breed: 'Gir', gender: 'calf', age: 0, weight: 28, color: 'Red', status: 'healthy', shedId: sheds[4]._id },
    { name: 'Rescued-Rani', breed: 'Unknown', gender: 'female', age: 10, weight: 300, color: 'Brown', status: 'rescued', shedId: sheds[2]._id, rescueDetails: { rescueDate: new Date('2024-06-15'), location: 'NH-48 Rajasthan Highway', condition: 'Malnourished with leg injury', rescuedBy: 'Gaushala Rescue Team' } },
    { name: 'Sundari', breed: 'Tharparkar', gender: 'female', age: 3, weight: 330, color: 'White-Grey', status: 'healthy', shedId: sheds[0]._id },
    { name: 'Govind', breed: 'Kankrej', gender: 'male', age: 5, weight: 480, color: 'Grey', status: 'healthy', shedId: sheds[1]._id },
    { name: 'Annapurna', breed: 'Sahiwal', gender: 'female', age: 7, weight: 390, color: 'Brown', status: 'lactating', shedId: sheds[0]._id },
    { name: 'Moti', breed: 'Gir', gender: 'calf', age: 1, weight: 80, color: 'Spotted', status: 'healthy', shedId: sheds[4]._id },
    { name: 'Tulsi', breed: 'Red Sindhi', gender: 'female', age: 4, weight: 320, color: 'Red', status: 'healthy', shedId: sheds[0]._id },
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

  const cowDocs = [];
  for (let i = 0; i < cowData.length; i++) {
    const tagId = `COW-2026-${String(i + 1).padStart(4, '0')}`;
    const inaphId = `100294${String(100000 + i + 1)}`;
    const qrCodeData = JSON.stringify({ tagId, inaphId, name: cowData[i].name, breed: cowData[i].breed });
    const photos = [CATTLE_PHOTOS[i % CATTLE_PHOTOS.length], CATTLE_PHOTOS[(i + 1) % CATTLE_PHOTOS.length]];
    const identificationMarks = ID_MARKS[i % ID_MARKS.length];
    const rescueDetails = cowData[i].rescueDetails || {
      rescueDate: new Date(Date.now() - (i + 1) * 45 * 24 * 60 * 60 * 1000),
      location: ['Jaipur Highway NH-48', 'Ajmer Road Overpass', 'Udaipur Market', 'Jodhpur Village', 'Pushkar Fair Outskirts'][i % 5],
      condition: 'Rescued stray cattle, fully rehabilitated and healthy',
      rescuedBy: 'Gaushala Rescue Team',
    };
    const notes = 'Docile temperament, consumes balanced green fodder and mineral mix daily. INAPH synchronized.';

    cowDocs.push({
      ...cowData[i],
      tagId,
      inaphId,
      qrCodeData,
      photos,
      identificationMarks,
      rescueDetails,
      notes,
    });
  }
  const cows = await Cow.insertMany(cowDocs);
  console.log(`   ✅ ${cows.length} cows created with full photos, INAPH IDs and identification marks`);

  // Update shed occupancy
  const shedOccupancy: Record<string, number> = {};
  cows.forEach(c => {
    const sid = c.shedId?.toString();
    if (sid) shedOccupancy[sid] = (shedOccupancy[sid] || 0) + 1;
  });
  for (const [sid, count] of Object.entries(shedOccupancy)) {
    await Shed.findByIdAndUpdate(sid, { currentOccupancy: count });
  }

  // ─── 4. Health Records ─────────────────────────────
  console.log('🩺 Creating health records...');
  const healthRecords = await HealthRecord.insertMany([
    { cowId: cows[0]._id, vetId: users[1]._id, recordType: 'checkup', symptoms: ['routine'], diagnosis: 'Healthy - routine checkup', temperature: 101.3, heartRate: 60, weight: 380, notes: 'Annual health screening passed' },
    { cowId: cows[6]._id, vetId: users[1]._id, recordType: 'treatment', symptoms: ['fever', 'loss of appetite', 'lethargy'], diagnosis: 'Bacterial infection - respiratory', medications: [{ name: 'Oxytetracycline', dosage: '10ml', frequency: 'Twice daily', duration: '7 days' }], temperature: 104.2, heartRate: 80, notes: 'Started antibiotics course' },
    { cowId: cows[14]._id, vetId: users[1]._id, recordType: 'emergency', symptoms: ['limping', 'wound', 'stress'], diagnosis: 'Fracture in left hind leg + malnutrition', medications: [{ name: 'Meloxicam', dosage: '5ml', frequency: 'Once daily', duration: '14 days' }, { name: 'Calcium Supplement', dosage: '20g', frequency: 'Daily', duration: '30 days' }], temperature: 102.5, heartRate: 72, notes: 'Rescued cow - needs intensive care and nutrition support' },
    { cowId: cows[2]._id, vetId: users[1]._id, recordType: 'checkup', symptoms: [], diagnosis: 'Pregnancy confirmed - month 6', temperature: 101.5, heartRate: 65, weight: 400, notes: 'Expected delivery in 3 months' },
    { cowId: cows[1]._id, vetId: users[1]._id, recordType: 'observation', symptoms: [], diagnosis: 'Healthy lactation', notes: 'Milk production: 8L/day' },
  ]);
  console.log(`   ✅ ${healthRecords.length} health records created`);

  // ─── 5. Vaccinations ───────────────────────────────
  console.log('💉 Creating vaccinations...');
  const now = new Date();
  const vaccinations = await Vaccination.insertMany([
    { cowId: cows[0]._id, vaccineName: 'FMD Vaccine', batchNumber: 'FMD-2026-A1', administeredBy: users[1]._id, administeredDate: new Date('2026-01-15'), nextDueDate: new Date('2026-07-15'), status: 'completed' },
    { cowId: cows[1]._id, vaccineName: 'Brucella S19', batchNumber: 'BRU-2026-B2', administeredBy: users[1]._id, administeredDate: new Date('2026-02-20'), nextDueDate: new Date('2026-08-20'), status: 'scheduled' },
    { cowId: cows[3]._id, vaccineName: 'HS Vaccine', batchNumber: 'HS-2026-C3', administeredBy: users[1]._id, administeredDate: new Date('2025-12-10'), nextDueDate: new Date('2026-06-10'), status: 'overdue' },
    { cowId: cows[5]._id, vaccineName: 'Black Quarter', batchNumber: 'BQ-2026-D4', administeredBy: users[1]._id, administeredDate: new Date('2026-03-05'), nextDueDate: new Date('2026-09-05'), status: 'scheduled' },
    { cowId: cows[7]._id, vaccineName: 'FMD Vaccine', batchNumber: 'FMD-2026-E5', administeredBy: users[1]._id, administeredDate: new Date('2026-04-01'), nextDueDate: new Date('2026-10-01'), status: 'scheduled' },
    { cowId: cows[2]._id, vaccineName: 'Anthrax Vaccine', batchNumber: 'ANT-2026-F6', administeredBy: users[1]._id, administeredDate: new Date('2026-05-15'), nextDueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), status: 'scheduled', notes: 'Due in 5 days' },
  ]);
  console.log(`   ✅ ${vaccinations.length} vaccinations created`);

  // ─── 6. Pregnancies ────────────────────────────────
  console.log('🤰 Creating pregnancies...');
  const pregnancies = await Pregnancy.insertMany([
    { cowId: cows[2]._id, inseminationDate: new Date('2026-02-01'), inseminationType: 'artificial', expectedDeliveryDate: new Date('2026-11-15'), status: 'monitoring', vetId: users[1]._id, notes: 'Month 6 - healthy progression' },
    { cowId: cows[5]._id, inseminationDate: new Date('2026-05-10'), inseminationType: 'natural', expectedDeliveryDate: new Date('2027-02-20'), status: 'confirmed', vetId: users[1]._id },
  ]);
  console.log(`   ✅ ${pregnancies.length} pregnancies created`);

  // ─── 7. Feed Logs ─────────────────────────────────
  console.log('🍽️ Creating feed logs...');
  const feedDays = 30;
  const feedLogs: any[] = [];
  for (let d = 0; d < feedDays; d++) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    feedLogs.push(
      { shedId: sheds[0]._id, feedType: 'green-fodder', quantityKg: 200 + Math.floor(Math.random() * 50), costIncurred: 800 + Math.floor(Math.random() * 200), loggedBy: users[2]._id, date },
      { shedId: sheds[0]._id, feedType: 'concentrate', quantityKg: 40 + Math.floor(Math.random() * 10), costIncurred: 600 + Math.floor(Math.random() * 100), loggedBy: users[2]._id, date },
      { shedId: sheds[1]._id, feedType: 'green-fodder', quantityKg: 150 + Math.floor(Math.random() * 40), costIncurred: 650 + Math.floor(Math.random() * 150), loggedBy: users[2]._id, date },
    );
  }
  await FeedLog.insertMany(feedLogs);
  console.log(`   ✅ ${feedLogs.length} feed logs created (${feedDays} days)`);

  // ─── 8. Tasks ──────────────────────────────────────
  console.log('📋 Creating tasks...');
  const tasks = await Task.insertMany([
    { title: 'Morning Feeding - Shed A', description: 'Green fodder + concentrate mix', assignedTo: users[2]._id, assignedBy: users[0]._id, priority: 'high', status: 'completed', category: 'feeding', dueDate: new Date(), completedAt: new Date() },
    { title: 'Clean Water Troughs', description: 'All sheds', assignedTo: users[2]._id, assignedBy: users[0]._id, priority: 'medium', status: 'in-progress', category: 'cleaning', dueDate: new Date() },
    { title: 'Sick Bay Check', description: 'Monitor Meera and Rescued-Rani', assignedTo: users[1]._id, assignedBy: users[0]._id, priority: 'urgent', status: 'pending', category: 'medical', dueDate: new Date() },
    { title: 'Shed B Roof Repair', description: 'Leaking in monsoon season', assignedTo: users[2]._id, assignedBy: users[0]._id, priority: 'medium', status: 'pending', category: 'maintenance', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
    { title: 'Evening Feeding - All Sheds', assignedTo: users[2]._id, assignedBy: users[0]._id, priority: 'high', status: 'pending', category: 'feeding', dueDate: new Date() },
    { title: 'Update Vaccination Records', description: 'Enter latest FMD batch data', assignedTo: users[1]._id, assignedBy: users[0]._id, priority: 'low', status: 'pending', category: 'administrative', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  ]);
  console.log(`   ✅ ${tasks.length} tasks created`);

  // ─── 9. Attendance ─────────────────────────────────
  console.log('📊 Creating attendance records...');
  const attendanceRecords: any[] = [];
  for (let d = 0; d < 14; d++) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    date.setHours(0, 0, 0, 0);
    const checkIn = new Date(date);
    checkIn.setHours(7, 30, 0, 0);
    const checkOut = new Date(date);
    checkOut.setHours(17, 0, 0, 0);

    attendanceRecords.push(
      { userId: users[2]._id, date, checkInTime: checkIn, checkOutTime: checkOut, status: 'present', hoursWorked: 9.5 },
      { userId: users[1]._id, date, checkInTime: checkIn, checkOutTime: checkOut, status: 'present', hoursWorked: 9.5 },
    );
  }
  await Attendance.insertMany(attendanceRecords);
  console.log(`   ✅ ${attendanceRecords.length} attendance records created`);

  // ─── 10. Donations ────────────────────────────────
  console.log('💰 Creating donations...');
  const donations = await Donation.insertMany([
    { donorId: users[3]._id, amount: 25000, donationType: 'one-time', purpose: 'cow-care', paymentMethod: 'razorpay', paymentStatus: 'completed', receiptNumber: 'RCP-2026-00001', donorName: 'Amit Patel', donorEmail: 'amit@gmail.com', donorPhone: '9876543213', donorPan: 'ABCDE1234F', donorAddress: 'Mumbai, Maharashtra', is80GEligible: true, razorpayPaymentId: 'pay_demo_001' },
    { donorId: users[3]._id, amount: 10000, donationType: 'monthly', purpose: 'feed', paymentMethod: 'upi', paymentStatus: 'completed', receiptNumber: 'RCP-2026-00002', donorName: 'Amit Patel', donorEmail: 'amit@gmail.com', donorPhone: '9876543213', is80GEligible: true, razorpayPaymentId: 'pay_demo_002' },
    { amount: 50000, donationType: 'one-time', purpose: 'infrastructure', paymentMethod: 'bank-transfer', paymentStatus: 'completed', receiptNumber: 'RCP-2026-00003', donorName: 'Ramesh Foundation', donorEmail: 'info@rameshfoundation.org', donorPhone: '0221234567', donorPan: 'AABTR1234C', donorAddress: 'Delhi', is80GEligible: true },
    { amount: 5000, donationType: 'one-time', purpose: 'medical', paymentMethod: 'cash', paymentStatus: 'completed', receiptNumber: 'RCP-2026-00004', donorName: 'Sunita Devi', donorEmail: 'sunita@email.com', is80GEligible: false },
    { amount: 15000, donationType: 'annual', purpose: 'adopt-a-cow', paymentMethod: 'razorpay', paymentStatus: 'completed', receiptNumber: 'RCP-2026-00005', donorName: 'Vikram Singh', donorEmail: 'vikram@outlook.com', donorPan: 'BRSPS5678D', donorAddress: 'Jaipur, Rajasthan', is80GEligible: true, razorpayPaymentId: 'pay_demo_003' },
  ]);
  console.log(`   ✅ ${donations.length} donations created`);

  // ─── 11. Adopt-a-Cow ──────────────────────────────
  console.log('❤️ Creating adoptions...');
  const adoptions = await AdoptACow.insertMany([
    { donorId: users[3]._id, cowId: cows[0]._id, monthlyAmount: 3000, startDate: new Date('2026-01-01'), status: 'active', totalPaid: 21000, lastPaymentDate: new Date('2026-07-01') },
    { donorId: users[3]._id, cowId: cows[5]._id, monthlyAmount: 2500, startDate: new Date('2026-03-01'), status: 'active', totalPaid: 12500, lastPaymentDate: new Date('2026-07-01') },
  ]);
  console.log(`   ✅ ${adoptions.length} adoptions created`);

  // ─── 12. Visitors ─────────────────────────────────
  console.log('👥 Creating visitors...');
  const today = new Date();
  const visitorData = await Visitor.insertMany([
    { name: 'Priya Sharma', phone: '9123456780', email: 'priya@gmail.com', visitType: 'individual', purpose: 'tour', groupSize: 1, scheduledDate: today, scheduledTime: '10:00', status: 'completed', checkInTime: new Date(today.setHours(10, 5)), checkOutTime: new Date(today.setHours(12, 30)), feedback: { rating: 5, comment: 'Beautiful gaushala! Very well maintained.' } },
    { name: 'DPS School Group', phone: '9123456781', email: 'dps@school.org', visitType: 'school', purpose: 'tour', groupSize: 35, scheduledDate: new Date(), scheduledTime: '09:00', status: 'scheduled', notes: 'Class 8 students with 2 teachers' },
    { name: 'Ramesh Foundation', phone: '0221234567', email: 'info@rameshfoundation.org', visitType: 'ngo', purpose: 'donation', groupSize: 5, scheduledDate: new Date(), scheduledTime: '11:00', status: 'scheduled' },
    { name: 'Dr. Anil Kumar', phone: '9123456782', visitType: 'government', purpose: 'inspection', groupSize: 3, scheduledDate: new Date(Date.now() + 2 * 86400000), scheduledTime: '14:00', status: 'scheduled', notes: 'Animal Husbandry Dept inspection' },
    { name: 'Sunita Devi', phone: '9123456783', visitType: 'individual', purpose: 'adoption', groupSize: 2, scheduledDate: new Date(Date.now() - 86400000), scheduledTime: '10:30', status: 'completed', feedback: { rating: 4, comment: 'Loved meeting Lakshmi!' } },
    { name: 'Times of India Reporter', phone: '9123456784', email: 'reporter@toi.in', visitType: 'media', purpose: 'media-coverage', groupSize: 2, scheduledDate: new Date(Date.now() + 5 * 86400000), scheduledTime: '11:00', status: 'scheduled', notes: 'Feature article on gaushala management' },
    { name: 'Rotary Club Jaipur', phone: '9123456785', visitType: 'group', purpose: 'volunteering', groupSize: 12, scheduledDate: new Date(Date.now() - 3 * 86400000), scheduledTime: '08:00', status: 'completed', feedback: { rating: 5, comment: 'Great experience volunteering here!' } },
    { name: 'Cancelled Visit', phone: '9123456786', visitType: 'individual', purpose: 'tour', groupSize: 1, scheduledDate: new Date(Date.now() - 7 * 86400000), status: 'cancelled' },
  ]);
  console.log(`   ✅ ${visitorData.length} visitors created`);

  // ─── 13. Expenses ─────────────────────────────────
  console.log('💹 Creating expenses...');
  const expenseData: any[] = [];
  const expenseItems = [
    { category: 'feed', description: 'Monthly green fodder supply', paidTo: 'Rajasthan Fodder Co.', amount: 45000 },
    { category: 'feed', description: 'Concentrate feed (cattle mix)', paidTo: 'Amul Cattle Feed', amount: 28000 },
    { category: 'medical', description: 'FMD vaccination batch', paidTo: 'Vet Pharma Supplies', amount: 12000 },
    { category: 'medical', description: 'Monthly medicine supply', paidTo: 'City Vet Store', amount: 8500 },
    { category: 'salary', description: 'Caretaker salary - July', paidTo: 'Suresh Kumar', amount: 18000 },
    { category: 'salary', description: 'Vet salary - July', paidTo: 'Dr. Priya Verma', amount: 35000 },
    { category: 'salary', description: 'Helper wages - July', paidTo: 'Daily wage workers', amount: 25000 },
    { category: 'utilities', description: 'Electricity bill - July', paidTo: 'Rajasthan Vidyut Nigam', amount: 8200 },
    { category: 'utilities', description: 'Water tanker charges', paidTo: 'Municipal Water Supply', amount: 3500 },
    { category: 'infrastructure', description: 'Shed B roof repair material', paidTo: 'Rajesh Hardware', amount: 15000 },
    { category: 'transport', description: 'Fodder transport', paidTo: 'Local Transport', amount: 5000 },
    { category: 'equipment', description: 'Milking machine maintenance', paidTo: 'DeLaval Service', amount: 4500 },
    { category: 'miscellaneous', description: 'Office supplies', paidTo: 'Stationery Shop', amount: 1200 },
  ];
  for (let m = 0; m < 3; m++) {
    for (const item of expenseItems) {
      const date = new Date();
      date.setMonth(date.getMonth() - m);
      date.setDate(Math.floor(Math.random() * 28) + 1);
      expenseData.push({
        ...item,
        amount: item.amount + Math.floor(Math.random() * 2000 - 1000),
        date,
        paymentMode: ['cash', 'upi', 'bank-transfer', 'cheque'][Math.floor(Math.random() * 4)],
        recordedBy: users[0]._id,
        approvedBy: users[0]._id,
      });
    }
  }
  await Expense.insertMany(expenseData);
  console.log(`   ✅ ${expenseData.length} expenses created (3 months)`);

  // ─── Done ──────────────────────────────────────────
  console.log('\n🎉 Seed completed successfully!');
  console.log('─────────────────────────────────');
  console.log('📧 Login credentials (all passwords: admin123):');
  console.log('   Admin:        admin@egowshala.org');
  console.log('   Veterinarian: vet@egowshala.org');
  console.log('   Caretaker:    caretaker@egowshala.org');
  console.log('   Donor:        donor@egowshala.org');
  console.log('   Volunteer:    volunteer@egowshala.org');
  console.log('   Government:   govt@egowshala.org');
  console.log('─────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
