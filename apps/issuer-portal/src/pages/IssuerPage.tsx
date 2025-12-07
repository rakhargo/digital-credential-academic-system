import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { Wallet, ShieldCheck, ArrowRight, Building2, Globe } from 'lucide-react';
import IssuerPanel from '../components/IssuerPanel';
// import BlockExplorer from '../components/BlockExplorer';
import { useBlockchain } from '../hooks/useBlockchain';
import { BlockData, Credential, FormData } from '../utils/constants';
import { createSDPayload } from '../utils/selectiveDisclosure';

const IssuerPage: React.FC = () => {
  // Panggil Hook Blockchain
  const { 
    account, 
    isLoading,
    connectWallet, 
    isVerified, isActive,
    issuerName,
    issueCredentialOnChain, registerCampus, resolveHolder 
  } = useBlockchain();
  
  const [blockchain, setBlockchain] = useState<BlockData[]>([]);
  const [issuedCredentials, setIssuedCredentials] = useState<Credential[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [regName, setRegName] = useState("");
  const [regEndpoint, setRegEndpoint] = useState("");

  // --- LOGIKA TOMBOL CONNECT ---
  const handleConnect = async () => {
    setIsConnecting(true);
    await connectWallet();
    setIsConnecting(false);
  };

  const handleIssueCredential = async (formData: FormData) => {
    if (!account) return alert("Konek wallet dulu!");
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // 1. BUAT SELECTIVE DISCLOSURE PAYLOAD
    // Ini akan memicu MetaMask untuk Sign Message (List of Hashes)
    const sdData = await createSDPayload(formData, signer);
    
    // 2. Buat Hash Root untuk Blockchain (Anchoring)
    // Kita pakai signature-nya sebagai unik ID untuk di-hash
    const vcHash = ethers.keccak256(ethers.toUtf8Bytes(sdData.signature));
    
    // 3. Catat di Blockchain (Anchoring)
    const txHash = await issueCredentialOnChain(vcHash);

    if (txHash) {
      // 3. Signing VC agar Unik (MetaMask Pop-up 2)
      // Kita sign hash-nya saja biar cepat
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      let signature = "error_signing";
      try {
          // Ini membuat signature yang UNIK berdasarkan konten data
          signature = await signer.signMessage(vcHash); 
      } catch (e) {
          console.log("User reject signing, pakai timestamp sebagai fallback");
          signature = `fallback_sig_${Date.now()}`;
      }

      // 4. Siapkan Data VC dengan Signature Unik
      const vcPayload = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        "type": ["VerifiableCredential", "SelectiveDisclosureCredential"],
        "issuer": `did:ethr:${account}`,
        "issuanceDate": new Date().toISOString(),
        "credentialSubject": {
            id: `did:ethr:${formData.address}`, // (Target DID)
            sdData: sdData // <--- Data Salt & Hash masuk sini
        }
      };

      try {
          await fetch('http://localhost:4000/api/pddikti/report', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  vcHash: vcHash,           // Kunci pencarian
                  credential: vcPayload,    // Data lengkap untuk dibaca admin
                  issuer: account
              })
          });
          console.log("✅ Laporan terkirim ke PDDikti");
      } catch (e) {
          console.error("Gagal lapor PDDikti");
      }

      // 5. LOGIKA PENGIRIMAN (Sama seperti sebelumnya)
      const targetAddress = formData.address; 

      if (ethers.isAddress(targetAddress)) {
          alert(`Mencari Service Endpoint untuk ${targetAddress}...`);
          const holder = await resolveHolder(targetAddress);

          if (holder && holder.endpoint) {
              // KASUS A: Mahasiswa punya Server (Endpoint)
              try {
                  console.log(`Mengirim ke ${holder.endpoint}...`);
                  await fetch(holder.endpoint, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(vcPayload)
                  });
                  alert(`✅ SUKSES! Ijazah terkirim otomatis ke Inbox Mahasiswa (${holder.endpoint})`);
              } catch (e) {
                  alert("⚠️ Gagal kirim ke endpoint (Server mati?). Download manual saja.");
                  downloadJSON(vcPayload);
              }
          } else {
              // KASUS B: Mahasiswa tidak punya Endpoint -> Download Manual
              alert("⚠️ Mahasiswa tidak memiliki Service Endpoint. File JSON akan didownload.");
              downloadJSON(vcPayload);
          }
      } else {
          // Fallback jika input bukan address
          alert("NIM bukan alamat wallet valid. Download JSON manual.");
          downloadJSON(vcPayload);
      }
    }
  };

  // Helper: Download File
  const downloadJSON = (data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `credential-${Date.now()}.json`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
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
      <main className="max-w-5xl mx-auto p-6 mt-6">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800">
              {isActive ? issuerName : "Pendaftaran Institusi"}
            </h1>
            <p className="text-slate-500">Wallet: {account}</p>
          </div>
          {/* <button onClick={disconnectWallet} className="text-sm text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg border border-red-100 transition">
            Disconnect
          </button> */}
        </div>

        {/* STATUS BAR */}
        <div className={`p-4 rounded-xl mb-8 flex items-center gap-3 ${isVerified ? "bg-green-100 border border-green-200 text-green-800" : "bg-yellow-50 border border-yellow-200 text-yellow-800"}`}>
          <ShieldCheck size={24} />
          <div>
            <p className="font-bold">{isVerified ? "STATUS: TERVERIFIKASI" : "STATUS: UNVERIFIED"}</p>
            <p className="text-xs opacity-80">
              {isVerified 
                ? "Institusi Anda berhak menerbitkan ijazah sah di Blockchain." 
                : "Menunggu verifikasi admin (Kemendikbud) untuk mengaktifkan fitur penerbitan."}
            </p>
          </div>
        </div>

        {/* --- FORM REGISTRASI (Jika Belum Daftar) --- */}
        {!isActive && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-fade-in">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Building2 className="text-blue-600" /> 
              Form Registrasi DID
            </h2>
            
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Institusi</label>
                <input 
                  type="text" 
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contoh: Universitas Indonesia"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Service Endpoint (Optional)</label>
                <div className="flex items-center gap-2">
                  <Globe size={18} className="text-slate-400" />
                  <input 
                    type="text" 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                    placeholder="URL Server Penerima"
                    value={regEndpoint}
                    onChange={(e) => setRegEndpoint(e.target.value)}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">*URL untuk menerima pesan DIDComm (Default: Local Agent)</p>
              </div>

              <button 
                onClick={() => registerCampus(regName, regEndpoint)}
                disabled={!regName}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Daftarkan ke Blockchain
              </button>
            </div>
          </div>
        )}

        {/* PANEL INPUT (Hanya Muncul Jika Sudah Register & Verified) */}
        {isActive && isVerified && (
          <IssuerPanel 
            onIssue={handleIssueCredential} 
            issuerName={issuerName} // Kirim nama kampus ke Panel
          />
        )}

        {/* Pesan Pending (Sudah Daftar tapi Belum Verified) */}
        {isActive && !isVerified && (
          <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="text-slate-500 text-lg">⏳ Data pendaftaran telah dikirim.</p>
            <p className="text-slate-400">Silakan hubungi Admin untuk proses verifikasi manual.</p>
          </div>
        )}
        
      </main>
    </div>
  );
};

export default IssuerPage;