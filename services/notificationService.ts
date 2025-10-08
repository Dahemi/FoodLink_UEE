import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { VolunteerTask } from '../types/volunteer';

// Configure notification behavior (only if not in Expo Go)
if (Constants.appOwnership !== 'expo') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export class NotificationService {
  private static isInitialized = false;

  /**
   * Initialize notification service and request permissions
   */
  static async initialize(): Promise<string | null> {
    if (this.isInitialized) {
      return null;
    }

    // Skip notifications in Expo Go as they're not fully supported
    if (Constants.appOwnership === 'expo') {
      console.log('Running in Expo Go - notifications disabled');
      this.isInitialized = true;
      return null;
    }

    try {
      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('volunteer-tasks', {
          name: 'Volunteer Tasks',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF8A50',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('task-reminders', {
          name: 'Task Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF8A50',
          sound: 'default',
        });
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('Push notification permissions not granted');
        this.isInitialized = true; // Mark as initialized even without permissions
        return null;
      }

      // Get push token (for production use) - handle gracefully
      try {
        const token = (await Notifications.getExpoPushTokenAsync({
          projectId: 'foodlink-volunteer-app'
        })).data;
        this.isInitialized = true;
        return token;
      } catch (tokenError) {
        console.warn('Could not get push token, continuing without notifications:', tokenError);
        this.isInitialized = true;
        return null;
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
      this.isInitialized = true; // Mark as initialized to prevent retry loops
      return null;
    }
  }

  /**
   * Schedule a reminder notification for an upcoming task
   */
  static async scheduleTaskReminder(task: VolunteerTask, minutesBefore: number = 30): Promise<string | null> {
    // Skip notifications in Expo Go
    if (Constants.appOwnership === 'expo') {
      return null;
    }

    try {
      const pickupTime = new Date(task.pickupTime);
      const reminderTime = new Date(pickupTime.getTime() - minutesBefore * 60000);
      
      // Don't schedule if reminder time is in the past
      if (reminderTime <= new Date()) {
        console.warn('Reminder time is in the past, skipping notification');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚚 Pickup Reminder',
          body: `Pickup from ${task.donorInfo.name} in ${minutesBefore} minutes`,
          data: { 
            taskId: task.id,
            type: 'task_reminder',
            donorName: task.donorInfo.name,
            pickupTime: task.pickupTime,
          },
          sound: 'default',
        },
        trigger: reminderTime,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling task reminder:', error);
      return null;
    }
  }

  /**
   * Send immediate notification for new task assignment
   */
  static async notifyNewTaskAssigned(task: VolunteerTask): Promise<void> {
    // Skip notifications in Expo Go
    if (Constants.appOwnership === 'expo') {
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📋 New Task Assigned',
          body: `Pickup from ${task.donorInfo.name} - ${task.foodDetails.type}`,
          data: { 
            taskId: task.id,
            type: 'new_task',
            priority: task.priority,
          },
          sound: 'default',
        },
        trigger: null, // Immediate
      });
    } catch (error) {
      console.error('Error sending new task notification:', error);
    }
  }

  /**
   * Send notification for task status updates
   */
  static async notifyTaskStatusUpdate(task: VolunteerTask, newStatus: string, message?: string): Promise<void> {
    // Skip notifications in Expo Go
    if (Constants.appOwnership === 'expo') {
      return;
    }

    try {
      const statusMessages = {
        accepted: '✅ Task Accepted',
        in_progress: '🚚 Task In Progress',
        completed: '🎉 Task Completed',
        cancelled: '❌ Task Cancelled',
        rescheduled: '📅 Task Rescheduled',
      };

      const title = statusMessages[newStatus as keyof typeof statusMessages] || 'Task Update';
      const body = message || `Task ${task.id} status updated to ${newStatus}`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { 
            taskId: task.id,
            type: 'status_update',
            newStatus,
          },
          sound: 'default',
        },
        trigger: null, // Immediate
      });
    } catch (error) {
      console.error('Error sending status update notification:', error);
    }
  }

  /**
   * Send notification for schedule changes
   */
  static async notifyScheduleChange(task: VolunteerTask, changeType: 'reschedule' | 'cancellation', newTime?: string): Promise<void> {
    // Skip notifications in Expo Go
    if (Constants.appOwnership === 'expo') {
      return;
    }

    try {
      let title: string;
      let body: string;

      if (changeType === 'reschedule' && newTime) {
        title = '📅 Schedule Changed';
        body = `Task rescheduled to ${new Date(newTime).toLocaleString()}`;
      } else {
        title = '❌ Task Cancelled';
        body = `Pickup from ${task.donorInfo.name} has been cancelled`;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { 
            taskId: task.id,
            type: 'schedule_change',
            changeType,
            newTime,
          },
          sound: 'default',
        },
        trigger: null, // Immediate
      });
    } catch (error) {
      console.error('Error sending schedule change notification:', error);
    }
  }

  /**
   * Cancel a scheduled notification
   */
  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  /**
   * Cancel all notifications for a specific task
   */
  static async cancelTaskNotifications(taskId: string): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduledNotifications) {
        if (notification.content.data?.taskId === taskId) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    } catch (error) {
      console.error('Error cancelling task notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Handle notification received while app is in foreground
   */
  static addNotificationReceivedListener(handler: (notification: Notifications.Notification) => void): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(handler);
  }

  /**
   * Handle notification tapped (app opened from notification)
   */
  static addNotificationResponseReceivedListener(handler: (response: Notifications.NotificationResponse) => void): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(handler);
  }
}
