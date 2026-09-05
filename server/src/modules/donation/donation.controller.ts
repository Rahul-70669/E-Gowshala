import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import * as donationService from './donation.service';
import { qs, qi, ps } from '../../utils/queryHelpers';

export const createDonation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const donation = await donationService.createDonation({
      ...req.body,
      donorId: req.user?.id,
    });
    res.status(201).json({ success: true, data: donation });
  } catch (error) { next(error); }
};

export const completeDonation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { razorpayPaymentId, razorpaySignature } = req.body;
    const donation = await donationService.completeDonation(ps(req.params.id), {
      razorpayPaymentId,
      razorpaySignature,
    });
    res.json({ success: true, data: donation });
  } catch (error) { next(error); }
};

export const getDonations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await donationService.getDonations({
      donorId: qs(req.query.donorId),
      paymentStatus: qs(req.query.paymentStatus),
      purpose: qs(req.query.purpose),
      startDate: qs(req.query.startDate),
      endDate: qs(req.query.endDate),
      page: qi(req.query.page),
      limit: qi(req.query.limit),
    });
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

export const getDonationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const donation = await donationService.getDonationById(ps(req.params.id));
    res.json({ success: true, data: donation });
  } catch (error) { next(error); }
};

export const createAdoption = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adoption = await donationService.createAdoption({
      ...req.body,
      donorId: req.body.donorId || req.user?.id,
    });
    res.status(201).json({ success: true, data: adoption });
  } catch (error) { next(error); }
};

export const getAdoptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adoptions = await donationService.getAdoptions({
      donorId: qs(req.query.donorId),
      cowId: qs(req.query.cowId),
      status: qs(req.query.status),
    });
    res.json({ success: true, data: adoptions });
  } catch (error) { next(error); }
};

export const updateAdoption = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adoption = await donationService.updateAdoption(ps(req.params.id), req.body);
    res.json({ success: true, data: adoption });
  } catch (error) { next(error); }
};

export const getDonationStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await donationService.getDonationStats();
    res.json({ success: true, data: stats });
  } catch (error) { next(error); }
};
