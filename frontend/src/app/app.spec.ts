import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the FinanceOS shell', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const httpMock = TestBed.inject(HttpTestingController);
    const requests = httpMock.match(() => true);
    expect(requests.length).toBe(5);

    for (const request of requests) {
      if (request.request.url.includes('/dashboard/summary')) {
        request.flush({
          period: {
            year: 2026,
            month: 6,
            startDate: '2026-06-01',
            endDate: '2026-06-30',
          },
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
          paidExpense: 0,
          pendingExpense: 0,
          transactionCount: 0,
          categoryBreakdown: [],
          monthlyEvolution: [],
        });
      } else {
        request.flush([]);
      }
    }

    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('FinanceOS');
  });
});
