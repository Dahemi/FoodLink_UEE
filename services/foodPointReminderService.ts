import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationService } from './notificationService';

export interface FoodPointReminderMeta {
  id: string;
  name?: string;
  address?: string;
  nextPickup?: string | null;
  enabled?: boolean;
  minutesFromNow?: number;
}

const META_KEY = '@foodpoint_reminders_meta';

export class FoodPointReminderService {
  static async getSavedReminders(): Promise<Record<string, FoodPointReminderMeta>> {
    try {
      const raw = await AsyncStorage.getItem(META_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.error('FoodPointReminderService.getSavedReminders', err);
      return {};
    }
  }

  static async saveMetaEntry(entry: FoodPointReminderMeta): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(META_KEY);
      const map: Record<string, FoodPointReminderMeta> = raw ? JSON.parse(raw) : {};
      map[entry.id] = { ...(map[entry.id] || {}), ...entry };
      await AsyncStorage.setItem(META_KEY, JSON.stringify(map));
    } catch (err) {
      console.error('FoodPointReminderService.saveMetaEntry', err);
    }
  }

  static async toggleReminder(
    meta: FoodPointReminderMeta,
    enable: boolean,
    minutesFromNow = 30
  ): Promise<string | null> {
    // Persist meta first (so UI updates)
    await this.saveMetaEntry({ ...meta, enabled: enable, minutesFromNow });

    if (enable) {
      // Schedules via the shared NotificationService
      return await NotificationService.scheduleFoodPointReminder(
        { id: meta.id, name: meta.name, address: meta.address, nextPickup: meta.nextPickup ?? null },
        minutesFromNow
      );
    } else {
      await NotificationService.cancelRemindersForFoodPoint(meta.id);
      return null;
    }
  }
}