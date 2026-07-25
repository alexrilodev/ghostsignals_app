import { Component, EnvironmentInjector, inject } from '@angular/core';
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
  unreadCount = 0;

  constructor() {
    addIcons({
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
    });

    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
  }
}
