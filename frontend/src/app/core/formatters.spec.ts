import { dayHeading, initials, longMonthName, shortDate, shortMoney } from './formatters';

describe('shortMoney', () => {
  it('formata zero sem abreviação', () => {
    expect(shortMoney(0)).toBe('R$ 0');
  });

  it('formata valores abaixo de mil sem abreviação', () => {
    expect(shortMoney(800)).toBe('R$ 800');
    expect(shortMoney(999)).toBe('R$ 999');
  });

  it('mantém o sinal negativo antes do símbolo da moeda', () => {
    expect(shortMoney(-800)).toBe('-R$ 800');
  });

  it('abrevia milhares com vírgula decimal', () => {
    expect(shortMoney(1_000)).toBe('R$ 1 mil');
    expect(shortMoney(1_500)).toBe('R$ 1,5 mil');
    expect(shortMoney(1_250)).toBe('R$ 1,25 mil');
    expect(shortMoney(-1_500)).toBe('-R$ 1,5 mil');
  });

  it('abrevia milhões com vírgula decimal', () => {
    expect(shortMoney(1_000_000)).toBe('R$ 1 mi');
    expect(shortMoney(1_200_000)).toBe('R$ 1,2 mi');
  });

  it('trata valor nulo como zero', () => {
    expect(shortMoney(null)).toBe('R$ 0');
    expect(shortMoney(undefined)).toBe('R$ 0');
  });
});

describe('longMonthName', () => {
  it('devolve o nome do mês capitalizado e acentuado', () => {
    expect(longMonthName(3)).toBe('Março');
    expect(longMonthName(5)).toBe('Maio');
    expect(longMonthName(1)).toBe('Janeiro');
    expect(longMonthName(12)).toBe('Dezembro');
  });
});

describe('shortDate', () => {
  it('formata a data ISO como dd/mm/aaaa sem passar por Date', () => {
    expect(shortDate('2026-09-24')).toBe('24/09/2026');
    expect(shortDate('2026-01-01')).toBe('01/01/2026');
  });

  it('devolve o valor original quando não é uma data ISO', () => {
    expect(shortDate('')).toBe('');
    expect(shortDate('24/09/2026')).toBe('24/09/2026');
  });
});

describe('dayHeading', () => {
  it('usa Hoje e Ontem relativos ao dia informado', () => {
    expect(dayHeading('2026-09-24', '2026-09-24')).toBe('Hoje, 24 de setembro');
    expect(dayHeading('2026-09-23', '2026-09-24')).toBe('Ontem, 23 de setembro');
  });

  it('usa só dia e mês nos demais dias do mesmo ano', () => {
    expect(dayHeading('2026-09-22', '2026-09-24')).toBe('22 de setembro');
    expect(dayHeading('2026-03-05', '2026-09-24')).toBe('5 de março');
  });

  it('reconhece Ontem na virada de mês e de ano', () => {
    expect(dayHeading('2026-08-31', '2026-09-01')).toBe('Ontem, 31 de agosto');
    expect(dayHeading('2025-12-31', '2026-01-01')).toBe('Ontem, 31 de dezembro de 2025');
  });

  it('acrescenta o ano quando é de outro ano', () => {
    expect(dayHeading('2025-09-22', '2026-09-24')).toBe('22 de setembro de 2025');
  });
});

describe('initials', () => {
  it('usa a primeira letra do primeiro e do último nome', () => {
    expect(initials('Ana Souza')).toBe('AS');
    expect(initials('ana maria de souza')).toBe('AS');
  });

  it('usa uma letra para nome único e vazio sem nome', () => {
    expect(initials('Ana')).toBe('A');
    expect(initials('  ')).toBe('');
    expect(initials(null)).toBe('');
  });
});
