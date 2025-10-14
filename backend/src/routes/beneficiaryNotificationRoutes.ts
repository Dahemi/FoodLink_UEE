import { Router } from 'express';
import { BeneficiaryNotificationModel } from '../models/BeneficiaryNotification.js';
import { authenticateBeneficiary } from '../middleware/authMiddleware.js';
import { sendSuccess, sendError } from '../utils/responseUtils.js';

const router = Router();

// Get all notifications for all beneficiaries
router.get('/all', authenticateBeneficiary, async (req, res, next) => {
  try {
    const notifications = await BeneficiaryNotificationModel.find({
      status: 'active'
    })
    .populate('ngoId', 'name address phone')
    .populate('donationId', 'title foodDetails')
    .sort({ createdAt: -1 });

    sendSuccess(res, notifications, 'Notifications retrieved successfully');
  } catch (e) {
    next(e);
  }
});

export default router;