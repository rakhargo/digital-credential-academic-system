import React from 'react';
import { Building2, ShieldCheck, LogOut } from 'lucide-react';
import VerifierPortal from '../components/VerifierPortal';
import { useVerifier } from '../hooks/useVerifier';

const VerifierPage: React.FC = () => {
  const { account, connectWallet, disconnectWallet } = useVerifier();

  // --- TAMPILAN 1: BELUM LOGIN ---
  if (!account) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
          <div className="p-8 text-center">
            <div className="bg-teal-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="text-teal-400" size={40} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Verifier Portal</h1>
            <p className="text-slate-400 mb-8">
              Portal Validasi Dokumen Akademik untuk Perusahaan & HRD.
            </p>
            
            <button 
              onClick={connectWallet}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-teal-900/50 flex items-center justify-center gap-2"
            >
              <ShieldCheck size={20} />
              Connect Wallet Access
            </button>
            <p className="mt-4 text-xs text-slate-500">
              Akses blockchain diperlukan untuk memvalidasi status emiten (Issuer) dan pencabutan (Revocation).
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- TAMPILAN 2: DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* Header */}
      <div className="bg-slate-900 text-white shadow-xl">
        <div className="max-w-6xl mx-auto p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Building2 className="text-teal-400" size={28} />
            <div>
              <h1 className="text-2xl font-bold">Verifier Dashboard</h1>
              <p className="text-xs text-slate-400">Verifikasi Integritas & Validitas PDDikti</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-sm font-mono text-teal-400">
              {account.substring(0,6)}...{account.substring(38)}
            </div>
            <button 
              onClick={disconnectWallet}
              className="p-2 hover:bg-red-500/20 rounded-full text-slate-400 hover:text-red-400 transition"
              title="Disconnect"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-6 mt-6 space-y-6">
        
        {/* Intro Card */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white p-8 rounded-2xl shadow-lg">
          <h2 className="text-xl font-bold mb-2">Selamat Datang, HRD/Verifier.</h2>
          <p className="opacity-90 max-w-2xl">
            Gunakan portal ini untuk memeriksa keaslian ijazah pelamar. Sistem akan memvalidasi Tanda Tangan Digital (Kriptografi), Status Kampus (Blockchain), dan Legalisasi PDDikti.
          </p>
        </div>

        {/* Portal Input Utama */}
        {/* Kita tidak perlu pass prop handleVerify lagi, karena logic sudah di dalam komponen */}
        <VerifierPortal />
        
      </main>
    </div>
  );
};

export default VerifierPage;