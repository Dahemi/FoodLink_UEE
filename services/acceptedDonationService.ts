import { AcceptedDonationModel } from '../backend/src/models/AcceptedDonation';

export const AcceptedDonationService = {
  async findNearbyDonations(coordinates: { latitude: number; longitude: number }, radiusKm: number = 5) {
    return AcceptedDonationModel.find({
      status: 'accepted',
      beneficiariesNotified: false,
      'distributionLocation.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [coordinates.longitude, coordinates.latitude]
          },
          $maxDistance: radiusKm * 1000 // Convert km to meters
        }
      }
    })
    .populate('ngoId', 'name address phone')
    .populate('donationId', 'title foodDetails pickupSchedule')
    .populate('donorId', 'name businessName')
    .sort({ acceptedAt: -1 });
  },

  async markNotificationSent(acceptedDonationId: string) {
    return AcceptedDonationModel.findByIdAndUpdate(acceptedDonationId, {
      beneficiariesNotified: true,
      notificationSentAt: new Date()
    });
  }
};