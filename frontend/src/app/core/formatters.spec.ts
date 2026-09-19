import { longMonthName, shortMoney } from './formatters';

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
