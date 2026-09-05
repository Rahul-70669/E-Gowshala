import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Cow from './modules/cow/cow.model';

async function checkCows() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const allCount = await Cow.countDocuments({});
  const activeCount = await Cow.countDocuments({ isActive: true });
  const sample = await Cow.find({}).limit(3).lean();
  console.log({ allCount, activeCount, sample });
  await mongoose.disconnect();
}

checkCows();
