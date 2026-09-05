import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from './modules/auth/auth.model';
import Cow from './modules/cow/cow.model';
import Shed from './modules/cow/shed.model';
import HealthRecord from './modules/health/healthRecord.model';
import Vaccination from './modules/health/vaccination.model';
import Pregnancy from './modules/health/pregnancy.model';
import Task from './modules/operations/task.model';
import FeedLog from './modules/operations/feedLog.model';
import Attendance from './modules/operations/attendance.model';
import Donation from './modules/donation/donation.model';
import AdoptACow from './modules/donation/adoptACow.model';
import Visitor from './modules/visitor/visitor.model';
import Expense from './modules/finance/expense.model';
import Inventory from './modules/operations/inventory.model';

async function auditDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI found in env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB for database audit\n');

  const [
    userCount,
    cowCount,
    shedCount,
    healthCount,
    vaccCount,
    pregCount,
    taskCount,
    feedCount,
    attCount,
    invCount,
    donCount,
    adoptCount,
    visCount,
    expCount,
  ] = await Promise.all([
    User.countDocuments(),
    Cow.countDocuments(),
    Shed.countDocuments(),
    HealthRecord.countDocuments(),
    Vaccination.countDocuments(),
    Pregnancy.countDocuments(),
    Task.countDocuments(),
    FeedLog.countDocuments(),
    Attendance.countDocuments(),
    Inventory.countDocuments(),
    Donation.countDocuments(),
    AdoptACow.countDocuments(),
    Visitor.countDocuments(),
    Expense.countDocuments(),
  ]);

  console.log('==============================================');
  console.log('         E-GOWSHALA DATABASE AUDIT            ');
  console.log('==============================================');
  console.log(` 👥 Users / Staff       : ${userCount}`);
  console.log(` 🐄 Cattle Registered   : ${cowCount}`);
  console.log(` 🏠 Housing Sheds       : ${shedCount}`);
  console.log(` 🩺 Health Records      : ${healthCount}`);
  console.log(` 💉 Vaccinations        : ${vaccCount}`);
  console.log(` 🐮 Breeding/Pregnancies: ${pregCount}`);
  console.log(` 📋 Tasks (Operations)  : ${taskCount}`);
  console.log(` 🌾 Feed Logs           : ${feedCount}`);
  console.log(` 🕒 Attendance Records  : ${attCount}`);
  console.log(` 📦 Inventory Items     : ${invCount}`);
  console.log(` 💰 Donations           : ${donCount}`);
  console.log(` ❤️ Adoptions Logged    : ${adoptCount}`);
  console.log(` 🚶 Visitors Logged     : ${visCount}`);
  console.log(` 💹 Expenses Logged     : ${expCount}`);
  console.log('==============================================\n');

  // Verify field completeness for cows
  const cows = await Cow.find();
  let cowsMissingFields = 0;
  for (const c of cows) {
    if (!c.tagId || !c.name || !c.breed || !c.gender || c.age === undefined || c.weight === undefined || !c.color || !c.identificationMarks || !c.notes) {
      cowsMissingFields++;
    }
  }
  console.log(` Cattle with empty core fields: ${cowsMissingFields} / ${cows.length}`);

  // Verify inventory completeness
  const invItems = await Inventory.find();
  let invMissingFields = 0;
  for (const item of invItems) {
    if (!item.name || !item.nameHi || !item.category || item.quantity === undefined || !item.unit || item.costPerUnit === undefined || !item.supplier || !item.location || !item.notes) {
      invMissingFields++;
    }
  }
  console.log(` Inventory items with empty fields: ${invMissingFields} / ${invItems.length}`);

  console.log('\n─── AVAILABLE USER ACCOUNTS FOR TESTING ───');
  const users = await User.find().select('name email role isActive').limit(10);
  users.forEach((u) => {
    console.log(` • [${u.role.toUpperCase().padEnd(12)}] ${u.email.padEnd(26)} (Name: ${u.name}, Active: ${u.isActive})`);
  });

  await mongoose.disconnect();
  console.log('\nAudit complete.');
}

auditDatabase().catch(console.error);
