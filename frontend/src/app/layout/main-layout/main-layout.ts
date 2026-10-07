import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  Injector,
  OnDestroy,
  ViewChild,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { initials } from '../../core/formatters';
import { ScreenAccessTracker } from '../../core/screen-access-tracker';
import { AuthService } from '../../core/services/auth.service';
import { APP_NAME, APP_VERSION } from '../../core/version';

type NavSheet = 'more';

const OVERLAY_OPEN_CLASS = 'overlay-open';
const FOCUSABLE_SELECTOR = 'button:not([disabled]), a[href], input, select, [tabindex]:not([tabindex="-1"])';
const FORM_ROUTE = /^\/(transactions|categories|users|profiles)\/(new|[^/?#]+\/edit)(?:[?#]|$)/;
const MORE_ROUTE = /^\/(categories|users|profiles|audit|documentation|release-notes)(?:[/?#]|$)/;

@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
  providers: [ScreenAccessTracker],
})
export class MainLayout implements OnDestroy {
  protected readonly authService = inject(AuthService);
  protected readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly screenAccess = inject(ScreenAccessTracker);

  protected readonly appName = APP_NAME;
  protected readonly appVersion = APP_VERSION;

  protected readonly collapsed = signal(false);
  protected readonly openSheet = signal<NavSheet | null>(null);
  protected readonly userInitials = computed(() => initials(this.authService.me()?.name));

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  protected readonly formRoute = computed(() => FORM_ROUTE.test(this.currentUrl()));
  protected readonly moreActive = computed(() => MORE_ROUTE.test(this.currentUrl()));

  private sheetTrigger: HTMLElement | null = null;

  @ViewChild('workspace') private workspace?: ElementRef<HTMLElement>;

  // O shell nasce durante a navegação que o ativa, então o NavigationEnd dela ainda chega aqui; o
  // `navigated` cobre o shell criado depois de uma navegação já concluída.
  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => this.screenAccess.track(event.urlAfterRedirects));

    if (this.router.navigated) {
      this.screenAccess.track(this.router.url);
    }
  }

  ngOnDestroy(): void {
    this.unlockBackground();
  }

  protected toggleCollapsed(): void {
    this.collapsed.update((collapsed) => !collapsed);
  }

  protected toggleSheet(sheet: NavSheet, event: Event): void {
    if (this.openSheet() === sheet) {
      this.closeSheet(true);
      return;
    }

    this.sheetTrigger = event.currentTarget as HTMLElement | null;
    this.openSheet.set(sheet);
    document.body.classList.add(OVERLAY_OPEN_CLASS);
    afterNextRender(
      () => {
        this.sheetFocusables()[0]?.focus();
      },
      { injector: this.injector },
    );
  }

  protected closeSheet(returnFocus: boolean): void {
    const wasOpen = this.openSheet() !== null;
    this.openSheet.set(null);
    this.unlockBackground();

    if (wasOpen && returnFocus) {
      this.sheetTrigger?.focus();
    }
    this.sheetTrigger = null;
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.openSheet()) {
      this.closeSheet(true);
    }
  }

  @HostListener('document:keydown.tab', ['$event'])
  @HostListener('document:keydown.shift.tab', ['$event'])
  protected onSheetTab(event: Event): void {
    if (!this.openSheet()) {
      return;
    }

    const focusables = this.sheetFocusables();
    if (!focusables.length) {
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    const inside = !!active && !!this.openSheetElement()?.contains(active);

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

  private openSheetElement(): HTMLElement | null {
    const sheet = this.openSheet();
    return sheet ? this.host.nativeElement.querySelector<HTMLElement>(`#sheet-${sheet}`) : null;
  }

  private sheetFocusables(): HTMLElement[] {
    const element = this.openSheetElement();
    return element ? Array.from(element.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)) : [];
  }

  private unlockBackground(): void {
    document.body.classList.remove(OVERLAY_OPEN_CLASS);
  }

  protected onNavigate(): void {
    this.closeSheet(false);
    this.workspace?.nativeElement.focus();
  }

  protected canSeeRegisters(): boolean {
    return this.authService.can('CATEGORIES', 'VIEW');
  }

  protected canSeeSettings(): boolean {
    return (
      this.authService.can('USERS', 'VIEW') ||
      this.authService.can('PROFILES', 'VIEW') ||
      this.authService.can('AUDIT', 'VIEW')
    );
  }

  protected canSeeAbout(): boolean {
    return this.authService.can('DOCUMENTATION', 'VIEW') || this.authService.can('RELEASE_NOTES', 'VIEW');
  }

  protected async logout(): Promise<void> {
    this.closeSheet(false);
    await this.authService.signOut();
    void this.router.navigate(['/login']);
  }
}
