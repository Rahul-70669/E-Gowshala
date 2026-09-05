import mongoose, { Document, Schema } from 'mongoose';

export interface IVisitor extends Document {
  name: string;
  email: string;
  phone: string;
  visitType: 'individual' | 'group' | 'school' | 'ngo' | 'government' | 'media';
  purpose: 'tour' | 'donation' | 'adoption' | 'volunteering' | 'inspection' | 'media-coverage' | 'other';
  groupSize: number;
  scheduledDate: Date;
  scheduledTime: string;
  checkInTime?: Date;
  checkOutTime?: Date;
  status: 'scheduled' | 'checked-in' | 'completed' | 'cancelled' | 'no-show';
  assignedGuide?: mongoose.Types.ObjectId;
  feedback?: {
    rating: number;
    comment: string;
  };
  idProofType?: string;
  idProofNumber?: string;
  vehicleNumber?: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const visitorSchema = new Schema<IVisitor>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, default: '' },
    phone: { type: String, required: true },
    visitType: {
      type: String,
      enum: ['individual', 'group', 'school', 'ngo', 'government', 'media'],
      default: 'individual',
    },
    purpose: {
      type: String,
      enum: ['tour', 'donation', 'adoption', 'volunteering', 'inspection', 'media-coverage', 'other'],
      default: 'tour',
    },
    groupSize: { type: Number, default: 1 },
    scheduledDate: { type: Date, required: true },
    scheduledTime: { type: String, default: '10:00' },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    status: {
      type: String,
      enum: ['scheduled', 'checked-in', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled',
    },
    assignedGuide: { type: Schema.Types.ObjectId, ref: 'User' },
    feedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String },
    },
    idProofType: { type: String },
    idProofNumber: { type: String },
    vehicleNumber: { type: String },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

visitorSchema.index({ scheduledDate: 1, status: 1 });
visitorSchema.index({ phone: 1 });

export default mongoose.model<IVisitor>('Visitor', visitorSchema);
