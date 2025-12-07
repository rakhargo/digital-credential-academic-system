import React from 'react';
import { ShieldCheck, CheckCircle, FileText, User, RefreshCw, AlertTriangle, Code } from 'lucide-react';
import { usePDDikti } from '../hooks/usePDDikti';

const PDDiktiPage: React.FC = () => {
  const { account, connectWallet, pendingReports, validateCredential, fetchReports, isLoading } = usePDDikti();

  // --- TAMPILAN LOGIN (Sama seperti sebelumnya) ---
  if (!account) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl p-8 text-center border border-slate-700">
          <h1 className="text-3xl font-bold mb-2">PDDikti Admin</h1>
          <button onClick={connectWallet} className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-all">
            Connect Wallet (Validator)
          </button>
        </div>
      </div>
    );
  }

  // --- TAMPILAN DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* Navbar Sederhana */}
      <div className="bg-slate-900 text-white p-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-blue-400" />
            <h1 className="font-bold text-lg">PDDikti Dashboard</h1>
          </div>
          <button onClick={fetchReports} className="p-2 hover:bg-white/10 rounded-full">
             <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6 mt-8">
        <h2 className="text-2xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
          <FileText className="text-blue-600" /> Antrean Validasi ({pendingReports.length})
        </h2>

        {pendingReports.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-500">Tidak ada laporan baru.</p>
            </div>
        ) : (
            <div className="grid gap-6">
                {pendingReports.map((report, idx) => (
                    <div key={idx} className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                        
                        {/* Header Kartu */}
                        <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">PENDING</span>
                                <span className="font-mono text-xs text-slate-500">Hash: {report.vcHash}</span>
                            </div>
                            
                            {/* Tombol Aksi */}
                            <button 
                                onClick={() => validateCredential(report.vcHash)}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md transition-all"
                            >
                                <CheckCircle size={16} />
                                VALIDASI SEKARANG
                            </button>
                        </div>

                        {/* Body: RAW JSON VIEWER */}
                        <div className="p-0 relative group">
                            <div className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition">
                                <span className="text-[10px] bg-black text-white px-2 py-1 rounded uppercase font-bold">Raw JSON</span>
                            </div>
                            <pre className="bg-[#1e1e1e] text-[#d4d4d4] p-4 text-xs font-mono overflow-auto max-h-96">
                                {JSON.stringify(report, null, 2)}
                            </pre>
                        </div>
                        
                        {/* Footer Status Blockchain */}
                        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs flex gap-4">
                            <span className={report.onChainExists ? "text-green-600 font-bold" : "text-red-500"}>
                                Blockchain Exists: {String(report.onChainExists)}
                            </span>
                            <span className={report.isRevoked ? "text-red-600 font-bold" : "text-slate-500"}>
                                Revoked: {String(report.isRevoked)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>
    </div>
  );
};

export default PDDiktiPage;