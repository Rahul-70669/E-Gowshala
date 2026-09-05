import { Router } from 'express';
import * as publicController from './public.controller';

const router = Router();

// No authentication required on any of these routes
router.get('/impact', publicController.getImpactStats);
router.get('/compliance-report', publicController.getComplianceReport);
router.get('/adopt-wall', publicController.getAdoptWall);
router.get('/rescue-map', publicController.getRescueLocations);
router.get('/census/csv', publicController.getHerdCensusCsv);
router.post('/rescue-report', publicController.submitRescueReport);
router.get('/rescue-requests', publicController.getRescueRequests);
router.patch('/rescue-requests/:id', publicController.updateRescueReportStatus);

export default router;
