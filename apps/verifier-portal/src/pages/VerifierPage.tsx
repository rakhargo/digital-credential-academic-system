import React, { useState } from 'react';
import VerifierPortal from '../components/VerifierPortal';
import BlockExplorer from '../components/BlockExplorer';
import { useBlockchain } from '../hooks/useBlockchain'; // Import Hook kita

const VerifierPage: React.FC = () => {
  // Panggil Hook Blockchain
  const { account, verifyIssuerOnChain, logs } = useBlockchain();
  
  // State untuk hasil verifikasi
  const [verificationResult, setResult] = useState<string>("");

  // Fungsi yang dipanggil saat tombol "Verifikasi" diklik di component anak
  const handleVerify = async (jsonInput: string) => {
    try {
      const data = JSON.parse(jsonInput);
      const issuerAddress = data.credential.issuer.split(":")[2]; // Ambil address dari DID
      
      const status = await verifyIssuerOnChain(issuerAddress);
      
      if (status && status.isVerified) {
        setResult(`✅ VALID: Penerbit adalah ${status.name} (Terverifikasi)`);
      } else {
        setResult("❌ INVALID: Penerbit tidak terdaftar di Blockchain.");
      }
    } catch (e) {
      setResult("❌ Error: Format JSON salah.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <main className="max-w-6xl mx-auto p-6 space-y-4">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-lime-600 text-white p-10 rounded-xl shadow-2xl">
          <h1 className="text-4xl font-extrabold mb-2">Verifier (Perusahaan/HRD)</h1>
          <p className="text-lg">Connected Wallet: {account || "Not Connected"}</p>
        </div>

        {/* Portal Input */}
        <VerifierPortal onVerify={handleVerify} resultMessage={verificationResult} />

        {/* Embedded Explorer (Real Data) */}
        <BlockExplorer data={logs} />
        
      </main>
    </div>
  );
};

export default VerifierPage;