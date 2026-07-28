import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_BASE } from '../../core/models';
import { ToastService } from '../../core/services/toast.service';
import { NETWORK_ERROR_MESSAGE, UNEXPECTED_ERROR_MESSAGE } from '../../core/http-error';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  let httpMock: HttpTestingController;
  let toastService: ToastService;

  beforeEach(async () => {
    TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
    fixture = TestBed.createComponent(Dashboard);
  });

  afterEach(() => httpMock.verify());

  async function settle(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function toasts() {
    return toastService.toasts();
  }

  function summaryRequest() {
    fixture.detectChanges();
    return httpMock.expectOne((request) => request.url.startsWith(`${API_BASE}/dashboard/summary`));
  }

  it('exibe toast de falha quando a API responde 500', async () => {
    summaryRequest().flush(null, { status: 500, statusText: 'Server Error' });
    await settle();

    expect(toasts()).toHaveLength(1);
    expect(toasts()[0].title).toBe('Falha');
    expect(toasts()[0].message).toBe(UNEXPECTED_ERROR_MESSAGE);
    expect(toasts()[0].duration).toBeNull();
  });

  it('exibe toast de falha quando a API está fora do ar (status 0)', async () => {
    summaryRequest().error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    await settle();

    expect(toasts()).toHaveLength(1);
    expect(toasts()[0].title).toBe('Falha');
    expect(toasts()[0].message).toBe(NETWORK_ERROR_MESSAGE);
  });

  it('não exibe toast quando a carga responde 200', async () => {
    summaryRequest().flush({
      period: { year: 2026, month: 7, startDate: '2026-07-01', endDate: '2026-07-31' },
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      paidExpense: 0,
      pendingExpense: 0,
      transactionCount: 0,
      categoryBreakdown: [],
      monthlyEvolution: [],
    });
    await settle();

    expect(toasts()).toEqual([]);
  });
});
