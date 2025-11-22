
import React from 'react';
import { DominoData, DominoNode } from '../types';
import { Truck, Users, Factory, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';

interface DominoGraphProps {
  data: DominoData;
  targetTicker: string;
}

const DominoGraph: React.FC<DominoGraphProps> = ({ data, targetTicker }) => {
  if (!data || !data.nodes || !data.edges) return null;

  const suppliers = data.nodes.filter(n => n.type === 'supplier');
  const customers = data.nodes.filter(n => n.type === 'customer');
  // If target isn't explicitly in nodes, we create a dummy visual for it
  const targetNode = data.nodes.find(n => n.type === 'target') || { id: 'TARGET', name: targetTicker, type: 'target', sentiment: 'neutral', impactDetails: '' };

  const renderNode = (node: DominoNode) => {
    const isRisk = node.sentiment === 'negative';
    const isOpp = node.sentiment === 'positive';
    
    return (
      <div 
        key={node.id}
        className={`relative p-3 rounded-xl border-2 transition-all hover:scale-105 ${
            isRisk ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' :
            isOpp ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' :
            'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
        }`}
      >
          <div className="flex items-center gap-2 mb-1">
              <div className={`p-1.5 rounded-full ${
                  node.type === 'supplier' ? 'bg-blue-100 text-blue-600' : 
                  node.type === 'customer' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
              }`}>
                  {node.type === 'supplier' ? <Truck size={14} /> : node.type === 'customer' ? <Users size={14} /> : <Factory size={14} />}
              </div>
              <span className="font-bold text-xs text-gray-800 dark:text-gray-200 truncate max-w-[100px]">{node.name}</span>
          </div>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2">{node.impactDetails || "No major impact detected."}</p>
          
          {/* Status Icon */}
          <div className="absolute -top-2 -right-2 bg-white dark:bg-gray-900 rounded-full">
              {isRisk ? <AlertTriangle size={16} className="text-red-500 fill-red-100" /> : 
               isOpp ? <CheckCircle size={16} className="text-emerald-500 fill-emerald-100" /> : null}
          </div>
      </div>
    );
  };

  return (
    <div className="w-full my-6 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-xl p-4 overflow-x-auto">
        <div className="flex items-center gap-2 mb-6">
            <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded">
                <Factory size={16} />
            </div>
            <h4 className="font-bold text-sm text-gray-700 dark:text-gray-200 uppercase tracking-wide">Supply Chain Domino Effect</h4>
        </div>

        <div className="flex justify-between items-center min-w-[500px] gap-8 relative">
            
            {/* SVG Connector Overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ overflow: 'visible' }}>
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
                    </marker>
                </defs>
                {/* Lines would ideally be calculated dynamically based on refs, but for a simplified static view using flex, we draw generic paths */}
                <path d="M 140 60 C 200 60, 200 60, 260 60" stroke="#e5e7eb" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                <path d="M 380 60 C 440 60, 440 60, 500 60" stroke="#e5e7eb" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
            </svg>

            {/* Column 1: Suppliers */}
            <div className="flex flex-col gap-4 w-1/3 z-10">
                <div className="text-center text-[10px] uppercase font-bold text-gray-400 mb-2">Upstream (Suppliers)</div>
                {suppliers.length > 0 ? suppliers.map(renderNode) : <div className="text-xs text-gray-400 text-center italic">No data</div>}
            </div>

            {/* Column 2: Target */}
            <div className="flex flex-col justify-center w-1/3 z-10 px-4">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-blue-500 text-center transform scale-110">
                     <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-2 text-blue-600">
                         <Factory size={20} />
                     </div>
                     <h3 className="font-black text-gray-900 dark:text-white text-lg">{targetTicker}</h3>
                     <span className="text-[10px] text-gray-500 uppercase">Target Entity</span>
                </div>
            </div>

            {/* Column 3: Customers */}
            <div className="flex flex-col gap-4 w-1/3 z-10">
                <div className="text-center text-[10px] uppercase font-bold text-gray-400 mb-2">Downstream (Customers)</div>
                {customers.length > 0 ? customers.map(renderNode) : <div className="text-xs text-gray-400 text-center italic">No data</div>}
            </div>
        </div>
    </div>
  );
};

export default DominoGraph;
