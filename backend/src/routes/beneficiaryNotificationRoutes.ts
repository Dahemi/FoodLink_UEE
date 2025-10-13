import { Router } from 'express';
import { BeneficiaryNotificationModel } from '../models/BeneficiaryNotification.js';
import { authenticateBeneficiary } from '../middleware/authMiddleware.js';
import { sendSuccess, sendError } from '../utils/responseUtils.js';

const router = Router();

// Get all active notifications
router.get('/', authenticateBeneficiary, async (req, res, next) => {
  try {
    const notifications = await BeneficiaryNotificationModel.find({ status: 'active' })
      .populate('ngoId', 'name address phone')
      .populate('donationId', 'title foodDetails')
      .sort({ createdAt: -1 });

    sendSuccess(res, notifications, 'Notifications retrieved successfully');
  } catch (e) {
    next(e);
  }
});

// Mark notification as read
router.post('/:notificationId/read', authenticateBeneficiary, async (req, res, next) => {
  try {
    const notification = await BeneficiaryNotificationModel.findOne({
      notificationId: req.params.notificationId
    });

    if (!notification) {
      return sendError(res, 'Notification not found', 404);
    }

    // Add beneficiary to readBy if not already there
    const alreadyRead = notification.readBy.some(
      r => r.beneficiaryId.toString() === req.beneficiary._id.toString()
    );

    if (!alreadyRead) {
      notification.readBy.push({
        beneficiaryId: req.beneficiary._id,
        readAt: new Date()
      });
      await notification.save();
    }

    sendSuccess(res, notification, 'Notification marked as read');
  } catch (e) {
    next(e);
  }
});

export default router;