import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: 'admin' | 'veterinarian' | 'caretaker' | 'donor' | 'volunteer' | 'government';
  language: 'en' | 'hi';
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'veterinarian', 'caretaker', 'donor', 'volunteer', 'government'],
      default: 'volunteer',
    },
    language: { type: String, enum: ['en', 'hi'], default: 'en' },
    avatar: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

export default mongoose.model<IUser>('User', userSchema);
