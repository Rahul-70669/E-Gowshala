import mongoose, { Document, Schema } from 'mongoose';

export interface ICow extends Document {
  tagId: string;
  inaphId?: string;
  name: string;
  breed: string;
  gender: 'female' | 'male' | 'calf';
  dateOfBirth?: Date;
  age?: number;
  weight?: number;
  color: string;
  status: 'healthy' | 'sick' | 'pregnant' | 'lactating' | 'rescued' | 'deceased';
  shedId?: mongoose.Types.ObjectId;
  photos: string[];
  qrCodeData: string;
  rescueDetails?: {
    rescueDate: Date;
    location: string;
    condition: string;
    rescuedBy: string;
  };
  identificationMarks: string;
  notes: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const cowSchema = new Schema<ICow>(
  {
    tagId: { type: String, required: true, unique: true },
    inaphId: { type: String, default: '' },
    name: { type: String, required: true, trim: true },
    breed: {
      type: String,
      required: true,
      enum: [
        'Gir', 'Sahiwal', 'Tharparkar', 'Kankrej', 'Red Sindhi',
        'Rathi', 'Hariana', 'Ongole', 'Deoni', 'Hallikar',
        'Amrit Mahal', 'Kangayam', 'Vechur', 'Punganur',
        'Crossbred', 'Unknown', 'Other'
      ],
    },
    gender: { type: String, enum: ['female', 'male', 'calf'], required: true },
    dateOfBirth: { type: Date },
    age: { type: Number },
    weight: { type: Number },
    color: { type: String, default: '' },
    status: {
      type: String,
      enum: ['healthy', 'sick', 'pregnant', 'lactating', 'rescued', 'deceased'],
      default: 'healthy',
    },
    shedId: { type: Schema.Types.ObjectId, ref: 'Shed' },
    photos: [{ type: String }],
    qrCodeData: { type: String, default: '' },
    rescueDetails: {
      rescueDate: { type: Date },
      location: { type: String },
      condition: { type: String },
      rescuedBy: { type: String },
    },
    identificationMarks: { type: String, default: '' },
    notes: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

cowSchema.index({ name: 'text', breed: 'text' });
cowSchema.index({ status: 1 });
cowSchema.index({ shedId: 1 });

export default mongoose.model<ICow>('Cow', cowSchema);
