
import React, { useState, useEffect, useRef } from 'react';
import { GameMessage, GameStatus, Language, GameType } from '../types';
import { createMysteryGameChat, createEmojiGameChat, createTwoTruthsChat, createRiddleChat, createOddOneOutChat, createCustomGameChat, generateSpeech } from '../services/geminiService';
import { Button, Icons, Card } from './UI';
import { Chat, GenerateContentResponse } from '@google/genai';
import { getText } from '../utils/translations';
import { useTTS } from '../hooks/useTTS';
import { playSuccessSound, playErrorSound } from '../utils/audio';

interface GamesProps {
  onBack: () => void;
  lang: Language;
  onEarnXP: (amount: number) => void;
}

// --- Theme Configuration ---
const GAME_THEMES: Record<string, {
  bgGradient: string;
  hudBorder: string;
  accentText: string;
  aiBubble: string;
  userBubble: string;
  avatarAiBg: string;
  avatarAiText: string;
  avatarUserBg: string;
  avatarUserText: string;
  inputRing: string;
  sendBtn: string;
  primaryColor: string; // For icon backgrounds in menu
}> = {
  mystery: {
    bgGradient: "from-indigo-950 via-slate-900 to-black",
    hudBorder: "border-indigo-500/30",
    accentText: "text-indigo-400",
    aiBubble: "bg-indigo-950/40 border-indigo-500/30 text-indigo-100 shadow-[0_0_15px_rgba(99,102,241,0.1)]",
    userBubble: "bg-indigo-600/20 border-indigo-500/30 text-indigo-50",
    avatarAiBg: "bg-indigo-950",
    avatarAiText: "text-indigo-400",
    avatarUserBg: "bg-indigo-900/50",
    avatarUserText: "text-indigo-300",
    inputRing: "focus-within:border-indigo-500 focus-within:ring-indigo-500/50",
    sendBtn: "text-indigo-400 hover:bg-indigo-500/10",
    primaryColor: "indigo"
  },
  emoji: {
    bgGradient: "from-fuchsia-950 via-purple-950 to-black",
    hudBorder: "border-fuchsia-500/30",
    accentText: "text-fuchsia-400",
    aiBubble: "bg-fuchsia-950/40 border-fuchsia-500/30 text-fuchsia-100 shadow-[0_0_15px_rgba(217,70,239,0.1)]",
    userBubble: "bg-pink-600/20 border-pink-500/30 text-pink-50",
    avatarAiBg: "bg-fuchsia-950",
    avatarAiText: "text-fuchsia-400",
    avatarUserBg: "bg-fuchsia-900/50",
    avatarUserText: "text-fuchsia-300",
    inputRing: "focus-within:border-fuchsia-500 focus-within:ring-fuchsia-500/50",
    sendBtn: "text-fuchsia-400 hover:bg-fuchsia-500/10",
    primaryColor: "fuchsia"
  },
  truth: {
    bgGradient: "from-emerald-950 via-teal-950 to-black",
    hudBorder: "border-emerald-500/30",
    accentText: "text-emerald-400",
    aiBubble: "bg-emerald-950/40 border-emerald-500/30 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
    userBubble: "bg-emerald-600/20 border-emerald-500/30 text-emerald-50",
    avatarAiBg: "bg-emerald-950",
    avatarAiText: "text-emerald-400",
    avatarUserBg: "bg-emerald-900/50",
    avatarUserText: "text-emerald-300",
    inputRing: "focus-within:border-emerald-500 focus-within:ring-emerald-500/50",
    sendBtn: "text-emerald-400 hover:bg-emerald-500/10",
    primaryColor: "emerald"
  },
  riddle: {
    bgGradient: "from-violet-950 via-indigo-950 to-black",
    hudBorder: "border-violet-500/30",
    accentText: "text-violet-400",
    aiBubble: "bg-violet-950/40 border-violet-500/30 text-violet-100 shadow-[0_0_15px_rgba(139,92,246,0.1)]",
    userBubble: "bg-violet-600/20 border-violet-500/30 text-violet-50",
    avatarAiBg: "bg-violet-950",
    avatarAiText: "text-violet-400",
    avatarUserBg: "bg-violet-900/50",
    avatarUserText: "text-violet-300",
    inputRing: "focus-within:border-violet-500 focus-within:ring-violet-500/50",
    sendBtn: "text-violet-400 hover:bg-violet-500/10",
    primaryColor: "violet"
  },
  odd: {
    bgGradient: "from-rose-950 via-red-950 to-black",
    hudBorder: "border-rose-500/30",
    accentText: "text-rose-400",
    aiBubble: "bg-rose-950/40 border-rose-500/30 text-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.1)]",
    userBubble: "bg-rose-600/20 border-rose-500/30 text-rose-50",
    avatarAiBg: "bg-rose-950",
    avatarAiText: "text-rose-400",
    avatarUserBg: "bg-rose-900/50",
    avatarUserText: "text-rose-300",
    inputRing: "focus-within:border-rose-500 focus-within:ring-rose-500/50",
    sendBtn: "text-rose-400 hover:bg-rose-500/10",
    primaryColor: "rose"
  },
  custom: {
    bgGradient: "from-amber-950 via-orange-950 to-black",
    hudBorder: "border-amber-500/30",
    accentText: "text-amber-400",
    aiBubble: "bg-amber-950/40 border-amber-500/30 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
    userBubble: "bg-amber-600/20 border-amber-500/30 text-amber-50",
    avatarAiBg: "bg-amber-950",
    avatarAiText: "text-amber-400",
    avatarUserBg: "bg-amber-900/50",
    avatarUserText: "text-amber-300",
    inputRing: "focus-within:border-amber-500 focus-within:ring-amber-500/50",
    sendBtn: "text-amber-400 hover:bg-amber-500/10",
    primaryColor: "amber"
  },
  tictactoe: {
    bgGradient: "from-cyan-950 via-blue-950 to-black",
    hudBorder: "border-cyan-500/30",
    accentText: "text-cyan-400",
    aiBubble: "", userBubble: "", avatarAiBg: "", avatarAiText: "", avatarUserBg: "", avatarUserText: "", inputRing: "", sendBtn: "", primaryColor: "cyan"
  },
  memory: {
    bgGradient: "from-pink-950 via-purple-950 to-black",
    hudBorder: "border-pink-500/30",
    accentText: "text-pink-400",
    aiBubble: "", userBubble: "", avatarAiBg: "", avatarAiText: "", avatarUserBg: "", avatarUserText: "", inputRing: "", sendBtn: "", primaryColor: "pink"
  }
};

export const Games: React.FC<GamesProps> = ({ onBack, lang, onEarnXP }) => {
  const [activeGame, setActiveGame] = useState<GameType>('none');
  const [customPrompt, setCustomPrompt] = useState('');

  if (activeGame === 'none') {
    return (
      <div className="max-w-6xl mx-auto animate-fade-in pb-10 px-4">
        <Button variant="ghost" onClick={onBack} icon={Icons.Back} className="mb-6">{getText(lang, 'backHome')}</Button>
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight drop-shadow-lg">
            {getText(lang, 'gameArcade')}
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto text-base md:text-lg">{getText(lang, 'chooseArena')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { id: 'mystery', icon: Icons.Sparkles, color: 'indigo', title: getText(lang, 'mysteryTitle'), desc: getText(lang, 'mysteryDesc') },
            { id: 'memory', icon: Icons.BrainCircuit, color: 'pink', title: getText(lang, 'memoryTitle'), desc: getText(lang, 'memoryDesc') },
            { id: 'tictactoe', icon: Icons.Grid3x3, color: 'cyan', title: getText(lang, 'tictacTitle'), desc: getText(lang, 'tictacDesc') },
            { id: 'emoji', icon: Icons.Game, color: 'fuchsia', title: getText(lang, 'emojiTitle'), desc: getText(lang, 'emojiDesc') },
            { id: 'truth', icon: Icons.List, color: 'emerald', title: getText(lang, 'truthTitle'), desc: getText(lang, 'truthDesc') },
            { id: 'riddle', icon: Icons.Help, color: 'violet', title: getText(lang, 'riddleTitle'), desc: getText(lang, 'riddleDesc') },
            { id: 'odd', icon: Icons.Target, color: 'rose', title: getText(lang, 'oddTitle'), desc: getText(lang, 'oddDesc') },
            { id: 'custom-setup', icon: Icons.Magic, color: 'amber', title: getText(lang, 'customTitle'), desc: getText(lang, 'customDesc') },
          ].map((game) => (
            <button 
              key={game.id}
              onClick={() => setActiveGame(game.id as GameType)}
              className={`group relative overflow-hidden bg-slate-900/40 border border-slate-700/50 rounded-3xl text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl backdrop-blur-sm flex flex-col h-full`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br from-${game.color}-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="p-6 md:p-8 flex-1 relative z-10">
                 <div className="flex justify-between items-start mb-6">
                    <div className={`w-14 h-14 bg-${game.color}-500/20 text-${game.color}-400 rounded-2xl flex items-center justify-center shadow-lg border border-${game.color}-500/20 group-hover:scale-110 transition-transform duration-300`}>
                      <game.icon className="w-7 h-7" />
                    </div>
                    <div className={`bg-${game.color}-500/10 text-${game.color}-300 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider border border-${game.color}-500/20 opacity-0 group-hover:opacity-100 transition-opacity`}>
                       +50 XP
                    </div>
                 </div>
                <h3 className="text-xl font-bold text-white mb-2 tracking-wide">{game.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{game.desc}</p>
              </div>

              <div className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-between relative z-10">
                 <span className={`text-xs font-medium text-${game.color}-400 group-hover:text-white transition-colors`}>{getText(lang, 'play')}</span>
                 <Icons.Next className={`w-4 h-4 text-${game.color}-400 transform group-hover:translate-x-1 transition-transform`} />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (activeGame === 'custom-setup') {
    return (
      <div className="max-w-xl mx-auto animate-fade-in pt-10 px-4">
        <Button variant="ghost" onClick={() => setActiveGame('none')} icon={Icons.Back} className="mb-4">{getText(lang, 'backHome')}</Button>
        <Card title={getText(lang, 'customTitle')} description={getText(lang, 'customDesc')}>
          <div className="space-y-6">
             <div>
               <label className="block text-sm font-medium text-slate-300 mb-2">{getText(lang, 'customPromptLabel')}</label>
               <textarea
                 className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors outline-none h-32 resize-none font-mono text-sm"
                 placeholder={getText(lang, 'customPromptPlaceholder')}
                 value={customPrompt}
                 onChange={(e) => setCustomPrompt(e.target.value)}
               />
             </div>
             <Button 
               onClick={() => setActiveGame('custom')} 
               disabled={!customPrompt.trim()} 
               className="w-full bg-amber-600 hover:bg-amber-500 text-white border-none" 
               icon={Icons.Sparkles}
             >
               {getText(lang, 'startGame')}
             </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (activeGame === 'tictactoe') {
    return <TicTacToeSession onExit={() => setActiveGame('none')} lang={lang} onWin={() => onEarnXP(50)} />;
  }

  if (activeGame === 'memory') {
    return <MemoryGameSession onExit={() => setActiveGame('none')} lang={lang} onWin={() => onEarnXP(75)} />;
  }

  return (
    <ActiveGameSession 
      gameType={activeGame as GameType} 
      onExit={() => setActiveGame('none')} 
      lang={lang}
      customConfig={customPrompt}
      onWin={() => onEarnXP(30)} // Smaller reward for text games per round usually
    />
  );
};

// --- Memory Game Component ---

interface MemoryCard {
  id: number;
  icon: React.ElementType;
  color: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const MemoryGameSession: React.FC<{ onExit: () => void; lang: Language; onWin: () => void }> = ({ onExit, lang, onWin }) => {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isGameWon, setIsGameWon] = useState(false);

  // Card Icons Pool
  const icons = [Icons.Brain, Icons.Zap, Icons.Game, Icons.Trophy, Icons.Sparkles, Icons.Lock, Icons.Globe, Icons.Target];
  const colors = ['text-pink-400', 'text-cyan-400', 'text-yellow-400', 'text-green-400', 'text-purple-400', 'text-red-400', 'text-blue-400', 'text-orange-400'];

  useEffect(() => {
    startNewGame();
  }, []);

  useEffect(() => {
    let interval: any;
    if (isGameActive && !isGameWon) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isGameActive, isGameWon]);

  const startNewGame = () => {
    // Create pairs
    const deck: MemoryCard[] = [];
    for (let i = 0; i < 8; i++) {
      deck.push({ id: i * 2, icon: icons[i], color: colors[i], isFlipped: false, isMatched: false });
      deck.push({ id: i * 2 + 1, icon: icons[i], color: colors[i], isFlipped: false, isMatched: false });
    }
    // Shuffle
    deck.sort(() => Math.random() - 0.5);
    setCards(deck);
    setFlippedCards([]);
    setMoves(0);
    setTimer(0);
    setIsGameActive(true);
    setIsGameWon(false);
  };

  const handleCardClick = (index: number) => {
    if (!isGameActive || isGameWon || cards[index].isFlipped || cards[index].isMatched || flippedCards.length >= 2) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      checkForMatch(newFlipped[0], newFlipped[1]);
    }
  };

  const checkForMatch = (id1: number, id2: number) => {
    const card1 = cards[id1];
    const card2 = cards[id2];

    if (card1.icon === card2.icon) {
      // Match
      playSuccessSound();
      setTimeout(() => {
        setCards(prev => prev.map((c, i) => (i === id1 || i === id2) ? { ...c, isMatched: true } : c));
        setFlippedCards([]);
        
        // Check Win
        if (cards.filter(c => c.isMatched).length + 2 === cards.length) {
          setIsGameWon(true);
          setIsGameActive(false);
          onWin();
          playSuccessSound(); // Extra victory sound
        }
      }, 500);
    } else {
      // No Match
      setTimeout(() => {
        setCards(prev => prev.map((c, i) => (i === id1 || i === id2) ? { ...c, isFlipped: false } : c));
        setFlippedCards([]);
        playErrorSound();
      }, 1000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pink-950 via-purple-950 to-black flex flex-col items-center justify-center text-white overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>
      
      {/* HUD */}
      <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-center z-20 bg-black/20 backdrop-blur-md border-b border-pink-500/20">
         <Button variant="ghost" size="sm" onClick={onExit} icon={Icons.Back} className="text-pink-200 hover:text-white hover:bg-pink-500/20">
            {getText(lang, 'exit')}
         </Button>
         <div className="flex gap-4 md:gap-8">
            <div className="flex items-center gap-2 text-pink-300 font-mono font-bold">
               <Icons.Zap size={18} />
               <span>{getText(lang, 'moves')}: {moves}</span>
            </div>
            <div className="flex items-center gap-2 text-cyan-300 font-mono font-bold">
               <Icons.Clock size={18} />
               <span>{getText(lang, 'time')}: {formatTime(timer)}</span>
            </div>
         </div>
         <Button variant="ghost" size="sm" onClick={startNewGame} icon={Icons.Restart} className="text-pink-200 hover:text-white hover:bg-pink-500/20">
            {getText(lang, 'playAgain')}
         </Button>
      </div>

      <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400 tracking-tighter drop-shadow-[0_0_15px_rgba(236,72,153,0.5)] mb-8 mt-16 z-10">
         NEON MEMORY
      </h1>

      <div className="grid grid-cols-4 gap-2 md:gap-4 relative z-10 p-4">
        {cards.map((card, index) => (
          <button
            key={index}
            onClick={() => handleCardClick(index)}
            className={`w-16 h-16 md:w-24 md:h-24 rounded-xl flex items-center justify-center transition-all duration-500 transform ${
              card.isFlipped || card.isMatched 
                ? 'bg-slate-800 border-2 border-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.3)] rotate-y-180' 
                : 'bg-slate-900/80 border border-slate-700 hover:bg-slate-800 hover:border-cyan-500/50'
            } ${card.isMatched ? 'opacity-50 scale-95 bg-green-900/30 border-green-500/50' : ''}`}
            disabled={card.isMatched || card.isFlipped}
          >
            {(card.isFlipped || card.isMatched) ? (
               <card.icon className={`w-8 h-8 md:w-12 md:h-12 ${card.color} drop-shadow-md`} />
            ) : (
               <Icons.BrainCircuit className="w-6 h-6 md:w-8 md:h-8 text-slate-700" />
            )}
          </button>
        ))}
      </div>

      {isGameWon && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="text-center scale-110 animate-bounce-slight p-8 bg-slate-900/80 rounded-3xl border border-pink-500/50 shadow-2xl">
             <Icons.Medal className="w-24 h-24 text-yellow-400 mx-auto mb-4 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]" />
             <h2 className="text-4xl font-black text-white mb-2">{getText(lang, 'victory')}</h2>
             <p className="text-pink-200 mb-6 font-mono">{getText(lang, 'matched')} {moves} {getText(lang, 'moves')}</p>
             <div className="flex gap-4 justify-center">
                <Button onClick={onExit} variant="secondary">{getText(lang, 'exit')}</Button>
                <Button onClick={startNewGame} variant="primary">{getText(lang, 'playAgain')}</Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};


// --- Tic Tac Toe Component ---
const TicTacToeSession: React.FC<{ onExit: () => void; lang: Language; onWin: () => void }> = ({ onExit, lang, onWin }) => {
  const [gridSize, setGridSize] = useState(3);
  const [numPlayers, setNumPlayers] = useState(1); // 1, 2, or 3
  const [board, setBoard] = useState<(string | null)[]>(Array(3 * 3).fill(null));
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost' | 'draw'>('playing');
  const [xpAwarded, setXpAwarded] = useState(false);

  const symbols = ['X', 'O', 'Δ'];
  
  useEffect(() => {
    resetGame();
  }, [gridSize, numPlayers]);

  const checkLine = (b: (string | null)[], idxs: number[]) => {
    const first = b[idxs[0]];
    if (!first) return null;
    for (let i = 1; i < idxs.length; i++) {
      if (b[idxs[i]] !== first) return null;
    }
    return first;
  };

  const calculateWinner = (squares: (string | null)[], size: number) => {
    const lines: number[][] = [];
    for (let i = 0; i < size; i++) {
      const row = [];
      for (let j = 0; j < size; j++) row.push(i * size + j);
      lines.push(row);
    }
    for (let i = 0; i < size; i++) {
      const col = [];
      for (let j = 0; j < size; j++) col.push(j * size + i);
      lines.push(col);
    }
    const d1 = [];
    const d2 = [];
    for (let i = 0; i < size; i++) {
      d1.push(i * size + i);
      d2.push((i + 1) * size - (i + 1));
    }
    lines.push(d1);
    lines.push(d2);

    for (const line of lines) {
      const w = checkLine(squares, line);
      if (w) return { winner: w, line };
    }
    return null;
  };

  // AI logic simplified for brevity as it was fully implemented in previous turn, keeping it working
  const evaluateBoard = (squares: (string | null)[], size: number) => {
      const result = calculateWinner(squares, size);
      if (result?.winner === 'O') return 10000;
      if (result?.winner === 'X') return -10000;
      return 0;
  };

  const minimax = (squares: (string | null)[], depth: number, isMaximizing: boolean, alpha: number, beta: number, maxDepth: number): number => {
    const result = calculateWinner(squares, gridSize);
    if (result?.winner === 'O') return 1000 - depth;
    if (result?.winner === 'X') return depth - 1000;
    if (!squares.includes(null)) return 0;
    if (depth >= maxDepth) return evaluateBoard(squares, gridSize);

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < squares.length; i++) {
        if (!squares[i]) {
          squares[i] = 'O';
          const score = minimax(squares, depth + 1, false, alpha, beta, maxDepth);
          squares[i] = null;
          bestScore = Math.max(score, bestScore);
          alpha = Math.max(alpha, score);
          if (beta <= alpha) break;
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < squares.length; i++) {
        if (!squares[i]) {
          squares[i] = 'X';
          const score = minimax(squares, depth + 1, true, alpha, beta, maxDepth);
          squares[i] = null;
          bestScore = Math.min(score, bestScore);
          beta = Math.min(beta, score);
          if (beta <= alpha) break;
        }
      }
      return bestScore;
    }
  };

  const getBestMove = (squares: (string | null)[]) => {
    let bestScore = -Infinity;
    let move = -1;
    const emptyCount = squares.filter(s => !s).length;
    const center = Math.floor(squares.length / 2);
    if (emptyCount === squares.length) return center;
    if (emptyCount === squares.length - 1 && !squares[center]) return center;
    const maxDepth = gridSize === 2 ? 9 : gridSize === 3 ? 9 : gridSize === 4 ? 4 : 3;
    const moves = [];
    for (let i = 0; i < squares.length; i++) if (!squares[i]) moves.push(i);
    moves.sort(() => Math.random() - 0.5);
    for (const i of moves) {
        squares[i] = 'O';
        const score = minimax(squares, 0, false, -Infinity, Infinity, maxDepth);
        squares[i] = null;
        if (score > bestScore) { bestScore = score; move = i; }
    }
    return move;
  };

  useEffect(() => {
    if (numPlayers === 1 && currentPlayerIndex === 1 && gameStatus === 'playing') {
      const timer = setTimeout(() => {
        const nextMove = getBestMove([...board]);
        if (nextMove !== -1) handleMove(nextMove);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentPlayerIndex, gameStatus, numPlayers]);

  const handleMove = (index: number) => {
    if (board[index] || gameStatus !== 'playing') return;
    const currentSymbol = symbols[currentPlayerIndex];
    if (currentSymbol === 'X') playSuccessSound(); else playErrorSound();

    const newBoard = [...board];
    newBoard[index] = currentSymbol;
    setBoard(newBoard);

    const result = calculateWinner(newBoard, gridSize);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
      if (numPlayers === 1) setGameStatus(result.winner === 'X' ? 'won' : 'lost');
      else setGameStatus('won');
      
      if (result.winner === 'X' || (numPlayers > 1)) {
          playSuccessSound();
          if (!xpAwarded && (result.winner === 'X' || numPlayers > 1)) {
              onWin();
              setXpAwarded(true);
          }
      } else playErrorSound();

    } else if (!newBoard.includes(null)) {
      setGameStatus('draw');
    } else {
      setCurrentPlayerIndex((prev) => (prev + 1) % numPlayers);
    }
  };

  const resetGame = () => {
    setBoard(Array(gridSize * gridSize).fill(null));
    setCurrentPlayerIndex(0);
    setWinner(null);
    setWinningLine(null);
    setGameStatus('playing');
    setXpAwarded(false);
  };

  const getGridCols = () => {
      switch(gridSize) { case 2: return "grid-cols-2"; case 4: return "grid-cols-4"; case 5: return "grid-cols-5"; default: return "grid-cols-3"; }
  };
  const getCellSize = () => {
      switch(gridSize) {
          case 2: return "w-[30vw] h-[30vw] max-w-[10rem] max-h-[10rem]";
          case 4: return "w-[18vw] h-[18vw] max-w-[5rem] max-h-[5rem] md:text-3xl";
          case 5: return "w-[15vw] h-[15vw] max-w-[4rem] max-h-[4rem] md:text-2xl text-xl";
          default: return "w-[22vw] h-[22vw] max-w-[7rem] max-h-[7rem] md:text-5xl text-3xl";
      }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950 via-blue-950 to-black flex flex-col items-center justify-center text-white overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>
      <div className="relative z-10 mb-2 md:mb-6 text-center px-4 w-full max-w-md">
        <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 tracking-tighter mb-2">TIC TAC TOE</h1>
        <div className="flex flex-col gap-2 mb-4">
           <div className="flex justify-center gap-2 bg-slate-900/50 p-1.5 rounded-xl backdrop-blur-sm border border-slate-700/50">
              {[2, 3, 4, 5].map(size => (
                  <button key={size} onClick={() => setGridSize(size)} className={`px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${gridSize === size ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>{size}x{size}</button>
              ))}
           </div>
           <div className="flex justify-center gap-2 bg-slate-900/50 p-1.5 rounded-xl backdrop-blur-sm border border-slate-700/50">
               {[1, 2, 3].map(n => (
                   <button key={n} onClick={() => setNumPlayers(n)} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] md:text-xs font-bold transition-all ${numPlayers === n ? 'bg-blue-500 text-white' : 'text-slate-400'}`}><Icons.User size={12} /> {n}P</button>
               ))}
           </div>
        </div>
      </div>

      <div className="relative z-10 bg-slate-900/40 backdrop-blur-xl p-4 md:p-6 rounded-3xl border border-white/10 shadow-2xl mx-4">
        <div className={`grid ${getGridCols()} gap-2 md:gap-3`}>
          {board.map((cell, index) => {
             const isWinningCell = winningLine?.includes(index);
             return (
              <button key={index} onClick={() => handleMove(index)} disabled={!!cell || gameStatus !== 'playing' || (numPlayers === 1 && currentPlayerIndex === 1)}
                className={`${getCellSize()} rounded-xl font-black flex items-center justify-center transition-all duration-300 relative overflow-hidden group ${!cell && gameStatus === 'playing' ? 'hover:bg-white/5' : ''} ${cell === 'X' ? 'text-cyan-400 bg-cyan-950/30 border-cyan-500/30' : cell === 'O' ? 'text-red-400 bg-red-950/30 border-red-500/30' : cell === 'Δ' ? 'text-yellow-400 bg-yellow-950/30' : 'bg-slate-800/50'} border ${isWinningCell ? 'scale-105 shadow-[0_0_30px_rgba(255,255,255,0.3)] border-white/50 z-10' : ''}`}>
                {cell && <span className={`animate-bounce-slight ${isWinningCell ? 'animate-pulse' : ''}`}>{cell === 'Δ' ? <Icons.Triangle className="w-3/4 h-3/4 fill-current" /> : cell}</span>}
              </button>
             );
          })}
        </div>
      </div>
      <div className="relative z-10 mt-8 flex gap-6">
        <Button variant="secondary" onClick={onExit} icon={Icons.Back}>{getText(lang, 'exit')}</Button>
        <Button variant="primary" onClick={resetGame} icon={Icons.Restart}>{getText(lang, 'playAgain')}</Button>
      </div>
    </div>
  );
};

// --- Active Game Session (Chat Games) ---

interface GameSessionProps {
  gameType: GameType;
  onExit: () => void;
  lang: Language;
  customConfig?: string;
  onWin: () => void;
}

const ActiveGameSession: React.FC<GameSessionProps> = ({ gameType, onExit, lang, customConfig, onWin }) => {
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [xpAwarded, setXpAwarded] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { speak, cancel, isSpeaking, isLoading: isTTSLoading, supported } = useTTS(lang);
  const theme = GAME_THEMES[gameType] || GAME_THEMES['custom'];

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { return () => cancel(); }, [cancel]);
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.sender === 'ai') generateSpeech(lastMsg.text);
  }, [messages]);

  const getGameTitle = () => {
    switch(gameType) {
      case 'mystery': return getText(lang, 'mysteryTitle');
      case 'emoji': return getText(lang, 'emojiTitle');
      case 'truth': return getText(lang, 'truthTitle');
      case 'riddle': return getText(lang, 'riddleTitle');
      case 'odd': return getText(lang, 'oddTitle');
      case 'custom': return getText(lang, 'customTitle');
      default: return 'Game';
    }
  }

  useEffect(() => {
    const initGame = async () => {
      setLoading(true);
      try {
        switch(gameType) {
          case 'mystery': chatRef.current = createMysteryGameChat(lang); break;
          case 'emoji': chatRef.current = createEmojiGameChat(lang); break;
          case 'truth': chatRef.current = createTwoTruthsChat(lang); break;
          case 'riddle': chatRef.current = createRiddleChat(lang); break;
          case 'odd': chatRef.current = createOddOneOutChat(lang); break;
          case 'custom': if (customConfig) chatRef.current = createCustomGameChat(lang, customConfig); break;
        }
        
        if (!chatRef.current) return;
        const response = await chatRef.current.sendMessageStream({ message: getText(lang, 'startPrompt') });
        let fullText = "";
        for await (const chunk of response) {
             const c = chunk as GenerateContentResponse;
             if(c.text) fullText += c.text;
        }
        setMessages([{ id: 'init', sender: 'ai', text: fullText }]);
        setStatus(GameStatus.PLAYING);
      } catch (error) {
        setMessages([{ id: 'err', sender: 'system', text: getText(lang, 'errorGame') }]);
      } finally {
        setLoading(false);
      }
    };
    if (status === GameStatus.IDLE && gameType !== 'none') initGame();
  }, [gameType]);

  const handleSend = async () => {
    if (!inputValue.trim() || !chatRef.current || loading || status !== GameStatus.PLAYING) return;
    const userMsg = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: userMsg }]);
    setLoading(true);
    cancel();

    try {
      const response = await chatRef.current.sendMessageStream({ message: userMsg });
      let aiResponseText = "";
      for await (const chunk of response) {
           const c = chunk as GenerateContentResponse;
           if(c.text) aiResponseText += c.text;
      }

      let finalStatus = GameStatus.PLAYING;
      let displayText = aiResponseText;

      if (aiResponseText.includes("GAME_OVER_WIN")) {
        finalStatus = GameStatus.WON;
        displayText = aiResponseText.replace("GAME_OVER_WIN", "");
      }

      setMessages(prev => [...prev, { id: Date.now().toString() + 'ai', sender: 'ai', text: displayText }]);
      if (finalStatus !== GameStatus.PLAYING) {
          setStatus(finalStatus);
          if (finalStatus === GameStatus.WON && !xpAwarded) {
              onWin();
              setXpAwarded(true);
          }
      }
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'system', text: 'Connection error.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleGiveUp = async () => {
    if (!chatRef.current || loading || status !== GameStatus.PLAYING) return;
    const giveUpMsg = getText(lang, 'giveUpPrompt');
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: giveUpMsg }]);
    setLoading(true);
    cancel();
    try {
      const response = await chatRef.current.sendMessageStream({ message: giveUpMsg });
      let aiResponseText = "";
      for await (const chunk of response) {
           const c = chunk as GenerateContentResponse;
           if(c.text) aiResponseText += c.text;
      }
      setMessages(prev => [...prev, { id: Date.now().toString() + 'ai', sender: 'ai', text: aiResponseText }]);
      setStatus(GameStatus.LOST);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'system', text: getText(lang, 'errorGame') }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${theme.bgGradient} flex flex-col text-white overflow-hidden`}>
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
      {/* Header */}
      <header className={`relative z-20 flex items-center justify-between p-3 md:p-4 md:px-8 glass-panel border-b ${theme.hudBorder}`}>
        <div className="flex items-center gap-4">
          <button onClick={onExit} className="p-2 rounded-full bg-white/5 border border-white/10"><Icons.Back className="w-5 h-5 text-slate-300" /></button>
          <h1 className="text-xl font-black tracking-tight">{getGameTitle()}</h1>
        </div>
        <div className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${status === GameStatus.PLAYING ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : status === GameStatus.WON ? 'bg-green-500/20 text-green-400 border-green-500' : 'bg-red-500/20 text-red-400 border-red-500'}`}>{status}</div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 relative z-10 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center border shadow-lg shrink-0 ${msg.sender === 'user' ? `${theme.avatarUserBg} border-white/20` : msg.sender === 'system' ? 'bg-red-900' : `${theme.avatarAiBg} border-white/20`}`}>
                 {msg.sender === 'user' ? <Icons.User className={theme.avatarUserText} /> : <Icons.Bot className={theme.avatarAiText} />}
            </div>
            <div className={`p-4 md:p-6 rounded-2xl max-w-[85%] md:max-w-[70%] backdrop-blur-md border shadow-sm ${msg.sender === 'user' ? theme.userBubble : msg.sender === 'system' ? 'bg-red-900/20 text-red-200' : theme.aiBubble}`}>
               <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{msg.text}</p>
               {msg.sender === 'ai' && supported && (
                   <button onClick={() => isSpeaking ? cancel() : speak(msg.text)} disabled={isTTSLoading && !isSpeaking} className="mt-3 flex items-center gap-2 text-xs font-bold opacity-70 hover:opacity-100">
                     {isSpeaking ? <Icons.AudioWave size={14} /> : <Icons.Speaker size={14} />} {isSpeaking ? 'Listening' : 'Listen'}
                   </button>
               )}
            </div>
          </div>
        ))}
        {loading && <div className="flex gap-4"><div className={`w-12 h-12 rounded-xl ${theme.avatarAiBg} flex items-center justify-center border border-white/10`}><Icons.Loader className="animate-spin" /></div></div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`relative z-30 p-4 glass-panel border-t ${theme.hudBorder}`}>
        <div className="max-w-4xl mx-auto flex gap-3">
           <button onClick={handleGiveUp} disabled={loading || status !== GameStatus.PLAYING} className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"><Icons.Flag /></button>
           <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className={`flex-1 flex items-center bg-slate-900/80 border border-slate-600 rounded-xl ${theme.inputRing}`}>
              <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder={getText(lang, 'typeAnswer')} disabled={status !== GameStatus.PLAYING || loading} className="flex-1 bg-transparent px-6 py-4 text-white outline-none" autoFocus />
              <button type="submit" disabled={!inputValue.trim() || loading || status !== GameStatus.PLAYING} className={`px-6 py-4 ${theme.sendBtn}`}><Icons.Send /></button>
           </form>
        </div>
      </div>
      
      {status === GameStatus.WON && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="text-center p-8">
            <Icons.Trophy className="w-32 h-32 text-yellow-400 mx-auto mb-4 animate-bounce-slight" />
            <h2 className="text-5xl font-black text-white mb-4">{getText(lang, 'victory')}</h2>
            <Button onClick={onExit} className="bg-white text-black px-8 py-3 font-bold">{getText(lang, 'exit')}</Button>
          </div>
        </div>
      )}
    </div>
  );
};
