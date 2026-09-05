import { Router } from 'express';
import * as authController from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', authenticate, authController.getMe);
router.get('/users', authenticate, authorize('admin'), authController.getAllUsers);
router.post('/users', authenticate, authorize('admin'), authController.register);
router.put('/users/:id', authenticate, authorize('admin'), authController.updateUser);
router.delete('/users/:id', authenticate, authorize('admin'), authController.deleteUser);

export default router;
