export type DayPeriod = 'dawn' | 'morning' | 'afternoon' | 'night';

export interface GreetingMessage {
  withName: string;
  withoutName: string;
  subline: string;
}

export interface GreetingText {
  headline: string;
  subline: string;
}

export const GREETING_NAME_TOKEN = '{nome}';
export const GREETING_TICK_MS = 60_000;
export const GREETING_MAX_LINE_LENGTH = 60;

const DAWN_END_HOUR = 6;
const MORNING_END_HOUR = 12;
const AFTERNOON_END_HOUR = 18;
const LAST_HOUR = 23;

export const GREETING_CATALOG: Record<DayPeriod, GreetingMessage[]> = {
  dawn: [
    {
      withName: 'Olha só quem apareceu na madrugada, {nome}!',
      withoutName: 'Olha só quem apareceu na madrugada!',
      subline: 'Plantão financeiro ativado.',
    },
    {
      withName: 'Ora, ora... {nome} por aqui a essa hora?',
      withoutName: 'Ora, ora... por aqui a essa hora?',
      subline: 'As contas agradecem a visita.',
    },
    {
      withName: 'Ei, {nome}! Ainda acordado por aí?',
      withoutName: 'Ei! Ainda acordado por aí?',
      subline: 'Já que o sono não veio, bora ver as contas?',
    },
    {
      withName: 'Enquanto o mundo dorme, {nome} cuida do dinheiro.',
      withoutName: 'Enquanto o mundo dorme, o dinheiro fica de olho.',
      subline: 'Silêncio total: ótima hora para conferir tudo.',
    },
    {
      withName: 'Boa madrugada, {nome}! Tudo tranquilo por aí?',
      withoutName: 'Boa madrugada! Tudo tranquilo por aí?',
      subline: 'Vamos dar uma espiadinha nas contas?',
    },
    {
      withName: 'A madrugada é toda sua, {nome}.',
      withoutName: 'A madrugada é toda sua.',
      subline: 'Bom momento para colocar as finanças em ordem.',
    },
  ],
  morning: [
    {
      withName: 'Bom dia, flor do dia, {nome}!',
      withoutName: 'Bom dia, flor do dia!',
      subline: 'Bora colocar as finanças nos trilhos?',
    },
    {
      withName: 'Café na mão, {nome}?',
      withoutName: 'Café na mão por aí?',
      subline: 'As finanças combinam bem com a primeira xícara.',
    },
    {
      withName: 'E aí, {nome}! Começando com o pé direito?',
      withoutName: 'E aí! Começando o dia com o pé direito?',
      subline: 'Que tal abrir a manhã de olho no que importa?',
    },
    {
      withName: 'Olha quem chegou cedo, {nome}!',
      withoutName: 'Olha quem chegou cedo!',
      subline: 'Bora colocar a casa em ordem antes do corre?',
    },
    {
      withName: 'Bom dia, {nome}! Disposição em alta por aí?',
      withoutName: 'Bom dia! Disposição em alta por aí?',
      subline: 'As finanças já acordaram também.',
    },
    {
      withName: 'Dia novo, {nome}. Contas em dia?',
      withoutName: 'Dia novo. Contas em dia?',
      subline: 'Uma olhada rápida agora evita surpresa depois.',
    },
  ],
  afternoon: [
    {
      withName: 'Olha quem apareceu por aqui, {nome}!',
      withoutName: 'Olha quem apareceu por aqui!',
      subline: 'Vamos ver como está o movimento?',
    },
    {
      withName: 'E aí, {nome}! Como anda esse financeiro?',
      withoutName: 'E aí! Como anda esse financeiro?',
      subline: 'Hora de dar aquela conferida nas contas.',
    },
    {
      withName: 'Fala, {nome}! Tudo sob controle por aí?',
      withoutName: 'Tudo sob controle por aí?',
      subline: 'Passando só para conferir o financeiro.',
    },
    {
      withName: 'Boa tarde, {nome}! Metade do caminho feita.',
      withoutName: 'Boa tarde! Metade do caminho já foi feita.',
      subline: 'Como estão as contas até aqui?',
    },
    {
      withName: 'Olá, {nome}! Que tal uma olhadinha no saldo?',
      withoutName: 'Que tal uma olhadinha no saldo?',
      subline: 'Leva menos tempo que o cafezinho da tarde.',
    },
    {
      withName: 'Tarde produtiva por aí, {nome}?',
      withoutName: 'Tarde produtiva por aí?',
      subline: 'Os números do mês estão logo abaixo.',
    },
  ],
  night: [
    {
      withName: 'E aí, {nome}! Vamos fechar o dia com as contas?',
      withoutName: 'Vamos fechar o dia de olho nas contas?',
      subline: 'Um balanço rápido antes de desligar tudo.',
    },
    {
      withName: 'Chegou a hora daquela última conferida, {nome}.',
      withoutName: 'Chegou a hora daquela última conferida.',
      subline: 'Cinco minutos agora rendem uma noite calma.',
    },
    {
      withName: 'Fim de expediente, {nome}?',
      withoutName: 'Fim de expediente por aí?',
      subline: 'O financeiro ainda está de olho por aqui.',
    },
    {
      withName: 'Boa noite, {nome}! Como o dia terminou?',
      withoutName: 'Boa noite! Como o dia terminou?',
      subline: 'Os números contam o resto da história.',
    },
    {
      withName: 'Mais um dia chegando ao fim, {nome}.',
      withoutName: 'Mais um dia chegando ao fim.',
      subline: 'Tudo em ordem por aqui? Dá uma conferida.',
    },
    {
      withName: 'Noite tranquila por aí, {nome}?',
      withoutName: 'Noite tranquila por aí?',
      subline: 'Financeiro sob controle combina com descanso.',
    },
  ],
};

export function greetingDisplayName(name: string | null | undefined): string | null {
  const first = (name ?? '').trim().split(/\s+/)[0] ?? '';

  return first.length > 0 ? first : null;
}

export function dayPeriod(hour: number): DayPeriod {
  const normalized = Number.isFinite(hour) ? Math.min(LAST_HOUR, Math.max(0, Math.floor(hour))) : 0;

  if (normalized < DAWN_END_HOUR) {
    return 'dawn';
  }

  if (normalized < MORNING_END_HOUR) {
    return 'morning';
  }

  if (normalized < AFTERNOON_END_HOUR) {
    return 'afternoon';
  }

  return 'night';
}

export function selectGreeting(period: DayPeriod, seed: number): GreetingMessage {
  const messages = GREETING_CATALOG[period];
  const safeSeed = Number.isFinite(seed) ? Math.min(Math.max(seed, 0), 1) : 0;

  return messages[Math.min(messages.length - 1, Math.floor(safeSeed * messages.length))];
}

export function buildGreeting(period: DayPeriod, name: string | null, seed: number): GreetingText {
  const message = selectGreeting(period, seed);
  const headline = name
    ? message.withName.split(GREETING_NAME_TOKEN).join(name)
    : message.withoutName;

  return { headline, subline: message.subline };
}
