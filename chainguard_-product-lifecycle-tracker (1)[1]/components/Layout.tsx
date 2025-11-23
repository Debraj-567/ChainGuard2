import React, { ReactNode } from 'react';
import { User, UserRole } from '../types';
import { Activity, Box, ShoppingBag, Truck, ShieldCheck, LogOut, User as UserIcon } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentUser: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentUser, onLogout }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-slate-950 border-r border-slate-800 flex flex-col sticky top-0 md:h-screen z-10">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-blue-600 p-2 rounded-lg">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-white">ChainGuard</h1>
            <p className="text-xs text-slate-400">Verifiable Supply Chain</p>
          </div>
        </div>

        {currentUser ? (
             <div className="p-6 border-b border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-3 mb-2">
                    <img src={currentUser.avatar} alt="avatar" className="w-10 h-10 rounded-full border border-slate-700 bg-slate-800" />
                    <div>
                        <p className="font-semibold text-sm text-white">{currentUser.name}</p>
                        <p className="text-xs text-blue-400">{currentUser.role}</p>
                    </div>
                </div>
             </div>
        ) : (
             <div className="p-6 border-b border-slate-800">
                 <p className="text-sm text-slate-500">Public Verification Mode</p>
             </div>
        )}

        <nav className="flex-1 p-4 space-y-2">
            {currentUser?.role === UserRole.MANUFACTURER && (
                <div className="flex items-center gap-3 px-4 py-3 bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-lg">
                    <Box size={18} /> <span className="font-medium">Production</span>
                </div>
            )}
             {currentUser?.role === UserRole.WAREHOUSE && (
                <div className="flex items-center gap-3 px-4 py-3 bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 rounded-lg">
                    <Truck size={18} /> <span className="font-medium">Logistics Center</span>
                </div>
            )}
             {currentUser?.role === UserRole.RETAILER && (
                <div className="flex items-center gap-3 px-4 py-3 bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 rounded-lg">
                    <ShoppingBag size={18} /> <span className="font-medium">Retail Operations</span>
                </div>
            )}
            {(currentUser?.role === UserRole.EXPLORER || !currentUser) && (
                 <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 text-slate-300 rounded-lg">
                    <Activity size={18} /> <span className="font-medium">Chain Explorer</span>
                </div>
            )}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-3">
           <div className="bg-slate-900 rounded p-3 text-xs text-slate-500">
                <p>Status: <span className="text-green-500">Online</span></p>
                <p>Blocks: <span className="text-blue-400">Synced</span></p>
           </div>
           
           {currentUser && (
               <button 
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition text-sm font-medium"
               >
                   <LogOut size={16} /> Sign Out
               </button>
           )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen bg-slate-900 relative">
        <div className="p-6 md:p-10 max-w-7xl mx-auto pb-24">
            {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;