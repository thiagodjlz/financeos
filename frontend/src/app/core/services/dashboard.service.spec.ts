import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE } from '../models';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('populates the summary signal from GET /dashboard/summary with year/month params', async () => {
    const refreshPromise = service.refresh(2026, 6);

    const req = httpMock.expectOne(`${API_BASE}/dashboard/summary?year=2026&month=6`);
    expect(req.request.method).toBe('GET');
    req.flush({
      period: { year: 2026, month: 6, startDate: '2026-06-01', endDate: '2026-06-30' },
      totalIncome: 100,
      totalExpense: 40,
      balance: 60,
      paidExpense: 40,
      pendingExpense: 0,
      transactionCount: 2,
      categoryBreakdown: [],
      monthlyEvolution: [],
    });

    await refreshPromise;
    expect(service.summary()?.totalIncome).toBe(100);
  });
});
