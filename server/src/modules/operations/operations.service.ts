import FeedLog from './feedLog.model';
import Task from './task.model';
import Attendance from './attendance.model';
import Inventory from './inventory.model';

// ─── Feed Logs ──────────────────────────────────────
export const createFeedLog = async (data: any) => {
  const log = await FeedLog.create(data);
  return log.populate([
    { path: 'shedId', select: 'name shedType' },
    { path: 'loggedBy', select: 'name' },
  ]);
};

export const getFeedLogs = async (filters: {
  shedId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  const query: any = {};
  if (filters.shedId) query.shedId = filters.shedId;
  if (filters.startDate || filters.endDate) {
    query.date = {};
    if (filters.startDate) query.date.$gte = new Date(filters.startDate);
    if (filters.endDate) query.date.$lte = new Date(filters.endDate);
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    FeedLog.find(query)
      .populate('shedId', 'name shedType')
      .populate('loggedBy', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    FeedLog.countDocuments(query),
  ]);

  return { logs, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const getFeedTrends = async (days: number = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return FeedLog.aggregate([
    { $match: { date: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        totalQuantityKg: { $sum: '$quantityKg' },
        totalCost: { $sum: '$costIncurred' },
        totalWater: { $sum: { $ifNull: ['$waterIntakeLiters', 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

// ─── Tasks ──────────────────────────────────────────
export const createTask = async (data: any) => {
  const task = await Task.create(data);
  return task.populate([
    { path: 'assignedTo', select: 'name email role' },
    { path: 'assignedBy', select: 'name' },
  ]);
};

export const getTasks = async (filters: {
  status?: string;
  priority?: string;
  assignedTo?: string;
  category?: string;
}) => {
  const query: any = {};
  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.assignedTo) query.assignedTo = filters.assignedTo;
  if (filters.category) query.category = filters.category;

  return Task.find(query)
    .populate('assignedTo', 'name email role')
    .populate('assignedBy', 'name')
    .sort({ priority: -1, dueDate: 1 })
    .lean();
};

export const updateTask = async (id: string, updates: any) => {
  if (updates.status === 'completed') {
    updates.completedAt = new Date();
  }
  return Task.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
    .populate('assignedTo', 'name email role')
    .lean();
};

export const deleteTask = async (id: string) => {
  return Task.findByIdAndDelete(id);
};

// ─── Attendance ─────────────────────────────────────
export const checkIn = async (userId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await Attendance.findOne({ userId, date: today });
  if (existing) {
    const error = new Error('Already checked in today') as any;
    error.statusCode = 400;
    throw error;
  }

  return Attendance.create({
    userId,
    date: today,
    checkInTime: new Date(),
    status: 'present',
  });
};

export const checkOut = async (userId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await Attendance.findOne({ userId, date: today });
  if (!attendance) {
    const error = new Error('No check-in found for today') as any;
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  const hoursWorked = (now.getTime() - attendance.checkInTime.getTime()) / (1000 * 60 * 60);

  attendance.checkOutTime = now;
  attendance.hoursWorked = Math.round(hoursWorked * 100) / 100;
  if (hoursWorked < 4) attendance.status = 'half-day';

  return attendance.save();
};

export const getAttendance = async (filters: { userId?: string; startDate?: string; endDate?: string }) => {
  const query: any = {};
  if (filters.userId) query.userId = filters.userId;
  if (filters.startDate || filters.endDate) {
    query.date = {};
    if (filters.startDate) query.date.$gte = new Date(filters.startDate);
    if (filters.endDate) query.date.$lte = new Date(filters.endDate);
  }

  return Attendance.find(query)
    .populate('userId', 'name email role')
    .sort({ date: -1 })
    .lean();
};

export const getOperationsStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [pendingTasks, todayFeedLogs, todayAttendance, overdueTasks, totalInventoryItems, lowStockItems] = await Promise.all([
    Task.countDocuments({ status: { $in: ['pending', 'in-progress'] } }),
    FeedLog.countDocuments({ date: { $gte: today } }),
    Attendance.countDocuments({ date: today }),
    Task.countDocuments({ status: 'pending', dueDate: { $lt: today } }),
    Inventory.countDocuments(),
    Inventory.countDocuments({ $expr: { $lte: ['$quantity', '$minThreshold'] } }),
  ]);

  return { pendingTasks, todayFeedLogs, todayAttendance, overdueTasks, totalInventoryItems, lowStockItems };
};

// ─── Inventory Management ───────────────────────────
const DEFAULT_INVENTORY_ITEMS = [
  { name: 'Green Lucerne / Barseem', nameHi: 'हरा बरसीम / लूसर्न', category: 'green-fodder', quantity: 1200, unit: 'kg', minThreshold: 300, costPerUnit: 4, location: 'Fodder Shed A' },
  { name: 'Wheat Straw / Bhusa', nameHi: 'गेहूं का भूसा', category: 'dry-fodder', quantity: 3500, unit: 'kg', minThreshold: 800, costPerUnit: 7, location: 'Main Barn B' },
  { name: 'Mustard Oil Cake (Sarson Khali)', nameHi: 'सरसों की खल', category: 'concentrate', quantity: 450, unit: 'kg', minThreshold: 100, costPerUnit: 28, location: 'Feed Storage 1' },
  { name: 'Gram Churi / Chana Churi', nameHi: 'चना चूरी', category: 'concentrate', quantity: 600, unit: 'kg', minThreshold: 150, costPerUnit: 32, location: 'Feed Storage 1' },
  { name: 'Chelated Mineral Mixture', nameHi: 'खनिज मिश्रण (मिनरल मिक्सचर)', category: 'supplement', quantity: 80, unit: 'kg', minThreshold: 25, costPerUnit: 120, location: 'Pharma Store' },
  { name: 'Liquid Calcium (5L)', nameHi: 'कैल्शियम टॉनिक', category: 'supplement', quantity: 18, unit: 'bottle', minThreshold: 5, costPerUnit: 650, location: 'Pharma Store' },
  { name: 'Oxytetracycline Injection (100ml)', nameHi: 'ऑक्सीटेट्रासाइक्लिन एंटीबायोटिक', category: 'medicine', quantity: 12, unit: 'bottle', minThreshold: 4, costPerUnit: 180, location: 'Vet Clinic' },
  { name: 'Povidone Iodine Ointment (500g)', nameHi: 'पोविडोन आयोडीन मरहम', category: 'medicine', quantity: 8, unit: 'packet', minThreshold: 3, costPerUnit: 220, location: 'Vet Clinic' },
];

export const getInventoryItems = async (filters: { category?: string; lowStockOnly?: boolean; search?: string }) => {
  // Ensure default items exist if DB is fresh
  const count = await Inventory.countDocuments();
  if (count === 0) {
    await Inventory.insertMany(DEFAULT_INVENTORY_ITEMS);
  }

  const query: any = {};
  if (filters.category && filters.category !== 'all') {
    query.category = filters.category;
  }
  if (filters.lowStockOnly) {
    query.$expr = { $lte: ['$quantity', '$minThreshold'] };
  }
  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { nameHi: { $regex: filters.search, $options: 'i' } },
    ];
  }

  return Inventory.find(query).sort({ category: 1, name: 1 }).lean();
};

export const createInventoryItem = async (data: any) => {
  return Inventory.create(data);
};

export const updateInventoryItem = async (id: string, updates: any) => {
  if (updates.quantity !== undefined) {
    updates.lastRestockedAt = new Date();
  }
  return Inventory.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean();
};

export const deleteInventoryItem = async (id: string) => {
  return Inventory.findByIdAndDelete(id);
};

export const getInventoryStats = async () => {
  const items = await Inventory.find().lean();
  let totalValue = 0;
  let lowStockCount = 0;
  const categoryCounts: Record<string, number> = {};

  items.forEach((item: any) => {
    totalValue += (item.quantity || 0) * (item.costPerUnit || 0);
    if ((item.quantity || 0) <= (item.minThreshold || 0)) {
      lowStockCount++;
    }
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
  });

  return {
    totalItems: items.length,
    lowStockCount,
    totalValuation: Math.round(totalValue),
    categoryCounts,
  };
};
