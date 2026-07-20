import { Component, EnvironmentInjector, inject } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
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

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);

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
  }
}
