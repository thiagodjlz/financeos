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

  protected toggleCollapsed(): void {
    this.collapsed.set(!this.collapsed());
  }

  protected toggleRegisters(): void {
    this.registersExpanded.set(!this.registersExpanded());
  }

  protected isRegistersActive(): boolean {
    return this.router.url.startsWith('/categories');
  }

  protected logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
