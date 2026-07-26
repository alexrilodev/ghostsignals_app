import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { App } from '@capacitor/app';
import { AuthService } from './services/auth.service';
import { NotificationService } from './services/notification.service';
import { ThemeService } from './services/theme.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private themeService: ThemeService,
    private location: Location,
    private router: Router
  ) {}

  ngOnInit() {
    this.themeService.init();

    this.authService.user$.pipe(
      filter(user => !!user)
    ).subscribe(() => {
      this.notificationService.initialize();
    });

    this.setupBackButton();
  }

  private setupBackButton() {
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        this.location.back();
      } else {
        this.router.navigateByUrl('/tabs/mapa');
      }
    });
  }
}
