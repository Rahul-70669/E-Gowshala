import Visitor from './visitor.model';

export const createVisitor = async (data: any) => {
  return Visitor.create(data);
};

export const getVisitors = async (filters: {
  status?: string;
  visitType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  const query: any = {};
  if (filters.status) query.status = filters.status;
  if (filters.visitType) query.visitType = filters.visitType;
  if (filters.startDate || filters.endDate) {
    query.scheduledDate = {};
    if (filters.startDate) query.scheduledDate.$gte = new Date(filters.startDate);
    if (filters.endDate) query.scheduledDate.$lte = new Date(filters.endDate);
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const [visitors, total] = await Promise.all([
    Visitor.find(query)
      .populate('assignedGuide', 'name')
      .sort({ scheduledDate: -1 })
      .skip(skip).limit(limit).lean(),
    Visitor.countDocuments(query),
  ]);

  return { visitors, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const checkInVisitor = async (id: string) => {
  const visitor = await Visitor.findByIdAndUpdate(id, {
    status: 'checked-in',
    checkInTime: new Date(),
  }, { new: true });
  if (!visitor) throw Object.assign(new Error('Visitor not found'), { statusCode: 404 });
  return visitor;
};

export const checkOutVisitor = async (id: string, feedback?: { rating: number; comment: string }) => {
  const updates: any = { status: 'completed', checkOutTime: new Date() };
  if (feedback) updates.feedback = feedback;
  const visitor = await Visitor.findByIdAndUpdate(id, updates, { new: true });
  if (!visitor) throw Object.assign(new Error('Visitor not found'), { statusCode: 404 });
  return visitor;
};

export const cancelVisit = async (id: string) => {
  return Visitor.findByIdAndUpdate(id, { status: 'cancelled' }, { new: true });
};

export const getTodaysVisitors = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return Visitor.find({
    scheduledDate: { $gte: today, $lt: tomorrow },
    status: { $ne: 'cancelled' },
  }).populate('assignedGuide', 'name').sort({ scheduledTime: 1 }).lean();
};

export const getVisitorStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todayCount, monthCount, scheduledToday, avgRating] = await Promise.all([
    Visitor.countDocuments({ scheduledDate: { $gte: today }, status: { $in: ['checked-in', 'completed'] } }),
    Visitor.countDocuments({ scheduledDate: { $gte: thisMonthStart }, status: 'completed' }),
    Visitor.countDocuments({ scheduledDate: { $gte: today }, status: 'scheduled' }),
    Visitor.aggregate([
      { $match: { 'feedback.rating': { $exists: true } } },
      { $group: { _id: null, avg: { $avg: '$feedback.rating' }, count: { $sum: 1 } } },
    ]),
  ]);

  return {
    todayVisitors: todayCount,
    monthlyVisitors: monthCount,
    scheduledToday,
    averageRating: avgRating[0]?.avg ? Math.round(avgRating[0].avg * 10) / 10 : 0,
    totalFeedbacks: avgRating[0]?.count || 0,
  };
};
