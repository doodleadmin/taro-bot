// Shared TypeScript types for Taro Premium

export type DeckId = 'mansion' | 'wood' | 'classic';
export type Theme = 'midnight' | 'amethyst' | 'emerald';
export type SpreadId = 'daily' | 'yesno' | 'question' | 'love' | 'situation' | 'match' | 'money' | 'celtic' | 'year' | 'natal';
export type TransactionType = 'topup' | 'spend' | 'free';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type PaymentProvider = 'telegram' | 'yukassa';

export interface Card {
  n: number;
  rom: string;
  name: string;
  glyph: string;
  key: string;
  up: string;
  rev: string;
  suit?: string;
}

export interface DrawnCard {
  n: number;
  reversed: boolean;
}

export interface Spread {
  id: SpreadId;
  title: string;
  cat: string;
  count: number;
  price: number;
  accent: string;
  group: 'simple' | 'big';
  sub: string;
  positions: string[];
  free1card?: boolean;
  verdict?: boolean;
}

export interface TopupPackage {
  id: string;
  amount: number;
  bonus: number;
  label: string;
  badge?: string;
  best?: boolean;
}

export interface Deck {
  id: DeckId;
  title: string;
  sub: string;
  kind: 'art' | 'image';
  path?: string;
  accent: string;
}

export interface AiInterpretation {
  cards: string[];
  summary: string;
}

// API request/response types

export interface AuthRequest {
  initData: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface UserProfile {
  id: number;
  tgId: string;
  firstName: string;
  username: string | null;
  photoUrl: string | null;
  balance: number;
  isAdmin?: boolean;
  deck: DeckId;
  freeAvailableToday: boolean;
  introFreeRemaining?: number;
  dailyFreeAvailableToday?: boolean;
  dayRevealedToday: boolean;
  createdAt: string;
}

export interface CatalogResponse {
  spreads: Spread[];
  topup: TopupPackage[];
  decks: Deck[];
}

export interface ReadingRequest {
  spreadId: SpreadId;
  question?: string;
  extra?: PairExtra | NatalExtra;
}

export interface PairExtra {
  type: 'pair';
  labelA: string;
  labelB: string;
  a: { name: string; date?: string; city?: string };
  b: { name: string; date?: string; city?: string };
}

export interface NatalExtra {
  type: 'natal';
  name: string;
  date: string;
  time?: string;
  place?: string;
  question?: string;
}

export interface ReadingResponse {
  id: number;
  spreadId: SpreadId;
  question: string;
  cards: DrawnCard[];
  interpretation: AiInterpretation;
  balance: number;
  paidWith?: 'free' | 'paid';
  freeAvailableToday?: boolean;
  introFreeRemaining?: number;
  dailyFreeAvailableToday?: boolean;
  createdAt: string;
}

export interface HistoryItem {
  id: number;
  spreadId: SpreadId;
  question: string;
  cards: DrawnCard[];
  interpretation: AiInterpretation;
  extra?: PairExtra | NatalExtra | null;
  createdAt: string;
}

export interface DailyCardResponse {
  card: Card;
  revealed: boolean;
  interpretation?: string;
}

export interface TopupCreateRequest {
  packageId: string;
}

export interface TopupCreateResponse {
  paymentUrl?: string;
  invoiceId?: string;
  // For Telegram Stars
  telegramInvoice?: TelegramInvoice;
}

export interface TelegramInvoice {
  title: string;
  description: string;
  payload: string;
  providerToken: string;
  currency: string;
  prices: Array<{ label: string; amount: number }>;
}

export interface Transaction {
  id: number;
  type: TransactionType;
  title: string;
  amount: number;
  createdAt: string;
}

// Natal chart types
export interface NatalChartData {
  sunSign: ZodiacSign;
  moonSign: ZodiacSign;
  ascendant: ZodiacSign;
  planets: PlanetPosition[];
  elements: ElementBalance;
  aspects: Aspect[];
}

export type ZodiacSign =
  | 'aries' | 'taurus' | 'gemini' | 'cancer'
  | 'leo' | 'virgo' | 'libra' | 'scorpio'
  | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export interface PlanetPosition {
  planet: string;
  sign: ZodiacSign;
  degree: number;
  retrograde: boolean;
}

export interface ElementBalance {
  fire: number;
  earth: number;
  air: number;
  water: number;
}

export interface Aspect {
  planet1: string;
  planet2: string;
  type: string;
  orb: number;
}
