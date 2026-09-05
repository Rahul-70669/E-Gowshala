/**
 * Development server with embedded MongoDB (no external DB needed).
 * Auto-seeds the database on first run.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
config();

const startDevServer = async () => {
  console.log('🔧 Starting development environment...\n');

  // Start in-memory MongoDB
  console.log('📦 Starting embedded MongoDB...');
  const mongod = await MongoMemoryServer.create({
    instance: { dbName: 'egowshala', storageEngine: 'wiredTiger' },
    binary: { version: '7.0.0' },
  });

  const mongoUri = mongod.getUri();
  process.env.MONGODB_URI = mongoUri;
  console.log(`   ✅ MongoDB running at ${mongoUri}\n`);

  // Connect to MongoDB
  await mongoose.connect(mongoUri);
  console.log('   ✅ Mongoose connected\n');

  // Auto-seed if DB is empty
  const User = (await import('./modules/auth/auth.model')).default;
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('🌱 Empty database — auto-seeding...\n');
    // Import all models
    const Cow = (await import('./modules/cow/cow.model')).default;
    const Shed = (await import('./modules/cow/shed.model')).default;
    const HealthRecord = (await import('./modules/health/healthRecord.model')).default;
    const Vaccination = (await import('./modules/health/vaccination.model')).default;
    const Pregnancy = (await import('./modules/health/pregnancy.model')).default;
    const FeedLog = (await import('./modules/operations/feedLog.model')).default;
    const Task = (await import('./modules/operations/task.model')).default;
    const Attendance = (await import('./modules/operations/attendance.model')).default;
    const Donation = (await import('./modules/donation/donation.model')).default;
    const AdoptACow = (await import('./modules/donation/adoptACow.model')).default;
    const Visitor = (await import('./modules/visitor/visitor.model')).default;
    const Expense = (await import('./modules/finance/expense.model')).default;

    const passwordHash = await bcrypt.hash('admin123', 12);
    const users = await User.insertMany([
      { name: 'Rajesh Sharma', email: 'admin@egowshala.org', passwordHash, role: 'admin', phone: '9876543210' },
      { name: 'Dr. Priya Verma', email: 'vet@egowshala.org', passwordHash, role: 'veterinarian', phone: '9876543211' },
      { name: 'Suresh Kumar', email: 'caretaker@egowshala.org', passwordHash, role: 'caretaker', phone: '9876543212' },
      { name: 'Amit Patel', email: 'donor@egowshala.org', passwordHash, role: 'donor', phone: '9876543213' },
      { name: 'Neha Gupta', email: 'volunteer@egowshala.org', passwordHash, role: 'volunteer', phone: '9876543214' },
      { name: 'Sanjay Mishra', email: 'govt@egowshala.org', passwordHash, role: 'government', phone: '9876543215' },
    ]);
    console.log(`   ✅ ${users.length} users`);

    const sheds = await Shed.insertMany([
      { name: 'Shed A — Main', code: 'SH-A', capacity: 30, currentCount: 8, description: 'Primary shed for healthy cows' },
      { name: 'Shed B — Recovery', code: 'SH-B', capacity: 15, currentCount: 4, description: 'Medical recovery ward' },
      { name: 'Shed C — Calves', code: 'SH-C', capacity: 20, currentCount: 5, description: 'Young calves under 1 year' },
      { name: 'Shed D — Pregnant', code: 'SH-D', capacity: 10, currentCount: 3, description: 'Pregnant cows, special care' },
      { name: 'Open Grazing', code: 'SH-E', capacity: 50, currentCount: 0, description: 'Open grazing area' },
      { name: 'Isolation Ward', code: 'SH-F', capacity: 5, currentCount: 0, description: 'Quarantine for new arrivals' },
    ]);
    console.log(`   ✅ ${sheds.length} sheds`);

    const breeds = ['Gir', 'Sahiwal', 'Tharparkar', 'Kankrej', 'Red Sindhi', 'Hariana', 'Ongole', 'Crossbred'];
    const cowNames = ['Lakshmi', 'Ganga', 'Nandini', 'Kamadhenu', 'Surabhi', 'Gauri', 'Parvati', 'Saraswati', 'Radha', 'Sita', 'Durga', 'Annapurna', 'Bhavani', 'Meera', 'Tulsi', 'Rohini', 'Revathi', 'Swati', 'Chitra', 'Pushpa'];
    const cowData: any[] = [];
    for (let i = 0; i < 20; i++) {
      const age = Math.floor(Math.random() * 12) + 1;
      cowData.push({
        tagId: `EG-${String(i + 1).padStart(4, '0')}`,
        name: cowNames[i],
        breed: breeds[i % breeds.length],
        gender: i < 18 ? 'female' : 'male',
        dateOfBirth: new Date(Date.now() - age * 365.25 * 24 * 60 * 60 * 1000),
        weight: 200 + Math.floor(Math.random() * 300),
        color: ['Brown', 'White', 'Black & White', 'Reddish Brown', 'Grey'][i % 5],
        status: i < 16 ? 'healthy' : i < 18 ? 'sick' : 'healthy',
        shedId: sheds[i % 4]._id,
        rescueDetails: { rescueDate: new Date(Date.now() - (age - 0.5) * 365.25 * 24 * 60 * 60 * 1000), location: ['Jaipur Highway', 'Udaipur Market', 'Jodhpur Village', 'Ajmer Road'][i % 4], condition: 'malnourished', rescuedBy: users[2]._id },
      });
    }
    const cows = await Cow.insertMany(cowData);
    console.log(`   ✅ ${cows.length} cows`);

    // Quick seed of other collections
    await Donation.insertMany([
      { amount: 5000, donationType: 'one-time', purpose: 'general', paymentMethod: 'upi', paymentStatus: 'completed', receiptNumber: 'RCP-2026-00001', donorName: 'Amit Patel', donorEmail: 'donor@egowshala.org', donorPan: 'ABCPD1234E', donorAddress: 'Mumbai, Maharashtra', is80GEligible: true },
      { amount: 25000, donationType: 'annual', purpose: 'medical', paymentMethod: 'bank-transfer', paymentStatus: 'completed', receiptNumber: 'RCP-2026-00002', donorName: 'Sunita Devi', donorEmail: 'sunita@yahoo.com', donorPan: 'XYZPS9876F', donorAddress: 'Delhi', is80GEligible: true },
      { amount: 1000, donationType: 'monthly', purpose: 'feed', paymentMethod: 'razorpay', paymentStatus: 'completed', receiptNumber: 'RCP-2026-00003', donorName: 'Ramesh Agarwal', donorEmail: 'ramesh@gmail.com', is80GEligible: false },
    ]);
    console.log('   ✅ 3 donations');

    const today = new Date();
    await Visitor.insertMany([
      { name: 'DPS School Group', phone: '9123456781', visitType: 'school', purpose: 'tour', groupSize: 35, scheduledDate: today, scheduledTime: '09:00', status: 'scheduled' },
      { name: 'Ramesh Foundation', phone: '0221234567', visitType: 'ngo', purpose: 'donation', groupSize: 5, scheduledDate: today, scheduledTime: '11:00', status: 'scheduled' },
      { name: 'Priya Sharma', phone: '9123456780', visitType: 'individual', purpose: 'tour', groupSize: 1, scheduledDate: new Date(Date.now() - 86400000), status: 'completed', feedback: { rating: 5, comment: 'Beautiful gaushala!' } },
    ]);
    console.log('   ✅ 3 visitors');

    const expenseItems = [
      { category: 'feed', description: 'Monthly green fodder', paidTo: 'Rajasthan Fodder Co.', amount: 45000 },
      { category: 'medical', description: 'FMD vaccination batch', paidTo: 'Vet Pharma Supplies', amount: 12000 },
      { category: 'salary', description: 'Staff salary - July', paidTo: 'Staff', amount: 78000 },
      { category: 'utilities', description: 'Electricity bill', paidTo: 'RVNL', amount: 8200 },
    ];
    const expenseData: any[] = [];
    for (let m = 0; m < 3; m++) {
      for (const item of expenseItems) {
        const date = new Date(); date.setMonth(date.getMonth() - m); date.setDate(Math.floor(Math.random() * 28) + 1);
        expenseData.push({ ...item, amount: item.amount + Math.floor(Math.random() * 2000 - 1000), date, paymentMode: 'cash', recordedBy: users[0]._id, approvedBy: users[0]._id });
      }
    }
    await Expense.insertMany(expenseData);
    console.log(`   ✅ ${expenseData.length} expenses\n`);

    console.log('─────────────────────────────────');
    console.log('📧 Login: admin@egowshala.org / admin123');
    console.log('─────────────────────────────────\n');
  } else {
    console.log(`📊 Database has ${userCount} users — skipping seed\n`);
  }

  // Import and start Express server
  const app = (await import('./app')).default;
  const PORT = process.env.PORT || 5000;

  const server = app.listen(PORT, () => {
    console.log(`🚀 E-Gowshala API running at http://localhost:${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health\n`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n🛑 Shutting down...');
    server.close();
    await mongoose.disconnect();
    await mongod.stop();
    console.log('   ✅ Cleaned up. Goodbye!\n');
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

startDevServer().catch((err) => {
  console.error('❌ Failed to start dev server:', err);
  process.exit(1);
});
