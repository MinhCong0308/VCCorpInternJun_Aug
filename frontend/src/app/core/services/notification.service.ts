import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new Subject<Notification>();
  public notifications$ = this.notificationSubject.asObservable();

  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  show(notification: Omit<Notification, 'id'>): string {
    const id = this.generateId();
    const fullNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 5000
    };

    this.notificationSubject.next(fullNotification);
    return id;
  }

  success(title: string, message: string, duration?: number): string {
    console.log("I am being called");
    return this.show({
      type: 'success',
      title,
      message,
      duration
    });
  }

  error(title: string, message: string, actions?: NotificationAction[], duration?: number): string {
    return this.show({
      type: 'error',
      title,
      message,
      actions,
      duration: duration || 0 // Errors don't auto-dismiss by default
    });
  }

  warning(title: string, message: string, duration?: number): string {
    return this.show({
      type: 'warning',
      title,
      message,
      duration
    });
  }

  info(title: string, message: string, duration?: number): string {
    return this.show({
      type: 'info',
      title,
      message,
      duration
    });
  }

  confirm(title: string, message: string, onConfirm: () => void, onCancel?: () => void): string {
    return this.show({
      type: 'warning',
      title,
      message,
      duration: 0, // Don't auto-dismiss
      actions: [
        {
          label: 'Cancel',
          action: onCancel || (() => {}),
          style: 'secondary'
        },
        {
          label: 'Confirm',
          action: onConfirm,
          style: 'primary'
        }
      ]
    });
  }
}