import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as healthService from './health.service';
import { qs, qi, ps } from '../../utils/queryHelpers';
import { uploadBufferToCloudinary } from '../../config/cloudinary';

// ─── Health Records ──────────────────────────────────────────────────────────

export const createHealthRecord = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const record = await healthService.createHealthRecord({ ...req.body, vetId: req.user!.id });
    res.status(201).json({ success: true, data: record });
  } catch (error) { next(error); }
};

export const getHealthRecordsByCow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const records = await healthService.getHealthRecordsByCow(ps(req.params.cowId));
    res.json({ success: true, data: records });
  } catch (error) { next(error); }
};

export const getAllHealthRecords = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await healthService.getAllHealthRecords({
      recordType:  qs(req.query.recordType),
      cowId:       qs(req.query.cowId),
      aiRiskLevel: qs(req.query.aiRiskLevel),
      page:        qi(req.query.page),
      limit:       qi(req.query.limit),
    });
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

// ─── AI Scan ─────────────────────────────────────────────────────────────────

/**
 * POST /health/ai-scan
 * Body: multipart/form-data — cowId, file (image), notes (optional)
 * Forwards image to AI service, stores result, returns full health record.
 */
export const createAiScan = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Image file is required' });
      return;
    }
    if (!req.body.cowId) {
      res.status(400).json({ success: false, message: 'cowId is required' });
      return;
    }

    // Upload image to Cloudinary
    let imageUrl = '';
    try {
      const uploadRes = await uploadBufferToCloudinary(req.file.buffer, 'egowshala/health_scans');
      imageUrl = uploadRes.secure_url;
    } catch (uploadErr) {
      console.warn('Cloudinary upload warning (using fallback):', uploadErr);
      imageUrl = req.file.path || `/uploads/scan_${Date.now()}.jpg`;
    }

    const record = await healthService.createAiScan({
      cowId:         req.body.cowId,
      vetId:         req.user!.id,
      imageBuffer:   req.file.buffer,
      imageMimeType: req.file.mimetype,
      imageUrl,
      notes:         req.body.notes,
    });

    res.status(201).json({ success: true, data: record });
  } catch (error) { next(error); }
};

/**
 * POST /health/ai-scan/:recordId/feedback
 * Body: { confirmedDisease, vetNotes? }
 */
export const submitAiFeedback = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const record = await healthService.submitAiFeedback(ps(req.params.recordId), {
      confirmedDisease: req.body.confirmedDisease,
      vetNotes:         req.body.vetNotes,
    });
    res.json({ success: true, data: record });
  } catch (error) { next(error); }
};

/**
 * GET /health/herd-risk
 * Returns AI herd health summary for the dashboard.
 */
export const getHerdRiskSummary = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const summary = await healthService.getHerdRiskSummary();
    res.json({ success: true, data: summary });
  } catch (error) { next(error); }
};

// ─── Vaccinations ─────────────────────────────────────────────────────────────

export const createVaccination = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vacc = await healthService.createVaccination({ ...req.body, administeredBy: req.user!.id });
    res.status(201).json({ success: true, data: vacc });
  } catch (error) { next(error); }
};

export const getVaccinationsDue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const days = qi(req.query.days) ?? 7;
    const vaccinations = await healthService.getVaccinationsDue(days);
    res.json({ success: true, data: vaccinations });
  } catch (error) { next(error); }
};

export const getVaccinationsByCow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vaccinations = await healthService.getVaccinationsByCow(ps(req.params.cowId));
    res.json({ success: true, data: vaccinations });
  } catch (error) { next(error); }
};

export const updateVaccination = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vacc = await healthService.updateVaccination(ps(req.params.id), req.body);
    res.json({ success: true, data: vacc });
  } catch (error) { next(error); }
};

// ─── Pregnancies ──────────────────────────────────────────────────────────────

export const createPregnancy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pregnancy = await healthService.createPregnancy(req.body);
    res.status(201).json({ success: true, data: pregnancy });
  } catch (error) { next(error); }
};

export const getPregnanciesByCow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pregnancies = await healthService.getPregnanciesByCow(ps(req.params.cowId));
    res.json({ success: true, data: pregnancies });
  } catch (error) { next(error); }
};

export const getActivePregnancies = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pregnancies = await healthService.getActivePregnancies();
    res.json({ success: true, data: pregnancies });
  } catch (error) { next(error); }
};

export const updatePregnancy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pregnancy = await healthService.updatePregnancy(ps(req.params.id), req.body);
    res.json({ success: true, data: pregnancy });
  } catch (error) { next(error); }
};

// ─── Stats ───────────────────────────────────────────────────────────────────

export const getHealthStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await healthService.getHealthStats();
    res.json({ success: true, data: stats });
  } catch (error) { next(error); }
};

// ─── Emergency SOS ───────────────────────────────────────────────────────────

export const triggerSosAlert = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const alert = await healthService.triggerSosAlert(req.body, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.role,
    });
    res.status(201).json({ success: true, data: alert });
  } catch (error) { next(error); }
};

export const getActiveSosAlerts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const alerts = await healthService.getActiveSosAlerts();
    res.json({ success: true, data: alerts });
  } catch (error) { next(error); }
};

export const acknowledgeSosAlert = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const alert = await healthService.acknowledgeSosAlert(ps(req.params.id), {
      id: req.user!.id,
      name: req.user!.name,
    });
    res.json({ success: true, data: alert });
  } catch (error) { next(error); }
};

export const resolveSosAlert = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const alert = await healthService.resolveSosAlert(ps(req.params.id), {
      id: req.user!.id,
      name: req.user!.name,
    });
    res.json({ success: true, data: alert });
  } catch (error) { next(error); }
};

