import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { Card, Button, Chip, IconButton, Divider } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useVolunteerTasks } from '../../hooks/useVolunteerTasks';
import { NavigationService } from '../../services/navigationService';
import RescheduleModal from '../../components/volunteer/RescheduleModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { VolunteerTask } from '../../types/volunteer';

const { width } = Dimensions.get('window');

export default function TaskDetail() {
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const [task, setTask] = useState<VolunteerTask | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    tasks,
    acceptTask,
    startTask,
    completeTask,
    cancelTask,
    refreshTasks,
  } = useVolunteerTasks();

  useEffect(() => {
    if (taskId && tasks.length > 0) {
      const foundTask = tasks.find(t => t.id === taskId);
      setTask(foundTask || null);
      setLoading(false);
    }
  }, [taskId, tasks]);

  const handleAcceptTask = async () => {
    if (!task) return;
    
    try {
      await acceptTask(task.id);
      Alert.alert('Success', 'Task accepted successfully!');
      await refreshTasks();
    } catch (error) {
      Alert.alert('Error', 'Failed to accept task. Please try again.');
    }
  };

  const handleStartTask = async () => {
    if (!task) return;

    Alert.alert(
      'Start Task',
      'Are you ready to start the pickup? This will mark the task as in progress.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            try {
              await startTask(task.id);
              Alert.alert('Success', 'Task started! Safe travels!');
              await refreshTasks();
            } catch (error) {
              Alert.alert('Error', 'Failed to start task. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleCompleteTask = async () => {
    if (!task) return;

    Alert.alert(
      'Complete Task',
      'Have you successfully delivered the food to the NGO?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await completeTask(task.id);
              Alert.alert(
                'Congratulations! 🎉',
                'Task completed successfully! Thank you for making a difference in the community.',
                [
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                  },
                ]
              );
              await refreshTasks();
            } catch (error) {
              Alert.alert('Error', 'Failed to complete task. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleCancelTask = () => {
    if (!task) return;

    Alert.alert(
      'Cancel Task',
      'Are you sure you want to cancel this task? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelTask(task.id, 'Cancelled by volunteer');
              Alert.alert('Task Cancelled', 'The task has been cancelled.');
              router.back();
              await refreshTasks();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel task. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleReschedule = async (taskId: string, newTime: Date, reason: string) => {
    // In a real app, this would make an API call to reschedule
    Alert.alert(
      'Reschedule Request Sent',
      'Your reschedule request has been sent to the donor and NGO. They will be notified of the new time.',
      [{ text: 'OK', onPress: () => setShowRescheduleModal(false) }]
    );
  };

  const makePhoneCall = (phone: string, contactType: string) => {
    Alert.alert(
      `Call ${contactType}`,
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

  const openMaps = (address: string, name: string) => {
    NavigationService.openMaps(address, name);
  };

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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  const isExpiringSoon = () => {
    if (!task) return false;
    const expiryTime = new Date(task.foodDetails.expiryTime);
    const now = new Date();
    const hoursUntilExpiry = (expiryTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilExpiry <= 2 && hoursUntilExpiry > 0;
  };

  if (loading) {
    return (
      <LoadingSpinner 
        message="Loading task details..." 
        size="large" 
        color="#FF8A50" 
      />
    );
  }

  if (!task) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>📋</Text>
        <Text style={styles.errorTitle}>Task Not Found</Text>
        <Text style={styles.errorMessage}>
          The task you're looking for doesn't exist or has been removed.
        </Text>
        <Button mode="contained" onPress={() => router.back()}>
          Go Back
        </Button>
      </View>
    );
  }

  const pickup = formatDateTime(task.pickupTime);
  const delivery = formatDateTime(task.deliveryTime);
  const expiry = formatDateTime(task.foodDetails.expiryTime);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View style={styles.headerLeft}>
                <Text style={styles.taskTitle}>{task.donorInfo.name}</Text>
                <Text style={styles.taskRoute}>→ {task.ngoInfo.name}</Text>
              </View>
              <View style={styles.headerRight}>
                <Chip
                  mode="outlined"
                  textStyle={[styles.priorityText, { color: getPriorityColor(task.priority) }]}
                  style={[styles.priorityChip, { borderColor: getPriorityColor(task.priority) }]}
                >
                  {task.priority.toUpperCase()}
                </Chip>
                <Chip
                  mode="flat"
                  textStyle={[styles.statusText, { color: getStatusColor(task.status) }]}
                  style={[styles.statusChip, { backgroundColor: `${getStatusColor(task.status)}20` }]}
                >
                  {task.status.toUpperCase()}
                </Chip>
              </View>
            </View>
          </View>
        </Card>

        {/* Food Details Card */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📦 Food Details</Text>
            {isExpiringSoon() && (
              <Chip
                mode="flat"
                style={styles.expiryWarning}
                textStyle={styles.expiryWarningText}
                icon="alert-circle"
              >
                Expires Soon!
              </Chip>
            )}
          </View>
          <View style={styles.cardContent}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type:</Text>
              <Text style={styles.detailValue}>{task.foodDetails.type}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quantity:</Text>
              <Text style={styles.detailValue}>{task.foodDetails.quantity}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expires:</Text>
              <Text style={[styles.detailValue, isExpiringSoon() && styles.expiryText]}>
                {expiry.date} at {expiry.time}
              </Text>
            </View>
            {task.foodDetails.specialInstructions && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.instructionsContainer}>
                  <Text style={styles.instructionsLabel}>📝 Special Instructions:</Text>
                  <Text style={styles.instructionsText}>
                    {task.foodDetails.specialInstructions}
                  </Text>
                </View>
              </>
            )}
          </View>
        </Card>

        {/* Schedule Card */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>⏰ Schedule</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>Pickup Time:</Text>
              <Text style={styles.scheduleValue}>{pickup.date}</Text>
              <Text style={styles.scheduleTime}>{pickup.time}</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>Delivery Time:</Text>
              <Text style={styles.scheduleValue}>{delivery.date}</Text>
              <Text style={styles.scheduleTime}>{delivery.time}</Text>
            </View>
          </View>
        </Card>

        {/* Donor Information Card */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🏪 Pickup Location</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.contactName}>{task.donorInfo.name}</Text>
            <Text style={styles.contactPerson}>Contact: {task.donorInfo.contactPerson}</Text>
            <Text style={styles.address}>{task.donorInfo.address}</Text>
            <View style={styles.contactActions}>
              <Button
                mode="outlined"
                icon="phone"
                onPress={() => makePhoneCall(task.donorInfo.phone, 'Donor')}
                style={styles.contactButton}
              >
                Call
              </Button>
              <Button
                mode="contained"
                icon="map-marker"
                onPress={() => openMaps(task.donorInfo.address, task.donorInfo.name)}
                style={styles.contactButton}
              >
                Navigate
              </Button>
            </View>
          </View>
        </Card>

        {/* NGO Information Card */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🏥 Delivery Location</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.contactName}>{task.ngoInfo.name}</Text>
            <Text style={styles.contactPerson}>Contact: {task.ngoInfo.contactPerson}</Text>
            <Text style={styles.address}>{task.ngoInfo.address}</Text>
            <View style={styles.contactActions}>
              <Button
                mode="outlined"
                icon="phone"
                onPress={() => makePhoneCall(task.ngoInfo.phone, 'NGO')}
                style={styles.contactButton}
              >
                Call
              </Button>
              <Button
                mode="contained"
                icon="map-marker"
                onPress={() => openMaps(task.ngoInfo.address, task.ngoInfo.name)}
                style={styles.contactButton}
              >
                Navigate
              </Button>
            </View>
          </View>
        </Card>

        {/* Distance and Duration Info */}
        {(task.distance || task.estimatedDuration) && (
          <Card style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.distanceInfo}>
                {task.distance && (
                  <View style={styles.distanceItem}>
                    <Text style={styles.distanceIcon}>📍</Text>
                    <Text style={styles.distanceText}>{task.distance}</Text>
                  </View>
                )}
                {task.estimatedDuration && (
                  <View style={styles.distanceItem}>
                    <Text style={styles.distanceIcon}>⏱️</Text>
                    <Text style={styles.distanceText}>{task.estimatedDuration}</Text>
                  </View>
                )}
              </View>
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {task.status === 'assigned' && (
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={handleCancelTask}
              style={[styles.actionButton, styles.cancelButton]}
              textColor="#F44336"
            >
              Decline
            </Button>
            <Button
              mode="contained"
              onPress={handleAcceptTask}
              style={[styles.actionButton, styles.acceptButton]}
            >
              Accept Task
            </Button>
          </View>
        )}

        {task.status === 'accepted' && (
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowRescheduleModal(true)}
              style={styles.actionButton}
            >
              Reschedule
            </Button>
            <Button
              mode="contained"
              onPress={handleStartTask}
              style={[styles.actionButton, styles.startButton]}
            >
              Start Pickup
            </Button>
          </View>
        )}

        {task.status === 'in_progress' && (
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowRescheduleModal(true)}
              style={styles.actionButton}
            >
              Report Issue
            </Button>
            <Button
              mode="contained"
              onPress={handleCompleteTask}
              style={[styles.actionButton, styles.completeButton]}
            >
              Mark Complete
            </Button>
          </View>
        )}
      </View>

      {/* Reschedule Modal */}
      <RescheduleModal
        visible={showRescheduleModal}
        task={task}
        onClose={() => setShowRescheduleModal(false)}
        onReschedule={handleReschedule}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 6,
    backgroundColor: '#FFFFFF',
  },
  headerContent: {
    padding: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 4,
  },
  taskRoute: {
    fontSize: 16,
    color: '#718096',
    fontWeight: '500',
  },
  priorityChip: {
    height: 28,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusChip: {
    height: 28,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 3,
    backgroundColor: '#FFFFFF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#2D3748',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  expiryText: {
    color: '#F44336',
    fontWeight: '600',
  },
  expiryWarning: {
    backgroundColor: '#FFF5F5',
    borderColor: '#F44336',
  },
  expiryWarningText: {
    color: '#F44336',
    fontWeight: '600',
  },
  divider: {
    marginVertical: 12,
    backgroundColor: '#E2E8F0',
  },
  instructionsContainer: {
    backgroundColor: '#FFF5E6',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  instructionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#BF360C',
    lineHeight: 20,
  },
  scheduleItem: {
    paddingVertical: 8,
  },
  scheduleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
    marginBottom: 4,
  },
  scheduleValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3748',
    marginBottom: 2,
  },
  scheduleTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF8A50',
  },
  contactName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  contactPerson: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 16,
    lineHeight: 20,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
  },
  distanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  distanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distanceIcon: {
    fontSize: 16,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A5568',
  },
  actionContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 4,
  },
  cancelButton: {
    borderColor: '#F44336',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  startButton: {
    backgroundColor: '#FF9800',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
});
