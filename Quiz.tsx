import React, { useState, useEffect } from 'react';
import { QuizConfig, QuizQuestion, Language } from '../types';
import { generateQuiz, generateSpeech } from '../services/geminiService';
import { Button, Card, Input, Icons } from './UI';
import { getText } from '../utils/translations';
import { useTTS } from '../hooks/useTTS';
import { playSuccessSound, playErrorSound } from '../utils/audio';

interface QuizProps {
  onBack: () => void;
  lang: Language;
}

export const Quiz: React.FC<QuizProps> = ({ onBack, lang }) => {
  const [view, setView] = useState<'setup' | 'loading' | 'active' | 'summary'>('setup');
  const [config, setConfig] = useState<QuizConfig>({ topic: '', difficulty: 'Medium' });
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // useTTS now includes isLoading from Gemini API
  const { speak, cancel, isSpeaking, isLoading: isTTSLoading, supported } = useTTS(lang);
  const difficulties: QuizConfig['difficulty'][] = ['Easy', 'Medium', 'Hard', 'Expert'];

  // Stop speaking when moving to next question or unmounting
  useEffect(() => {
    return () => cancel();
  }, [currentQIndex, view, cancel]);

  // --- Pre-fetching Audio Strategy ---
  // Construct the text that will be read for the current question
  const q = questions[currentQIndex];
  const textToRead = q ? `${getText(lang, 'question')} ${currentQIndex + 1}. ${q.question}. 
      ${getText(lang, 'typeAnswer')}: 
      ${q.options[0]}, ${q.options[1]}, ${q.options[2]}, ${q.options[3]}.` : "";

  // Automatically fetch audio in the background when the question loads
  useEffect(() => {
    if (textToRead && view === 'active') {
      // Fire and forget - this populates the cache
      generateSpeech(textToRead);
    }
  }, [textToRead, view]);

  const startQuiz = async () => {
    if (!config.topic.trim()) return;
    setView('loading');
    setError(null);
    try {
      const generatedQuestions = await generateQuiz(config, lang);
      setQuestions(generatedQuestions);
      setAnswers(new Array(generatedQuestions.length).fill(null));
      setCurrentQIndex(0);
      setScore(0);
      setView('active');
    } catch (err) {
      console.error(err);
      setError(getText(lang, 'errorQuiz'));
      setView('setup');
    }
  };

  const handleAnswer = (optionIndex: number) => {
    if (answers[currentQIndex] !== null) return; // Already answered

    const isCorrect = optionIndex === questions[currentQIndex].correctAnswerIndex;
    
    // Play Sound Effect
    if (isCorrect) {
      playSuccessSound();
      setScore(s => s + 1);
    } else {
      playErrorSound();
    }

    const newAnswers = [...answers];
    newAnswers[currentQIndex] = optionIndex;
    setAnswers(newAnswers);

    setShowExplanation(true);
  };

  const nextQuestion = () => {
    cancel(); // Stop speech
    setShowExplanation(false);
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      setView('summary');
    }
  };

  const handleReadQuestion = () => {
    if (isSpeaking || isTTSLoading) {
      cancel();
    } else {
      speak(textToRead);
    }
  };

  // --- Setup View ---
  if (view === 'setup') {
    return (
      <div className="max-w-xl mx-auto animate-fade-in">
        <Button variant="ghost" onClick={onBack} icon={Icons.Back} className="mb-4">{getText(lang, 'backHome')}</Button>
        <Card title={getText(lang, 'configureQuiz')} description={getText(lang, 'quizDesc')}>
          <div className="space-y-6">
            <Input
              label={getText(lang, 'topicLabel')}
              placeholder={getText(lang, 'topicPlaceholder')}
              value={config.topic}
              onChange={(e) => setConfig({ ...config, topic: e.target.value })}
            />
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">{getText(lang, 'difficultyLabel')}</label>
              <div className="grid grid-cols-2 gap-3">
                {difficulties.map(d => (
                  <button
                    key={d}
                    onClick={() => setConfig({ ...config, difficulty: d })}
                    className={`p-3 rounded-lg text-sm font-medium border transition-all ${
                      config.difficulty === d
                        ? 'bg-brand-500/20 border-brand-500 text-brand-400'
                        : 'bg-slate-900/30 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{error}</div>}

            <Button 
              onClick={startQuiz} 
              disabled={!config.topic} 
              className="w-full" 
              icon={Icons.Sparkles}
            >
              {getText(lang, 'generateQuiz')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // --- Loading View ---
  if (view === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-fade-in px-4">
        <div className="relative">
          <div className="absolute inset-0 bg-brand-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
          <Icons.Brain className="w-16 h-16 md:w-20 md:h-20 text-brand-500 animate-bounce-slight relative z-10" />
        </div>
        <h2 className="mt-8 text-xl md:text-2xl font-bold text-white">{getText(lang, 'craftingQuestions')}</h2>
        <p className="text-slate-400 mt-2 text-sm md:text-base">{getText(lang, 'consultingAI')} "{config.topic}"</p>
      </div>
    );
  }

  // --- Active Quiz View ---
  if (view === 'active' && q) {
    const isAnswered = answers[currentQIndex] !== null;
    const isCorrect = answers[currentQIndex] === q.correctAnswerIndex;

    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <div className="text-xs md:text-sm text-slate-400">
            {getText(lang, 'question')} <span className="text-white font-bold">{currentQIndex + 1}</span> / {questions.length}
          </div>
          <div className="text-xs md:text-sm text-slate-400">
            {getText(lang, 'score')}: <span className="text-brand-400 font-bold">{score}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full mb-6 md:mb-8 overflow-hidden">
          <div 
            className="bg-brand-500 h-full transition-all duration-500 ease-out"
            style={{ width: `${((currentQIndex) / questions.length) * 100}%` }}
          ></div>
        </div>

        <Card className="mb-6">
          <div className="flex justify-between items-start gap-3 md:gap-4 mb-6">
            <h2 className="text-lg md:text-2xl font-bold text-white leading-relaxed">
              {q.question}
            </h2>
            {supported && (
              <button 
                onClick={handleReadQuestion}
                disabled={isTTSLoading && !isSpeaking}
                className={`p-2 rounded-full transition-all flex-shrink-0 ${
                  isSpeaking 
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/50' 
                    : isTTSLoading 
                    ? 'bg-slate-700/50 text-brand-400 cursor-wait'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                }`}
                title="Read Question (AI Voice)"
              >
                {isTTSLoading ? (
                  <Icons.Loader className="w-5 h-5 animate-spin" />
                ) : isSpeaking ? (
                  <Icons.AudioWave className="w-5 h-5 animate-pulse" />
                ) : (
                  <Icons.Speaker className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
          
          <div className="space-y-3">
            {q.options.map((option, idx) => {
              let btnClass = "w-full text-left p-4 rounded-xl border transition-all ";
              if (!isAnswered) {
                btnClass += "border-slate-700 bg-slate-800/50 hover:bg-slate-700 hover:border-slate-600 active:bg-slate-700";
              } else {
                if (idx === q.correctAnswerIndex) {
                  btnClass += "border-green-500/50 bg-green-500/10 text-green-400";
                } else if (idx === answers[currentQIndex]) {
                  btnClass += "border-red-500/50 bg-red-500/10 text-red-400";
                } else {
                  btnClass += "border-slate-800 bg-slate-900/50 text-slate-500 opacity-50";
                }
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswered}
                  onClick={() => handleAnswer(idx)}
                  className={btnClass}
                >
                  <div className="flex items-center">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 md:mr-4 shrink-0 ${
                      !isAnswered ? "bg-slate-700 text-slate-300" :
                      idx === q.correctAnswerIndex ? "bg-green-500 text-white" :
                      idx === answers[currentQIndex] ? "bg-red-500 text-white" : "bg-slate-800 text-slate-600"
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="font-medium text-sm md:text-base">{option}</span>
                    {isAnswered && idx === q.correctAnswerIndex && (
                      <Icons.Check className="w-5 h-5 ml-auto text-green-500 shrink-0" />
                    )}
                    {isAnswered && idx === answers[currentQIndex] && idx !== q.correctAnswerIndex && (
                      <Icons.X className="w-5 h-5 ml-auto text-red-500 shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {isAnswered && (
          <div className="animate-fade-in space-y-6 pb-10">
            {/* Result Status & Correct Answer Display */}
            <div className={`p-4 md:p-5 rounded-xl border ${isCorrect ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <div className="flex items-start gap-3">
                {isCorrect ? <Icons.Check className="text-green-400 w-6 h-6 mt-1 shrink-0" /> : <Icons.X className="text-red-400 w-6 h-6 mt-1 shrink-0" />}
                <div>
                  <h4 className={`text-lg font-bold mb-1 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                    {isCorrect ? getText(lang, 'correct') : getText(lang, 'incorrect')}
                  </h4>
                  {!isCorrect && (
                     <p className="text-slate-200 text-sm">
                       {getText(lang, 'correctAnswerWas')} <span className="font-bold text-white">{q.options[q.correctAnswerIndex]}</span>
                     </p>
                  )}
                </div>
              </div>
            </div>

            {/* Explanation Card */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 md:p-5">
              <div className="flex items-center gap-2 mb-2 text-brand-400">
                <Icons.Brain className="w-5 h-5" />
                <span className="font-bold uppercase text-xs tracking-wider">{getText(lang, 'explanation')}</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-sm md:text-base">{q.explanation}</p>
            </div>

            <div className="flex justify-end">
              <Button onClick={nextQuestion} icon={Icons.Next}>
                {currentQIndex === questions.length - 1 ? getText(lang, 'finishQuiz') : getText(lang, 'nextQuestion')}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- Summary View ---
  return (
    <div className="max-w-xl mx-auto text-center animate-fade-in py-10 px-4">
      <div className="mb-8 relative inline-block">
         <div className="absolute inset-0 bg-yellow-500 blur-3xl opacity-20 rounded-full"></div>
         <Icons.Trophy className="w-20 h-20 md:w-24 md:h-24 text-yellow-400 mx-auto relative z-10" />
      </div>
     
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{getText(lang, 'quizComplete')}</h2>
      <p className="text-slate-400 mb-8">{getText(lang, 'score')} {score} / {questions.length}</p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
          <div className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">{getText(lang, 'accuracy')}</div>
          <div className="text-xl md:text-2xl font-bold text-white">{Math.round((score / questions.length) * 100)}%</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
          <div className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">{getText(lang, 'topicLabel')}</div>
          <div className="text-lg md:text-xl font-bold text-white truncate">{config.topic}</div>
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        <Button variant="outline" onClick={onBack}>{getText(lang, 'backHome')}</Button>
        <Button onClick={() => setView('setup')}>{getText(lang, 'newQuiz')}</Button>
      </div>
    </div>
  );
};