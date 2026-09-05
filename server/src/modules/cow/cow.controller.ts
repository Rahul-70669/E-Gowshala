import { Request, Response, NextFunction } from 'express';
import * as cowService from './cow.service';
import { qs, qi, ps } from '../../utils/queryHelpers';
import { uploadBufferToCloudinary } from '../../config/cloudinary';

export const createCow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cow = await cowService.createCow(req.body);
    res.status(201).json({ success: true, data: cow });
  } catch (error) { next(error); }
};

export const getAllCows = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await cowService.getAllCows({
      search: qs(req.query.search),
      status: qs(req.query.status),
      breed: qs(req.query.breed),
      shedId: qs(req.query.shedId),
      page: qi(req.query.page),
      limit: qi(req.query.limit),
    });
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

export const getCowById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cow = await cowService.getCowById(ps(req.params.id));
    res.json({ success: true, data: cow });
  } catch (error) { next(error); }
};

export const getCowByTagId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cow = await cowService.getCowByTagId(ps(req.params.tagId));
    res.json({ success: true, data: cow });
  } catch (error) { next(error); }
};

export const updateCow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cow = await cowService.updateCow(ps(req.params.id), req.body);
    res.json({ success: true, data: cow });
  } catch (error) { next(error); }
};

export const deleteCow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await cowService.deleteCow(ps(req.params.id));
    res.json({ success: true, message: 'Cow deactivated successfully' });
  } catch (error) { next(error); }
};

export const getCowStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await cowService.getCowStats();
    res.json({ success: true, data: stats });
  } catch (error) { next(error); }
};

export const uploadCowPhoto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Image file is required' });
      return;
    }
    const uploadRes = await uploadBufferToCloudinary(req.file.buffer, 'egowshala/cows');
    res.json({ success: true, data: { url: uploadRes.secure_url, publicId: uploadRes.public_id } });
  } catch (error) { next(error); }
};

export const createShed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const shed = await cowService.createShed(req.body);
    res.status(201).json({ success: true, data: shed });
  } catch (error) { next(error); }
};

export const getAllSheds = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sheds = await cowService.getAllSheds();
    res.json({ success: true, data: sheds });
  } catch (error) { next(error); }
};
