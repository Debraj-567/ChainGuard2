
import React, { useState } from 'react';
import { ExternalBot } from '../types';
import { Bot, Link, Trash2, Plus, Terminal, Wifi } from 'lucide-react';

interface BotConnectionPanelProps {
  connectedBots: ExternalBot[];
  onAddBot: (bot: ExternalBot) => void;
  onRemoveBot: (id: string) => void;
  onClose: () => void;
}

const BotConnectionPanel: React.FC<BotConnectionPanelProps> = ({ connectedBots, onAddBot, onRemoveBot, onClose }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Legal' | 'Finance' | 'Logistics' | 'Supervisor'>('Legal');
  const [systemInstruction, setSystemInstruction] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleAdd = () => {
    if (!name || !systemInstruction) return;
    
    setIsConnecting(true);
    // Simulate handshake
    setTimeout(() => {
      onAddBot({
        id: Math.random().toString(36).substr(2, 9),
        name,
        role,
        systemInstruction,
        isConnected: true
      });
      setName('');
      setSystemInstruction('');
      setIsConnecting(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh]">
        
        {/* Left: Bot List */}
        <div className="w-full md:w-1/3 bg-slate-950 border-r border-slate-800 p-6 flex flex-col">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <NetworkIcon className="w-5 h-5 text-blue-400" /> Active Nodes
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {connectedBots.length === 0 ? (
              <div className="text-slate-500 text-sm text-center py-8 italic">
                No external agents linked.
              </div>
            ) : (
              connectedBots.map(bot => (
                <div key={bot.id} className="bg-slate-900 p-4 rounded-lg border border-slate-700 relative group hover:border-blue-500 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 mb-1">
                      <Bot className={`w-4 h-4 ${getRoleColor(bot.role)}`} />
                      <span className="font-bold text-white text-sm">{bot.name}</span>
                    </div>
                    <button 
                      onClick={() => onRemoveBot(bot.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-slate-400 mb-2">{bot.role} Agent</div>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    ONLINE
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Add New Bot */}
        <div className="w-full md:w-2/3 p-8 bg-slate-900/50 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Connect External Bot</h2>
              <p className="text-slate-400 text-sm">Input the System Instructions from your other PC's AI Studio project.</p>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white">
              <span className="text-2xl">&times;</span>
            </button>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Bot Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sentinel-X"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Role</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="Legal">Legal & Compliance</option>
                  <option value="Finance">Finance & Audit</option>
                  <option value="Logistics">Logistics & Inventory</option>
                  <option value="Supervisor">Supervisor (General)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase text-slate-500 font-bold mb-1 flex items-center justify-between">
                <span>System Instructions (Copy from AI Studio)</span>
                <span className="flex items-center gap-1 text-[10px] text-blue-400"><Terminal className="w-3 h-3"/> RAW INPUT</span>
              </label>
              <textarea 
                value={systemInstruction}
                onChange={(e) => setSystemInstruction(e.target.value)}
                placeholder="Paste the 'System Instruction' block from your other bot here. This defines its personality and rules."
                className="w-full h-48 bg-slate-950 border border-slate-700 rounded-lg p-4 text-sm font-mono text-slate-300 focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            <button
              onClick={handleAdd}
              disabled={isConnecting || !name || !systemInstruction}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                ${!name || !systemInstruction 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'}`}
            >
              {isConnecting ? (
                <>
                  <Wifi className="w-5 h-5 animate-ping" /> Establishing Uplink...
                </>
              ) : (
                <>
                  <Link className="w-5 h-5" /> Link Agent Node
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const getRoleColor = (role: string) => {
  switch (role) {
    case 'Legal': return 'text-red-400';
    case 'Finance': return 'text-emerald-400';
    case 'Logistics': return 'text-orange-400';
    default: return 'text-blue-400';
  }
};

const NetworkIcon: React.FC<{className?: string}> = ({className}) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

export default BotConnectionPanel;
