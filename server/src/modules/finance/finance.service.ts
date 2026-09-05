import Expense from './expense.model';
import Donation from '../donation/donation.model';

export const createExpense = async (data: any) => {
  const expense = await Expense.create(data);
  return expense.populate([
    { path: 'recordedBy', select: 'name' },
    { path: 'approvedBy', select: 'name' },
  ]);
};

export const getExpenses = async (filters: {
  category?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  const query: any = {};
  if (filters.category) query.category = filters.category;
  if (filters.startDate || filters.endDate) {
    query.date = {};
    if (filters.startDate) query.date.$gte = new Date(filters.startDate);
    if (filters.endDate) query.date.$lte = new Date(filters.endDate);
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const [expenses, total] = await Promise.all([
    Expense.find(query)
      .populate('recordedBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ date: -1 })
      .skip(skip).limit(limit).lean(),
    Expense.countDocuments(query),
  ]);

  return { expenses, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const updateExpense = async (id: string, updates: any) => {
  return Expense.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
    .populate('recordedBy', 'name').lean();
};

export const deleteExpense = async (id: string) => {
  return Expense.findByIdAndDelete(id);
};

// ─── Financial Summary ──────────────────────────────
export const getFinancialSummary = async (year?: number, month?: number) => {
  const now = new Date();
  const y = year || now.getFullYear();
  const m = month !== undefined ? month : now.getMonth();

  const monthStart = new Date(y, m, 1);
  const monthEnd = new Date(y, m + 1, 0, 23, 59, 59);
  const yearStart = new Date(y, 0, 1);
  const yearEnd = new Date(y, 11, 31, 23, 59, 59);

  // Monthly breakdown
  const [monthlyExpenses, monthlyIncome, yearlyExpenses, yearlyIncome, categoryBreakdown, monthlyTrends] = await Promise.all([
    Expense.aggregate([
      { $match: { date: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Donation.aggregate([
      { $match: { paymentStatus: 'completed', createdAt: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Expense.aggregate([
      { $match: { date: { $gte: yearStart, $lte: yearEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Donation.aggregate([
      { $match: { paymentStatus: 'completed', createdAt: { $gte: yearStart, $lte: yearEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Expense.aggregate([
      { $match: { date: { $gte: monthStart, $lte: monthEnd } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
    // Last 12 months trend
    Expense.aggregate([
      { $match: { date: { $gte: new Date(y, m - 11, 1) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$date' } }, total: { $sum: '$amount' } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const incomeTrends = await Donation.aggregate([
    { $match: { paymentStatus: 'completed', createdAt: { $gte: new Date(y, m - 11, 1) } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, total: { $sum: '$amount' } } },
    { $sort: { _id: 1 } },
  ]);

  return {
    monthlyExpense: monthlyExpenses[0]?.total || 0,
    monthlyIncome: monthlyIncome[0]?.total || 0,
    yearlyExpense: yearlyExpenses[0]?.total || 0,
    yearlyIncome: yearlyIncome[0]?.total || 0,
    netBalance: (yearlyIncome[0]?.total || 0) - (yearlyExpenses[0]?.total || 0),
    categoryBreakdown,
    expenseTrends: monthlyTrends,
    incomeTrends,
  };
};
