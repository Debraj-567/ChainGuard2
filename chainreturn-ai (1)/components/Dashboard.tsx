
import React from 'react';
import { Block } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { ShieldAlert, Clock, IndianRupee, Activity, Fingerprint, Network, Users, ShoppingBag } from 'lucide-react';

interface DashboardProps {
  blocks: Block[];
}

const Dashboard: React.FC<DashboardProps> = ({ blocks }) => {
  
  // Calculate stats
  const totalReturns = blocks.length;
  const totalValue = blocks.reduce((acc, b) => acc + (b.data.estimatedRefund || 0), 0);
  
  // Fraud Stats
  const fraudBlocks = blocks.filter(b => b.data.fraudRisk && b.data.fraudRisk.riskLevel !== 'LOW');
  const syndicateCount = blocks.filter(b => b.data.fraudRisk?.flags.isSyndicate).length;
  const wardrobingCount = blocks.filter(b => b.data.fraudRisk?.flags.isWardrobing).length;
  const serialReturnerCount = blocks.filter(b => b.data.fraudRisk?.flags.isSerialReturner).length;
  const deviceSpoofCount = blocks.filter(b => b.data.fraudRisk?.flags.isDeviceSpoofing).length;

  const avgProcessingTime = "2.4s"; // Simulated metric

  const chartData = blocks.map((b, i) => ({
    name: `Block #${b.index}`,
    refund: b.data.estimatedRefund,
    score: b.data.authenticityScore,
  })).slice(-10); // Last 10

  const fraudDistribution = [
    { name: 'Syndicates', value: syndicateCount, color: '#ef4444' },
    { name: 'Wardrobing', value: wardrobingCount, color: '#f97316' },
    { name: 'Serial Returns', value: serialReturnerCount, color: '#eab308' },
    { name: 'Device Spoof', value: deviceSpoofCount, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold text-white mb-6">Real-Time Ledger Analytics</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="glass-panel p-6 rounded-xl border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-400 text-sm font-medium">Total Processed</p>
                    <h3 className="text-3xl font-bold text-white mt-1">{totalReturns}</h3>
                </div>
                <Activity className="text-blue-500 w-6 h-6" />
            </div>
        </div>

        <div className="glass-panel p-6 rounded-xl border-l-4 border-emerald-500">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-400 text-sm font-medium">Funds Released</p>
                    <h3 className="text-3xl font-bold text-white mt-1">₹{totalValue.toFixed(2)}</h3>
                </div>
                <IndianRupee className="text-emerald-500 w-6 h-6" />
            </div>
        </div>

        <div className="glass-panel p-6 rounded-xl border-l-4 border-red-500">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-400 text-sm font-medium">Fraud Detected</p>
                    <h3 className="text-3xl font-bold text-white mt-1">{fraudBlocks.length}</h3>
                </div>
                <ShieldAlert className="text-red-500 w-6 h-6" />
            </div>
        </div>

        <div className="glass-panel p-6 rounded-xl border-l-4 border-violet-500">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-400 text-sm font-medium">Avg. Validation Time</p>
                    <h3 className="text-3xl font-bold text-white mt-1">{avgProcessingTime}</h3>
                </div>
                <Clock className="text-violet-500 w-6 h-6" />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="glass-panel p-6 rounded-xl lg:col-span-2 h-[400px]">
          <h3 className="text-lg font-bold text-white mb-4">Refund Volume Stream (INR)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }}
                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                formatter={(value: number) => [`₹${value}`, 'Refund']}
              />
              <Bar dataKey="refund" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Blocks Feed */}
        <div className="glass-panel p-6 rounded-xl lg:col-span-1 h-[400px] overflow-hidden flex flex-col">
           <h3 className="text-lg font-bold text-white mb-4">Latest Ledger Entries</h3>
           <div className="overflow-y-auto flex-1 space-y-4 pr-2 custom-scrollbar">
              {blocks.slice().reverse().map((block) => (
                <div key={block.hash} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 text-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-mono text-blue-400">#{block.index}</span>
                        <span className="text-xs text-slate-500">{new Date(block.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                         <div className={`w-2 h-2 rounded-full ${
                             block.data.fraudRisk?.riskLevel === 'CRITICAL' ? 'bg-red-500' : 
                             block.data.policyStatus === 'APPROVED' ? 'bg-green-500' : 'bg-yellow-500'
                         }`}></div>
                         <span className="text-slate-300">{block.data.itemType} ({block.data.condition})</span>
                    </div>
                    {block.data.fraudRisk?.riskLevel !== 'LOW' && block.data.fraudRisk && (
                        <div className="text-xs text-red-400 font-bold mt-1">
                           ⚠ {block.data.fraudRisk.detectedPatterns[0]}
                        </div>
                    )}
                    <div className="text-xs font-mono text-slate-600 truncate mt-1">
                        Hash: {block.hash}
                    </div>
                </div>
              ))}
           </div>
        </div>

        {/* Fraud Intelligence Panel (New) */}
        <div className="glass-panel p-6 rounded-xl lg:col-span-3 h-[300px] flex gap-8">
            <div className="flex-1">
               <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                   <ShieldAlert className="text-red-500 w-5 h-5" />
                   Fraud Intelligence Center
               </h3>
               <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-800/50 p-4 rounded border border-slate-700">
                       <div className="flex items-center gap-2 text-slate-400 mb-1">
                           <Network className="w-4 h-4" /> Syndicates Blocked
                       </div>
                       <div className="text-2xl font-bold text-white">{syndicateCount}</div>
                   </div>
                   <div className="bg-slate-800/50 p-4 rounded border border-slate-700">
                       <div className="flex items-center gap-2 text-slate-400 mb-1">
                           <Users className="w-4 h-4" /> Serial Returners
                       </div>
                       <div className="text-2xl font-bold text-white">{serialReturnerCount}</div>
                   </div>
                   <div className="bg-slate-800/50 p-4 rounded border border-slate-700">
                       <div className="flex items-center gap-2 text-slate-400 mb-1">
                           <Fingerprint className="w-4 h-4" /> Device Spoofing
                       </div>
                       <div className="text-2xl font-bold text-white">{deviceSpoofCount}</div>
                   </div>
                   <div className="bg-slate-800/50 p-4 rounded border border-slate-700">
                       <div className="flex items-center gap-2 text-slate-400 mb-1">
                           <ShoppingBag className="w-4 h-4" /> Wardrobing
                       </div>
                       <div className="text-2xl font-bold text-white">{wardrobingCount}</div>
                   </div>
               </div>
            </div>

            <div className="w-[300px] flex flex-col items-center justify-center">
                 <h4 className="text-sm font-medium text-slate-400 mb-2">Threat Distribution</h4>
                 {fraudDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie 
                                data={fraudDistribution} 
                                dataKey="value" 
                                cx="50%" 
                                cy="50%" 
                                outerRadius={80} 
                                innerRadius={60}
                            >
                                {fraudDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }} />
                        </PieChart>
                    </ResponsiveContainer>
                 ) : (
                     <div className="text-slate-600 text-sm">No fraud data detected yet</div>
                 )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
