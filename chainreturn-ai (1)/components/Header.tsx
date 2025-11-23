
import React from 'react';
import { Box, Layers, LayoutDashboard, Network } from 'lucide-react';

interface HeaderProps {
  onNavigate: (view: 'customer' | 'dashboard') => void;
  currentView: 'customer' | 'dashboard';
  onOpenBotPanel: () => void;
  connectedBotCount: number;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentView, onOpenBotPanel, connectedBotCount }) => {
  return (
    <header className="w-full border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('customer')}>
          <div className="bg-gradient-to-br from-blue-500 to-violet-600 p-2 rounded-lg">
            <Box className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            ChainReturn
          </span>
        </div>

        <nav className="flex gap-4">
           <button
            onClick={onOpenBotPanel}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2
              ${connectedBotCount > 0
                ? 'bg-blue-900/40 text-blue-300 border border-blue-500/50 hover:bg-blue-900/60' 
                : 'text-slate-400 hover:text-white border border-transparent hover:border-slate-700'}`}
          >
            <Network className={`w-4 h-4 ${connectedBotCount > 0 ? 'animate-pulse' : ''}`} />
            {connectedBotCount > 0 ? `${connectedBotCount} Nodes Linked` : 'Connect Bots'}
          </button>

          <div className="h-6 w-px bg-slate-700 mx-2 self-center hidden sm:block"></div>

          <button
            onClick={() => onNavigate('customer')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2
              ${currentView === 'customer' 
                ? 'bg-slate-800 text-white border border-slate-600' 
                : 'text-slate-400 hover:text-white'}`}
          >
            <Layers className="w-4 h-4" />
            Return Portal
          </button>
          <button
            onClick={() => onNavigate('dashboard')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2
              ${currentView === 'dashboard' 
                ? 'bg-slate-800 text-white border border-slate-600' 
                : 'text-slate-400 hover:text-white'}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
