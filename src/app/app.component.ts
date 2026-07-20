import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
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
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    this.themeService.init();

    this.authService.user$.pipe(
      filter(user => !!user)
    ).subscribe(() => {
      this.notificationService.initialize();
    });
  }
}
