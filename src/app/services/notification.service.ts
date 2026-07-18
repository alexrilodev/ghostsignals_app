import { Injectable, NgZone } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  signalId?: string;
  receivedAt: Date;
  read: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  public notifications$: Observable<AppNotification[]> = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$: Observable<number> = this.unreadCountSubject.asObservable();

  constructor(
    private router: Router,
    private ngZone: NgZone
  ) {
    this.loadNotifications();
  }

  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.warn('Push notifications only available on native devices');
      return;
    }

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');

      const permission = await PushNotifications.requestPermissions();
      if (permission.receive !== 'granted') {
        console.warn('Push notification permission denied');
        return;
      }

      await PushNotifications.register();
      this.setupListeners();
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  private async setupListeners(): Promise<void> {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration success, token:', token.value);
      this.sendTokenToServer(token.value);
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error:', error);
    });

    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification) => {
        this.ngZone.run(() => {
          this.handleForegroundNotification(notification);
        });
      }
    );

    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action) => {
        this.ngZone.run(() => {
          this.handleNotificationAction(action);
        });
      }
    );
  }

  private handleForegroundNotification(notification: any): void {
    const appNotification: AppNotification = {
      id: notification.id?.toString() || Date.now().toString(),
      title: notification.title || 'Nueva notificación',
      body: notification.body || '',
      signalId: notification.data?.['signalId'],
      receivedAt: new Date(),
      read: false,
    };

    this.addNotification(appNotification);
  }

  private handleNotificationAction(action: any): void {
    const notification = action.notification;
    const signalId = notification.data?.['signalId'];

    if (signalId) {
      this.router.navigate(['/tabs/mapa'], { queryParams: { signalId } });
    }
  }

  private async sendTokenToServer(token: string): Promise<void> {
    console.log('Token to send to server:', token);
  }

  private addNotification(notification: AppNotification): void {
    const current = this.notificationsSubject.value;
    const updated = [notification, ...current];
    this.notificationsSubject.next(updated);
    this.unreadCountSubject.next(updated.filter(n => !n.read).length);
    this.saveNotifications(updated);
  }

  markAsRead(notificationId: string): void {
    const current = this.notificationsSubject.value;
    const updated = current.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    this.notificationsSubject.next(updated);
    this.unreadCountSubject.next(updated.filter(n => !n.read).length);
    this.saveNotifications(updated);
  }

  markAllAsRead(): void {
    const current = this.notificationsSubject.value;
    const updated = current.map(n => ({ ...n, read: true }));
    this.notificationsSubject.next(updated);
    this.unreadCountSubject.next(0);
    this.saveNotifications(updated);
  }

  clearAll(): void {
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
    localStorage.removeItem('ghostsignals_notifications');
  }

  private loadNotifications(): void {
    try {
      const stored = localStorage.getItem('ghostsignals_notifications');
      if (stored) {
        const notifications: AppNotification[] = JSON.parse(stored);
        this.notificationsSubject.next(notifications);
        this.unreadCountSubject.next(notifications.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  private saveNotifications(notifications: AppNotification[]): void {
    try {
      localStorage.setItem('ghostsignals_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }
}
