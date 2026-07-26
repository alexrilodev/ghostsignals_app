import { Injectable, NgZone, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Router } from '@angular/router';
import { Geolocation } from '@capacitor/geolocation';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

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

  private authService = inject(AuthService);
  private supabaseUrl = environment.supabase.url;
  private supabaseKey = environment.supabase.anonKey;
  private listenersInitialized = false;

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
      if (!this.listenersInitialized) {
        this.setupListeners();
      }
      this.fetchServerNotifications();
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  private async getCurrentPosition(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      if (Capacitor.isNativePlatform()) {
        const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        return { latitude: position.coords.latitude, longitude: position.coords.longitude };
      } else {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        });
      }
    } catch {
      return null;
    }
  }

  private async setupListeners(): Promise<void> {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token:', token.value);
      const position = await this.getCurrentPosition();
      this.sendTokenToServer(token.value, position?.latitude, position?.longitude);
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

    this.listenersInitialized = true;
  }

  private async fetchServerNotifications(): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) return;

    try {
      const response = await fetch(
        `${this.supabaseUrl}/rest/v1/notifications?user_id=eq.${user.uid}&read=eq.false&order=created_at.desc`,
        {
          headers: {
            apikey: this.supabaseKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) return;

      const data = await response.json();
      if (!data || data.length === 0) return;

      const existing = this.notificationsSubject.value;
      const existingIds = new Set(existing.map(n => n.id));
      const existingSignalIds = new Set(existing.filter(n => n.signalId).map(n => n.signalId));

      for (const notif of data) {
        if (!existingIds.has(notif.id) && (!notif.signal_id || !existingSignalIds.has(notif.signal_id))) {
          const appNotification: AppNotification = {
            id: notif.id,
            title: notif.title,
            body: notif.body,
            signalId: notif.signal_id,
            receivedAt: new Date(notif.created_at),
            read: notif.read,
          };
          const current = this.notificationsSubject.value;
          this.notificationsSubject.next([appNotification, ...current]);
          this.unreadCountSubject.next(
            this.notificationsSubject.value.filter(n => !n.read).length
          );
        }
      }

      this.saveNotifications(this.notificationsSubject.value);

      const ids = data.map((n: any) => n.id);
      if (ids.length > 0) {
        await fetch(
          `${this.supabaseUrl}/rest/v1/notifications?id=in.(${ids.join(',')})`,
          {
            method: 'PATCH',
            headers: {
              apikey: this.supabaseKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ read: true }),
          }
        );
      }
    } catch (error) {
      console.error('Error fetching server notifications:', error);
    }
  }

  private async loadDeliveredNotifications(): Promise<void> {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const delivered = await PushNotifications.getDeliveredNotifications();

      if (delivered?.notifications && delivered.notifications.length > 0) {
        const existing = this.notificationsSubject.value;
        const existingIds = new Set(existing.map(n => n.id));
        const existingSignalIds = new Set(existing.filter(n => n.signalId).map(n => n.signalId));

        for (const notif of delivered.notifications) {
          const id = notif.id?.toString() || '';
          const signalId = notif.data?.['signalId'];
          if (!existingIds.has(id) && (!signalId || !existingSignalIds.has(signalId))) {
            const appNotification: AppNotification = {
              id,
              title: notif.title || notif.data?.['title'] || 'Nueva notificación',
              body: notif.body || notif.data?.['body'] || '',
              signalId: notif.data?.['signalId'],
              receivedAt: new Date(),
              read: false,
            };
            this.addNotification(appNotification);
          }
        }

        PushNotifications.removeAllDeliveredNotifications();
      }
    } catch (error) {
      console.error('Error loading delivered notifications:', error);
    }
  }

  private handleForegroundNotification(notification: any): void {
    const appNotification: AppNotification = {
      id: notification.id?.toString() || Date.now().toString(),
      title: notification.title || notification.data?.['title'] || 'Nueva notificación',
      body: notification.body || notification.data?.['body'] || '',
      signalId: notification.data?.['signalId'],
      receivedAt: new Date(),
      read: false,
    };

    this.addNotification(appNotification);
  }

  private handleNotificationAction(action: any): void {
    const notification = action.notification;
    const signalId = notification.data?.['signalId'];

    const appNotification: AppNotification = {
      id: notification.id?.toString() || Date.now().toString(),
      title: notification.title || notification.data?.['title'] || 'Nueva notificación',
      body: notification.body || notification.data?.['body'] || '',
      signalId,
      receivedAt: new Date(),
      read: false,
    };
    this.addNotification(appNotification);

    if (signalId) {
      this.router.navigate(['/tabs/mapa'], { queryParams: { signalId } });
    }
  }

  private async sendTokenToServer(token: string, latitude?: number, longitude?: number): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) return;

    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/rpc/save_push_token`, {
        method: 'POST',
        headers: {
          apikey: this.supabaseKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          p_user_id: user.uid,
          p_token: token,
          p_platform: Capacitor.getPlatform(),
          p_latitude: latitude ?? null,
          p_longitude: longitude ?? null,
        }),
      });

      if (response.ok) {
        console.log('Push token saved successfully');
      } else {
        const error = await response.text();
        console.error('Error saving push token:', error);
      }
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  async removeTokenFromServer(): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) return;

    try {
      await fetch(`${this.supabaseUrl}/rest/v1/rpc/delete_push_tokens`, {
        method: 'POST',
        headers: {
          apikey: this.supabaseKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_user_id: user.uid }),
      });
    } catch (error) {
      console.error('Error removing push tokens:', error);
    }
  }

  private addNotification(notification: AppNotification): void {
    const current = this.notificationsSubject.value;
    if (current.some(n => n.id === notification.id)) return;
    if (notification.signalId && current.some(n => n.signalId === notification.signalId)) return;
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
