import AsyncStorage from '@react-native-async-storage/async-storage';
import { VolunteerTask, VolunteerStats, RescheduleRequest } from '../types/volunteer';

export class VolunteerStorageService {
  private static TASKS_KEY = '@volunteer_tasks';
  private static STATS_KEY = '@volunteer_stats';
  private static RESCHEDULE_KEY = '@volunteer_reschedules';

  // Task Management
  static async saveTasks(tasks: VolunteerTask[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.TASKS_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
      throw new Error('Failed to save tasks');
    }
  }

  static async getTasks(): Promise<VolunteerTask[]> {
    try {
      const tasksJson = await AsyncStorage.getItem(this.TASKS_KEY);
      return tasksJson ? JSON.parse(tasksJson) : this.getDefaultTasks();
    } catch (error) {
      console.error('Error getting tasks:', error);
      return this.getDefaultTasks();
    }
  }

  static async updateTaskStatus(taskId: string, status: VolunteerTask['status']): Promise<void> {
    try {
      const tasks = await this.getTasks();
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        tasks[taskIndex].status = status;
        await this.saveTasks(tasks);
        
        // Update stats if task completed
        if (status === 'completed') {
          await this.updateStatsOnCompletion(tasks[taskIndex]);
        }
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      throw new Error('Failed to update task status');
    }
  }

  static async addTask(task: VolunteerTask): Promise<void> {
    try {
      const tasks = await this.getTasks();
      tasks.push(task);
      await this.saveTasks(tasks);
    } catch (error) {
      console.error('Error adding task:', error);
      throw new Error('Failed to add task');
    }
  }

  // Stats Management
  static async getStats(): Promise<VolunteerStats> {
    try {
      const statsJson = await AsyncStorage.getItem(this.STATS_KEY);
      return statsJson ? JSON.parse(statsJson) : this.getDefaultStats();
    } catch (error) {
      console.error('Error getting stats:', error);
      return this.getDefaultStats();
    }
  }

  static async saveStats(stats: VolunteerStats): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Error saving stats:', error);
      throw new Error('Failed to save stats');
    }
  }

  private static async updateStatsOnCompletion(task: VolunteerTask): Promise<void> {
    const stats = await this.getStats();
    stats.completedTasks += 1;
    stats.totalDeliveries += 1;
    stats.mealsDelivered += parseInt(task.foodDetails.quantity) || 1;
    stats.totalHours += 2; // Estimated 2 hours per task
    stats.impactScore += this.calculateImpactScore(task);
    await this.saveStats(stats);
  }

  private static calculateImpactScore(task: VolunteerTask): number {
    const baseScore = 10;
    const priorityMultiplier = task.priority === 'high' ? 1.5 : task.priority === 'medium' ? 1.2 : 1;
    const quantityBonus = parseInt(task.foodDetails.quantity) || 1;
    return Math.floor(baseScore * priorityMultiplier * Math.log(quantityBonus + 1));
  }

  // Reschedule Management
  static async saveRescheduleRequest(request: RescheduleRequest): Promise<void> {
    try {
      const requests = await this.getRescheduleRequests();
      requests.push(request);
      await AsyncStorage.setItem(this.RESCHEDULE_KEY, JSON.stringify(requests));
    } catch (error) {
      console.error('Error saving reschedule request:', error);
      throw new Error('Failed to save reschedule request');
    }
  }

  static async getRescheduleRequests(): Promise<RescheduleRequest[]> {
    try {
      const requestsJson = await AsyncStorage.getItem(this.RESCHEDULE_KEY);
      return requestsJson ? JSON.parse(requestsJson) : [];
    } catch (error) {
      console.error('Error getting reschedule requests:', error);
      return [];
    }
  }

  // Default Data
  private static getDefaultStats(): VolunteerStats {
    return {
      completedTasks: 0,
      totalDeliveries: 0,
      mealsDelivered: 0,
      averageRating: 0,
      totalHours: 0,
      impactScore: 0,
    };
  }

  private static getDefaultTasks(): VolunteerTask[] {
    return [
      {
        id: '1',
        donorInfo: {
          name: 'Sunrise Bakery',
          address: '123 Main Street, Colombo 03',
          phone: '+94771234567',
          contactPerson: 'Mr. Silva',
        },
        ngoInfo: {
          name: 'Community Kitchen',
          address: '456 Hope Lane, Colombo 05',
          phone: '+94779876543',
          contactPerson: 'Ms. Perera',
        },
        foodDetails: {
          type: 'Fresh Bread & Pastries',
          quantity: '50 items',
          expiryTime: '2025-01-08T18:00:00Z',
          specialInstructions: 'Handle with care, keep at room temperature',
        },
        pickupTime: '2025-01-08T14:00:00Z',
        deliveryTime: '2025-01-08T16:00:00Z',
        status: 'assigned',
        priority: 'high',
        distance: '3.2 km',
        estimatedDuration: '25 mins',
      },
      {
        id: '2',
        donorInfo: {
          name: 'Green Valley Restaurant',
          address: '789 Galle Road, Colombo 06',
          phone: '+94712345678',
          contactPerson: 'Chef Kumar',
        },
        ngoInfo: {
          name: 'Helping Hands Foundation',
          address: '321 Charity Street, Colombo 04',
          phone: '+94708765432',
          contactPerson: 'Mrs. Fernando',
        },
        foodDetails: {
          type: 'Cooked Rice & Curry',
          quantity: '30 portions',
          expiryTime: '2025-01-08T20:00:00Z',
          specialInstructions: 'Keep warm, serve immediately',
        },
        pickupTime: '2025-01-08T17:00:00Z',
        deliveryTime: '2025-01-08T18:30:00Z',
        status: 'accepted',
        priority: 'medium',
        distance: '2.8 km',
        estimatedDuration: '20 mins',
      },
      {
        id: '3',
        donorInfo: {
          name: 'Fresh Market Supermarket',
          address: '555 Commercial Avenue, Colombo 07',
          phone: '+94723456789',
          contactPerson: 'Mr. Wickrama',
        },
        ngoInfo: {
          name: 'Children\'s Home',
          address: '999 Care Road, Colombo 08',
          phone: '+94717654321',
          contactPerson: 'Sister Mary',
        },
        foodDetails: {
          type: 'Fresh Vegetables & Fruits',
          quantity: '25 kg',
          expiryTime: '2025-01-09T12:00:00Z',
          specialInstructions: 'Sort and check for quality',
        },
        pickupTime: '2025-01-08T10:00:00Z',
        deliveryTime: '2025-01-08T11:30:00Z',
        status: 'completed',
        priority: 'low',
        distance: '4.1 km',
        estimatedDuration: '30 mins',
      },
    ];
  }
}
