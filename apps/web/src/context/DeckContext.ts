import { createContext } from 'react';
import type { DeckId } from '@taro/shared';

export const DeckContext = createContext<DeckId>('mansion');
