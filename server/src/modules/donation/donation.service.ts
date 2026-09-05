import Donation from './donation.model';
import AdoptACow from './adoptACow.model';
import { generate80GReceipt } from '../../utils/pdfGenerator';
import { uploadBufferToCloudinary } from '../../config/cloudinary';
import { sendDonationConfirmationEmail } from '../../utils/emailService';

// Auto-generate receipt number: RCP-2026-XXXXX
const generateReceiptNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await Donation.countDocuments();
  return `RCP-${year}-${String(count + 1).padStart(5, '0')}`;
};

// ─── Donations ──────────────────────────────────────
export const createDonation = async (data: any) => {
  const receiptNumber = await generateReceiptNumber();
  const donation = await Donation.create({ ...data, receiptNumber });
  return donation;
};

export const completeDonation = async (
  donationId: string,
  paymentDetails: { razorpayPaymentId: string; razorpaySignature: string }
) => {
  const donation = await Donation.findById(donationId);
  if (!donation) {
    const error = new Error('Donation not found') as any;
    error.statusCode = 404;
    throw error;
  }

  donation.razorpayPaymentId = paymentDetails.razorpayPaymentId;
  donation.razorpaySignature = paymentDetails.razorpaySignature;
  donation.paymentStatus = 'completed';

  // Generate 80G receipt PDF
  if (donation.is80GEligible) {
    const pdfBuffer = await generate80GReceipt({
      receiptNumber: donation.receiptNumber,
      donorName: donation.donorName,
      donorEmail: donation.donorEmail,
      donorPan: donation.donorPan || 'N/A',
      donorAddress: donation.donorAddress || 'N/A',
      amount: donation.amount,
      purpose: donation.purpose,
      date: donation.createdAt,
      paymentId: paymentDetails.razorpayPaymentId,
    });
    
    // Upload PDF to Cloudinary
    try {
      const uploadRes = await uploadBufferToCloudinary(pdfBuffer, 'egowshala/receipts', 'raw');
      donation.receiptPdfUrl = uploadRes.secure_url;
    } catch (uploadErr) {
      console.warn('Cloudinary PDF upload warning (using fallback base64):', uploadErr);
      donation.receiptPdfUrl = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
    }
  }

  await donation.save();

  // Send confirmation email (non-blocking)
  try {
    await sendDonationConfirmationEmail({
      to: donation.donorEmail,
      donorName: donation.donorName,
      amount: donation.amount,
      receiptNumber: donation.receiptNumber,
      purpose: donation.purpose,
      paymentId: paymentDetails.razorpayPaymentId,
      is80GEligible: donation.is80GEligible,
      receiptPdfUrl: donation.receiptPdfUrl,
    });
  } catch (emailErr) {
    console.warn('[Email] Donation confirmation email failed (non-blocking):', emailErr);
  }

  return donation;
};

export const getDonations = async (filters: {
  donorId?: string;
  paymentStatus?: string;
  purpose?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  const query: any = {};
  if (filters.donorId) query.donorId = filters.donorId;
  if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
  if (filters.purpose) query.purpose = filters.purpose;
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const [donations, total] = await Promise.all([
    Donation.find(query)
      .populate('donorId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Donation.countDocuments(query),
  ]);

  return { donations, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const getDonationById = async (id: string) => {
  return Donation.findById(id).populate('donorId', 'name email phone').lean();
};

// ─── Adopt-a-Cow ────────────────────────────────────
export const createAdoption = async (data: any) => {
  const adoption = await AdoptACow.create(data);
  return adoption.populate([
    { path: 'donorId', select: 'name email' },
    { path: 'cowId', select: 'tagId name breed photos' },
  ]);
};

export const getAdoptions = async (filters: { donorId?: string; cowId?: string; status?: string }) => {
  const query: any = {};
  if (filters.donorId) query.donorId = filters.donorId;
  if (filters.cowId) query.cowId = filters.cowId;
  if (filters.status) query.status = filters.status;

  return AdoptACow.find(query)
    .populate('donorId', 'name email')
    .populate('cowId', 'tagId name breed photos')
    .sort({ createdAt: -1 })
    .lean();
};

export const updateAdoption = async (id: string, updates: any) => {
  return AdoptACow.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
    .populate('cowId', 'tagId name breed')
    .lean();
};

// ─── Donation Stats ─────────────────────────────────
export const getDonationStats = async () => {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [totalDonations, thisMonthTotal, lastMonthTotal, activeAdoptions, totalDonors] = await Promise.all([
    Donation.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Donation.aggregate([
      { $match: { paymentStatus: 'completed', createdAt: { $gte: thisMonthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Donation.aggregate([
      { $match: { paymentStatus: 'completed', createdAt: { $gte: lastMonthStart, $lt: thisMonthStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    AdoptACow.countDocuments({ status: 'active' }),
    Donation.distinct('donorEmail', { paymentStatus: 'completed' }),
  ]);

  const totalAmount = totalDonations[0]?.total || 0;
  const thisMonth = thisMonthTotal[0]?.total || 0;
  const lastMonth = lastMonthTotal[0]?.total || 0;
  const growthPercent = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;

  return {
    totalAmount,
    thisMonthAmount: thisMonth,
    lastMonthAmount: lastMonth,
    growthPercent,
    activeAdoptions,
    totalDonors: totalDonors.length,
  };
};
