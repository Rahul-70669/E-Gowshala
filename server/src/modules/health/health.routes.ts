import { Router } from 'express';
import multer from 'multer';
import * as healthController from './health.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';

const router = Router();
router.use(authenticate);

// Multer — store image in memory so we can forward buffer to AI service
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },   // 10 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// ─── Health Records ──────────────────────────────────────────────────────────
router.get('/records',           healthController.getAllHealthRecords);
router.get('/records/cow/:cowId', healthController.getHealthRecordsByCow);
router.post('/records', authorize('admin', 'veterinarian'), healthController.createHealthRecord);

// ─── AI Scan ─────────────────────────────────────────────────────────────────
// POST  /health/ai-scan          — upload image, get AI diagnosis, save record
// POST  /health/ai-scan/:id/feedback — vet confirms/corrects prediction
// GET   /health/herd-risk        — dashboard herd health summary
router.post(
  '/ai-scan',
  authorize('admin', 'veterinarian'),
  upload.single('file'),
  healthController.createAiScan,
);
router.post(
  '/ai-scan/:recordId/feedback',
  authorize('admin', 'veterinarian'),
  healthController.submitAiFeedback,
);
router.get('/herd-risk', healthController.getHerdRiskSummary);

// ─── Vaccinations ─────────────────────────────────────────────────────────────
router.get('/vaccinations',            healthController.getVaccinationsDue);
router.get('/vaccinations/due',        healthController.getVaccinationsDue);
router.get('/vaccinations/cow/:cowId', healthController.getVaccinationsByCow);
router.post('/vaccinations',  authorize('admin', 'veterinarian'), healthController.createVaccination);
router.put('/vaccinations/:id', authorize('admin', 'veterinarian'), healthController.updateVaccination);

// ─── Pregnancies ──────────────────────────────────────────────────────────────
router.get('/pregnancies',            healthController.getActivePregnancies);
router.get('/pregnancies/active',     healthController.getActivePregnancies);
router.get('/pregnancies/cow/:cowId', healthController.getPregnanciesByCow);
router.post('/pregnancies', authorize('admin', 'veterinarian'), healthController.createPregnancy);
router.put('/pregnancies/:id', authorize('admin', 'veterinarian'), healthController.updatePregnancy);

// ─── Stats ────────────────────────────────────────────────────────────────────
router.get('/stats', healthController.getHealthStats);

// ─── Emergency SOS ───────────────────────────────────────────────────────────
router.post('/sos', healthController.triggerSosAlert);
router.get('/sos/active', healthController.getActiveSosAlerts);
router.patch('/sos/:id/acknowledge', authorize('admin', 'veterinarian'), healthController.acknowledgeSosAlert);
router.patch('/sos/:id/resolve', authorize('admin', 'veterinarian'), healthController.resolveSosAlert);

export default router;

