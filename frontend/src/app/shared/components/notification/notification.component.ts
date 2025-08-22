import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html', 
  styleUrl: './notification.component.css'
})
export class NotificationComponent implements OnInit, OnDestroy {
  activeNotifications: Notification[] = [];
  private subscription: Subscription = new Subscription();
  private timers: Map<string, any> = new Map();

  constructor(private notificationService: NotificationService) {
    console.log('NotificationComponent created'); // Debug log
  }

  ngOnInit(): void {
    console.log('NotificationComponent ngOnInit'); // Debug log
    this.subscription = this.notificationService.notifications$.subscribe(
      (notification) => {
        console.log('Notification received:', notification); // Debug log
        this.addNotification(notification);
      }
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.timers.forEach(timer => clearTimeout(timer));
  }

  private addNotification(notification: Notification): void {
    console.log('Adding notification:', notification); // Debug log
    this.activeNotifications.push(notification);
    console.log('Active notifications count:', this.activeNotifications.length); // Debug log

    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        this.dismissNotification(notification.id);
      }, notification.duration);
      
      this.timers.set(notification.id, timer);
    }
  }

  dismissNotification(id: string): void {
    console.log('Dismissing notification:', id); // Debug log
    this.activeNotifications = this.activeNotifications.filter(n => n.id !== id);
    
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  executeAction(action: any, notificationId: string): void {
    action.action();
    this.dismissNotification(notificationId);
  }

  getIconClass(type: string): string {
    switch (type) {
      case 'success': return 'fas fa-check-circle';
      case 'error': return 'fas fa-exclamation-circle';
      case 'warning': return 'fas fa-exclamation-triangle';
      case 'info': return 'fas fa-info-circle';
      default: return 'fas fa-bell';
    }
  }
}