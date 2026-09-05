import mongoose, { Document, Schema } from 'mongoose';

export interface IInventory extends Document {
  name: string;
  nameHi?: string;
  category: 'green-fodder' | 'dry-fodder' | 'concentrate' | 'supplement' | 'medicine' | 'equipment' | 'other';
  quantity: number;
  unit: 'kg' | 'quintal' | 'ton' | 'liter' | 'bag' | 'bottle' | 'packet' | 'piece';
  minThreshold: number;
  costPerUnit: number;
  supplier?: string;
  location?: string;
  lastRestockedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const inventorySchema = new Schema<IInventory>(
  {
    name: { type: String, required: true, trim: true },
    nameHi: { type: String, trim: true },
    category: {
      type: String,
      enum: ['green-fodder', 'dry-fodder', 'concentrate', 'supplement', 'medicine', 'equipment', 'other'],
      required: true,
    },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    unit: {
      type: String,
      enum: ['kg', 'quintal', 'ton', 'liter', 'bag', 'bottle', 'packet', 'piece'],
      required: true,
      default: 'kg',
    },
    minThreshold: { type: Number, required: true, min: 0, default: 10 },
    costPerUnit: { type: Number, min: 0, default: 0 },
    supplier: { type: String, trim: true },
    location: { type: String, trim: true, default: 'Main Store' },
    lastRestockedAt: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

inventorySchema.index({ category: 1 });
inventorySchema.index({ name: 1 });

export default mongoose.model<IInventory>('Inventory', inventorySchema);
