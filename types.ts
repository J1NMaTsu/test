
export interface Card {
  id: string;
  question: string;
  answer: string;
  comment?: string;
  mastered: boolean;
  favorite: boolean;
  _originDeckId?: string;
  _originIndex?: number;
}

export interface Deck {
  id: string;
  name: string;
  cards: Card[];
  createdAt: number;
}

export enum Theme {
  DEFAULT = 'default',
  SUNSET = 'sunset',
  OCEAN = 'ocean',
  FOREST = 'forest'
}

export const THEME_BG: Record<Theme, string> = {
  [Theme.DEFAULT]: 'bg-gradient-to-br from-[#667eea] to-[#764ba2]',
  [Theme.SUNSET]: 'bg-gradient-to-br from-[#ff9a9e] to-[#fecfef]',
  [Theme.OCEAN]: 'bg-gradient-to-br from-[#4facfe] to-[#00f2fe]',
  [Theme.FOREST]: 'bg-gradient-to-br from-[#66bb6a] to-[#43a047]'
};
