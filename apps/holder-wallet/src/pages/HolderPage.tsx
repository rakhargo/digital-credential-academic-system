import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, RefreshCw, UserCheck, Server, Trash2 } from 'lucide-react'; // Tambah icon Trash2
import HolderWallet from '../components/HolderWallet';
import { useHolder } from '../hooks/useHolder';
import { Credential } from '../utils/constants';

const HolderPage: React.FC = () => {
  const { account, connectWallet, isRegistered, registeredData, registerHolderDID } = useHolder();
  
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [showRegModal, setShowRegModal] = useState(false);
  const [regName, setRegName] = useState("");
  const [regEndpoint, setRegEndpoint] = useState("http://localhost:4000/api/inbox"); 

  // --- 1. LOAD DATA AWAL ---
  useEffect(() => {
    const saved = localStorage.getItem('my_wallet_vcs');
    if (saved) {
      try {
        setCredentials(JSON.parse(saved));
      } catch(e) {
        console.error("Gagal load wallet local");
      }
    }
  }, []);

  // --- 2. FUNGSI SIMPAN KE STORAGE ---
  const saveToWallet = (newCreds: Credential[]) => {
    setCredentials(newCreds);
    localStorage.setItem('my_wallet_vcs', JSON.stringify(newCreds));
  };

  // --- 3. FUNGSI RESET MANUAL (DEMO ONLY) ---
  const handleReset = () => {
    if (confirm("⚠️ Yakin ingin menghapus semua data lokal? (Gunakan ini jika Blockchain di-reset)")) {
      localStorage.removeItem('my_wallet_vcs');
      // Opsional: Hapus flag login juga jika mau benar-benar logout
      // localStorage.removeItem('isHolderConnected'); 
      setCredentials([]);
      alert("Wallet Lokal Dibersihkan!");
      window.location.reload();
    }
  };

  const getCredentialId = (vc: any): string => {
    // KASUS 1: Format SD-VC (Yang Anda kirim sekarang)
    // Signature ada di dalam credentialSubject.sdData.signature
    if (vc.credentialSubject?.sdData?.signature) {
      return vc.credentialSubject.sdData.signature;
    }

    // KASUS 2: Format Selective Disclosure Presentation (VP)
    // Signature ada di root object (flat format)
    if (vc.signature && vc.revealed) {
      return vc.signature;
    }

    // KASUS 3: Format VC Standar W3C (Proof JWS)
    if (vc.proof?.jws) {
      return vc.proof.jws;
    }

    // Fallback: Return string kosong (akan dibuang oleh filter)
    return "";
  };

  // --- 4. LOGIC SYNC DENGAN DEDUPLIKASI ---
  const syncFromAgent = useCallback(async (isManual = false) => {
    setIsSyncing(true);
    try {
      const response = await fetch('http://localhost:4000/api/credentials');
      const inboxData = await response.json();
      
      if (inboxData.length > 0) {
        const incomingVCs = inboxData.map((item: any) => item.content);
        let addedCount = 0;

        setCredentials(prevCreds => {
          // Buat Daftar ID yang SUDAH ADA di dompet
          const existingIds = new Set(prevCreds.map(c => getCredentialId(c)));
          
          const uniqueNewVCs = incomingVCs.filter((vc: any) => {
            const id = getCredentialId(vc);
            
            // 1. Jika ID kosong (Data rusak/Format salah), tolak.
            if (!id) return false;

            // 2. Jika ID sudah ada di dompet, tolak (Duplikat).
            if (existingIds.has(id)) return false;
            
            // 3. Jika lolos, simpan ID ini ke Set sementara 
            // (untuk mencegah duplikat ganda dalam satu kali tarikan sync)
            existingIds.add(id); 
            return true;
          });

          addedCount = uniqueNewVCs.length;
          
          if (addedCount > 0) {
            const updatedList = [...uniqueNewVCs, ...prevCreds];
            saveToWallet(updatedList);
            return updatedList;
          }
          return prevCreds; // Tidak ada perubahan
        });

        if (isManual) {
          if (addedCount > 0) console.log(`✅ Berhasil menarik ${addedCount} dokumen baru!`);
          else console.log("Inbox sudah disinkronkan. Tidak ada dokumen baru.");
        }
      } else if (isManual) {
        console.log("Inbox Agent kosong.");
      }
    } catch (e) {
      if (isManual) console.log("Gagal konek Agent (Pastikan node server.js jalan).");
    }
    setIsSyncing(false);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-8 rounded-xl shadow-xl flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-extrabold mb-2">Digital Wallet</h1>
            <p className="opacity-90">Portal Mahasiswa & Alumni</p>
          </div>
          
          {!account ? (
            <button onClick={connectWallet} className="bg-white text-indigo-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition shadow-lg">
              Connect Wallet
            </button>
          ) : (
            <div className="text-right space-y-2">
              <div className="bg-white/20 px-3 py-1 rounded font-mono text-sm border border-white/10 inline-block">
                {account.substring(0,6)}...{account.substring(38)}
              </div>
              
              <div>
                {isRegistered ? (
                  <div className="flex items-center justify-end gap-2 text-green-300 text-sm font-bold bg-green-900/30 px-3 py-1 rounded-full inline-flex">
                    <UserCheck size={16} /> DID Registered
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowRegModal(true)}
                    className="text-xs bg-yellow-400 text-indigo-900 px-4 py-1.5 rounded-full font-bold hover:bg-yellow-300 transition shadow-lg animate-pulse"
                  >
                    ⚠️ Register DID Now
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* TOOLBAR (Agent Info & Actions) */}
        {account && (
          <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            
            {/* Kiri: Info Agent */}
            <div className="flex items-center gap-4">
              {isRegistered && registeredData ? (
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                  <div className="p-1.5 bg-green-100 rounded-md">
                    <Server size={16} className="text-green-600"/>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Agent Endpoint</p>
                    <p className="font-mono text-xs text-slate-700">{registeredData.endpoint}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Agent belum aktif (Register dulu).</p>
              )}
            </div>

            {/* Kanan: Tombol Aksi */}
            <div className="flex gap-3">
              {/* TOMBOL RESET MANUAL (Baru) */}
              <button 
                onClick={handleReset}
                className="flex items-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition text-xs font-bold border border-transparent hover:border-red-100"
                title="Hapus data lokal jika blockchain di-reset"
              >
                <Trash2 size={16} />
                Reset Data
              </button>

              {/* Tombol Sync */}
              <button 
                onClick={() => syncFromAgent(true)}
                disabled={isSyncing || !isRegistered}
                className="flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg font-bold transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                {isSyncing ? "Syncing..." : "Sync Inbox"}
              </button>
            </div>
          </div>
        )}

        <HolderWallet credentials={credentials} account={account} />

        {/* ... (MODAL REGISTRASI TETAP SAMA) ... */}
        {showRegModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-bold mb-2 text-slate-800">Registrasi Identitas</h3>
              <div className="space-y-4 mt-4">
                <input 
                   className="w-full p-3 border rounded-lg" 
                   placeholder="Nama Lengkap" 
                   value={regName} 
                   onChange={e => setRegName(e.target.value)} 
                />
                <input 
                   className="w-full p-3 border rounded-lg bg-slate-50" 
                   value={regEndpoint} 
                   onChange={e => setRegEndpoint(e.target.value)} 
                />
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button onClick={() => setShowRegModal(false)} className="px-4 py-2 text-slate-500">Cancel</button>
                <button 
                  onClick={() => registerHolderDID(regName, regEndpoint)} 
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold"
                >
                  Register
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