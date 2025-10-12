import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Card, Button, Chip, IconButton } from 'react-native-paper';
import { NavigationService } from '../../services/navigationService';

interface ClaimedDonationCardProps {
  donation: any;
  onPress: () => void;
  onAccept?: (donationId: string) => void;
  showActions?: boolean;
}

export default function ClaimedDonationCard({ 
  donation, 
  onPress, 
  onAccept,
  showActions = true 
}: ClaimedDonationCardProps) {
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#F44336';
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'claimed': return '#2196F3';
      case 'pickup_scheduled': return '#FF9800';
      case 'picked_up': return '#9C27B0';
      case 'delivered': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'claimed': return 'Ready for Pickup';
      case 'pickup_scheduled': return 'Scheduled';
      case 'picked_up': return 'Picked Up';
      case 'delivered': return 'Delivered';
      default: return status;
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpiringSoon = () => {
    if (!donation.expiryDateTime) return false;
    const expiryTime = new Date(donation.expiryDateTime);
    const now = new Date();
    const hoursUntilExpiry = (expiryTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilExpiry <= 2 && hoursUntilExpiry > 0;
  };

  const handleQuickCall = (phone: string, contactType: 'donor' | 'ngo') => {
    Alert.alert(
      `Call ${contactType === 'donor' ? 'Donor' : 'NGO'}`,
      `Call ${phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => NavigationService.makePhoneCall(phone),
        },
      ]
    );
  };

  const handleQuickNavigation = (address: string, name: string) => {
    NavigationService.openMaps(address, name);
  };

  const renderActionButtons = () => {
    if (!showActions) return null;

    if (donation.status === 'claimed') {
      return (
        <View style={styles.actionButtons}>
          <Button 
            mode="contained" 
            onPress={() => onAccept?.(donation.id)}
            style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
            labelStyle={styles.actionButtonText}
          >
            Accept Pickup
          </Button>
        </View>
      );
    }
    
    return null;
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.cardContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.donorName}>{donation.donorInfo?.name || 'Unknown Donor'}</Text>
            <Text style={styles.route}>→ {donation.ngoInfo?.name || 'Unknown NGO'}</Text>
          </View>
          <View style={styles.headerRight}>
            <Chip 
              mode="outlined" 
              textStyle={[styles.priorityText, { color: getPriorityColor(donation.priority) }]}
              style={[styles.priorityChip, { borderColor: getPriorityColor(donation.priority) }]}
            >
              {donation.priority?.toUpperCase() || 'MEDIUM'}
            </Chip>
            <Chip 
              mode="flat"
              textStyle={[styles.statusText, { color: getStatusColor(donation.status) }]}
              style={[styles.statusChip, { backgroundColor: `${getStatusColor(donation.status)}20` }]}
            >
              {getStatusText(donation.status)}
            </Chip>
          </View>
        </View>

        {/* Food Details */}
        <View style={styles.foodDetails}>
          <Text style={styles.foodType}>📦 {donation.foodDetails?.type || 'Food'}</Text>
          <Text style={styles.quantity}>📊 {donation.foodDetails?.quantity || 'Unknown quantity'}</Text>
          {isExpiringSoon() && (
            <Text style={styles.expiryWarning}>⚠️ Expires soon!</Text>
          )}
        </View>

        {/* Pickup and Delivery Addresses */}
        <View style={styles.addressesContainer}>
          {/* Pickup Address */}
          <View style={styles.addressSection}>
            <Text style={styles.addressLabel}>📍 Pickup from:</Text>
            <Text style={styles.addressText}>{donation.donorInfo?.address || 'Address not available'}</Text>
            <Text style={styles.contactText}>Contact: {donation.donorInfo?.contactPerson || 'N/A'} ({donation.donorInfo?.phone || 'N/A'})</Text>
          </View>

          {/* Delivery Address */}
          <View style={styles.addressSection}>
            <Text style={styles.addressLabel}>🏢 Deliver to:</Text>
            <Text style={styles.addressText}>{donation.ngoInfo?.address || 'Address not available'}</Text>
            <Text style={styles.contactText}>Contact: {donation.ngoInfo?.contactPerson || 'N/A'} ({donation.ngoInfo?.phone || 'N/A'})</Text>
          </View>
        </View>

        {/* Time and Schedule Info */}
        <View style={styles.timeLocationInfo}>
          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>Available:</Text>
            <Text style={styles.timeValue}>
              {donation.pickupSchedule?.availableFrom ? 
                `${formatDate(donation.pickupSchedule.availableFrom)} at ${formatTime(donation.pickupSchedule.availableFrom)}` : 
                'Check with donor'
              }
            </Text>
          </View>
          {donation.pickupSchedule?.availableUntil && (
            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>Until:</Text>
              <Text style={styles.timeValue}>
                {formatDate(donation.pickupSchedule.availableUntil)} at {formatTime(donation.pickupSchedule.availableUntil)}
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <IconButton
            icon="phone"
            size={20}
            iconColor="#4CAF50"
            style={styles.quickActionButton}
            onPress={() => handleQuickCall(donation.donorInfo?.phone, 'donor')}
          />
          <IconButton
            icon="map-marker"
            size={20}
            iconColor="#2196F3"
            style={styles.quickActionButton}
            onPress={() => handleQuickNavigation(donation.donorInfo?.address, donation.donorInfo?.name)}
          />
          <IconButton
            icon="phone-outline"
            size={20}
            iconColor="#4CAF50"
            style={styles.quickActionButton}
            onPress={() => handleQuickCall(donation.ngoInfo?.phone, 'ngo')}
          />
          <IconButton
            icon="map-marker-outline"
            size={20}
            iconColor="#2196F3"
            style={styles.quickActionButton}
            onPress={() => handleQuickNavigation(donation.ngoInfo?.address, donation.ngoInfo?.name)}
          />
        </View>

        {/* Action Buttons */}
        {renderActionButtons()}

        {/* Special Instructions */}
        {donation.pickupSchedule?.specialInstructions && (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsLabel}>📝 Instructions:</Text>
            <Text style={styles.instructionsText}>{donation.pickupSchedule.specialInstructions}</Text>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  donorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 4,
  },
  route: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  priorityChip: {
    height: 24,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusChip: {
    height: 24,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  foodDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
  },
  foodType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
    flex: 1,
  },
  quantity: {
    fontSize: 14,
    fontWeight: '500',
    color: '#718096',
  },
  expiryWarning: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F44336',
  },
  addressesContainer: {
    marginBottom: 12,
    gap: 8,
  },
  addressSection: {
    padding: 12,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3748',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 12,
    color: '#718096',
    fontStyle: 'italic',
  },
  timeLocationInfo: {
    marginBottom: 12,
  },
  timeInfo: {
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3748',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
  },
  quickActionButton: {
    margin: 0,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  instructionsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF5E6',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  instructionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 13,
    color: '#BF360C',
    lineHeight: 18,
  },
});
