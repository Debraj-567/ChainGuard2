
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CustomerReturnFlow from './components/CustomerReturnFlow';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import BotConnectionPanel from './components/BotConnectionPanel';
import { Block, User, ExternalBot } from './types';
import { GENESIS_BLOCK } from './services/blockchainService';
import { Toast, ToastMessage, ToastType } from './components/Toast';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'customer' | 'dashboard'>('customer');
  const [blockchain, setBlockchain] = useState<Block[]>([GENESIS_BLOCK]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Bot Network State
  const [connectedBots, setConnectedBots] = useState<ExternalBot[]>([]);
  const [showBotPanel, setShowBotPanel] = useState(false);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    showToast('success', 'Welcome Back', `Logged in as ${loggedInUser.email}`);
  };

  const handleBlockCreated = (newBlock: Block) => {
    setBlockchain(prev => [...prev, newBlock]);
  };

  const showToast = (type: ToastType, title: string, message: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (!user) {
    return (
      <>
         <Login onLogin={handleLogin} />
         {/* Toast Container for Login Screen */}
         <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none">
            <div className="pointer-events-auto">
               {toasts.map(toast => (
                 <Toast key={toast.id} toast={toast} onClose={removeToast} />
               ))}
            </div>
         </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-200">
      {/* Decorative background elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-violet-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10">
        <Header 
          currentView={currentView} 
          onNavigate={setCurrentView} 
          onOpenBotPanel={() => setShowBotPanel(true)}
          connectedBotCount={connectedBots.length}
        />
        
        <main className="pb-12">
          {currentView === 'customer' ? (
            <>
              <div className="text-center py-12 px-4">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-slate-600" />
                  <span className="text-slate-400">Hello, <span className="text-white font-bold">{user.name}</span></span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-violet-400 to-emerald-400">
                  Instant Returns. <br className="hidden md:block" />Powered by Trust.
                </h1>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                  Experience the future of commerce. AI verifies your product condition in seconds, 
                  and Blockchain executes your refund immediately.
                </p>
              </div>
              
              <CustomerReturnFlow 
                user={user}
                onBlockCreated={handleBlockCreated}
                lastBlockHash={blockchain[blockchain.length - 1].hash}
                blockHeight={blockchain.length}
                showToast={showToast}
                connectedBots={connectedBots}
              />
            </>
          ) : (
            <Dashboard blocks={blockchain} />
          )}
        </main>
      </div>

      {showBotPanel && (
        <BotConnectionPanel 
          connectedBots={connectedBots}
          onAddBot={(bot) => {
            setConnectedBots(prev => [...prev, bot]);
            showToast('success', 'Node Connected', `${bot.name} is now active in the neural network.`);
          }}
          onRemoveBot={(id) => setConnectedBots(prev => prev.filter(b => b.id !== id))}
          onClose={() => setShowBotPanel(false)}
        />
      )}

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none">
        <div className="pointer-events-auto">
           {toasts.map(toast => (
             <Toast key={toast.id} toast={toast} onClose={removeToast} />
           ))}
        </div>
      </div>
    </div>
  );
}

export default App;
