import mongoose, { Document, Schema } from 'mongoose';

export interface IFeedLog extends Document {
  shedId: mongoose.Types.ObjectId;
  feedType: 'green-fodder' | 'dry-fodder' | 'concentrate' | 'supplement' | 'water';
  quantityKg: number;
  waterIntakeLiters?: number;
  costIncurred: number;
  loggedBy: mongoose.Types.ObjectId;
  date: Date;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const feedLogSchema = new Schema<IFeedLog>(
  {
    shedId: { type: Schema.Types.ObjectId, ref: 'Shed', required: true },
    feedType: {
      type: String,
      enum: ['green-fodder', 'dry-fodder', 'concentrate', 'supplement', 'water'],
      required: true,
    },
    quantityKg: { type: Number, required: true },
    waterIntakeLiters: { type: Number },
    costIncurred: { type: Number, default: 0 },
    loggedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

feedLogSchema.index({ shedId: 1, date: -1 });
feedLogSchema.index({ date: -1 });

export default mongoose.model<IFeedLog>('FeedLog', feedLogSchema);
