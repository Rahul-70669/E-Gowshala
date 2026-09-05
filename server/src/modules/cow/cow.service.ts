import Cow, { ICow } from './cow.model';
import Shed, { IShed } from './shed.model';

// Auto-generate unique tag ID: COW-2026-XXXX
const generateTagId = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const lastCow = await Cow.findOne({ tagId: new RegExp(`^COW-${year}-`) })
    .sort({ tagId: -1 })
    .lean();

  let nextNum = 1;
  if (lastCow) {
    const parts = lastCow.tagId.split('-');
    nextNum = parseInt(parts[2], 10) + 1;
  }

  return `COW-${year}-${String(nextNum).padStart(4, '0')}`;
};

interface CreateCowInput {
  name: string;
  breed: string;
  gender: ICow['gender'];
  dateOfBirth?: string;
  age?: number;
  weight?: number;
  color?: string;
  status?: ICow['status'];
  shedId?: string;
  photos?: string[];
  rescueDetails?: ICow['rescueDetails'];
  identificationMarks?: string;
  notes?: string;
}

export const createCow = async (input: CreateCowInput) => {
  const tagId = await generateTagId();
  const qrCodeData = JSON.stringify({ tagId, name: input.name, breed: input.breed });

  const cow = await Cow.create({
    ...input,
    tagId,
    qrCodeData,
    dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
  });

  // Update shed occupancy if assigned
  if (input.shedId) {
    await Shed.findByIdAndUpdate(input.shedId, { $inc: { currentOccupancy: 1 } });
  }

  return cow;
};

export const getAllCows = async (filters: {
  search?: string;
  status?: string;
  breed?: string;
  shedId?: string;
  page?: number;
  limit?: number;
}) => {
  const query: any = { isActive: true };

  if (filters.status) query.status = filters.status;
  if (filters.breed) query.breed = filters.breed;
  if (filters.shedId) query.shedId = filters.shedId;
  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { tagId: { $regex: filters.search, $options: 'i' } },
      { breed: { $regex: filters.search, $options: 'i' } },
    ];
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const [cows, total] = await Promise.all([
    Cow.find(query).populate('shedId', 'name shedType').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Cow.countDocuments(query),
  ]);

  return {
    cows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getCowById = async (id: string) => {
  const cow = await Cow.findById(id).populate('shedId', 'name shedType capacity').lean();
  if (!cow) {
    const error = new Error('Cow not found') as any;
    error.statusCode = 404;
    throw error;
  }
  return cow;
};

export const getCowByTagId = async (tagId: string) => {
  const cow = await Cow.findOne({ tagId }).populate('shedId', 'name shedType').lean();
  if (!cow) {
    const error = new Error('Cow not found with this tag') as any;
    error.statusCode = 404;
    throw error;
  }
  return cow;
};

export const updateCow = async (id: string, updates: Partial<CreateCowInput>) => {
  const cow = await Cow.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
    .populate('shedId', 'name shedType')
    .lean();
  if (!cow) {
    const error = new Error('Cow not found') as any;
    error.statusCode = 404;
    throw error;
  }
  return cow;
};

export const deleteCow = async (id: string) => {
  const cow = await Cow.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!cow) {
    const error = new Error('Cow not found') as any;
    error.statusCode = 404;
    throw error;
  }
  if (cow.shedId) {
    await Shed.findByIdAndUpdate(cow.shedId, { $inc: { currentOccupancy: -1 } });
  }
  return cow;
};

export const getCowStats = async () => {
  const [total, healthy, sick, pregnant, lactating, rescued] = await Promise.all([
    Cow.countDocuments({ isActive: true }),
    Cow.countDocuments({ isActive: true, status: 'healthy' }),
    Cow.countDocuments({ isActive: true, status: 'sick' }),
    Cow.countDocuments({ isActive: true, status: 'pregnant' }),
    Cow.countDocuments({ isActive: true, status: 'lactating' }),
    Cow.countDocuments({ isActive: true, status: 'rescued' }),
  ]);

  const breedDistribution = await Cow.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$breed', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  return { total, healthy, sick, pregnant, lactating, rescued, breedDistribution };
};

// ─── Shed CRUD ───────────────────────────────────────
export const createShed = async (input: {
  name: string;
  shedType: IShed['shedType'];
  capacity: number;
  caretakerInCharge?: string;
  location?: string;
}) => {
  return Shed.create(input);
};

export const getAllSheds = async () => {
  return Shed.find({ isActive: true })
    .populate('caretakerInCharge', 'name email')
    .sort({ name: 1 })
    .lean();
};
