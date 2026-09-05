import mongoose, { Document, Schema } from 'mongoose';

export interface IDonation extends Document {
  donorId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  donationType: 'one-time' | 'monthly' | 'annual' | 'in-kind';
  purpose: 'general' | 'cow-care' | 'medical' | 'feed' | 'infrastructure' | 'adopt-a-cow';
  paymentMethod: 'razorpay' | 'upi' | 'bank-transfer' | 'cash' | 'cheque';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  receiptNumber: string;
  receiptPdfUrl?: string;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  donorPan?: string;
  donorAddress?: string;
  is80GEligible: boolean;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const donationSchema = new Schema<IDonation>(
  {
    donorId: { type: Schema.Types.ObjectId, ref: 'User' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    donationType: {
      type: String,
      enum: ['one-time', 'monthly', 'annual', 'in-kind'],
      default: 'one-time',
    },
    purpose: {
      type: String,
      enum: ['general', 'cow-care', 'medical', 'feed', 'infrastructure', 'adopt-a-cow'],
      default: 'general',
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'upi', 'bank-transfer', 'cash', 'cheque'],
      default: 'razorpay',
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    receiptNumber: { type: String, unique: true },
    receiptPdfUrl: { type: String },
    donorName: { type: String, required: true },
    donorEmail: { type: String, required: true },
    donorPhone: { type: String, default: '' },
    donorPan: { type: String, default: '' },
    donorAddress: { type: String, default: '' },
    is80GEligible: { type: Boolean, default: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

donationSchema.index({ donorId: 1, createdAt: -1 });
donationSchema.index({ paymentStatus: 1 });

export default mongoose.model<IDonation>('Donation', donationSchema);
