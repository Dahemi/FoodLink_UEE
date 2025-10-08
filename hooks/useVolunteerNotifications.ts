import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { NotificationService } from '../services/notificationService';

export function useVolunteerNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Initialize notification service
    const initializeNotifications = async () => {
      try {
        const token = await NotificationService.initialize();
        setExpoPushToken(token);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initializeNotifications();

    // Handle notifications received while app is in foreground
    const notificationListener = NotificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received in foreground:', notification);
        
        // You can show custom in-app notification here if needed
        const { type, taskId } = notification.request.content.data || {};
        
        if (type === 'task_reminder' && taskId) {
          // Could show a custom modal or toast
          console.log(`Task reminder for task ${taskId}`);
        }
      }
    );

    // Handle notification tapped (app opened from notification)
    const responseListener = NotificationService.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
        
        const { type, taskId } = response.notification.request.content.data || {};
        
        // Navigate based on notification type
        if (taskId) {
          switch (type) {
            case 'new_task':
            case 'task_reminder':
            case 'status_update':
              // Navigate to task detail screen
              router.push(`/volunteer/task-detail?taskId=${taskId}`);
              break;
            case 'schedule_change':
              // Navigate to schedule screen
              router.push('/volunteer/schedule');
              break;
            default:
              // Navigate to dashboard
              router.push('/volunteer/dashboard');
              break;
          }
        } else {
          // Default navigation to volunteer dashboard
          router.push('/volunteer/dashboard');
        }
      }
    );

    // Cleanup listeners
    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, [router]);

  // Schedule task reminder
  const scheduleTaskReminder = async (task: any, minutesBefore: number = 30) => {
    if (!isInitialized) {
      console.warn('Notification service not initialized');
      return null;
    }

    try {
      return await NotificationService.scheduleTaskReminder(task, minutesBefore);
    } catch (error) {
      console.error('Failed to schedule task reminder:', error);
      return null;
    }
  };

  // Send new task notification
  const notifyNewTask = async (task: any) => {
    if (!isInitialized) {
      console.warn('Notification service not initialized');
      return;
    }

    try {
      await NotificationService.notifyNewTaskAssigned(task);
    } catch (error) {
      console.error('Failed to send new task notification:', error);
    }
  };

  // Send status update notification
  const notifyStatusUpdate = async (task: any, status: string, message?: string) => {
    if (!isInitialized) {
      console.warn('Notification service not initialized');
      return;
    }

    try {
      await NotificationService.notifyTaskStatusUpdate(task, status, message);
    } catch (error) {
      console.error('Failed to send status update notification:', error);
    }
  };

  // Send schedule change notification
  const notifyScheduleChange = async (task: any, changeType: 'reschedule' | 'cancellation', newTime?: string) => {
    if (!isInitialized) {
      console.warn('Notification service not initialized');
      return;
    }

    try {
      await NotificationService.notifyScheduleChange(task, changeType, newTime);
    } catch (error) {
      console.error('Failed to send schedule change notification:', error);
    }
  };

  // Cancel task notifications
  const cancelTaskNotifications = async (taskId: string) => {
    if (!isInitialized) {
      console.warn('Notification service not initialized');
      return;
    }

    try {
      await NotificationService.cancelTaskNotifications(taskId);
    } catch (error) {
      console.error('Failed to cancel task notifications:', error);
    }
  };

  // Get scheduled notifications
  const getScheduledNotifications = async () => {
    if (!isInitialized) {
      console.warn('Notification service not initialized');
      return [];
    }

    try {
      return await NotificationService.getScheduledNotifications();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  };

  return {
    expoPushToken,
    isInitialized,
    scheduleTaskReminder,
    notifyNewTask,
    notifyStatusUpdate,
    notifyScheduleChange,
    cancelTaskNotifications,
    getScheduledNotifications,
  };
}
