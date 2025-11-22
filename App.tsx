
import React, { useState, useEffect } from 'react';
import { AppView, Language, UserStats } from './types';
import { Quiz } from './components/Quiz';
import { Games } from './components/Games';
import { Icons } from './components/UI';
import { getText } from './utils/translations';

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [language, setLanguage] = useState<Language>('en');
  
  // User Stats / XP System
  const [userStats, setUserStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('mindspark_stats');
    return saved ? JSON.parse(saved) : { level: 1, currentXP: 0, nextLevelXP: 100, totalGamesPlayed: 0, totalWins: 0 };
  });

  useEffect(() => {
    localStorage.setItem('mindspark_stats', JSON.stringify(userStats));
  }, [userStats]);

  const awardXP = (amount: number) => {
    setUserStats(prev => {
      let newXP = prev.currentXP + amount;
      let newLevel = prev.level;
      let newNextXP = prev.nextLevelXP;

      // Level Up Logic
      if (newXP >= prev.nextLevelXP) {
        newLevel += 1;
        newXP = newXP - prev.nextLevelXP;
        newNextXP = newLevel * 100; // Simple progression: Level 1=100, Level 2=200, etc.
      }

      return {
        ...prev,
        level: newLevel,
        currentXP: newXP,
        nextLevelXP: newNextXP,
        totalGamesPlayed: prev.totalGamesPlayed + 1,
        totalWins: prev.totalWins + 1
      };
    });
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.HOME:
        return (
          <div className="flex flex-col min-h-[80vh] px-4 py-6 animate-fade-in">
            
            {/* Dashboard Header / Stats Card */}
            <div className="w-full max-w-4xl mx-auto mb-8">
               <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-[80px] -mr-16 -mt-16"></div>
                  
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                     {/* Level Circle */}
                     <div className="flex items-center gap-6">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-full border-4 border-brand-500/30 flex items-center justify-center bg-slate-950 shadow-lg">
                             <span className="text-4xl font-black text-white">{userStats.level}</span>
                          </div>
                          <div className="absolute -bottom-2 inset-x-0 text-center">
                             <span className="bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">{getText(language, 'level')}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col">
                           <h2 className="text-2xl font-bold text-white mb-1">Player One</h2>
                           <div className="flex items-center gap-2 text-slate-400 text-sm font-mono">
                              <Icons.Zap className="w-4 h-4 text-yellow-400" />
                              <span>{userStats.currentXP} / {userStats.nextLevelXP} {getText(language, 'xp')}</span>
                           </div>
                           {/* XP Bar */}
                           <div className="w-48 h-2 bg-slate-700 rounded-full mt-3 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-1000" 
                                style={{ width: `${(userStats.currentXP / userStats.nextLevelXP) * 100}%` }}
                              ></div>
                           </div>
                        </div>
                     </div>

                     {/* Quick Stats */}
                     <div className="flex gap-4">
                        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 text-center min-w-[100px]">
                           <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">{getText(language, 'totalGames')}</div>
                           <div className="text-xl font-black text-white">{userStats.totalGamesPlayed}</div>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 text-center min-w-[100px]">
                           <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">{getText(language, 'wins')}</div>
                           <div className="text-xl font-black text-emerald-400">{userStats.totalWins}</div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-brand-200 to-brand-400 tracking-tight leading-tight mb-2">
                {getText(language, 'dashboard')}
              </h1>
              <p className="text-slate-400 max-w-lg mx-auto">{getText(language, 'chooseArena')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto relative z-10">
              {/* Quiz Card */}
              <button
                onClick={() => setCurrentView(AppView.QUIZ_SETUP)}
                className="group relative bg-slate-800 hover:bg-slate-800/80 border border-slate-700 rounded-3xl p-8 text-left transition-all hover:scale-[1.02] hover:border-brand-500 hover:shadow-2xl hover:shadow-brand-500/20 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-brand-500/5 rounded-bl-full -mr-10 -mt-10 group-hover:bg-brand-500/10 transition-colors"></div>
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-brand-500/20 rounded-2xl flex items-center justify-center text-brand-400 mb-6 group-hover:scale-110 transition-transform">
                      <Icons.Brain className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{getText(language, 'quizTitle')}</h2>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">{getText(language, 'quizDesc')}</p>
                    <div className="flex items-center text-brand-400 font-bold group-hover:translate-x-2 transition-transform">
                      {getText(language, 'startQuiz')} <Icons.Next className="w-4 h-4 ml-2" />
                    </div>
                </div>
              </button>

              {/* Games Card */}
              <button
                onClick={() => setCurrentView(AppView.GAMES_HUB)}
                className="group relative bg-slate-800 hover:bg-slate-800/80 border border-slate-700 rounded-3xl p-8 text-left transition-all hover:scale-[1.02] hover:border-accent-500 hover:shadow-2xl hover:shadow-accent-500/20 overflow-hidden"
              >
                 <div className="absolute top-0 right-0 w-40 h-40 bg-accent-500/5 rounded-bl-full -mr-10 -mt-10 group-hover:bg-accent-500/10 transition-colors"></div>
                 <div className="relative z-10">
                    <div className="w-12 h-12 bg-accent-500/20 rounded-2xl flex items-center justify-center text-accent-400 mb-6 group-hover:scale-110 transition-transform">
                      <Icons.Game className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{getText(language, 'gamesTitle')}</h2>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">{getText(language, 'gamesDesc')}</p>
                    <div className="flex items-center text-accent-400 font-bold group-hover:translate-x-2 transition-transform">
                      {getText(language, 'enterArcade')} <Icons.Next className="w-4 h-4 ml-2" />
                    </div>
                </div>
              </button>
            </div>
          </div>
        );

      case AppView.QUIZ_SETUP:
      case AppView.QUIZ_ACTIVE:
        // Note: Not implementing onEarnXP for Quiz in this specific prompt response to keep changes focused on Games as requested, 
        // but could easily be added same as Games.
        return <Quiz onBack={() => setCurrentView(AppView.HOME)} lang={language} />;

      case AppView.GAMES_HUB:
        return <Games onBack={() => setCurrentView(AppView.HOME)} lang={language} onEarnXP={awardXP} />;
        
      default:
        return <div className="text-white">View not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-brand-500/30 font-sans">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-900/10 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-900/10 rounded-full blur-[120px]"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      {/* Navbar */}
      <header className="relative z-50 border-b border-slate-800/50 backdrop-blur-md bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 font-bold text-xl cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => setCurrentView(AppView.HOME)}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-accent-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              M
            </div>
            <span className="text-white hidden sm:block tracking-tight">{getText(language, 'appTitle')}</span>
          </div>
          
          <div className="flex items-center gap-4">
             {/* XP Display Mini (Visible on mobile if needed, but kept simple here) */}
             {currentView !== AppView.HOME && (
                <div className="hidden sm:flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700">
                   <Icons.Zap className="w-3 h-3 text-yellow-400" />
                   <span className="text-xs font-mono font-bold text-slate-300">Lvl {userStats.level}</span>
                </div>
             )}

             <div className="relative group z-50">
                <button className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-300 hover:text-white bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700 transition-colors">
                   <Icons.Globe className="w-3 h-3 sm:w-4 sm:h-4" />
                   {language === 'en' ? 'EN' : language === 'hi' ? 'HI' : 'NE'}
                </button>
                <div className="absolute right-0 mt-2 w-32 bg-slate-900 border border-slate-800 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all transform origin-top-right">
                   <button onClick={() => setLanguage('en')} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white first:rounded-t-xl">English</button>
                   <button onClick={() => setLanguage('hi')} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">Hindi</button>
                   <button onClick={() => setLanguage('ne')} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white last:rounded-b-xl">Nepali</button>
                </div>
             </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
