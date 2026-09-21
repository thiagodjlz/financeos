import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoAccess } from './no-access';

describe('NoAccess', () => {
  let fixture: ComponentFixture<NoAccess>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoAccess],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(NoAccess);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('exibe a mensagem em português e não faz nenhuma requisição', () => {
    expect(fixture.nativeElement.querySelector('.empty-state').textContent?.trim()).toBe(
      'Seu perfil não tem acesso a nenhuma tela. Fale com o administrador.',
    );
    httpMock.expectNone(() => true);
  });
});
