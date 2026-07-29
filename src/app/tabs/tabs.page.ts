import { Component, EnvironmentInjector, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  mapOutline,
  searchOutline,
  notificationsOutline,
  personOutline,
  closeCircle,
  camera,
  images,
  location,
  locationOutline,
  warning,
  addCircle,
  addOutline,
  timeOutline,
  warningOutline,
  locate,
  navigateOutline,
  openOutline,
  sunnyOutline,
  moonOutline,
  phonePortraitOutline,
  refresh,
  checkmarkCircle,
  trash,
  notifications,
  createOutline,
  trashOutline,
} from 'ionicons/icons';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [CommonModule, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  unreadCount = 0;

  constructor() {
    addIcons({
      'map-outline': mapOutline,
      'search-outline': searchOutline,
      'notifications-outline': notificationsOutline,
      'person-outline': personOutline,
      'close-circle': closeCircle,
      'camera': camera,
      'images': images,
      'location': location,
      'location-outline': locationOutline,
      'warning': warning,
      'add-circle': addCircle,
      'add-outline': addOutline,
      'time-outline': timeOutline,
      'warning-outline': warningOutline,
      'locate': locate,
      'navigate-outline': navigateOutline,
      'open-outline': openOutline,
      'sunny-outline': sunnyOutline,
      'moon-outline': moonOutline,
      'phone-portrait-outline': phonePortraitOutline,
      'refresh': refresh,
      'checkmark-circle': checkmarkCircle,
      'trash': trash,
      'notifications': notifications,
      'create-outline': createOutline,
      'trash-outline': trashOutline,
    });

    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
      this.cdr.detectChanges();
    });
  }
}
