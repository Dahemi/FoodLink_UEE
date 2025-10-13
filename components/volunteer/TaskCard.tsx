import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Card, Button, Chip, IconButton } from 'react-native-paper';
import { VolunteerTask } from '../../types/volunteer';
import { NavigationService } from '../../services/navigationService';

interface TaskCardProps {
  task: VolunteerTask;
  onPress: () => void;
  onAccept?: (taskId: string) => void;
  onStart?: (taskId: string) => void;
  onComplete?: (taskId: string) => void;
  onCancel?: (taskId: string) => void;
  showActions?: boolean;
}

export default function TaskCard({ 
  task, 
  onPress, 
  onAccept, 
  onStart, 
  onComplete, 
  onCancel,
  showActions = true 
}: TaskCardProps) {
  
  const getPriorityColor = (priority: VolunteerTask['priority']) => {
    switch (priority) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getStatusColor = (status: VolunteerTask['status']) => {
    switch (status) {
      case 'assigned': return '#2196F3';
      case 'accepted': return '#FF9800';
      case 'in_progress': return '#9C27B0';
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: VolunteerTask['status']) => {
    switch (status) {
      case 'assigned': return 'New';
      case 'accepted': return 'Accepted';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpiringSoon = () => {
    const expiryTime = new Date(task.foodDetails.expiryTime);
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

    switch (task.status) {
      case 'assigned':
        return (
          <View style={styles.actionButtons}>
            <Button 
              mode="contained" 
              onPress={() => onAccept?.(task.id)}
              style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
              labelStyle={styles.actionButtonText}
            >
              Accept
            </Button>
            <Button 
              mode="outlined" 
              onPress={() => onCancel?.(task.id)}
              style={styles.actionButton}
              textColor="#F44336"
            >
              Decline
            </Button>
          </View>
        );
      
      case 'accepted':
        return (
          <View style={styles.actionButtons}>
            <Button 
              mode="contained" 
              onPress={() => onStart?.(task.id)}
              style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
              labelStyle={styles.actionButtonText}
            >
              Start Pickup
            </Button>
          </View>
        );
      
      case 'in_progress':
        return (
          <View style={styles.actionButtons}>
            <Button 
              mode="contained" 
              onPress={() => onComplete?.(task.id)}
              style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
              labelStyle={styles.actionButtonText}
            >
              Mark Complete
            </Button>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.cardContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.taskTitle}>{task.title || 'Food Donation'}</Text>
            <Text style={styles.donorName}>{task.donorInfo.name}</Text>
            <Text style={styles.route}>→ {task.ngoInfo.name}</Text>
          </View>
          <View style={styles.headerRight}>
            <Chip 
              mode="outlined" 
              textStyle={[styles.priorityText, { color: getPriorityColor(task.priority) }]}
              style={[styles.priorityChip, { borderColor: getPriorityColor(task.priority), marginBottom: 4 }]}
            >
              {task.priority.toUpperCase()}
            </Chip>
            <Chip 
              mode="flat"
              textStyle={[styles.statusText, { color: getStatusColor(task.status) }]}
              style={[styles.statusChip, { backgroundColor: `${getStatusColor(task.status)}20` }]}
            >
              {getStatusText(task.status)}
            </Chip>
          </View>
        </View>

        {/* Food Details */}
        <View style={styles.foodDetails}>
          <Text style={styles.foodType}>📦 {task.foodDetails.type}</Text>
          <Text style={styles.quantity}>📊 {task.foodDetails.quantity}</Text>
          {isExpiringSoon() && (
            <Text style={styles.expiryWarning}>⚠️ Expires soon!</Text>
          )}
        </View>

        {/* Time and Location Info */}
        <View style={styles.timeLocationInfo}>
          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>Pickup:</Text>
            <Text style={styles.timeValue}>
              {formatDate(task.pickupTime)} at {formatTime(task.pickupTime)}
            </Text>
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.distanceText}>📍 {task.distance || 'Calculating...'}</Text>
            <Text style={styles.durationText}>⏱️ {task.estimatedDuration || 'Est. time'}</Text>
          </View>
        </View>

        {/* Modern Quick Actions with Cards */}
        <View style={styles.quickActionsContainer}>
          {/* Pickup Card */}
          <View style={styles.locationCard}>
            <View style={styles.locationCardHeader}>
              <View style={[styles.locationIconContainer, styles.pickupIconContainer]}>
                <IconButton
                  icon="package-variant"
                  size={20}
                  iconColor="#FF8A50"
                  style={styles.locationIconButton}
                />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>Pickup from {task.donorInfo.name}</Text>
                <Text style={styles.locationAddress} numberOfLines={1}>{task.donorInfo.address}</Text>
              </View>
            </View>
            <View style={styles.locationActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.callButton]}
                onPress={() => handleQuickCall(task.donorInfo.phone, 'donor')}
              >
                <IconButton
                  icon="phone"
                  size={16}
                  iconColor="#4CAF50"
                  style={styles.actionIconButton}
                />
                <Text style={styles.actionButtonText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.navigateButton]}
                onPress={() => handleQuickNavigation(task.donorInfo.address, task.donorInfo.name)}
              >
                <IconButton
                  icon="navigation"
                  size={16}
                  iconColor="#2196F3"
                  style={styles.actionIconButton}
                />
                <Text style={styles.actionButtonText}>Navigate</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Delivery Card */}
          <View style={styles.locationCard}>
            <View style={styles.locationCardHeader}>
              <View style={[styles.locationIconContainer, styles.deliveryIconContainer]}>
                <IconButton
                  icon="office-building"
                  size={20}
                  iconColor="#4CAF50"
                  style={styles.locationIconButton}
                />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>Deliver to {task.ngoInfo.name}</Text>
                <Text style={styles.locationAddress} numberOfLines={1}>{task.ngoInfo.address}</Text>
              </View>
            </View>
            <View style={styles.locationActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.callButton]}
                onPress={() => handleQuickCall(task.ngoInfo.phone, 'ngo')}
              >
                <IconButton
                  icon="phone"
                  size={16}
                  iconColor="#4CAF50"
                  style={styles.actionIconButton}
                />
                <Text style={styles.actionButtonText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.navigateButton]}
                onPress={() => handleQuickNavigation(task.ngoInfo.address, task.ngoInfo.name)}
              >
                <IconButton
                  icon="navigation"
                  size={16}
                  iconColor="#2196F3"
                  style={styles.actionIconButton}
                />
                <Text style={styles.actionButtonText}>Navigate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {renderActionButtons()}

        {/* Special Instructions */}
        {task.foodDetails.specialInstructions && (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsLabel}>📝 Instructions:</Text>
            <Text style={styles.instructionsText}>{task.foodDetails.specialInstructions}</Text>
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
    minHeight: 65,
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF8A50',
    marginBottom: 4,
  },
  donorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 2,
  },
  route: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  priorityChip: {
    height: 30,
    minHeight: 30,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusChip: {
    height: 30,
    minHeight: 30,
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
  locationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
  durationText: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
  quickActionsContainer: {
    marginBottom: 12,
    gap: 12,
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  locationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pickupIconContainer: {
    backgroundColor: '#FFF5E6',
  },
  deliveryIconContainer: {
    backgroundColor: '#E8F5E8',
  },
  locationIconButton: {
    margin: 0,
  },
  actionIconButton: {
    margin: 0,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 12,
    color: '#718096',
    lineHeight: 16,
  },
  locationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  callButton: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  navigateButton: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  actionButtonIcon: {
    fontSize: 16,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D3748',
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
