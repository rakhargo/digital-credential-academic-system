import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { Wallet, ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';
import IssuerPanel from '../components/IssuerPanel';
import BlockExplorer from '../components/BlockExplorer';
import { useBlockchain } from '../hooks/useBlockchain';
import { BlockData, Credential, FormData } from '../utils/constants';

const IssuerPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Panggil Hook Blockchain
  const { 
    account, 
    connectWallet, 
    isVerified, isActive,
    issueCredentialOnChain, 
    registerCampus,
    refreshStatus, debugData
  } = useBlockchain(); // Tidak perlu ambil disconnectWallet lagi
  
  const [blockchain, setBlockchain] = useState<BlockData[]>([]);
  const [issuedCredentials, setIssuedCredentials] = useState<Credential[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  // --- LOGIKA TOMBOL CONNECT ---
  const handleConnect = async () => {
    setIsConnecting(true);
    await connectWallet();
    setIsConnecting(false);
  };

  const handleIssueCredential = async (formData: FormData) => {
    if (!account) return alert("Konek wallet dulu!");
    
    // 1. Buat Hash
    const dataString = JSON.stringify(formData);
    const vcHash = ethers.keccak256(ethers.toUtf8Bytes(dataString));
    
    // 2. Kirim ke Blockchain
    const txHash = await issueCredentialOnChain(vcHash);

    if (txHash) {
      // 3. Update UI
      const newCredential: Credential = {
        id: `vc:${Date.now()}`,
        degree: `S1 - ${formData.program}`,
        issuer: "Universitas Indonesia",
        issuanceDate: new Date().toISOString().split('T')[0],
        credentialSubject: { ...formData },
        hash: vcHash,
        proof: { signature: "SignedByMetaMask" }
      };

      const newBlock: BlockData = {
        blockId: blockchain.length + 100,
        txHash: txHash,
        vcHash: vcHash,
        did: `did:ethr:${account}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: "Confirmed"
      };

      setIssuedCredentials([newCredential, ...issuedCredentials]);
      setBlockchain([newBlock, ...blockchain]);
      
      alert("✅ Sukses! Ijazah tercatat di Blockchain.");
    }
  };

  // --- TAMPILAN 1: BELUM KONEK ---
  if (!account) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-center">
            <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <ShieldCheck className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Issuer Portal</h1>
            <p className="text-blue-100 text-sm">Sistem Penerbitan Ijazah Terdesentralisasi</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-lg font-semibold text-slate-800">Hubungkan Dompet Digital</h2>
              <p className="text-slate-500 text-sm">
                Hubungkan MetaMask untuk mengakses panel admin.
              </p>
            </div>

            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-lg shadow-orange-500/20"
            >
              {isConnecting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Menghubungkan...
                </span>
              ) : (
                <>
                  <Wallet size={20} />
                  Connect MetaMask
                  <ArrowRight size={18} className="opacity-70" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- TAMPILAN 2: SUDAH KONEK ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <main className="max-w-6xl mx-auto p-6 mt-6">
        
        <div className="space-y-4 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-violet-600 text-white p-10 rounded-xl shadow-2xl animate-fade-in">
            
            {/* Bagian Header: Judul & Info Wallet */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-extrabold mb-2">Issuer Dashboard</h1>
                <p className="text-blue-100">Portal Manajemen Kredensial Akademik</p>
              </div>
              
              {/* STATUS WALLET (Pojok Kanan Atas) */}
              <div className="text-right">
                <div className="text-xs text-blue-200 mb-1">Connected Wallet</div>
                <div className="bg-white/20 px-3 py-1 rounded-lg font-mono text-sm border border-white/10">
                  {account.substring(0,6)}...{account.substring(38)}
                </div>
              </div>
            </div>

            {/* STATUS VERIFIKASI */}
            <div className="flex items-center gap-4 mt-8">
              <div className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${isVerified ? "bg-green-500 shadow-lg shadow-green-500/30" : "bg-red-500 shadow-lg shadow-red-500/30"}`}>
                <ShieldCheck size={18}/>
                {isVerified ? "TERVERIFIKASI" : "UNVERIFIED"}
              </div>
              
              {/* Pesan Status Dinamis */}
              {!isVerified && isActive && (
                <span className="text-sm text-yellow-200 animate-pulse bg-yellow-900/30 px-3 py-1 rounded-full border border-yellow-500/30">
                  ⏳ Menunggu persetujuan admin (Pending Approval).
                </span>
              )}
            </div>
            
            {/* LOGIKA TOMBOL BARU */}
            {/* Hanya tampilkan tombol Register jika BELUM Register (isActive false) */}
            {!isActive && !isVerified && account && (
              <div className="mt-6 bg-white/10 border border-white/20 p-4 rounded-lg backdrop-blur-sm">
                <p className="mb-3 text-white font-medium">Langkah 1: Daftarkan Identitas Kampus</p>
                <button 
                  onClick={() => registerCampus("Universitas Indonesia")}
                  className="bg-yellow-400 text-black px-6 py-2 rounded-full font-bold hover:bg-yellow-300 shadow-lg transition-all"
                >
                  Register DID on Blockchain
                </button>
              </div>
            )}

            {/* Jika Sudah Register TAPI Belum Verified -> Tampilkan Tombol Cheat Admin */}
            {isActive && !isVerified && (
               <div className="mt-6 bg-blue-500/20 border border-blue-400/50 p-4 rounded-lg backdrop-blur-sm">
                <p className="mb-2 text-blue-100 text-sm">
                  🔒 Akun Anda sudah terdaftar di Blockchain, tetapi belum diverifikasi oleh Kemendikbud (Admin).
                </p>
                <p className="text-xs text-slate-400 mb-3">
                  (Karena ini demo lokal, Anda bisa simulasi jadi Admin untuk verifikasi diri sendiri)
                </p>
                
                {/* Kita butuh fungsi verifySelf di hook nanti, atau sementara manual dulu */}
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-500"
                  onClick={() => alert("Fitur simulasi admin belum dipasang. Minta admin verify manual lewat script Python/Cast.")}
                >
                  👑 Simulasi: Self-Verify (Admin Cheat)
                </button>
              </div>
            )}

          </div>
          
          {/* Panel Form HANYA muncul jika Verified */}
          {isVerified ? (
            <IssuerPanel onIssue={handleIssueCredential} />
          ) : null}
        </div>

        <BlockExplorer data={blockchain} />
      </main>
    </div>
  );
};

export default IssuerPage;