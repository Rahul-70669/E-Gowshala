import mongoose, { Document, Schema } from 'mongoose';

export interface IShed extends Document {
  name: string;
  shedType: 'general' | 'sick-bay' | 'maternity' | 'calf-pen' | 'quarantine';
  capacity: number;
  currentOccupancy: number;
  caretakerInCharge?: mongoose.Types.ObjectId;
  location: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const shedSchema = new Schema<IShed>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    shedType: {
      type: String,
      enum: ['general', 'sick-bay', 'maternity', 'calf-pen', 'quarantine'],
      default: 'general',
    },
    capacity: { type: Number, required: true },
    currentOccupancy: { type: Number, default: 0 },
    caretakerInCharge: { type: Schema.Types.ObjectId, ref: 'User' },
    location: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IShed>('Shed', shedSchema);
