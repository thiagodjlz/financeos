import { HttpErrorResponse } from '@angular/common/http';
import {
  FieldErrorState,
  collectFieldErrors,
  extractViolations,
  focusFirstInvalidField,
} from './field-errors';

function badRequest(violations: unknown, message = 'Informe os campos obrigatórios: Nome.'): HttpErrorResponse {
  return new HttpErrorResponse({
    status: 400,
    error: { title: 'Constraint Violation', status: 400, violations, message },
  });
}

describe('field-errors', () => {
  it('extrai as violações de um HttpErrorResponse de validação', () => {
    const err = badRequest([{ field: 'create.request.name', message: 'O nome é obrigatório.' }]);

    expect(extractViolations(err)).toEqual([
      { field: 'create.request.name', message: 'O nome é obrigatório.' },
    ]);
  });

  it('devolve lista vazia quando o erro não é HTTP ou não tem violações', () => {
    expect(extractViolations(new Error('falha'))).toEqual([]);
    expect(extractViolations(new HttpErrorResponse({ status: 500, error: null }))).toEqual([]);
    expect(extractViolations(new HttpErrorResponse({ status: 409, error: { message: 'Duplicado.' } }))).toEqual(
      [],
    );
  });

  it('mapeia o último segmento do campo e ignora os campos que a tela não tem', () => {
    const err = badRequest([
      { field: 'create.request.name', message: 'O nome é obrigatório.' },
      { field: 'create.request.permissions[0].screen', message: 'A tela é obrigatória.' },
    ]);

    const errors = collectFieldErrors(err, ['name', 'color']);

    expect(errors.get('name')).toBe('O nome é obrigatório.');
    expect(errors.has('screen')).toBe(false);
    expect(errors.size).toBe(1);
  });

  it('mantém a primeira mensagem quando o mesmo campo tem duas violações', () => {
    const err = badRequest([
      { field: 'create.request.email', message: 'Informe um e-mail válido.' },
      { field: 'create.request.email', message: 'O e-mail deve ter no máximo 180 caracteres.' },
    ]);

    expect(collectFieldErrors(err, ['email']).get('email')).toBe('Informe um e-mail válido.');
  });

  it('foca o primeiro campo inválido na ordem do DOM, não na ordem das violações', () => {
    const form = document.createElement('form');
    form.innerHTML = `
      <input name="description" />
      <input name="amount" />
      <select name="categoryId"></select>
    `;
    document.body.appendChild(form);

    const errors = new Map([
      ['categoryId', 'A categoria é obrigatória.'],
      ['amount', 'O valor é obrigatório.'],
    ]);

    focusFirstInvalidField(form, errors);

    expect((document.activeElement as HTMLElement).getAttribute('name')).toBe('amount');

    form.remove();
  });

  it('não muda o foco quando não há campo inválido no formulário', () => {
    const form = document.createElement('form');
    form.innerHTML = '<input name="name" />';
    document.body.appendChild(form);

    const outside = document.createElement('input');
    document.body.appendChild(outside);
    outside.focus();

    focusFirstInvalidField(form, new Map([['color', 'A cor é obrigatória.']]));

    expect(document.activeElement).toBe(outside);

    form.remove();
    outside.remove();
  });

  describe('FieldErrorState', () => {
    it('aplica, consulta, limpa por campo e reseta', () => {
      const state = new FieldErrorState(['name', 'color', 'active']);

      state.apply(
        badRequest([
          { field: 'create.request.name', message: 'O nome é obrigatório.' },
          { field: 'create.request.color', message: 'A cor é obrigatória.' },
        ]),
      );

      expect(state.invalid('name')).toBe(true);
      expect(state.message('color')).toBe('A cor é obrigatória.');
      expect(state.invalid('active')).toBe(false);

      state.clear('name');

      expect(state.invalid('name')).toBe(false);
      expect(state.message('name')).toBe('');
      expect(state.invalid('color')).toBe(true);

      state.reset();

      expect(state.invalid('color')).toBe(false);
    });

    it('substitui o conteúdo anterior a cada apply', () => {
      const state = new FieldErrorState(['name', 'color']);

      state.apply(badRequest([{ field: 'create.request.name', message: 'O nome é obrigatório.' }]));
      state.apply(badRequest([{ field: 'create.request.color', message: 'A cor é obrigatória.' }]));

      expect(state.invalid('name')).toBe(false);
      expect(state.invalid('color')).toBe(true);
    });
  });
});
