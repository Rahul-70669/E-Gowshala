import mongoose, { Document, Schema } from 'mongoose';

// ── Sub-schemas ────────────────────────────────────────────────────────────

export interface IImageAnalysis {
  imageUrl: string;
  disease: string;
  displayName: string;
  confidence: number;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  allPredictions: { class: string; displayName: string; confidence: number }[];
  treatment: string;
  shouldSeeVet: boolean;
  modelVersion: string;
  analyzedAt: Date;
}

export interface ILabResult {
  testName: string;
  value: number;
  unit: string;
  normalRange: string;
  isAbnormal: boolean;
  testedAt: Date;
}

export interface IAiFeedback {
  predictedDisease: string;
  confirmedDisease: string;
  isCorrect: boolean;
  vetNotes?: string;
  submittedAt: Date;
}

export interface IClinicalVitals {
  temperature?: number;        // °F
  heartRate?: number;          // bpm
  respiratoryRate?: number;    // breaths/min (normal: 26-50)
  weight?: number;             // kg
  milkYieldLiters?: number;
  bodyConditionScore?: number; // 1–5 BCS scale
  rumenMotility?: string;      // normal | reduced | absent
  mucousMembraneColor?: string;// pink | pale | yellow | blue
}

// ── Main Interface ──────────────────────────────────────────────────────────

export interface IHealthRecord extends Document {
  cowId: mongoose.Types.ObjectId;
  vetId: mongoose.Types.ObjectId;
  recordType: 'checkup' | 'treatment' | 'surgery' | 'emergency' | 'observation' | 'ai_scan';

  // Clinical data
  symptoms: string[];
  diagnosis: string;
  clinicalVitals: IClinicalVitals;

  // Medications
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];

  // AI outputs
  imageAnalysis?: IImageAnalysis;
  aiRiskScore?: number;
  aiRiskLevel?: 'low' | 'moderate' | 'high' | 'critical';
  aiRecommendations?: string[];

  // Lab results
  labResults: ILabResult[];

  // Vet feedback on AI prediction
  aiFeedback?: IAiFeedback;

  // General
  notes: string;
  attachments: string[];      // image URLs / file paths
  isFollowUpRequired: boolean;
  followUpDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ─────────────────────────────────────────────────────────────────

const imageAnalysisSchema = new Schema<IImageAnalysis>({
  imageUrl:       { type: String, required: true },
  disease:        { type: String, required: true },
  displayName:    { type: String, required: true },
  confidence:     { type: Number, required: true, min: 0, max: 1 },
  severity:       { type: String, enum: ['none', 'low', 'medium', 'high', 'critical'] },
  allPredictions: [{ class: String, displayName: String, confidence: Number }],
  treatment:      { type: String },
  shouldSeeVet:   { type: Boolean, default: false },
  modelVersion:   { type: String, default: '1.0' },
  analyzedAt:     { type: Date, default: Date.now },
}, { _id: false });

const labResultSchema = new Schema<ILabResult>({
  testName:    { type: String, required: true },
  value:       { type: Number, required: true },
  unit:        { type: String },
  normalRange: { type: String },
  isAbnormal:  { type: Boolean, default: false },
  testedAt:    { type: Date, default: Date.now },
}, { _id: false });

const aiFeedbackSchema = new Schema<IAiFeedback>({
  predictedDisease: { type: String, required: true },
  confirmedDisease: { type: String, required: true },
  isCorrect:        { type: Boolean, required: true },
  vetNotes:         { type: String },
  submittedAt:      { type: Date, default: Date.now },
}, { _id: false });

const clinicalVitalsSchema = new Schema<IClinicalVitals>({
  temperature:          { type: Number },   // °F
  heartRate:            { type: Number },   // bpm
  respiratoryRate:      { type: Number },   // breaths/min
  weight:               { type: Number },   // kg
  milkYieldLiters:      { type: Number },
  bodyConditionScore:   { type: Number, min: 1, max: 5 },
  rumenMotility:        { type: String, enum: ['normal', 'reduced', 'absent'] },
  mucousMembraneColor:  { type: String, enum: ['pink', 'pale', 'yellow', 'blue', 'other'] },
}, { _id: false });

const healthRecordSchema = new Schema<IHealthRecord>(
  {
    cowId:    { type: Schema.Types.ObjectId, ref: 'Cow', required: true },
    vetId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recordType: {
      type: String,
      enum: ['checkup', 'treatment', 'surgery', 'emergency', 'observation', 'ai_scan'],
      required: true,
    },

    // Clinical
    symptoms:       [{ type: String }],
    diagnosis:      { type: String, default: '' },
    clinicalVitals: { type: clinicalVitalsSchema, default: () => ({}) },

    // Medications
    medications: [{
      name:      { type: String, required: true },
      dosage:    { type: String },
      frequency: { type: String },
      duration:  { type: String },
    }],

    // AI fields
    imageAnalysis:     { type: imageAnalysisSchema },
    aiRiskScore:       { type: Number, min: 0, max: 1 },
    aiRiskLevel:       { type: String, enum: ['low', 'moderate', 'high', 'critical'] },
    aiRecommendations: [{ type: String }],

    // Lab
    labResults: [labResultSchema],

    // Feedback
    aiFeedback: { type: aiFeedbackSchema },

    // General
    notes:              { type: String, default: '' },
    attachments:        [{ type: String }],
    isFollowUpRequired: { type: Boolean, default: false },
    followUpDate:       { type: Date },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────
healthRecordSchema.index({ cowId: 1, createdAt: -1 });
healthRecordSchema.index({ vetId: 1 });
healthRecordSchema.index({ 'imageAnalysis.disease': 1 });        // query by detected disease
healthRecordSchema.index({ aiRiskLevel: 1, createdAt: -1 });     // dashboard: recent critical cases
healthRecordSchema.index({ isFollowUpRequired: 1, followUpDate: 1 }); // follow-up reminders

export default mongoose.model<IHealthRecord>('HealthRecord', healthRecordSchema);
