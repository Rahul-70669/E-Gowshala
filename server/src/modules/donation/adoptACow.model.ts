import mongoose, { Document, Schema } from 'mongoose';

export interface IAdoptACow extends Document {
  donorId: mongoose.Types.ObjectId;
  cowId: mongoose.Types.ObjectId;
  monthlyAmount: number;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'paused' | 'cancelled' | 'completed';
  totalPaid: number;
  lastPaymentDate?: Date;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const adoptACowSchema = new Schema<IAdoptACow>(
  {
    donorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    cowId: { type: Schema.Types.ObjectId, ref: 'Cow', required: true },
    monthlyAmount: { type: Number, required: true },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ['active', 'paused', 'cancelled', 'completed'],
      default: 'active',
    },
    totalPaid: { type: Number, default: 0 },
    lastPaymentDate: { type: Date },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

adoptACowSchema.index({ donorId: 1 });
adoptACowSchema.index({ cowId: 1 });
adoptACowSchema.index({ status: 1 });

export default mongoose.model<IAdoptACow>('AdoptACow', adoptACowSchema);
