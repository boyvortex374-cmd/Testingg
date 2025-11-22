
import React from 'react';
import { Loader2, ArrowLeft, Brain, Gamepad2, CheckCircle, XCircle, Trophy, Play, Sparkles, ArrowRight, CircleHelp, ListChecks, Send, User, Bot, Globe, Volume2, StopCircle, AudioLines, Target, Flag, Wand2, Grid3x3, RotateCcw, Users, Triangle, Zap, Clock, Lock, Unlock, Medal, BrainCircuit } from 'lucide-react';

// --- Icons ---
export const Icons = {
  Loader: Loader2,
  Back: ArrowLeft,
  Brain: Brain,
  Game: Gamepad2,
  Check: CheckCircle,
  X: XCircle,
  Trophy: Trophy,
  Play: Play,
  Sparkles: Sparkles,
  Next: ArrowRight,
  Help: CircleHelp,
  List: ListChecks,
  Send: Send,
  User: User,
  Bot: Bot,
  Globe: Globe,
  Speaker: Volume2,
  Stop: StopCircle,
  AudioWave: AudioLines,
  Target: Target,
  Flag: Flag,
  Magic: Wand2,
  Grid3x3: Grid3x3,
  Restart: RotateCcw,
  Users: Users,
  Triangle: Triangle,
  Zap: Zap,
  Clock: Clock,
  Lock: Lock,
  Unlock: Unlock,
  Medal: Medal,
  BrainCircuit: BrainCircuit,
};

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ElementType;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading,
  icon: Icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  
  const variants = {
    primary: "bg-gradient-to-r from-brand-500 to-accent-600 text-white hover:from-brand-600 hover:to-accent-700 shadow-lg shadow-brand-500/25 focus:ring-brand-500",
    secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700 focus:ring-slate-500",
    outline: "bg-transparent border-2 border-slate-600 text-slate-300 hover:border-brand-500 hover:text-brand-500 focus:ring-brand-500",
    ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/50 focus:ring-slate-500",
    danger: "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 focus:ring-red-500",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Icons.Loader className="w-5 h-5 mr-2 animate-spin" />}
      {!isLoading && Icon && <Icon className="w-5 h-5 mr-2" />}
      {children}
    </button>
  );
};

// --- Card ---
interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, description }) => {
  return (
    <div className={`bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl ${className}`}>
      {(title || description) && (
        <div className="mb-6">
          {title && <h3 className="text-xl font-bold text-white mb-1">{title}</h3>}
          {description && <p className="text-slate-400 text-sm">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>}
      <input
        className={`w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors outline-none ${className}`}
        {...props}
      />
    </div>
  );
};
