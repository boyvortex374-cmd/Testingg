
export enum AppView {
  HOME = 'HOME',
  QUIZ_SETUP = 'QUIZ_SETUP',
  QUIZ_ACTIVE = 'QUIZ_ACTIVE',
  GAMES_HUB = 'GAMES_HUB',
  GAME_MYSTERY = 'GAME_MYSTERY',
  GAME_EMOJI = 'GAME_EMOJI',
}

export type Language = 'en' | 'hi' | 'ne';

export interface UserStats {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  totalGamesPlayed: number;
  totalWins: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface QuizConfig {
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
}

export interface GameMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
}

export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  WON = 'WON',
  LOST = 'LOST',
}

export type GameType = 'none' | 'mystery' | 'emoji' | 'truth' | 'riddle' | 'odd' | 'custom' | 'custom-setup' | 'tictactoe' | 'memory';
