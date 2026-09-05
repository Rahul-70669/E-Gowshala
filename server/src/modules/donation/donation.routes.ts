import { Router } from 'express';
import * as donationController from './donation.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';

const router = Router();
router.use(authenticate);

// Donations
router.get('/', donationController.getDonations);
router.get('/stats', donationController.getDonationStats);
router.get('/:id', donationController.getDonationById);
router.post('/', donationController.createDonation);
router.post('/:id/complete', donationController.completeDonation);

// Adopt-a-Cow
router.get('/adopt/list', donationController.getAdoptions);
router.post('/adopt', donationController.createAdoption);
router.put('/adopt/:id', authorize('admin', 'donor'), donationController.updateAdoption);

export default router;
