import { Router } from 'express';
import multer from 'multer';
import * as cowController from './cow.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// All cow routes require authentication
router.use(authenticate);

// Cow photo upload to Cloudinary
router.post(
  '/upload-photo',
  authorize('admin', 'veterinarian', 'caretaker'),
  upload.single('photo'),
  cowController.uploadCowPhoto
);

// Sheds (must be declared before /:id)
router.get('/sheds/all', cowController.getAllSheds);
router.get('/sheds', cowController.getAllSheds);
router.post('/sheds', authorize('admin'), cowController.createShed);

// Cow CRUD
router.get('/', cowController.getAllCows);
router.get('/stats', cowController.getCowStats);
router.get('/tag/:tagId', cowController.getCowByTagId);
router.get('/:id', cowController.getCowById);
router.post('/', authorize('admin', 'veterinarian', 'caretaker'), cowController.createCow);
router.put('/:id', authorize('admin', 'veterinarian', 'caretaker'), cowController.updateCow);
router.delete('/:id', authorize('admin'), cowController.deleteCow);

export default router;
