import { useState, useEffect, useCallback } from 'react';
import { VolunteerTask, VolunteerStats, TaskFilter } from '../types/volunteer';
import { VolunteerStorageService } from '../services/volunteerStorage';
import { VolunteerApi } from '../services/volunteerApi';
import { NotificationService } from '../services/notificationService';

export function useVolunteerTasks() {
  const [tasks, setTasks] = useState<VolunteerTask[]>([]);
  const [stats, setStats] = useState<VolunteerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load tasks from backend (if configured) or storage fallback
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let savedTasks: VolunteerTask[] = [];
      let savedStats: VolunteerStats | null = null;

      if (VolunteerApi.isEnabled()) {
        [savedTasks, savedStats] = await Promise.all([
          VolunteerApi.getTasks(),
          VolunteerApi.getStats(),
        ]);
      } else {
        [savedTasks, savedStats] = await Promise.all([
          VolunteerStorageService.getTasks(),
          VolunteerStorageService.getStats(),
        ]);
      }
      
      setTasks(savedTasks);
      setStats(savedStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tasks';
      setError(errorMessage);
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh tasks (pull-to-refresh)
  const refreshTasks = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadTasks();
    } catch (err) {
      console.error('Error refreshing tasks:', err);
    } finally {
      setRefreshing(false);
    }
  }, [loadTasks]);

  // Accept a task
  const acceptTask = useCallback(async (taskId: string) => {
    try {
      setError(null);
      if (VolunteerApi.isEnabled()) {
        await VolunteerApi.updateTaskStatus(taskId, 'accepted');
      } else {
        await VolunteerStorageService.updateTaskStatus(taskId, 'accepted');
      }
      
      // Find the task and schedule reminder
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await NotificationService.scheduleTaskReminder(task, 30);
        await NotificationService.notifyTaskStatusUpdate(task, 'accepted');
      }
      
      await loadTasks(); // Refresh tasks
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept task';
      setError(errorMessage);
      console.error('Error accepting task:', err);
    }
  }, [tasks, loadTasks]);

  // Mark task as in progress
  const startTask = useCallback(async (taskId: string) => {
    try {
      setError(null);
      if (VolunteerApi.isEnabled()) {
        await VolunteerApi.updateTaskStatus(taskId, 'in_progress');
      } else {
        await VolunteerStorageService.updateTaskStatus(taskId, 'in_progress');
      }
      
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await NotificationService.notifyTaskStatusUpdate(task, 'in_progress');
      }
      
      await loadTasks();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start task';
      setError(errorMessage);
      console.error('Error starting task:', err);
    }
  }, [tasks, loadTasks]);

  // Complete a task
  const completeTask = useCallback(async (taskId: string) => {
    try {
      setError(null);
      if (VolunteerApi.isEnabled()) {
        await VolunteerApi.updateTaskStatus(taskId, 'completed');
      } else {
        await VolunteerStorageService.updateTaskStatus(taskId, 'completed');
      }
      
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await NotificationService.notifyTaskStatusUpdate(task, 'completed', 'Great job! Task completed successfully.');
        await NotificationService.cancelTaskNotifications(taskId);
      }
      
      await loadTasks();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete task';
      setError(errorMessage);
      console.error('Error completing task:', err);
    }
  }, [tasks, loadTasks]);

  // Cancel a task
  const cancelTask = useCallback(async (taskId: string, reason?: string) => {
    try {
      setError(null);
      if (VolunteerApi.isEnabled()) {
        await VolunteerApi.updateTaskStatus(taskId, 'cancelled');
      } else {
        await VolunteerStorageService.updateTaskStatus(taskId, 'cancelled');
      }
      
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await NotificationService.notifyTaskStatusUpdate(task, 'cancelled', reason);
        await NotificationService.cancelTaskNotifications(taskId);
      }
      
      await loadTasks();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel task';
      setError(errorMessage);
      console.error('Error cancelling task:', err);
    }
  }, [tasks, loadTasks]);

  // Filter tasks
  const getFilteredTasks = useCallback((filter: TaskFilter = {}) => {
    let filteredTasks = [...tasks];

    if (filter.status) {
      filteredTasks = filteredTasks.filter(task => task.status === filter.status);
    }

    if (filter.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === filter.priority);
    }

    if (filter.dateRange) {
      filteredTasks = filteredTasks.filter(task => {
        const taskDate = new Date(task.pickupTime);
        return taskDate >= filter.dateRange!.start && taskDate <= filter.dateRange!.end;
      });
    }

    return filteredTasks;
  }, [tasks]);

  // Get tasks by status
  const getTasksByStatus = useCallback((status: VolunteerTask['status']) => {
    return tasks.filter(task => task.status === status);
  }, [tasks]);

  // Get urgent tasks (high priority or expiring soon)
  const getUrgentTasks = useCallback(() => {
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    return tasks.filter(task => {
      const isHighPriority = task.priority === 'high';
      const isExpiringSoon = new Date(task.foodDetails.expiryTime) <= twoHoursFromNow;
      const isActive = ['assigned', 'accepted', 'in_progress'].includes(task.status);
      
      return isActive && (isHighPriority || isExpiringSoon);
    });
  }, [tasks]);

  // Get today's tasks
  const getTodaysTasks = useCallback(() => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    return tasks.filter(task => {
      const taskDate = new Date(task.pickupTime);
      return taskDate >= startOfDay && taskDate < endOfDay;
    });
  }, [tasks]);

  // Initialize on mount
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return {
    // Data
    tasks,
    stats,
    
    // Loading states
    loading,
    error,
    refreshing,
    
    // Actions
    loadTasks,
    refreshTasks,
    acceptTask,
    startTask,
    completeTask,
    cancelTask,
    
    // Filtering
    getFilteredTasks,
    getTasksByStatus,
    getUrgentTasks,
    getTodaysTasks,
    
    // Computed values
    activeTasks: getTasksByStatus('assigned'),
    acceptedTasks: getTasksByStatus('accepted'),
    inProgressTasks: getTasksByStatus('in_progress'),
    completedTasks: getTasksByStatus('completed'),
    urgentTasks: getUrgentTasks(),
    todaysTasks: getTodaysTasks(),
  };
}
