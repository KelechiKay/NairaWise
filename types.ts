
export interface PlayerStats {
  balance: number;
  savings: number;
  debt: number;
  happiness: number;
  currentWeek: number;
  job: string;
}

export interface Stock {
  id: string;
  name: string;
  price: number;
  history: number[];
  sector: string;
}

export interface PortfolioItem {
  stockId: string;
  shares: number;
  averagePrice: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface MarketNews {
  headline: string;
  impact: string; // "positive", "negative", "neutral"
  stockId?: string;
}

export interface Choice {
  text: string;
  consequence: string;
  impact: {
    balance: number;
    savings: number;
    debt: number;
    happiness: number;
  };
}

export interface Scenario {
  title: string;
  description: string;
  imageTheme: string;
  choices: Choice[];
  marketEvent?: MarketNews;
}

export interface GameLog {
  week: number;
  title: string;
  decision: string;
  consequence: string;
}

export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER',
  LOADING = 'LOADING'
}
