import { Router } from 'express';
import * as financeController from './finance.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';

const router = Router();
router.use(authenticate);

router.get('/expenses', financeController.getExpenses);
router.get('/summary', financeController.getFinancialSummary);
router.get('/stats', financeController.getFinancialSummary);
router.post('/expenses', authorize('admin'), financeController.createExpense);
router.put('/expenses/:id', authorize('admin'), financeController.updateExpense);
router.delete('/expenses/:id', authorize('admin'), financeController.deleteExpense);

export default router;
