import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as opsService from './operations.service';
import { qs, qi, ps } from '../../utils/queryHelpers';

// Feed Logs
export const createFeedLog = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const log = await opsService.createFeedLog({ ...req.body, loggedBy: req.user!.id });
    res.status(201).json({ success: true, data: log });
  } catch (error) { next(error); }
};

export const getFeedLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await opsService.getFeedLogs({
      shedId: qs(req.query.shedId),
      startDate: qs(req.query.startDate),
      endDate: qs(req.query.endDate),
      page: qi(req.query.page),
      limit: qi(req.query.limit),
    });
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

export const getFeedTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const days = qi(req.query.days) ?? 30;
    const trends = await opsService.getFeedTrends(days);
    res.json({ success: true, data: trends });
  } catch (error) { next(error); }
};

// Tasks
export const createTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await opsService.createTask({ ...req.body, assignedBy: req.user!.id });
    res.status(201).json({ success: true, data: task });
  } catch (error) { next(error); }
};

export const getTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tasks = await opsService.getTasks({
      status: qs(req.query.status),
      priority: qs(req.query.priority),
      assignedTo: qs(req.query.assignedTo),
      category: qs(req.query.category),
    });
    res.json({ success: true, data: tasks });
  } catch (error) { next(error); }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await opsService.updateTask(ps(req.params.id), req.body);
    res.json({ success: true, data: task });
  } catch (error) { next(error); }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await opsService.deleteTask(ps(req.params.id));
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) { next(error); }
};

// Attendance
export const checkIn = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const record = await opsService.checkIn(req.user!.id);
    res.status(201).json({ success: true, data: record });
  } catch (error) { next(error); }
};

export const checkOut = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const record = await opsService.checkOut(req.user!.id);
    res.json({ success: true, data: record });
  } catch (error) { next(error); }
};

export const getAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const records = await opsService.getAttendance({
      userId: qs(req.query.userId),
      startDate: qs(req.query.startDate),
      endDate: qs(req.query.endDate),
    });
    res.json({ success: true, data: records });
  } catch (error) { next(error); }
};

export const getOperationsStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await opsService.getOperationsStats();
    res.json({ success: true, data: stats });
  } catch (error) { next(error); }
};

// ─── Inventory ──────────────────────────────────────
export const getInventory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const items = await opsService.getInventoryItems({
      category: qs(req.query.category),
      lowStockOnly: req.query.lowStock === 'true',
      search: qs(req.query.search),
    });
    res.json({ success: true, data: items });
  } catch (error) { next(error); }
};

export const createInventory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const item = await opsService.createInventoryItem(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) { next(error); }
};

export const updateInventory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const item = await opsService.updateInventoryItem(ps(req.params.id), req.body);
    res.json({ success: true, data: item });
  } catch (error) { next(error); }
};

export const deleteInventory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await opsService.deleteInventoryItem(ps(req.params.id));
    res.json({ success: true, message: 'Inventory item deleted' });
  } catch (error) { next(error); }
};

export const getInventoryStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await opsService.getInventoryStats();
    res.json({ success: true, data: stats });
  } catch (error) { next(error); }
};
