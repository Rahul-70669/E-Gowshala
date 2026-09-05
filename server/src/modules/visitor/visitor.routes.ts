import { Router } from 'express';
import * as visitorController from './visitor.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';

const router = Router();
router.use(authenticate);

router.get('/', visitorController.getVisitors);
router.get('/today', visitorController.getTodaysVisitors);
router.get('/stats', visitorController.getVisitorStats);
router.post('/', authorize('admin', 'caretaker', 'volunteer'), visitorController.createVisitor);
router.post('/:id/check-in', authorize('admin', 'caretaker', 'volunteer'), visitorController.checkIn);
router.post('/:id/check-out', authorize('admin', 'caretaker', 'volunteer'), visitorController.checkOut);
router.post('/:id/cancel', authorize('admin'), visitorController.cancelVisit);

export default router;
