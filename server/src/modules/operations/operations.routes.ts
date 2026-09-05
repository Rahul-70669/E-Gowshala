import { Router } from 'express';
import * as opsController from './operations.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';

const router = Router();
router.use(authenticate);

// Feed Logs
router.get('/feed', opsController.getFeedLogs);
router.get('/feed/trends', opsController.getFeedTrends);
router.post('/feed', authorize('admin', 'caretaker'), opsController.createFeedLog);

// Tasks
router.get('/tasks', opsController.getTasks);
router.post('/tasks', authorize('admin', 'caretaker'), opsController.createTask);
router.put('/tasks/:id', authorize('admin', 'caretaker'), opsController.updateTask);
router.delete('/tasks/:id', authorize('admin'), opsController.deleteTask);

// Attendance
router.post('/attendance/check-in', opsController.checkIn);
router.post('/attendance/check-out', opsController.checkOut);
router.put('/attendance/check-out', opsController.checkOut);
router.get('/attendance', authorize('admin', 'caretaker'), opsController.getAttendance);

// Inventory & Fodder Stock
router.get('/inventory', opsController.getInventory);
router.get('/inventory/stats', opsController.getInventoryStats);
router.post('/inventory', authorize('admin', 'caretaker'), opsController.createInventory);
router.put('/inventory/:id', authorize('admin', 'caretaker'), opsController.updateInventory);
router.delete('/inventory/:id', authorize('admin'), opsController.deleteInventory);

// Stats
router.get('/stats', opsController.getOperationsStats);

export default router;
