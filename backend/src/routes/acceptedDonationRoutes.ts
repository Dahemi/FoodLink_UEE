// backend/src/routes/acceptedDonationRoutes.ts
import express from 'express';
import { authenticateNGO } from '../middleware/authMiddleware.js'; // Fixed import path
import { AcceptedDonationModel } from '../models/AcceptedDonation.js';
import { DonationModel } from '../models/Donation.js';
import mongoose from 'mongoose';
import { sendSuccess, sendError } from '../utils/responseUtils.js';
import { NotificationModel } from '../models/Notification.js';
import { BeneficiaryModel } from '../models/Beneficiary.js';

const router = express.Router();

// Create accepted donation
router.post('/accept', authenticateNGO, async (req, res) => {
  try {
    const {
      donationId,
      donorId,
      distributionStartTime,
      distributionEndTime,
      distributionLocation
    } = req.body;

    // Validate required fields
    if (!donationId || !donorId) {
      return sendError(res, 'Missing required fields: donationId and donorId are required', 400);
    }

    const coordinates = {
      longitude: distributionLocation?.coordinates?.longitude || req.ngo.address.coordinates.longitude,
      latitude: distributionLocation?.coordinates?.latitude || req.ngo.address.coordinates.latitude
    };

    const address = distributionLocation?.address || `${req.ngo.address.street}, ${req.ngo.address.city}`;

    const acceptedDonation = new AcceptedDonationModel({
      ngoId: req.ngo._id,
      donationId: new mongoose.Types.ObjectId(donationId),
      donorId: new mongoose.Types.ObjectId(donorId),
      distributionLocation: {
        coordinates: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        },
        address: address
      },
      distributionStartTime,
      distributionEndTime
    });

    // Save accepted donation and update original donation status
    await Promise.all([
      acceptedDonation.save(),
      DonationModel.findByIdAndUpdate(donationId, { status: 'accepted', acceptedBy: req.ngo._id })
    ]);

    // Create a single notification for all beneficiaries
    const notification = new NotificationModel({
      recipientType: 'beneficiary', // This makes it visible to all beneficiaries
      title: 'New Food Distribution Available',
      body: `${req.ngo.name} has new food available for distribution`,
      shortText: 'New food distribution point available',
      type: 'donation_available',
      contextType: 'donation',
      contextId: acceptedDonation._id,
      data: {
        donationId: acceptedDonation.donationId,
        ngoId: acceptedDonation.ngoId,
        location: {
          coordinates: coordinates,
          address: address
        },
        ngoName: req.ngo.name
      }
    });

    await notification.save();

    // Mark accepted donation as notified
    await acceptedDonation.updateOne({ 
      beneficiariesNotified: true, 
      notificationSentAt: new Date() 
    });

    // Populate for response
    const populated = await AcceptedDonationModel.findById(acceptedDonation._id)
      .populate('ngoId', 'name address phone')
      .populate('donationId', 'title foodDetails pickupSchedule')
      .populate('donorId', 'name businessName');

    sendSuccess(res, populated, 'Donation accepted and beneficiaries notified');

  } catch (error: any) {
    console.error('Error accepting donation:', error);
    sendError(res, error.message || 'Failed to accept donation', 500);
  }
});

// Create accepted donation record when NGO expresses interest
router.post('/from-interest', authenticateNGO, async (req, res) => {
  try {
    const { donationId, donorId } = req.body;

    // Validate required fields
    if (!donationId || !donorId) {
      return sendError(res, 'Missing required fields: donationId and donorId are required', 400);
    }

    const coordinates = {
      longitude: req.ngo.address.coordinates?.longitude || 79.8612,
      latitude: req.ngo.address.coordinates?.latitude || 6.9271
    };

    const address = `${req.ngo.address.street}, ${req.ngo.address.city}`;

    // Create AcceptedDonation record
    const acceptedDonation = new AcceptedDonationModel({
      ngoId: req.ngo._id,
      donationId: new mongoose.Types.ObjectId(donationId),
      donorId: new mongoose.Types.ObjectId(donorId),
      distributionLocation: {
        coordinates: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        },
        address: address
      }
    });

    // Create notification for beneficiaries
    const notification = new NotificationModel({
      recipientType: 'beneficiary',
      title: 'New Food Distribution Available',
      body: `${req.ngo.name} has new food available for distribution`,
      shortText: 'New food distribution point available',
      type: 'donation_available',
      contextType: 'donation',
      contextId: acceptedDonation._id,
      data: {
        donationId: acceptedDonation.donationId,
        ngoId: acceptedDonation.ngoId,
        location: {
          coordinates: coordinates,
          address: address
        },
        ngoName: req.ngo.name
      }
    });

    // Save both records
    await Promise.all([
      acceptedDonation.save(),
      notification.save()
    ]);

    // Mark as notified
    await acceptedDonation.updateOne({
      beneficiariesNotified: true,
      notificationSentAt: new Date()
    });

    // Return populated response
    const populated = await AcceptedDonationModel.findById(acceptedDonation._id)
      .populate('ngoId', 'name address phone')
      .populate('donationId', 'title foodDetails pickupSchedule')
      .populate('donorId', 'name businessName');

    sendSuccess(res, populated, 'Accepted donation record created');

  } catch (error: any) {
    console.error('Error creating accepted donation record:', error);
    sendError(res, error.message || 'Failed to create accepted donation record', 500);
  }
});

// Get accepted donations for an NGO
router.get('/ngo', authenticateNGO, async (req, res) => {
  try {
    const { status } = req.query;
    
    const query: any = { ngoId: req.ngo._id };
    if (status) {
      query.status = status;
    }

    const acceptedDonations = await AcceptedDonationModel.find(query)
      .populate('donationId', 'title foodDetails pickupSchedule')
      .populate('donorId', 'name businessName')
      .sort({ createdAt: -1 });

    sendSuccess(res, acceptedDonations);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch accepted donations', 500);
  }
});

// Update accepted donation status
router.patch('/:id/status', authenticateNGO, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['accepted', 'distributed', 'cancelled'].includes(status)) {
      return sendError(res, 'Invalid status', 400);
    }

    const acceptedDonation = await AcceptedDonationModel.findOneAndUpdate(
      { _id: id, ngoId: req.ngo._id },
      { status },
      { new: true }
    );

    if (!acceptedDonation) {
      return sendError(res, 'Accepted donation not found', 404);
    }

    sendSuccess(res, acceptedDonation, 'Status updated successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update status', 500);
  }
});

export default router;