import axios from 'axios';
import FormData from 'form-data';
import HealthRecord from './healthRecord.model';
import Vaccination from './vaccination.model';
import Pregnancy from './pregnancy.model';
import Cow from '../cow/cow.model';
import Task from '../operations/task.model';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// ─── Health Records ─────────────────────────────────────────────────────────

export const createHealthRecord = async (data: any) => {
  const record = await HealthRecord.create(data);
  return record.populate([
    { path: 'cowId', select: 'tagId name breed' },
    { path: 'vetId', select: 'name email' },
  ]);
};

export const getHealthRecordsByCow = async (cowId: string) => {
  return HealthRecord.find({ cowId })
    .populate('vetId', 'name email')
    .sort({ createdAt: -1 })
    .lean();
};

export const getAllHealthRecords = async (filters: {
  recordType?: string;
  cowId?: string;
  aiRiskLevel?: string;
  page?: number;
  limit?: number;
}) => {
  const query: any = {};
  if (filters.recordType)  query.recordType  = filters.recordType;
  if (filters.cowId)       query.cowId       = filters.cowId;
  if (filters.aiRiskLevel) query.aiRiskLevel = filters.aiRiskLevel;

  const page  = filters.page  || 1;
  const limit = filters.limit || 20;
  const skip  = (page - 1) * limit;

  const [records, total] = await Promise.all([
    HealthRecord.find(query)
      .populate('cowId', 'tagId name breed')
      .populate('vetId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    HealthRecord.countDocuments(query),
  ]);

  return { records, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// ─── AI Scan ────────────────────────────────────────────────────────────────

/**
 * Upload image to AI service, store full result in a health record.
 * Called by the /health/ai-scan endpoint.
 */
export const createAiScan = async (params: {
  cowId: string;
  vetId: string;
  imageBuffer: Buffer;
  imageMimeType: string;
  imageUrl: string;          // S3 / Cloudinary / local URL after upload
  notes?: string;
}) => {
  const { cowId, vetId, imageBuffer, imageMimeType, imageUrl, notes } = params;

  // 1. Call the AI service /predict/image
  const form = new FormData();
  form.append('file', imageBuffer, {
    filename: 'scan.jpg',
    contentType: imageMimeType,
  });

  const aiRes = await axios.post(`${AI_SERVICE_URL}/predict/image`, form, {
    headers: form.getHeaders(),
    timeout: 30_000,
  });

  const ai = aiRes.data;  // ImagePredictionResponse shape

  // 2. Persist as an ai_scan health record
  const record = await HealthRecord.create({
    cowId,
    vetId,
    recordType: 'ai_scan',
    notes: notes || '',
    attachments: [imageUrl],
    imageAnalysis: {
      imageUrl,
      disease:        ai.disease,
      displayName:    ai.display_name,
      confidence:     ai.confidence,
      severity:       ai.severity,
      allPredictions: ai.all_predictions.map((p: any) => ({
        class:       p.class,
        displayName: p.display_name,
        confidence:  p.confidence,
      })),
      treatment:    ai.treatment,
      shouldSeeVet: ai.should_see_vet,
      modelVersion: ai.model_version,
      analyzedAt:   new Date(),
    },
    // Severity → risk level mapping
    aiRiskLevel: ai.severity === 'critical' ? 'critical'
               : ai.severity === 'high'     ? 'high'
               : ai.severity === 'medium'   ? 'moderate'
               : 'low',
    aiRiskScore: ai.confidence,
    aiRecommendations: [ai.treatment],
    isFollowUpRequired: ai.should_see_vet,
  });

  return record.populate([
    { path: 'cowId', select: 'tagId name breed' },
    { path: 'vetId', select: 'name email' },
  ]);
};

/**
 * Submit vet feedback on an AI prediction (correct / incorrect).
 * Also forwards to the AI service feedback endpoint for future retraining.
 */
export const submitAiFeedback = async (
  recordId: string,
  feedback: { confirmedDisease: string; vetNotes?: string }
) => {
  const record = await HealthRecord.findById(recordId);
  if (!record || !record.imageAnalysis) {
    throw new Error('Record not found or has no image analysis');
  }

  const isCorrect = record.imageAnalysis.disease === feedback.confirmedDisease;

  // Update the record with vet feedback
  record.aiFeedback = {
    predictedDisease: record.imageAnalysis.disease,
    confirmedDisease: feedback.confirmedDisease,
    isCorrect,
    vetNotes:    feedback.vetNotes,
    submittedAt: new Date(),
  };
  await record.save();

  // Forward to AI service for retraining data collection (fire-and-forget)
  axios.post(`${AI_SERVICE_URL}/feedback`, {
    image_prediction: record.imageAnalysis.disease,
    correct_label:    feedback.confirmedDisease,
    cow_id:           record.cowId?.toString(),
    notes:            feedback.vetNotes,
  }).catch(() => { /* non-blocking */ });

  return record.populate('cowId', 'tagId name breed');
};

// ─── Herd Risk Dashboard ─────────────────────────────────────────────────────

/**
 * Returns AI-powered herd health summary for the dashboard.
 */
export const getHerdRiskSummary = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [riskCounts, recentScans, followUpsPending, diseaseBreakdown] = await Promise.all([
    // Count records by AI risk level (last 30 days)
    HealthRecord.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, aiRiskLevel: { $exists: true } } },
      { $group: { _id: '$aiRiskLevel', count: { $sum: 1 } } },
    ]),

    // 5 most recent AI scans
    HealthRecord.find({ recordType: 'ai_scan' })
      .populate('cowId', 'tagId name breed')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('cowId imageAnalysis aiRiskLevel createdAt')
      .lean(),

    // Cows needing follow-up
    HealthRecord.countDocuments({
      isFollowUpRequired: true,
      followUpDate: { $lte: new Date() },
    }),

    // Disease distribution from image scans (last 30 days)
    HealthRecord.aggregate([
      { $match: { recordType: 'ai_scan', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$imageAnalysis.disease', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  // Build risk level map
  const riskMap: Record<string, number> = { low: 0, moderate: 0, high: 0, critical: 0 };
  riskCounts.forEach((r: any) => { if (r._id) riskMap[r._id] = r.count; });

  return {
    riskDistribution: riskMap,
    totalAiScans: Object.values(riskMap).reduce((a, b) => a + b, 0),
    followUpsPending,
    recentScans,
    diseaseBreakdown: diseaseBreakdown.map((d: any) => ({
      disease: d._id,
      count:   d.count,
    })),
  };
};

// ─── Vaccinations ────────────────────────────────────────────────────────────

export const createVaccination = async (data: any) => {
  const vacc = await Vaccination.create(data);
  return vacc.populate([
    { path: 'cowId', select: 'tagId name breed' },
    { path: 'administeredBy', select: 'name' },
  ]);
};

export const getVaccinationsDue = async (daysAhead: number = 7) => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  return Vaccination.find({
    status: { $in: ['scheduled', 'overdue'] },
    nextDueDate: { $lte: futureDate },
  })
    .populate('cowId', 'tagId name breed shedId')
    .sort({ nextDueDate: 1 })
    .lean();
};

export const getVaccinationsByCow = async (cowId: string) => {
  return Vaccination.find({ cowId })
    .populate('administeredBy', 'name')
    .sort({ administeredDate: -1 })
    .lean();
};

export const updateVaccination = async (id: string, updates: any) => {
  return Vaccination.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
    .populate('cowId', 'tagId name breed')
    .lean();
};

// ─── Pregnancies ─────────────────────────────────────────────────────────────

export const createPregnancy = async (data: any) => Pregnancy.create(data);

export const getPregnanciesByCow = async (cowId: string) => {
  return Pregnancy.find({ cowId }).populate('vetId', 'name').sort({ createdAt: -1 }).lean();
};

export const getActivePregnancies = async () => {
  return Pregnancy.find({ status: { $in: ['confirmed', 'monitoring'] } })
    .populate('cowId', 'tagId name breed')
    .populate('vetId', 'name')
    .sort({ expectedDeliveryDate: 1 })
    .lean();
};

export const updatePregnancy = async (id: string, updates: any) => {
  return Pregnancy.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean();
};

// ─── Health Stats ─────────────────────────────────────────────────────────────

export const getHealthStats = async () => {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [totalRecords, vaccinationsDue, overdueVaccinations, activePregnancies, criticalCases] =
    await Promise.all([
      HealthRecord.countDocuments(),
      Vaccination.countDocuments({ status: 'scheduled', nextDueDate: { $lte: sevenDaysFromNow } }),
      Vaccination.countDocuments({ status: 'overdue' }),
      Pregnancy.countDocuments({ status: { $in: ['confirmed', 'monitoring'] } }),
      HealthRecord.countDocuments({ aiRiskLevel: 'critical', createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } }),
    ]);

  return { totalRecords, vaccinationsDue, overdueVaccinations, activePregnancies, criticalCases };
};

// ─── Emergency SOS Alerts ───────────────────────────────────────────────────

export const triggerSosAlert = async (
  data: {
    title?: string;
    description?: string;
    cowId?: string;
    shedName?: string;
    severity?: string;
  },
  triggeredBy: { id: string; name: string; role: string }
) => {
  let cowDetails: any = null;
  if (data.cowId) {
    cowDetails = await Cow.findById(data.cowId).select('tagId name breed shedId status').lean();
    if (cowDetails) {
      await Cow.findByIdAndUpdate(data.cowId, { status: 'sick' }).catch(() => {});
    }
  }

  const title = data.title || '🚨 VETERINARY EMERGENCY — Immediate Attention Required';
  const cowSummary = cowDetails ? ` [Cattle: ${cowDetails.name} (${cowDetails.tagId}) - ${cowDetails.breed}]` : '';
  const description = data.description
    ? `${data.description}${cowSummary}`
    : `Emergency SOS broadcast triggered from Health Module by ${triggeredBy.name} (${triggeredBy.role}). All veterinarians must report immediately for urgent clinical response.${cowSummary}`;

  const task = await Task.create({
    title,
    description,
    priority: 'urgent',
    status: 'pending',
    category: 'medical',
    assignedBy: triggeredBy.id,
    dueDate: new Date(),
    notes: JSON.stringify({
      isSos: true,
      triggeredBy: triggeredBy.name,
      triggeredByRole: triggeredBy.role,
      severity: data.severity || 'critical',
      cowId: data.cowId || null,
      cowName: cowDetails?.name || null,
      cowTagId: cowDetails?.tagId || null,
      shedName: data.shedName || null,
      createdAt: new Date().toISOString(),
    }),
  });

  return task.populate([
    { path: 'assignedBy', select: 'name email role' },
  ]);
};

export const getActiveSosAlerts = async () => {
  const query: any = {
    priority: 'urgent',
    status: { $in: ['pending', 'in-progress'] },
    $or: [
      { category: 'medical' },
      { category: 'health' },
      { title: { $regex: /SOS|EMERGENCY|ALERT/i } },
    ],
  };
  const tasks = await Task.find(query)
    .populate('assignedBy', 'name email role')
    .populate('assignedTo', 'name email role')
    .sort({ createdAt: -1 })
    .lean();


  return tasks.map((t: any) => {
    let meta: any = {};
    try {
      meta = JSON.parse(t.notes || '{}');
    } catch {
      meta = { rawNotes: t.notes };
    }
    return {
      id: t._id,
      title: t.title,
      description: t.description,
      priority: t.priority,
      status: t.status,
      category: t.category,
      assignedBy: t.assignedBy,
      assignedTo: t.assignedTo,
      createdAt: t.createdAt,
      dueDate: t.dueDate,
      ...meta,
    };
  });
};

export const acknowledgeSosAlert = async (id: string, user: { id: string; name: string }) => {
  const task = await Task.findById(id);
  if (!task) throw new Error('Emergency SOS alert not found');
  task.status = 'in-progress';
  task.assignedTo = user.id as any;

  let meta: any = {};
  try { meta = JSON.parse(task.notes || '{}'); } catch { meta = {}; }
  meta.acknowledgedBy = user.name;
  meta.acknowledgedAt = new Date().toISOString();
  task.notes = JSON.stringify(meta);
  await task.save();

  return task.populate([
    { path: 'assignedBy', select: 'name email role' },
    { path: 'assignedTo', select: 'name email role' },
  ]);
};

export const resolveSosAlert = async (id: string, user: { id: string; name: string }) => {
  const task = await Task.findById(id);
  if (!task) throw new Error('Emergency SOS alert not found');
  task.status = 'completed';
  task.completedAt = new Date();

  let meta: any = {};
  try { meta = JSON.parse(task.notes || '{}'); } catch { meta = {}; }
  meta.resolvedBy = user.name;
  meta.resolvedAt = new Date().toISOString();
  task.notes = JSON.stringify(meta);
  await task.save();

  return task;
};
