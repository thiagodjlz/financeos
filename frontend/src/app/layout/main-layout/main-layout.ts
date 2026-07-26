import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { APP_NAME, APP_VERSION } from '../../core/version';

@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {
  protected readonly authService = inject(AuthService);
  protected readonly router = inject(Router);

  protected readonly appName = APP_NAME;
  protected readonly appVersion = APP_VERSION;

  protected readonly collapsed = signal(false);
  protected readonly registersExpanded = signal(false);
  protected readonly settingsExpanded = signal(false);

  protected toggleCollapsed(): void {
    this.collapsed.set(!this.collapsed());
  }

  protected toggleRegisters(): void {
    if (this.collapsed()) {
      this.collapsed.set(false);
      this.registersExpanded.set(true);
      return;
    }

    this.registersExpanded.set(!this.registersExpanded());
  }

  protected toggleSettings(): void {
    if (this.collapsed()) {
      this.collapsed.set(false);
      this.settingsExpanded.set(true);
      return;
    }

    this.settingsExpanded.set(!this.settingsExpanded());
  }

  protected isRegistersActive(): boolean {
    return this.router.url.startsWith('/categories');
  }

  protected isSettingsActive(): boolean {
    return this.router.url.startsWith('/users') || this.router.url.startsWith('/profiles');
  }

  protected canSeeSettings(): boolean {
    return this.authService.can('USERS', 'VIEW') || this.authService.can('PROFILES', 'VIEW');
  }

  protected logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
