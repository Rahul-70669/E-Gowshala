import mongoose, { Document, Schema } from 'mongoose';

export interface IPregnancy extends Document {
  cowId: mongoose.Types.ObjectId;
  inseminationDate: Date;
  inseminationType: 'natural' | 'artificial';
  expectedDeliveryDate: Date;
  actualDeliveryDate?: Date;
  status: 'confirmed' | 'monitoring' | 'delivered' | 'complications' | 'miscarriage';
  calfDetails?: {
    name: string;
    gender: string;
    weight: number;
    health: string;
  };
  vetId?: mongoose.Types.ObjectId;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const pregnancySchema = new Schema<IPregnancy>(
  {
    cowId: { type: Schema.Types.ObjectId, ref: 'Cow', required: true },
    inseminationDate: { type: Date, required: true },
    inseminationType: { type: String, enum: ['natural', 'artificial'], default: 'natural' },
    expectedDeliveryDate: { type: Date, required: true },
    actualDeliveryDate: { type: Date },
    status: {
      type: String,
      enum: ['confirmed', 'monitoring', 'delivered', 'complications', 'miscarriage'],
      default: 'confirmed',
    },
    calfDetails: {
      name: { type: String },
      gender: { type: String },
      weight: { type: Number },
      health: { type: String },
    },
    vetId: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

pregnancySchema.index({ cowId: 1 });
pregnancySchema.index({ status: 1, expectedDeliveryDate: 1 });

export default mongoose.model<IPregnancy>('Pregnancy', pregnancySchema);
