import {
  dateTimeLabel,
  currentMonth,
  dayHeading,
  formatAmountInput,
  initials,
  longMonthName,
  monthKey,
  monthLabel,
  monthRange,
  parseAmountInput,
  parseMonthKey,
  percentLabel,
  shiftMonth,
  shortDate,
  shortMoney,
  transactionStatusLabel,
} from './formatters';

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
  it('usa Hoje e Ontem relativos ao dia informado, no lugar do dia da semana', () => {
    expect(dayHeading('2026-09-24', '2026-09-24')).toBe('Hoje, 24 de setembro');
    expect(dayHeading('2026-09-23', '2026-09-24')).toBe('Ontem, 23 de setembro');
  });

  it('abre os demais dias do mesmo ano com o dia da semana, sem "-feira"', () => {
    expect(dayHeading('2026-10-10', '2026-10-03')).toBe('Sábado, 10 de outubro');
    expect(dayHeading('2026-10-05', '2026-10-03')).toBe('Segunda, 5 de outubro');
    expect(dayHeading('2026-10-01', '2026-10-03')).toBe('Quinta, 1 de outubro');
    expect(dayHeading('2026-03-08', '2026-09-24')).toBe('Domingo, 8 de março');
  });

  it('reconhece Ontem na virada de mês e de ano', () => {
    expect(dayHeading('2026-08-31', '2026-09-01')).toBe('Ontem, 31 de agosto');
    expect(dayHeading('2025-12-31', '2026-01-01')).toBe('Ontem, 31 de dezembro de 2025');
  });

  it('acrescenta o ano só quando o dia é de outro ano', () => {
    expect(dayHeading('2025-09-22', '2026-09-24')).toBe('Segunda, 22 de setembro de 2025');
    expect(dayHeading('2027-01-02', '2026-09-24')).toBe('Sábado, 2 de janeiro de 2027');
  });
});

describe('percentLabel', () => {
  it('formata o percentual da API com uma casa e vírgula, sem arredondar de novo', () => {
    expect(percentLabel(29.3)).toBe('29,3%');
    expect(percentLabel(130)).toBe('130,0%');
    expect(percentLabel(8.7)).toBe('8,7%');
    expect(percentLabel(0)).toBe('0,0%');
  });
});

describe('valor digitado no cadastro', () => {
  it('lê vírgula decimal e ponto de milhar', () => {
    expect(parseAmountInput('184,90')).toBe(184.9);
    expect(parseAmountInput('1.234,56')).toBe(1234.56);
    expect(parseAmountInput('1.234')).toBe(1234);
    expect(parseAmountInput('120')).toBe(120);
    expect(parseAmountInput('12.5')).toBe(12.5);
    expect(parseAmountInput(' 120 ')).toBe(120);
  });

  it('mantém o sinal e o zero: quem recusa é o back-end', () => {
    expect(parseAmountInput('-50,00')).toBe(-50);
    expect(parseAmountInput('0,00')).toBe(0);
  });

  it('não limpa o texto que não é número: segue como foi digitado', () => {
    expect(parseAmountInput('12abc')).toBe('12abc');
    expect(parseAmountInput('R$ 10')).toBe('R$ 10');
    expect(parseAmountInput('1,2,3')).toBe('1,2,3');
    expect(parseAmountInput(',')).toBe(',');
  });

  it('devolve nulo para o campo vazio, para o back-end apontar o valor obrigatório', () => {
    expect(parseAmountInput('')).toBeNull();
    expect(parseAmountInput('   ')).toBeNull();
    expect(parseAmountInput(null)).toBeNull();
  });

  it('mostra o valor gravado com duas casas e vírgula', () => {
    expect(formatAmountInput(120)).toBe('120,00');
    expect(formatAmountInput(184.9)).toBe('184,90');
    expect(formatAmountInput(1234.5)).toBe('1.234,50');
    expect(formatAmountInput(null)).toBe('');
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

describe('transactionStatusLabel', () => {
  it('traduz só os status existentes', () => {
    expect(transactionStatusLabel('PENDING')).toBe('Pendente');
    expect(transactionStatusLabel('PAID')).toBe('Pago');
    expect(transactionStatusLabel(null)).toBe('-');
  });
});

describe('meses do filtro de período', () => {
  it('monta o rótulo com o nome completo do mês', () => {
    expect(monthLabel(2026, 3)).toBe('Março de 2026');
    expect(monthLabel(2025, 12)).toBe('Dezembro de 2025');
  });

  it('usa o mês do relógio como mês atual', () => {
    expect(currentMonth(new Date(2026, 8, 30))).toEqual({ year: 2026, month: 9 });
  });

  it('anda mês a mês no calendário, virando o ano nos dois sentidos', () => {
    expect(shiftMonth({ year: 2025, month: 12 }, 1)).toEqual({ year: 2026, month: 1 });
    expect(shiftMonth({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth({ year: 2026, month: 6 }, 1)).toEqual({ year: 2026, month: 7 });
  });

  it('converte o mês em chave YYYY-MM e de volta', () => {
    expect(monthKey({ year: 2026, month: 2 })).toBe('2026-02');
    expect(parseMonthKey('2026-02')).toEqual({ year: 2026, month: 2 });
    expect(parseMonthKey('')).toBeNull();
    expect(parseMonthKey('2026-13')).toBeNull();
    expect(parseMonthKey('2026-2')).toBeNull();
  });

  it('gera do dia 1 ao último dia do mês, inclusive em ano bissexto', () => {
    expect(monthRange('2026-02')).toEqual({ startDate: '2026-02-01', endDate: '2026-02-28' });
    expect(monthRange('2028-02')).toEqual({ startDate: '2028-02-01', endDate: '2028-02-29' });
    expect(monthRange('2026-12')).toEqual({ startDate: '2026-12-01', endDate: '2026-12-31' });
    expect(monthRange('2026-04')).toEqual({ startDate: '2026-04-01', endDate: '2026-04-30' });
    expect(monthRange('')).toBeNull();
  });
});

describe('dateTimeLabel', () => {
  it('mostra data e hora com segundos no fuso do navegador', () => {
    const instant = new Date(2026, 9, 6, 14, 5, 9).toISOString();

    expect(dateTimeLabel(instant)).toBe('06/10/2026 14:05:09');
  });

  it('converte o instante com fuso informado para o horário local', () => {
    const local = new Date('2026-03-01T15:00:00Z');
    const expected = `${String(local.getDate()).padStart(2, '0')}/${String(local.getMonth() + 1).padStart(2, '0')}/2026 ${String(local.getHours()).padStart(2, '0')}:00:00`;

    expect(dateTimeLabel('2026-03-01T12:00:00-03:00')).toBe(expected);
  });

  it('devolve o texto recebido quando não é uma data', () => {
    expect(dateTimeLabel('sem data')).toBe('sem data');
  });
});
