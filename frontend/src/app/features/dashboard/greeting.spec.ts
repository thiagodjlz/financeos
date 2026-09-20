import {
  DayPeriod,
  GREETING_CATALOG,
  GREETING_MAX_LINE_LENGTH,
  GREETING_NAME_TOKEN,
  buildGreeting,
  dayPeriod,
  greetingDisplayName,
  selectGreeting,
} from './greeting';

const PERIODS: DayPeriod[] = ['dawn', 'morning', 'afternoon', 'night'];
const LONG_NAME = 'Alessandrina';
const MIN_MESSAGES_PER_PERIOD = 5;
const SEED_SAMPLES = 1000;

const VETOED_PHRASES = [
  'Bem-vindo ao sistema',
  'Seja bem-vindo',
  'Bom dia, usuário.',
  'Consulte abaixo',
  'Confira o resumo financeiro do período',
];

const ACCENTED_WORDS = [
  'não',
  'você',
  'período',
  'possível',
  'máximo',
  'está',
  'já',
  'só',
  'é',
  'café',
  'número',
  'história',
  'rápida',
  'ótima',
  'última',
];

function withoutAccents(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function linesOf(period: DayPeriod): string[] {
  return GREETING_CATALOG[period].flatMap((message) => [
    message.withName.split(GREETING_NAME_TOKEN).join(LONG_NAME),
    message.withoutName,
    message.subline,
  ]);
}

function everyLine(): string[] {
  return PERIODS.flatMap(linesOf);
}

describe('greetingDisplayName', () => {
  it('devolve o primeiro nome do nome completo', () => {
    expect(greetingDisplayName('Thiago Dos Santos')).toBe('Thiago');
  });

  it('devolve o próprio nome quando há um único termo', () => {
    expect(greetingDisplayName('Thiago')).toBe('Thiago');
  });

  it('ignora espaços em excesso antes, depois e no meio', () => {
    expect(greetingDisplayName('  Ana  Paula  ')).toBe('Ana');
  });

  it('preserva a acentuação e a caixa como cadastrada', () => {
    expect(greetingDisplayName('Antônio de Assis')).toBe('Antônio');
    expect(greetingDisplayName('ÂNGELA Maria')).toBe('ÂNGELA');
    expect(greetingDisplayName('inês souza')).toBe('inês');
  });

  it('devolve nulo quando o nome está ausente, vazio ou só com espaços', () => {
    expect(greetingDisplayName(null)).toBeNull();
    expect(greetingDisplayName(undefined)).toBeNull();
    expect(greetingDisplayName('')).toBeNull();
    expect(greetingDisplayName('   ')).toBeNull();
  });
});

describe('dayPeriod', () => {
  it('usa as quatro faixas exatas nas bordas de cada período', () => {
    expect(dayPeriod(0)).toBe('dawn');
    expect(dayPeriod(5)).toBe('dawn');
    expect(dayPeriod(6)).toBe('morning');
    expect(dayPeriod(11)).toBe('morning');
    expect(dayPeriod(12)).toBe('afternoon');
    expect(dayPeriod(17)).toBe('afternoon');
    expect(dayPeriod(18)).toBe('night');
    expect(dayPeriod(23)).toBe('night');
  });

  it('cobre as 24 horas do dia com exatamente quatro períodos de seis horas', () => {
    const covered = Array.from({ length: 24 }, (_, hour) => dayPeriod(hour));

    expect(new Set(covered).size).toBe(4);

    for (const period of PERIODS) {
      expect(covered.filter((item) => item === period)).toHaveLength(6);
    }
  });
});

describe('GREETING_CATALOG', () => {
  it('tem ao menos cinco mensagens distintas em cada período', () => {
    for (const period of PERIODS) {
      const messages = GREETING_CATALOG[period];

      expect(messages.length).toBeGreaterThanOrEqual(MIN_MESSAGES_PER_PERIOD);
      expect(new Set(messages.map((message) => message.withName)).size).toBe(messages.length);
      expect(new Set(messages.map((message) => message.subline)).size).toBe(messages.length);
    }
  });

  it('traz cada mensagem como um par de linhas, com e sem nome', () => {
    for (const period of PERIODS) {
      for (const message of GREETING_CATALOG[period]) {
        expect(message.withName).toContain(GREETING_NAME_TOKEN);
        expect(message.withoutName).not.toContain(GREETING_NAME_TOKEN);
        expect(message.subline).not.toContain(GREETING_NAME_TOKEN);
        expect(message.subline.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('não usa nenhuma das formulações vetadas pela issue', () => {
    for (const line of everyLine()) {
      for (const vetoed of VETOED_PHRASES) {
        expect(line).not.toContain(vetoed);
      }
    }
  });

  it('não usa emoji nem caractere fora do texto corrido em português', () => {
    for (const line of everyLine()) {
      expect(/\p{Extended_Pictographic}/u.test(line)).toBe(false);
      expect(/^[A-Za-zÀ-ÿ0-9 .,!?:;'()—-]+$/u.test(line)).toBe(true);
    }
  });

  it('mantém o texto em português acentuado', () => {
    const forbidden = ACCENTED_WORDS.map(withoutAccents);

    for (const line of everyLine()) {
      for (const word of forbidden) {
        expect(new RegExp(`(^|[^A-Za-zÀ-ÿ])${word}([^A-Za-zÀ-ÿ]|$)`, 'u').test(line)).toBe(false);
      }
    }

    expect(everyLine().some((line) => /[À-ÿ]/u.test(line))).toBe(true);
  });

  it('cabe no limite de 60 caracteres por linha com um nome longo', () => {
    for (const line of everyLine()) {
      expect(line.length).toBeLessThanOrEqual(GREETING_MAX_LINE_LENGTH);
    }
  });
});

describe('selectGreeting', () => {
  it('alcança todas as mensagens do período ao varrer as sementes', () => {
    for (const period of PERIODS) {
      const reached = new Set<string>();

      for (let sample = 0; sample < SEED_SAMPLES; sample++) {
        reached.add(selectGreeting(period, sample / SEED_SAMPLES).withName);
      }

      expect(reached.size).toBe(GREETING_CATALOG[period].length);
    }
  });

  it('é determinística: a mesma semente devolve sempre a mesma mensagem', () => {
    expect(selectGreeting('morning', 0.42)).toBe(selectGreeting('morning', 0.42));
    expect(selectGreeting('night', 0)).toBe(GREETING_CATALOG.night[0]);
  });

  it('nunca estoura o catálogo, mesmo com a semente no limite', () => {
    for (const period of PERIODS) {
      const messages = GREETING_CATALOG[period];

      expect(selectGreeting(period, 0.9999999)).toBe(messages[messages.length - 1]);
      expect(selectGreeting(period, 1)).toBe(messages[messages.length - 1]);
    }
  });
});

describe('buildGreeting', () => {
  it('substitui o marcador pelo primeiro nome do operador', () => {
    for (const period of PERIODS) {
      const messages = GREETING_CATALOG[period];

      for (let index = 0; index < messages.length; index++) {
        const text = buildGreeting(period, 'Thiago', index / messages.length);

        expect(text.headline).toContain('Thiago');
        expect(text.headline).not.toContain(GREETING_NAME_TOKEN);
        expect(text.subline).toBe(messages[index].subline);
      }
    }
  });

  it('usa a redação sem nome e não deixa pontuação órfã quando não há nome', () => {
    for (const period of PERIODS) {
      const messages = GREETING_CATALOG[period];

      for (let index = 0; index < messages.length; index++) {
        const text = buildGreeting(period, null, index / messages.length);

        for (const line of [text.headline, text.subline]) {
          expect(line).not.toContain(GREETING_NAME_TOKEN);
          expect(line).not.toContain('undefined');
          expect(line).not.toContain('null');
          expect(line).not.toMatch(/,\s*[!?.]/);
          expect(line.trim()).toBe(line);
          expect(line.length).toBeGreaterThan(0);
        }

        expect(text.headline).toBe(messages[index].withoutName);
      }
    }
  });

  it('mantém a linha de complemento igual com e sem nome', () => {
    const named = buildGreeting('afternoon', 'Thiago', 0.5);
    const anonymous = buildGreeting('afternoon', null, 0.5);

    expect(named.subline).toBe(anonymous.subline);
  });
});
