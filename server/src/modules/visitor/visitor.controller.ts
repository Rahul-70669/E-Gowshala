import { Request, Response, NextFunction } from 'express';
import * as visitorService from './visitor.service';
import { qs, qi, ps } from '../../utils/queryHelpers';

export const createVisitor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const visitor = await visitorService.createVisitor(req.body);
    res.status(201).json({ success: true, data: visitor });
  } catch (error) { next(error); }
};

export const getVisitors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await visitorService.getVisitors({
      status: qs(req.query.status), visitType: qs(req.query.visitType),
      startDate: qs(req.query.startDate), endDate: qs(req.query.endDate),
      page: qi(req.query.page), limit: qi(req.query.limit),
    });
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

export const getTodaysVisitors = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const visitors = await visitorService.getTodaysVisitors();
    res.json({ success: true, data: visitors });
  } catch (error) { next(error); }
};

export const checkIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const visitor = await visitorService.checkInVisitor(ps(req.params.id));
    res.json({ success: true, data: visitor });
  } catch (error) { next(error); }
};

export const checkOut = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const visitor = await visitorService.checkOutVisitor(ps(req.params.id), req.body.feedback);
    res.json({ success: true, data: visitor });
  } catch (error) { next(error); }
};

export const cancelVisit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const visitor = await visitorService.cancelVisit(ps(req.params.id));
    res.json({ success: true, data: visitor });
  } catch (error) { next(error); }
};

export const getVisitorStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await visitorService.getVisitorStats();
    res.json({ success: true, data: stats });
  } catch (error) { next(error); }
};
