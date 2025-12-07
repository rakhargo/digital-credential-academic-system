import React, { useState } from 'react';
import { Wallet, School, QrCode, Copy, User, Loader } from 'lucide-react';
import { Credential } from '../utils/constants';
import { useHolder } from '../hooks/useHolder'; // Import Hook
import { createSDPresentation } from '../utils/selectiveDisclosure';

interface HolderWalletProps {
  credentials: Credential[];
  account: string; // Terima props account
}

const HolderWallet: React.FC<HolderWalletProps> = ({ credentials, account }) => {
  const { createVerifiablePresentation } = useHolder(); // Panggil Hook
  const [selectedVc, setSelectedVc] = useState<any>(null);
  const [isSigning, setIsSigning] = useState(false); // Loading state

  const [showSelectModal, setShowSelectModal] = useState(false);
  const [vcToPresent, setVcToPresent] = useState<any>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const openPresentationModal = (vc: any) => {
    setVcToPresent(vc);
    // Ambil semua keys dari data mentah
    const keys = Object.keys(vc.credentialSubject.sdData.rawValues);
    setSelectedFields(keys); // Default pilih semua
    setShowSelectModal(true);
  };

  // Toggle Checkbox
  const toggleField = (field: string) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter(f => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const handleGenerateVP = () => {
    const vp = createSDPresentation(vcToPresent, selectedFields, `did:ethr:${account}`);
    
    // Copy ke clipboard
    navigator.clipboard.writeText(JSON.stringify(vp, null, 2));
    alert("✅ Selective Disclosure VP berhasil dibuat! (Data yang tidak dicentang telah disembunyikan)");
    setShowSelectModal(false);
  };

  // Fungsi COPY yang baru (Async Signing)
  const handleCopyVP = async (vc: any) => {
    setIsSigning(true);
    const vpString = await createVerifiablePresentation(vc); // Trigger MetaMask
    setIsSigning(false);

    if (vpString) {
      navigator.clipboard.writeText(vpString);
      alert("✅ VP Token berhasil dibuat & disalin! Kirim ke Verifier.");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
      
      {/* CARD IDENTITY (Kiri) - Update datanya biar dinamis */}
      <div className="md:col-span-1 space-y-4">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <User size={100} />
          </div>
          <div className="relative z-10">
            <h3 className="text-lg font-semibold opacity-90">Digital Identity Wallet</h3>
            <div className="mt-8">
              <p className="text-xs opacity-70 uppercase tracking-wider">DID Holder</p>
              <p className="font-mono text-sm truncate">
                {account ? `did:ethr:${account}` : "Not Connected"}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <p className="text-xs font-medium">Status: Verified</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="font-semibold text-slate-700 mb-2">Statistik Wallet</h4>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Total Kredensial</span>
            <span className="font-bold text-slate-800">{credentials.length}</span>
          </div>
        </div>
      </div>

      {/* LIST KREDENSIAL (Kanan) */}
      <div className="md:col-span-2 space-y-4">
        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <Wallet size={20} className="text-indigo-600"/>
          Kredensial Saya
        </h3>
        
        {credentials.length === 0 ? (
          <div className="text-center p-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500">Belum ada kredensial yang diterbitkan.</p>
          </div>
        ) : (
          credentials.map((vc: any, index: number) => {
            // Ambil data dinamis dengan Fallback agar tidak crash
            const subjectData = vc.credentialSubject?.data || {};
            
            // Coba ambil degree, kalau tidak ada, cari nama dokumen lain
            const title = subjectData.degree || subjectData.type || "Dokumen Akademik";
            const issuerDid = vc.issuer || "Unknown Issuer";
            const issueDate = vc.issuanceDate ? new Date(vc.issuanceDate).toLocaleDateString() : "-";
            
            // Hash pendek untuk display (jika tidak ada hash di json, kita generate dummy)
            const displayHash = vc.proof?.jws ? vc.proof.jws.substring(0, 10) : "No-Sig";

            return (
            <div key={index} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                     <School size={24} />
                  </div>
                  <div>
                     <h4 className="font-bold text-slate-800 text-lg">{title}</h4>
                     <p className="text-slate-600 text-sm font-mono">{issuerDid.substring(0, 20)}...</p>
                     <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                       <span>Issued: {issueDate}</span>
                       <span>•</span>
                       <span className="font-mono bg-slate-100 px-1 rounded">Sig: {displayHash}...</span>
                     </div>
                  </div>
                </div>
                
                {/* Indikator Status (Opsional: Bisa cek expired date) */}
                <div className="text-right">
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                    ACTIVE
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex justify-end gap-3">
                 {/* Tombol QR (View Raw) */}
                 <button 
                   onClick={() => setSelectedVc(vc)} 
                   className="text-sm text-slate-600 hover:text-blue-600 flex items-center gap-1"
                 >
                    <QrCode size={16} /> View Raw
                 </button>
                 
                 {/* TOMBOL SIGN VP */}
                 <button 
                    onClick={() => openPresentationModal(vc)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                  >
                    <Copy size={16} /> Selective VP
                  </button>
              </div>
            </div>
          )})
        )}
      </div>

      {selectedVc && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          {/* Ubah max-w-sm jadi max-w-3xl agar lebar */}
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
            
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              📄 Raw Credential Data
            </h3>
            
            {/* Area JSON dengan Scrollbar */}
            <div className="flex-1 overflow-auto bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
              <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap break-all leading-relaxed">
                {JSON.stringify(selectedVc, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={() => setSelectedVc(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 px-6 rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SELEKSI FIELD (Baru) */}
        {showSelectModal && vcToPresent && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-lg font-bold mb-2">Pilih Data untuk Dibuka</h3>
              <p className="text-xs text-slate-500 mb-4">
                Data yang tidak dicentang akan disembunyikan (Hashed) demi privasi.
              </p>
              
              <div className="space-y-2 mb-6">
                {Object.keys(vcToPresent.credentialSubject.sdData.rawValues).map(key => (
                  <label key={key} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedFields.includes(key)}
                      onChange={() => toggleField(key)}
                      className="w-5 h-5 text-indigo-600 rounded"
                    />
                    <div>
                      <p className="font-bold text-sm capitalize">{key}</p>
                      <p className="text-xs text-slate-500 truncate w-48">
                        {vcToPresent.credentialSubject.sdData.rawValues[key]}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <button 
                onClick={handleGenerateVP}
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition"
              >
                Generate & Copy VP
              </button>
              <button onClick={() => setShowSelectModal(false)} className="w-full mt-2 text-slate-500 py-2 text-sm">Batal</button>
            </div>
          </div>
        )}
    </div>
  );
};

export default HolderWallet;