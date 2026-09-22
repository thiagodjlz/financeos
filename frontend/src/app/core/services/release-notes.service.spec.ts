import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE } from '../models';
import { ReleaseNotesService } from './release-notes.service';

describe('ReleaseNotesService', () => {
  let service: ReleaseNotesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReleaseNotesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('populates the content signal from GET /release-notes', async () => {
    const loadPromise = service.load();

    const req = httpMock.expectOne(`${API_BASE}/release-notes`);
    expect(req.request.method).toBe('GET');
    req.flush({
      currentVersion: '1.0.2',
      versions: [{ version: '1.0.2', categories: [{ kind: 'NEW', items: ['Item novo.'] }] }],
    });

    await loadPromise;
    expect(service.content()?.currentVersion).toBe('1.0.2');
    expect(service.content()?.versions).toHaveLength(1);
  });
});
