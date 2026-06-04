import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { config } from './config.js';
import { ARCANA, DECKS, cardTitle } from '@taro/shared';
import type { DrawnCard, Spread, AiInterpretation, DeckId, PairExtra } from '@taro/shared';

// Card descriptions — loaded once
// We import the raw desc data here (duplicates the JS source but keeps server self-contained)
import { CARD_DESC_MANSION, CARD_DESC_WOOD } from './card-desc-data.js';

const CARD_DESC: Record<DeckId, string[]> = {
  mansion: CARD_DESC_MANSION,
  wood: CARD_DESC_WOOD,
  classic: CARD_DESC_WOOD,
};

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
  const perCard = big ? '3–4 предложения' : '2–3 предложения';
  const sumLen = big ? '5–7 предложений' : mid ? '4–5 предложений' : '3–4 предложения';

  const lines = draw.map((d, i) => {
    const card = ARCANA.find(c => c.n === d.n)!;
    const pos = spread.positions[i] ?? `Карта ${i + 1}`;
    const desc = (CARD_DESC[deckId]?.[card.n] ?? '').slice(0, 260);
    return `${i + 1}. Позиция «${pos}»: ${cardTitle(card)}${d.reversed ? ' (перевёрнутая)' : ''}. Ключ: ${card.key}. Смысл: ${desc}`;
  }).join('\n');

  let pairBlock = '';
  if (extra?.type === 'pair' && extra.a?.name) {
    const fmt = (p: { name: string; date?: string; city?: string }) =>
      `${p.name || '—'}${p.date ? `, род. ${p.date}` : ''}${p.city ? `, ${p.city}` : ''}`;
    pairBlock = `\nЛюди в раскладе: ${extra.labelA || 'Первый'} — ${fmt(extra.a)}; ${extra.labelB || 'Второй'} — ${fmt(extra.b)}. Обращайся к ним по именам и учитывай их в трактовке.`;
  }

  const schemaExample = draw.map((_, i) => `"подробная трактовка позиции ${i + 1} (${perCard})"`).join(', ');

  return `Ты — мудрый, тёплый и красноречивый таролог. Сделай глубокую трактовку расклада на русском, обращаясь на «вы».
Расклад: «${spread.title}» (${draw.length} карт). Колода: «${deckTitle}».
Вопрос человека: "${question}"${pairBlock}
Выпавшие карты:
${lines}

Это ${big ? 'большой и важный' : 'значимый'} расклад — дай развёрнутую, насыщенную и интересную для чтения трактовку. По КАЖДОЙ позиции напиши ${perCard}: что означает карта именно в этой позиции и в контексте вопроса, как она влияет на ситуацию, и что с этим делать. Свяжи карты между собой в единую живую историю, учитывай позиции, соседство карт и перевёрнутость. Пиши образно и тепло, без «воды» и канцелярита.
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

async function callOpenAI(prompt: string): Promise<string> {
  const client = new OpenAI({ apiKey: config.llmApiKey });
  const resp = await client.chat.completions.create({
    model: config.llmModel,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.85,
    max_tokens: 2048,
  });
  return resp.choices[0]?.message?.content ?? '';
}

async function callAnthropic(prompt: string): Promise<string> {
  const client = new Anthropic({ apiKey: config.llmApiKey });
  const resp = await client.messages.create({
    model: config.llmModel,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });
  const block = resp.content[0];
  if (block.type !== 'text') return '';
  return block.text;
}

export async function getAiInterpretation(
  spread: Spread,
  draw: DrawnCard[],
  question: string,
  deckId: DeckId,
  extra?: PairExtra,
): Promise<AiInterpretation> {
  const prompt = buildPrompt(spread, draw, question, deckId, extra);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      let raw: string;
      if (config.llmProvider === 'anthropic') {
        raw = await callAnthropic(prompt);
      } else {
        raw = await callOpenAI(prompt);
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
