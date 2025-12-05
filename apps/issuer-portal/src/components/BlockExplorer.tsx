import React from 'react';
import { Database } from 'lucide-react';
import { BlockData } from '../utils/constants';

interface BlockExplorerProps {
  data: BlockData[];
}

const BlockExplorer: React.FC<BlockExplorerProps> = ({ data }) => (
  <div className="mt-12 border-t pt-8">
    <div className="flex items-center gap-2 mb-4">
      <Database className="text-slate-400" size={20} />
      <h3 className="font-bold text-slate-700">Live Blockchain Ledger (Simulasi)</h3>
    </div>
    <div className="overflow-x-auto bg-slate-900 rounded-xl p-4 shadow-inner">
      <table className="w-full text-left text-xs font-mono">
        <thead>
          <tr className="text-slate-500 border-b border-slate-700">
            <th className="p-2">Block #</th>
            <th className="p-2">Timestamp</th>
            <th className="p-2">Transaction Hash</th>
            <th className="p-2">VC Hash (Data Integrity)</th>
            <th className="p-2">Status</th>
          </tr>
        </thead>
        <tbody className="text-slate-300">
          {data.map((block, i) => (
            <tr key={i} className="border-b border-slate-800 hover:bg-slate-800 transition-colors">
              <td className="p-2 text-blue-400">#{block.blockId}</td>
              <td className="p-2">{block.timestamp}</td>
              <td className="p-2">{block.txHash}</td>
              <td className="p-2 text-yellow-500">{block.vcHash.substring(0, 16)}...</td>
              <td className="p-2 text-green-400">{block.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default BlockExplorer;