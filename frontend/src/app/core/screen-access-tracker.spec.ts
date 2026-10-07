import { TestBed } from '@angular/core/testing';
import { Screen } from './models';
import { ScreenAccessTracker } from './screen-access-tracker';
import { AuditService } from './services/audit.service';

describe('ScreenAccessTracker', () => {
  let tracker: ScreenAccessTracker;
  let screenAccess: ReturnType<typeof vi.fn<(screen: Screen) => Promise<void>>>;

  beforeEach(() => {
    screenAccess = vi.fn<(screen: Screen) => Promise<void>>().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [ScreenAccessTracker, { provide: AuditService, useValue: { screenAccess } }],
    });
    tracker = TestBed.inject(ScreenAccessTracker);
  });

  it('registra a carga inicial e cada entrada numa tela diferente do menu', () => {
    tracker.track('/dashboard');
    tracker.track('/transactions');
    tracker.track('/audit');

    expect(screenAccess.mock.calls.map(([screen]) => screen)).toEqual(['DASHBOARD', 'TRANSACTIONS', 'AUDIT']);
  });

  it('não registra ao ir da lista ao cadastro da mesma tela e voltar', () => {
    tracker.track('/transactions');
    tracker.track('/transactions/7/edit');
    tracker.track('/transactions/new');
    tracker.track('/transactions');

    expect(screenAccess).toHaveBeenCalledTimes(1);
  });

  it('não registra ao trocar de aba na mesma tela', () => {
    tracker.track('/documentation');
    tracker.track('/documentation#transacoes');
    tracker.track('/documentation?area=perfis');

    expect(screenAccess).toHaveBeenCalledTimes(1);
  });

  it('não registra ao paginar a listagem', () => {
    tracker.track('/audit');
    tracker.track('/audit?page=2');
    tracker.track('/audit?page=3');

    expect(screenAccess).toHaveBeenCalledTimes(1);
  });

  it('volta a registrar a mesma tela depois de passar por uma rota fora do menu', () => {
    tracker.track('/users');
    tracker.track('/no-access');
    tracker.track('/users');

    expect(screenAccess.mock.calls.map(([screen]) => screen)).toEqual(['USERS', 'USERS']);
  });

  it('não interrompe a navegação quando o registro falha', async () => {
    screenAccess.mockRejectedValueOnce(new Error('403'));

    expect(() => tracker.track('/users')).not.toThrow();
    await Promise.resolve();
    tracker.track('/profiles');

    expect(screenAccess).toHaveBeenCalledTimes(2);
  });
});
