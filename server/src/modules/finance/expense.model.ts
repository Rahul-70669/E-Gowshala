import mongoose, { Document, Schema } from 'mongoose';

export interface IExpense extends Document {
  category: 'feed' | 'medical' | 'salary' | 'utilities' | 'infrastructure' | 'transport' | 'equipment' | 'miscellaneous';
  amount: number;
  description: string;
  date: Date;
  paidTo: string;
  paymentMode: 'cash' | 'upi' | 'bank-transfer' | 'cheque';
  receiptNumber?: string;
  approvedBy?: mongoose.Types.ObjectId;
  recordedBy: mongoose.Types.ObjectId;
  attachments: string[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    category: {
      type: String,
      enum: ['feed', 'medical', 'salary', 'utilities', 'infrastructure', 'transport', 'equipment', 'miscellaneous'],
      required: true,
    },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    paidTo: { type: String, required: true },
    paymentMode: {
      type: String,
      enum: ['cash', 'upi', 'bank-transfer', 'cheque'],
      default: 'cash',
    },
    receiptNumber: { type: String },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    attachments: [{ type: String }],
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });

export default mongoose.model<IExpense>('Expense', expenseSchema);
