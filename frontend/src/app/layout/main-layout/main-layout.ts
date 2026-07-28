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

  protected readonly expanded = signal(false);
  protected readonly settingsExpanded = signal(false);

  protected expand(): void {
    this.expanded.set(true);
  }

  protected collapse(): void {
    this.expanded.set(false);
  }

  protected onMouseLeave(event: MouseEvent): void {
    const sidebar = event.currentTarget as HTMLElement;

    if (sidebar.contains(document.activeElement)) {
      return;
    }

    this.collapse();
  }

  protected onFocusOut(event: FocusEvent): void {
    const sidebar = event.currentTarget as HTMLElement;
    const nextFocused = event.relatedTarget as Node | null;

    if (!nextFocused || !sidebar.contains(nextFocused)) {
      this.collapse();
    }
  }

  protected toggleSettings(): void {
    if (!this.expanded()) {
      this.expanded.set(true);
      this.settingsExpanded.set(true);
      return;
    }

    this.settingsExpanded.set(!this.settingsExpanded());
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
