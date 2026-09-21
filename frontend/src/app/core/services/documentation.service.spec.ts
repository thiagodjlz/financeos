import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE } from '../models';
import { DocumentationService } from './documentation.service';

describe('DocumentationService', () => {
  let service: DocumentationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DocumentationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('populates the content signal from GET /documentation', async () => {
    const loadPromise = service.load();

    const req = httpMock.expectOne(`${API_BASE}/documentation`);
    expect(req.request.method).toBe('GET');
    req.flush({
      title: 'Central de Documentação',
      introduction: { id: 'overview', title: 'Como utilizar o sistema', summary: '', sections: [] },
      areas: [{ id: 'dashboard', title: 'Resumo', summary: '', sections: [] }],
    });

    await loadPromise;
    expect(service.content()?.areas).toHaveLength(1);
    expect(service.content()?.areas[0].title).toBe('Resumo');
  });
});
