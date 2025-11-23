
import React from 'react';
import { ProductPassport } from '../types';
import { Factory, Warehouse, Truck, ShoppingBag, CheckCircle, Database } from 'lucide-react';

interface SupplyChainVisualizerProps {
  passport: ProductPassport;
  onComplete: () => void;
}

const SupplyChainVisualizer: React.FC<SupplyChainVisualizerProps> = ({ passport, onComplete }) => {
  return (
    <div className="animate-fadeIn">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900/30 border border-blue-500/50 rounded-full text-blue-300 text-sm font-mono mb-4 animate-pulse">
           <Database className="w-4 h-4" /> Connected to Phase 1: Manufacturing Node
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Product Provenance Verified</h2>
        <p className="text-slate-400 text-sm">
           Immutable Ledger History for ID: <span className="font-mono text-white">{passport.uniqueId}</span>
        </p>
      </div>

      <div className="relative border-l-2 border-slate-700 ml-6 md:ml-12 my-8 space-y-8">
        {passport.history.map((event, index) => {
           const Icon = getIcon(event.stage);
           return (
             <div key={event.id} className="relative pl-8 md:pl-12 group">
               {/* Timeline Dot */}
               <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border-2 border-blue-500 group-hover:bg-blue-500 transition-colors z-10"></div>
               
               {/* Content Card */}
               <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl hover:border-blue-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                     <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-lg ${getColor(event.stage)} bg-opacity-20`}>
                           {Icon}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${getColor(event.stage)} bg-opacity-20 text-white`}>
                           {event.stage}
                        </span>
                     </div>
                     <span className="text-xs font-mono text-slate-500">{new Date(event.timestamp).toLocaleDateString()}</span>
                  </div>
                  
                  <h4 className="text-white font-medium text-sm">{event.action}</h4>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400 font-mono">
                     <span>Auth: {event.actor}</span>
                     <span className="truncate max-w-[80px] opacity-50">{event.hash}</span>
                  </div>
               </div>
             </div>
           );
        })}
      </div>

      <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-xl flex items-center gap-4 mb-6">
         <div className="bg-emerald-500/20 p-2 rounded-full">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
         </div>
         <div>
            <h4 className="text-white font-bold text-sm">Authenticity Confirmed</h4>
            <p className="text-slate-400 text-xs">This item is a verified asset from your Manufacturing Chain.</p>
         </div>
      </div>

      <button 
        onClick={onComplete}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20"
      >
        Proceed to Return Analysis
      </button>
    </div>
  );
};

const getIcon = (stage: string) => {
  switch (stage) {
    case 'MANUFACTURING': return <Factory className="w-4 h-4 text-blue-400" />;
    case 'WAREHOUSE': return <Warehouse className="w-4 h-4 text-orange-400" />;
    case 'LOGISTICS': return <Truck className="w-4 h-4 text-yellow-400" />;
    case 'RETAIL': return <ShoppingBag className="w-4 h-4 text-pink-400" />;
    default: return <Database className="w-4 h-4 text-slate-400" />;
  }
};

const getColor = (stage: string) => {
  switch (stage) {
    case 'MANUFACTURING': return 'bg-blue-500';
    case 'WAREHOUSE': return 'bg-orange-500';
    case 'LOGISTICS': return 'bg-yellow-500';
    case 'RETAIL': return 'bg-pink-500';
    default: return 'bg-slate-500';
  }
};

export default SupplyChainVisualizer;
