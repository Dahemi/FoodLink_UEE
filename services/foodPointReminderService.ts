import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface FoodPointReminderMeta {
  id: string;
  name?: string;
  address?: string;
  nextPickup?: string | null;
  enabled?: boolean;
  minutesFromNow?: number;
}

const META_KEY = '@foodpoint_reminders_meta';
const REMINDERS_KEY = '@foodpoint_reminders_ids';

export class FoodPointReminderService {
  /**
   * Return persisted reminder metadata map (id -> meta)
   */
  static async getSavedReminders(): Promise<Record<string, FoodPointReminderMeta>> {
    try {
      const raw = await AsyncStorage.getItem(META_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.error('FoodPointReminderService.getSavedReminders', err);
      return {};
    }
  }

  /**
   * Save or update a single reminder meta entry
   */
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

  /**
   * Schedule a local notification for a food point and persist the notification id(s).
   * Returns the scheduled notification id (string) or null (e.g. Expo Go).
   */
  static async scheduleReminder(
    meta: FoodPointReminderMeta,
    minutesFromNow: number = 30
  ): Promise<string | null> {
    // In Expo Go local scheduling may be unreliable — still persist meta for UI
    if (Constants.appOwnership === 'expo') {
      console.warn('Running in Expo Go — skipping actual scheduling, persisting meta only');
      await this.saveMetaEntry({ ...meta, enabled: true, minutesFromNow });
      return null;
    }

    try {
      const triggerDate = new Date(Date.now() + minutesFromNow * 60000);

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Reminder: ${meta.name ?? 'Food Point'}`,
          body: meta.address ? `${meta.name || 'Food Point'} — ${meta.address}` : (meta.name || 'Food Point'),
          data: { type: 'foodpoint_reminder', foodPointId: meta.id },
          sound: 'default',
        },
        trigger: triggerDate,
      });

      // persist mapping id -> [notificationIds]
      try {
        const raw = await AsyncStorage.getItem(REMINDERS_KEY);
        const map: Record<string, string[]> = raw ? JSON.parse(raw) : {};
        map[meta.id] = map[meta.id] ? [...map[meta.id], id] : [id];
        await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(map));
      } catch (e) {
        console.warn('FoodPointReminderService: failed to persist notification id', e);
      }

      // update meta as enabled
      await this.saveMetaEntry({ ...meta, enabled: true, minutesFromNow });

      return id;
    } catch (err) {
      console.error('FoodPointReminderService.scheduleReminder', err);
      return null;
    }
  }

  /**
   * Cancel all scheduled reminders for a food point and remove persisted ids.
   */
  static async cancelRemindersForFoodPoint(foodPointId: string): Promise<void> {
    // If Expo Go, just update meta
    if (Constants.appOwnership === 'expo') {
      try {
        const rawMeta = await AsyncStorage.getItem(META_KEY);
        const meta = rawMeta ? JSON.parse(rawMeta) : {};
        if (meta[foodPointId]) {
          meta[foodPointId].enabled = false;
          await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
        }
      } catch (e) {
        console.warn('FoodPointReminderService.cancelRemindersForFoodPoint (expo) failed', e);
      }
      return;
    }

    try {
      const raw = await AsyncStorage.getItem(REMINDERS_KEY);
      if (raw) {
        const map: Record<string, string[]> = JSON.parse(raw);
        const ids = map[foodPointId] || [];
        for (const nid of ids) {
          try {
            await Notifications.cancelScheduledNotificationAsync(nid);
          } catch (e) {
            console.warn('Failed to cancel scheduled notification id', nid, e);
          }
        }
        delete map[foodPointId];
        await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(map));
      }

      // mark meta disabled
      try {
        const rawMeta = await AsyncStorage.getItem(META_KEY);
        const meta = rawMeta ? JSON.parse(rawMeta) : {};
        if (meta[foodPointId]) {
          meta[foodPointId].enabled = false;
          await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
        }
      } catch (e) {
        console.warn('FoodPointReminderService: failed to update meta after cancel', e);
      }
    } catch (err) {
      console.error('FoodPointReminderService.cancelRemindersForFoodPoint', err);
    }
  }

  /**
   * Toggle reminder state for a food point. If enabling, schedule; if disabling, cancel.
   * Returns scheduled notification id when enabling, null otherwise.
   */
  static async toggleReminder(
    meta: FoodPointReminderMeta,
    enable: boolean,
    minutesFromNow = 30
  ): Promise<string | null> {
    // persist meta immediately so UI updates
    await this.saveMetaEntry({ ...meta, enabled: enable, minutesFromNow });

    if (enable) {
      return await this.scheduleReminder(meta, minutesFromNow);
    } else {
      await this.cancelRemindersForFoodPoint(meta.id);
      return null;
    }
  }
}