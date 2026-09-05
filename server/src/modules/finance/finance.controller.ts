import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as financeService from './finance.service';
import { qs, qi, ps } from '../../utils/queryHelpers';

export const createExpense = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const expense = await financeService.createExpense({ ...req.body, recordedBy: req.user!.id });
    res.status(201).json({ success: true, data: expense });
  } catch (error) { next(error); }
};

export const getExpenses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await financeService.getExpenses({
      category: qs(req.query.category), startDate: qs(req.query.startDate),
      endDate: qs(req.query.endDate), page: qi(req.query.page), limit: qi(req.query.limit),
    });
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

export const updateExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const expense = await financeService.updateExpense(ps(req.params.id), req.body);
    res.json({ success: true, data: expense });
  } catch (error) { next(error); }
};

export const deleteExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await financeService.deleteExpense(ps(req.params.id));
    res.json({ success: true, message: 'Expense deleted' });
  } catch (error) { next(error); }
};

export const getFinancialSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const year = qi(req.query.year);
    const month = qi(req.query.month);
    const summary = await financeService.getFinancialSummary(year, month);
    res.json({ success: true, data: summary });
  } catch (error) { next(error); }
};
