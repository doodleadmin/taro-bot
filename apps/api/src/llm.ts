import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { config } from './config.js';
import { ARCANA, DECKS, cardTitle, cardKnowledge, domainForSpread } from '@taro/shared';
import type { DrawnCard, Spread, AiInterpretation, DeckId, PairExtra, NatalResult } from '@taro/shared';

// Card descriptions — loaded once
// We import the raw desc data here (duplicates the JS source but keeps server self-contained)
import { CARD_DESC_MANSION, CARD_DESC_WOOD } from './card-desc-data.js';

const CARD_DESC: Record<DeckId, string[]> = {
  mansion: CARD_DESC_MANSION,
  wood: CARD_DESC_WOOD,
  classic: CARD_DESC_WOOD,
};

// Человекочитаемое название сферы вопроса (для шапки промпта).
const DOMAIN_LABEL: Record<string, string> = {
  love: 'любовь и отношения',
  work: 'деньги, работа, карьера',
  situation: 'ситуация и её развитие',
  advice: 'совет и выбор действия',
};

/**
 * Методика конкретного расклада — как профессионал ведёт именно этот разбор.
 * Заставляет модель работать по существу вопроса, а не пересказывать карты.
 */
function spreadMethod(spread: Spread): string {
  switch (spread.id) {
    case 'yesno':
      return 'Методика «Да или Нет»: дай ясный ответ ДА / НЕТ / СКОРЕЕ ДА / СКОРЕЕ НЕТ, опираясь на вердикт карты, но не ограничивайся им. Объясни, ПОЧЕМУ карта склоняет ответ туда, какие условия способны изменить исход, что человеку сделать сейчас и какой скрытый риск есть в самом вопросе.';
    case 'question':
      return 'Методика «Вопрос картам»: разбор по линии прошлое → настоящее → ближайшее развитие. Каждая карта показывает не общее значение, а свою роль в истории вопроса: откуда пришла ситуация, что происходит сейчас, к чему всё идёт и как человек может повлиять на исход.';
    case 'love':
      return 'Методика «Отношения»: живой анализ пары по позициям Вы → Партнёр → Что связывает → Препятствие → Перспектива. Раскрывай мотивы, чувства, ожидания и страхи обеих сторон, что сближает и что отдаляет. Заверши бережным советом по поведению.';
    case 'situation':
      return 'Методика «Ситуация»: диагностический разбор по позициям Суть → Причина → Скрытое → Совет → Исход. Отделяй факты от скрытых влияний, в каждой позиции отвечай на вопрос «что это значит именно для моей ситуации» и давай практический вывод.';
    case 'match':
      return 'Методика «Совместимость»: оцени не «подходит/не подходит», а КАК двое взаимодействуют — вклад каждого, силу влечения, главный вызов, будущее союза и что сделать, чтобы связь стала здоровее. Если в данных есть имена — обращайся по именам.';
    case 'money':
      return 'Методика «Деньги и карьера»: разбор через работу, деньги, ресурсы и решения по позициям Сейчас → Препятствие → Скрытый ресурс → Совет → Перспектива. Дай практичные шаги: что усилить, чего избегать, где искать возможность.';
    case 'celtic':
      return 'Методика «Кельтский крест»: глубокий профессиональный разбор. Не пересказывай позиции списком — собери целостную картину (суть, конфликт, глубинная причина, влияние прошлого, цель, ближайшее будущее, роль человека, окружение, надежды/страхи, итог), покажи причинно-следственные связи между картами и дай конкретный план действий.';
    case 'year':
      return 'Методика «Прогноз на год»: каждая карта — тема месяца. Для каждого месяца скажи, какая сфера активна, какой шанс/риск несёт карта и что лучше сделать. В итоге выдели главную линию года, сильные и осторожные месяцы и общий совет.';
    default:
      return 'Методика: отвечай как таролог на конкретный вопрос человека. Значения карт используй как материал для анализа, а не как справочник.';
  }
}

function buildPrompt(
  spread: Spread,
  draw: DrawnCard[],
  question: string,
  deckId: DeckId,
  extra?: PairExtra,
): string {
  const deckTitle = DECKS.find(d => d.id === deckId)?.title ?? '';
  const big = draw.length >= 10;
  const mid = draw.length >= 5;
  const perCard = big ? '5–7 предложений' : mid ? '4–5 предложений' : '3–4 предложения';
  const sumLen = big ? '8–10 предложений' : mid ? '6–8 предложений' : '4–6 предложений';

  const domain = domainForSpread(spread.id);
  const domainLabel = DOMAIN_LABEL[domain] ?? 'ситуация';

  // По каждой карте: позиция, название, положение, и ТОЧНОЕ значение под сферу+позицию
  // из профессиональной базы знаний (cardKnowledge), плюс краткий «вкус» колоды.
  const lines = draw.map((d, i) => {
    const card = ARCANA.find(c => c.n === d.n)!;
    const pos = spread.positions[i] ?? `Карта ${i + 1}`;
    const knowledge = cardKnowledge(card.n, spread.id, pos, d.reversed);
    const flavor = (CARD_DESC[deckId]?.[card.n] ?? '').slice(0, 160);
    const orient = d.reversed ? 'перевёрнутая' : 'прямая';
    return `${i + 1}. Позиция «${pos}» — ${cardTitle(card)} (${orient}). Ключ: ${card.key}.\n   Значение в этой сфере: ${knowledge}${flavor ? `\n   Образ колоды: ${flavor}` : ''}`;
  }).join('\n');

  let pairBlock = '';
  if (extra?.type === 'pair' && extra.a?.name) {
    const fmt = (p: { name: string; date?: string; city?: string }) =>
      `${p.name || '—'}${p.date ? `, род. ${p.date}` : ''}${p.city ? `, ${p.city}` : ''}`;
    pairBlock = `\nЛюди в раскладе: ${extra.labelA || 'Первый'} — ${fmt(extra.a)}; ${extra.labelB || 'Второй'} — ${fmt(extra.b)}. Обращайся к ним по именам и учитывай их в трактовке.`;
  }

  const schemaExample = draw.map((_, i) => `"развёрнутая трактовка позиции ${i + 1} (${perCard})"`).join(', ');
  const method = spreadMethod(spread);

  return `Ты — опытный практикующий таролог. Перед тобой человек с конкретным вопросом, тревогой или выбором. Твоя задача — не описать карты из учебника, а провести настоящий разбор ПО СУЩЕСТВУ его вопроса, как живой консультант, сидящий напротив.

Расклад: «${spread.title}» (${draw.length} карт). Сфера вопроса: ${domainLabel}. Колода: «${deckTitle}».
Вопрос человека: "${question || 'Вопрос не задан — дай разбор по сути расклада.'}"${pairBlock}

Выпавшие карты (для каждой уже подобрано точное значение под сферу вопроса и положение карты):
${lines}

${method}

Как мыслить (про себя, не выводи эти шаги):
1. Пойми суть вопроса и сферу жизни, которую он затрагивает.
2. Прочитай каждую карту именно в её позиции и в этой сфере, опираясь на данное «Значение в этой сфере» и учитывая прямое/перевёрнутое положение.
3. Свяжи карты между собой: как они усиливают или меняют друг друга, какую общую историю рассказывают.
4. Сделай вывод по сути вопроса и дай конкретный, выполнимый совет.

Правила качества:
- В каждой позиции сначала скажи, ЧТО карта означает именно по вопросу человека, и лишь потом используй символику. Пиши «в вашей ситуации это показывает…», «здесь важно…», «ответ карты такой…», а не «эта карта означает…».
- Давай конкретику: мотивы, причины, вероятное развитие, риски, действия, сроки/этапы там, где уместно.
- У одной карты много значений — выбирай то, что подходит позиции, вопросу, соседним картам и положению.
- Не обещай абсолютное будущее: говори о тенденции и пути влияния. Пиши тепло, живо, без воды и канцелярита.

Это ${big ? 'большой и важный' : 'значимый'} расклад — дай насыщенную трактовку. По КАЖДОЙ позиции напиши ${perCard}. В итоге свяжи карты в единую историю и ответь на вопрос целиком.
Верни СТРОГО валидный JSON без markdown и пояснений, по схеме:
{"cards": [${schemaExample}], "summary": "цельный вывод по всему раскладу и конкретный практический совет (${sumLen})"}`;
}

function parseResponse(raw: string): AiInterpretation {
  let txt = String(raw).trim().replace(/^```(json)?/i, '').replace(/```$/, '').trim();
  const s = txt.indexOf('{');
  const e = txt.lastIndexOf('}');
  if (s >= 0 && e > s) txt = txt.slice(s, e + 1);
  const parsed = JSON.parse(txt);
  return {
    cards: Array.isArray(parsed.cards) ? parsed.cards.map(String) : [],
    summary: String(parsed.summary ?? ''),
  };
}

function staticFallback(draw: DrawnCard[], spread: Spread): AiInterpretation {
  const cards = draw.map(d => {
    const card = ARCANA.find(c => c.n === d.n)!;
    return d.reversed ? card.rev : card.up;
  });
  const summary = `Расклад «${spread.title}» завершён. Проанализируйте каждую карту в контексте вашего вопроса.`;
  return { cards, summary };
}

async function callOpenAI(prompt: string, maxTokens = 2048): Promise<string> {
  const client = new OpenAI({ apiKey: config.llmApiKey });
  const resp = await client.chat.completions.create({
    model: config.llmModel,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.85,
    max_tokens: maxTokens,
  });
  return resp.choices[0]?.message?.content ?? '';
}

async function callAnthropic(prompt: string, maxTokens = 2048): Promise<string> {
  const client = new Anthropic({ apiKey: config.llmApiKey });
  // Без temperature: совместимо и с Sonnet 4.6, и с Opus 4.8 (там sampling-параметры удалены).
  const resp = await client.messages.create({
    model: config.llmModel,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  const block = resp.content[0];
  if (!block || block.type !== 'text') return '';
  return block.text;
}

const ZODIAC_RU = ['Овен','Телец','Близнецы','Рак','Лев','Дева','Весы','Скорпион','Стрелец','Козерог','Водолей','Рыбы'];
const PLANET_RU: Record<string, string> = {
  sun: 'Солнце', moon: 'Луна', mercury: 'Меркурий', venus: 'Венера',
  mars: 'Марс', jupiter: 'Юпитер', saturn: 'Сатурн',
};

export async function getDailyInterpretation(cardName: string, cardKey: string, cardUp: string): Promise<string> {
  const prompt = `Ты — таролог, который каждое утро пишет короткое послание на день своим подписчикам.

Сегодняшняя карта дня: ${cardName}. Ключевое слово: ${cardKey}. Основное значение: ${cardUp}.

Напиши живое вдохновляющее сообщение-настрой на сегодняшний день (3–4 предложения): что несёт эта карта, на что обратить внимание, какую энергию использовать. Пиши тепло, образно, в настоящем времени. Не пересказывай учебное значение карты — дай личное послание для дня. Отвечай только текстом сообщения, без заголовков.`;
  try {
    const raw = config.llmProvider === 'anthropic'
      ? await callAnthropic(prompt, 512)
      : await callOpenAI(prompt, 512);
    return raw.trim() || cardUp;
  } catch {
    return cardUp;
  }
}

export async function getNatalInterpretation(natalData: NatalResult, name: string, question: string): Promise<string> {
  const planetLines = natalData.planets
    .map(p => `${PLANET_RU[p.key] ?? p.key} в ${ZODIAC_RU[p.sign] ?? p.sign}`)
    .join(', ');
  const ascSign = ZODIAC_RU[natalData.asc] ?? natalData.asc;

  const prompt = `Ты — профессиональный астролог, специализирующийся на натальных картах. Клиент: ${name}.
Натальная карта: Солнце в ${ZODIAC_RU[natalData.sun]}, Луна в ${ZODIAC_RU[natalData.moon]}, Асцендент ${ascSign}.
Все планеты: ${planetLines}.
${question ? `Вопрос клиента: "${question}"` : 'Сделай общий разбор личности и жизненного пути.'}

Напиши живой профессиональный разбор натальной карты (8–12 предложений): характер, сильные стороны, вызовы, ключевые жизненные темы. Если есть вопрос — ответь на него через призму карты. Пиши тепло, конкретно, без шаблонных фраз. Обращайся по имени. Отвечай только текстом разбора, без заголовков и списков.`;
  try {
    const raw = config.llmProvider === 'anthropic'
      ? await callAnthropic(prompt, 1024)
      : await callOpenAI(prompt, 1024);
    return raw.trim() || `Натальная карта ${name} построена. Солнце в ${ZODIAC_RU[natalData.sun]}, Луна в ${ZODIAC_RU[natalData.moon]}.`;
  } catch {
    return `Натальная карта ${name} построена. Солнце в ${ZODIAC_RU[natalData.sun]}, Луна в ${ZODIAC_RU[natalData.moon]}.`;
  }
}

export async function getAiInterpretation(
  spread: Spread,
  draw: DrawnCard[],
  question: string,
  deckId: DeckId,
  extra?: PairExtra,
): Promise<AiInterpretation> {
  const prompt = buildPrompt(spread, draw, question, deckId, extra);
  // Масштабируем длину ответа по размеру расклада.
  const maxTokens = draw.length >= 10 ? 4096 : draw.length >= 5 ? 2800 : 2048;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      let raw: string;
      if (config.llmProvider === 'anthropic') {
        raw = await callAnthropic(prompt, maxTokens);
      } else {
        raw = await callOpenAI(prompt, maxTokens);
      }
      const result = parseResponse(raw);
      if (result.cards.length === draw.length && result.summary) {
        return result;
      }
    } catch (err) {
      if (attempt === 2) {
        console.error('LLM failed after 3 attempts, using fallback', err);
      }
    }
  }

  return staticFallback(draw, spread);
}
