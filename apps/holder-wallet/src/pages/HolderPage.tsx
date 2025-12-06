import React, { useState, useEffect } from 'react';
import { PlusCircle, RefreshCw, UserCheck, Server } from 'lucide-react';
import HolderWallet from '../components/HolderWallet';
import { useHolder } from '../hooks/useHolder'; // Hook baru
import { Credential } from '../utils/constants';

const HolderPage: React.FC = () => {
  const { account, connectWallet, isRegistered, registeredData, registerHolderDID } = useHolder();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const [showRegModal, setShowRegModal] = useState(false);
  const [regName, setRegName] = useState("");
  // Default Endpoint ke Agent Lokal kita
  const [regEndpoint, setRegEndpoint] = useState("http://localhost:4000/api/inbox");

  // Load dari LocalStorage saat startup
  useEffect(() => {
    const saved = localStorage.getItem('my_wallet_vcs');
    if (saved) setCredentials(JSON.parse(saved));
  }, []);

  const syncFromAgent = async () => {
    setIsSyncing(true);
    try {
      // Kita fetch dari agent lokal
      const response = await fetch('http://localhost:4000/api/credentials');
      const inboxData = await response.json();
      
      if (inboxData.length > 0) {
        const newVCs = inboxData.map((item: any) => item.content);
        setCredentials(prev => [...prev, ...newVCs]);
        alert(`✅ Berhasil menarik ${inboxData.length} dokumen baru!`);
      } else {
        console.log("Inbox kosong");
      }
    } catch (e) {
      console.error(e);
      alert("Gagal konek Agent (Pastikan node server.js jalan).");
    }
    setIsSyncing(false);
  };

  useEffect(() => {
    syncFromAgent();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-8 rounded-xl shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-extrabold mb-2">Digital Wallet</h1>
              <p className="opacity-90">Portal Mahasiswa & Alumni</p>
            </div>
            
            {!account ? (
              <button onClick={connectWallet} className="bg-white text-indigo-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100">
                Connect Wallet
              </button>
            ) : (
              <div className="text-right">
                <div className="bg-white/20 px-3 py-1 rounded font-mono text-sm mb-2">
                  {account.substring(0,6)}...{account.substring(38)}
                </div>
                
                {/* INDIKATOR STATUS REGISTRASI */}
                {isRegistered ? (
                  <div className="flex items-center justify-end gap-2 text-green-300 text-sm font-bold">
                    <UserCheck size={16} />
                    DID Registered
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowRegModal(true)}
                    className="text-xs bg-yellow-400 text-indigo-900 px-3 py-1 rounded-full font-bold hover:bg-yellow-300 transition"
                  >
                    ⚠️ Register DID (Wajib untuk Auto-Receive)
                  </button>
                )}
              </div>
            )}
          </div>

          {/* INFO AGENT (Jika Sudah Register) */}
          {isRegistered && registeredData && (
            <div className="mt-6 p-4 bg-black/20 rounded-lg border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Server size={20} className="text-green-300"/>
                </div>
                <div>
                  <p className="text-xs text-indigo-200">Active Service Endpoint</p>
                  <p className="font-mono text-sm text-white">{registeredData.endpoint}</p>
                </div>
              </div>
              <button 
                onClick={syncFromAgent}
                disabled={isSyncing}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition"
              >
                <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                Check Inbox
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          {/* TOMBOL SYNC (Gantikan tombol Import Manual) */}
          <button 
            onClick={syncFromAgent}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition"
          >
            <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? "Syncing..." : "Sync from Cloud Agent"}
          </button>
        </div>

        {/* WALLET CONTENT */}
        <HolderWallet credentials={credentials} account={account} />

        {/* MODAL REGISTRASI DID */}
        {showRegModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-bold mb-2 text-slate-800">Registrasi Identitas</h3>
              <p className="text-sm text-slate-500 mb-6">
                Agar kampus bisa mengirim ijazah secara otomatis, daftarkan nama dan alamat server agent Anda ke Blockchain.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nama Lengkap</label>
                  <input 
                    className="w-full p-3 border rounded-lg"
                    placeholder="Contoh: Rakha Dhifiargo"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Service Endpoint (Agent URL)</label>
                  <input 
                    className="w-full p-3 border rounded-lg bg-slate-50 font-mono text-sm"
                    value={regEndpoint}
                    onChange={(e) => setRegEndpoint(e.target.value)}
                  />
                  <p className="text-xs text-slate-400 mt-1">*Default ke server local agent node.js</p>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-8">
                <button onClick={() => setShowRegModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Batal</button>
                <button 
                  onClick={() => registerHolderDID(regName, regEndpoint)}
                  className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg"
                >
                  Daftar ke Blockchain
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default HolderPage;