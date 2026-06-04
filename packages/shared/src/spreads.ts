import type { Spread, TopupPackage, Deck } from './types.js';

export const SPREADS: Record<string, Spread> = {
  daily:    { id: 'daily',    title: 'Карта дня',        cat: 'Энергия 24 часов',   count: 1,  price: 0,   accent: '#5fd0a0', group: 'simple',
              sub: 'Совет и настроение на сегодня',
              positions: ['Сегодня'] },
  yesno:    { id: 'yesno',    title: 'Да или Нет',       cat: 'Прямой ответ',       count: 1,  price: 15,  free1card: true, accent: '#dcb86a', verdict: true, group: 'simple',
              sub: 'Быстрый и решительный ответ судьбы',
              positions: ['Ответ'] },
  question: { id: 'question', title: 'Вопрос картам',    cat: 'Энергия проявления', count: 3,  price: 15,  accent: '#dcb86a', group: 'simple',
              sub: 'Прошлое · Настоящее · Будущее',
              positions: ['Прошлое', 'Настоящее', 'Будущее'] },
  love:     { id: 'love',     title: 'Отношения',        cat: 'Тайны двух сердец',  count: 5,  price: 15,  accent: '#e06a9a', group: 'simple',
              sub: 'Глубокий анализ связи между вами',
              positions: ['Вы', 'Партнёр', 'Что вас связывает', 'Препятствие', 'Перспектива'] },
  situation:{ id: 'situation',title: 'Ситуация',         cat: 'Свет в темноте',     count: 5,  price: 15,  accent: '#6aa7e0', group: 'simple',
              sub: 'Разбор ситуации и поиск пути',
              positions: ['Суть', 'Причина', 'Скрытое', 'Совет', 'Исход'] },
  match:    { id: 'match',    title: 'Совместимость',    cat: 'Гармония душ',       count: 5,  price: 15,  accent: '#c46ae0', group: 'simple',
              sub: 'Проверка гармонии душ и характеров',
              positions: ['Вы', 'Партнёр', 'Влечение', 'Вызов', 'Будущее союза'] },
  money:    { id: 'money',    title: 'Деньги и карьера', cat: 'Путь достатка',      count: 5,  price: 15,  accent: '#cdae5e', group: 'simple',
              sub: 'Финансы, работа и денежный поток',
              positions: ['Сейчас', 'Препятствие', 'Скрытый ресурс', 'Совет', 'Перспектива'] },
  celtic:   { id: 'celtic',   title: 'Кельтский крест',  cat: 'Глубокий разбор',    count: 10, price: 30,  accent: '#b89be8', group: 'big',
              sub: 'Золотой стандарт Таро — 10 карт',
              positions: ['Ситуация', 'Вызов', 'Основа', 'Прошлое', 'Цель', 'Будущее', 'Вы', 'Окружение', 'Надежды и страхи', 'Итог'] },
  year:     { id: 'year',     title: 'Прогноз на год',   cat: '12 месяцев',         count: 12, price: 30,  accent: '#dcb86a', group: 'big',
              sub: 'Подробный расклад на 12 месяцев',
              positions: ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'] },
  natal:    { id: 'natal',    title: 'Натальная карта',  cat: 'Астрология',         count: 0,  price: 100, accent: '#b89be8', group: 'big',
              sub: 'Портрет личности по звёздам',
              positions: [] },
};

export const LAYOUTS: Record<number, Array<{ x: number; y: number; rot?: number }>> = {
  1:  [ {x:50, y:50} ],
  3:  [ {x:20, y:50}, {x:50, y:50}, {x:80, y:50} ],
  5:  [ {x:50, y:18}, {x:22, y:50}, {x:50, y:50}, {x:78, y:50}, {x:50, y:82} ],
  10: [ {x:33, y:50}, {x:33, y:50, rot:90}, {x:33, y:80}, {x:13, y:50}, {x:33, y:20}, {x:53, y:50},
        {x:80, y:84}, {x:80, y:61}, {x:80, y:38}, {x:80, y:15} ],
  12: Array.from({length:12}, (_,i) => {
    const a = (i * 30 - 90) * Math.PI / 180;
    return { x: 50 + Math.cos(a) * 40, y: 50 + Math.sin(a) * 40 };
  }),
};

export const TOPUP: TopupPackage[] = [
  { id: 't50',  amount: 50,  bonus: 0,   label: 'Старт' },
  { id: 't150', amount: 150, bonus: 15,  label: 'Выгодно',    badge: '+15₽' },
  { id: 't300', amount: 300, bonus: 45,  label: 'Популярный', badge: '+45₽', best: true },
  { id: 't700', amount: 700, bonus: 140, label: 'Максимум',   badge: '+140₽' },
];

export const DECKS: Deck[] = [
  { id: 'mansion', title: 'Dark Mansion', sub: 'Готическое серебро',    kind: 'image', path: 'cards/mansion', accent: '#9fb8c8' },
  { id: 'wood',    title: 'Dark Wood',    sub: 'Винтажный лес',         kind: 'image', path: 'cards/wood',    accent: '#a8b487' },
  { id: 'classic', title: 'Мистическое золото', sub: 'Фирменный стиль', kind: 'art',                          accent: '#dcb86a' },
];

export const SPREAD_COVER: Record<string, number> = {
  daily: 19, yesno: 11, question: 1, love: 6, situation: 9, match: 37, money: 64,
  celtic: 10, year: 21, natal: 18,
};

export const SEED_BALANCE = 45;
