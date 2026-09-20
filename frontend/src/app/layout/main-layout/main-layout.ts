import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  Injector,
  OnDestroy,
  ViewChild,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { APP_NAME, APP_VERSION } from '../../core/version';

type NavGroup = 'registers' | 'settings';

const DRAWER_OPEN_CLASS = 'drawer-open';
const FOCUSABLE_SELECTOR = 'button:not([disabled]), a[href], input, select, [tabindex]:not([tabindex="-1"])';

@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout implements OnDestroy {
  protected readonly authService = inject(AuthService);
  protected readonly router = inject(Router);
  private readonly injector = inject(Injector);

  protected readonly appName = APP_NAME;
  protected readonly appVersion = APP_VERSION;

  protected readonly expanded = signal(false);
  protected readonly openGroup = signal<NavGroup | null>(null);
  protected readonly drawerOpen = signal(false);

  @ViewChild('workspace') private workspace?: ElementRef<HTMLElement>;
  @ViewChild('drawer') private drawer?: ElementRef<HTMLElement>;
  @ViewChild('menuButton') private menuButton?: ElementRef<HTMLButtonElement>;

  ngOnDestroy(): void {
    this.unlockBackground();
  }

  protected toggleDrawer(): void {
    if (this.drawerOpen()) {
      this.closeDrawer(true);
      return;
    }

    this.drawerOpen.set(true);
    document.body.classList.add(DRAWER_OPEN_CLASS);
    afterNextRender(
      () => {
        this.drawerFocusables()[0]?.focus();
      },
      { injector: this.injector },
    );
  }

  protected closeDrawer(returnFocus: boolean): void {
    const wasOpen = this.drawerOpen();
    this.drawerOpen.set(false);
    this.unlockBackground();

    if (wasOpen && returnFocus) {
      this.menuButton?.nativeElement.focus();
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.drawerOpen()) {
      this.closeDrawer(true);
    }
  }

  @HostListener('document:keydown.tab', ['$event'])
  @HostListener('document:keydown.shift.tab', ['$event'])
  protected onDrawerTab(event: Event): void {
    if (!this.drawerOpen()) {
      return;
    }

    const focusables = this.drawerFocusables();
    if (!focusables.length) {
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    const inside = !!active && !!this.drawer?.nativeElement.contains(active);

    if ((event as KeyboardEvent).shiftKey) {
      if (!inside || active === first) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (!inside || active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private drawerFocusables(): HTMLElement[] {
    const host = this.drawer?.nativeElement;
    if (!host) {
      return [];
    }

    return Array.from(host.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  }

  private unlockBackground(): void {
    document.body.classList.remove(DRAWER_OPEN_CLASS);
  }

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

  protected toggleGroup(group: NavGroup): void {
    if (!this.expanded()) {
      this.expanded.set(true);
      this.openGroup.set(group);
      return;
    }

    this.openGroup.set(this.openGroup() === group ? null : group);
  }

  protected onNavigate(): void {
    this.closeDrawer(false);
    this.expanded.set(false);
    this.openGroup.set(null);
    this.workspace?.nativeElement.focus();
  }

  protected isRegistersActive(): boolean {
    return this.router.url.startsWith('/categories');
  }

  protected canSeeRegisters(): boolean {
    return this.authService.can('CATEGORIES', 'VIEW');
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
