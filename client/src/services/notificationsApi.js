// Re-export existing inventory notifications API (typo in folder name kept in project)
import * as notif from './inventoty/notificationsApi';
export const fetchNotifications = notif.fetchNotifications;
export const markNotificationRead = notif.markNotificationRead;
export const markAllRead = notif.markAllRead;
export const createNotification = notif.createNotification;
export const deleteNotification = notif.deleteNotification;
