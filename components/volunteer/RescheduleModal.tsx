import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Alert } from 'react-native';
import { Button, TextInput, Card } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { VolunteerTask } from '../../types/volunteer';

interface RescheduleModalProps {
  visible: boolean;
  task: VolunteerTask | null;
  onClose: () => void;
  onReschedule: (taskId: string, newTime: Date, reason: string) => void;
}

export default function RescheduleModal({
  visible,
  task,
  onClose,
  onReschedule
}: RescheduleModalProps) {
  const [newTime, setNewTime] = useState(new Date());
  const [reason, setReason] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setNewTime(new Date());
    setReason('');
    setShowDatePicker(false);
    setShowTimePicker(false);
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleReschedule = async () => {
    if (!task) return;

    // Validation
    if (newTime <= new Date()) {
      Alert.alert('Invalid Time', 'Please select a future date and time.');
      return;
    }

    if (reason.trim().length < 10) {
      Alert.alert('Reason Required', 'Please provide a detailed reason for rescheduling (minimum 10 characters).');
      return;
    }

    try {
      setLoading(true);
      await onReschedule(task.id, newTime, reason.trim());
      handleClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to reschedule task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const updatedTime = new Date(newTime);
      updatedTime.setFullYear(selectedDate.getFullYear());
      updatedTime.setMonth(selectedDate.getMonth());
      updatedTime.setDate(selectedDate.getDate());
      setNewTime(updatedTime);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const updatedTime = new Date(newTime);
      updatedTime.setHours(selectedTime.getHours());
      updatedTime.setMinutes(selectedTime.getMinutes());
      setNewTime(updatedTime);
    }
  };

  if (!task) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Reschedule Task</Text>
          <Button mode="text" onPress={handleClose} textColor="#718096">
            Cancel
          </Button>
        </View>

        <View style={styles.content}>
          {/* Task Info */}
          <Card style={styles.taskInfoCard}>
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>{task.donorInfo.name}</Text>
              <Text style={styles.taskSubtitle}>→ {task.ngoInfo.name}</Text>
              <Text style={styles.currentTime}>
                Current pickup: {formatDateTime(new Date(task.pickupTime))}
              </Text>
            </View>
          </Card>

          {/* New Date/Time Selection */}
          <View style={styles.dateTimeSection}>
            <Text style={styles.sectionTitle}>Select New Date & Time</Text>
            
            <View style={styles.dateTimeButtons}>
              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                style={styles.dateTimeButton}
                icon="calendar"
              >
                {newTime.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Button>

              <Button
                mode="outlined"
                onPress={() => setShowTimePicker(true)}
                style={styles.dateTimeButton}
                icon="clock"
              >
                {newTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Button>
            </View>

            <Text style={styles.selectedTime}>
              New pickup time: {formatDateTime(newTime)}
            </Text>
          </View>

          {/* Reason Input */}
          <View style={styles.reasonSection}>
            <Text style={styles.sectionTitle}>Reason for Rescheduling</Text>
            <TextInput
              label="Please provide a reason"
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
              style={styles.reasonInput}
              placeholder="e.g., Traffic delay, emergency situation, donor requested change..."
              mode="outlined"
            />
            <Text style={styles.characterCount}>
              {reason.length}/200 characters
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={handleClose}
            style={styles.cancelButton}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleReschedule}
            style={styles.rescheduleButton}
            loading={loading}
            disabled={loading || reason.trim().length < 10}
          >
            Reschedule Task
          </Button>
        </View>

        {/* Date/Time Pickers */}
        {showDatePicker && (
          <DateTimePicker
            value={newTime}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={newTime}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3748',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  taskInfoCard: {
    marginBottom: 24,
    backgroundColor: '#F7FAFC',
  },
  taskInfo: {
    padding: 16,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  taskSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
  },
  currentTime: {
    fontSize: 14,
    color: '#4A5568',
    fontWeight: '500',
  },
  dateTimeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
  },
  dateTimeButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dateTimeButton: {
    flex: 1,
  },
  selectedTime: {
    fontSize: 14,
    color: '#4A5568',
    fontWeight: '500',
    textAlign: 'center',
    padding: 12,
    backgroundColor: '#E6FFFA',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  reasonSection: {
    marginBottom: 24,
  },
  reasonInput: {
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelButton: {
    flex: 1,
  },
  rescheduleButton: {
    flex: 2,
    backgroundColor: '#FF8A50',
  },
});
