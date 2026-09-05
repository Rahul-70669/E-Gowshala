import mongoose, { Document, Schema } from 'mongoose';

export interface IVaccination extends Document {
  cowId: mongoose.Types.ObjectId;
  vaccineName: string;
  batchNumber: string;
  administeredBy: mongoose.Types.ObjectId;
  administeredDate: Date;
  nextDueDate: Date;
  status: 'scheduled' | 'completed' | 'overdue' | 'skipped';
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const vaccinationSchema = new Schema<IVaccination>(
  {
    cowId: { type: Schema.Types.ObjectId, ref: 'Cow', required: true },
    vaccineName: { type: String, required: true },
    batchNumber: { type: String, default: '' },
    administeredBy: { type: Schema.Types.ObjectId, ref: 'User' },
    administeredDate: { type: Date, required: true },
    nextDueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'overdue', 'skipped'],
      default: 'scheduled',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

vaccinationSchema.index({ cowId: 1 });
vaccinationSchema.index({ nextDueDate: 1, status: 1 });

export default mongoose.model<IVaccination>('Vaccination', vaccinationSchema);
