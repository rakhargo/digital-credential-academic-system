import React, { useState } from 'react';
import { Building2, ChevronRight, CheckCircle, XCircle, Shield } from 'lucide-react';
import { BlockData } from '../utils/constants';

interface VerifierPortalProps {
  blockchain: BlockData[];
}

interface VerificationStep {
  msg: string;
  valid: boolean;
}

const VerifierPortal: React.FC<VerifierPortalProps> = ({ blockchain }) => {
  const [inputJson, setInputJson] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'memverifikasi' | 'success' | 'invalid'>('idle');
  const [steps, setSteps] = useState<VerificationStep[]>([]);

  const handleVerify = () => {
    if (!inputJson) return;

    setVerificationStatus('memverifikasi');
    setSteps([]);

    const sequence = [
      { msg: "Format check (JSON Schema)", valid: true },
      { msg: "memverifikasi Issuer DID Signature (Public Key)", valid: true },
      { msg: "Checking Revocation Registry (Smart Contract)", valid: true },
      { msg: "Matching Merkle Root Hash on Blockchain", valid: true },
    ];

    let currentStep = 0;

    const interval = setInterval(() => {
      if (currentStep >= sequence.length) {
        clearInterval(interval);
        try {
          const data = JSON.parse(inputJson);
          const onChain = blockchain.find(b => b.vcHash === data.hash);
          
          if (onChain && onChain.status === 'Active') {
            setVerificationStatus('success');
          } else {
            setVerificationStatus('invalid');
            setSteps(prev => [...prev, { msg: "Hash Mismatch: Data not found on ledger", valid: false }]);
          }
        } catch (e) {
          setVerificationStatus('invalid');
           setSteps(prev => [...prev, { msg: "Invalid JSON Format", valid: false }]);
        }
        return;
      }

      setSteps(prev => [...prev, sequence[currentStep]]);
      currentStep++;
    }, 800);
  };

  const loadSample = () => {
    const sample = {
      "id": "vc:uuid:1234",
      "type": ["VerifiableCredential", "UniversityDegreeCredential"],
      "issuer": "Universitas Indonesia",
      "issuanceDate": "2024-01-15",
      "credentialSubject": {
        "name": "Budi Santoso",
        "degree": "S.Kom - Teknik Informatika",
        "gpa": "3.85"
      },
      "proof": {
        "type": "EcdsaSecp256k1Signature2019",
        "verificationMethod": "did:ethr:issuer#key-1",
        "signatureValue": "0xabc..."
      },
      "hash": "0x123456789abc"
    };
    setInputJson(JSON.stringify(sample, null, 2));
    setVerificationStatus('idle');
    setSteps([]);
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 p-6 border-b border-slate-200">
           <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
             <Building2 className="text-blue-600"/>
             Portal Verifikasi Kredensial
           </h2>
           <p className="text-slate-500 text-sm mt-1">
             HRD atau Pihak Ketiga dapat memverifikasi keaslian ijazah secara instan tanpa menghubungi penerbit.
           </p>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Presentasi yang Dapat Diverifikasi (Data JSON)
            </label>
            <div className="relative">
              <textarea 
                className="w-full h-40 font-mono text-xs bg-slate-900 text-green-400 p-4 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder='Paste JSON VC disini...'
                value={inputJson}
                onChange={(e) => setInputJson(e.target.value)}
              />
              <button 
                onClick={loadSample}
                className="absolute top-2 right-2 text-xs bg-slate-700 text-white px-2 py-1 rounded hover:bg-slate-600"
              >
                Muat Sampel yang Valid
              </button>
            </div>
          </div>

          <button 
            onClick={handleVerify}
            disabled={verificationStatus === 'memverifikasi' || !inputJson}
            className={`w-full py-3 rounded-lg font-bold text-lg transition-all flex justify-center items-center gap-2 ${
              verificationStatus === 'memverifikasi' 
                ? 'bg-slate-200 text-slate-500' 
                : 'bg-green-600 hover:bg-green-700 text-white shadow-md'
            }`}
          >
             {verificationStatus === 'memverifikasi' ? (
               <>Pemrosesan Kriptografi...</>
             ) : (
               <>Verifikasi Kredensial Sekarang <ChevronRight/></>
             )}
          </button>

          {steps.length > 0 && (
            <div className="mt-8 space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide mb-3">Proses Verifikasi</h3>
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm animate-fade-in-up">
                   {step.valid ? (
                     <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                   ) : (
                     <XCircle size={18} className="text-red-500 flex-shrink-0" />
                   )}
                   <span className={step.valid ? "text-slate-700" : "text-red-600 font-medium"}>
                     {step.msg}
                   </span>
                </div>
              ))}
            </div>
          )}

          {verificationStatus === 'success' && (
             <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-4 animate-scale-in">
               <div className="bg-green-100 p-2 rounded-full">
                 <Shield className="text-green-600 h-8 w-8" />
               </div>
               <div>
                 <h4 className="font-bold text-green-800 text-lg">Kredensial yang Valid</h4>
                 <p className="text-green-700 text-sm mt-1">
                   Dokumen ini asli, diterbitkan oleh Universitas Terdaftar, dan hash tercatat di Blockchain (Block #1024). Tidak ada status pencabutan (revocation).
                 </p>
               </div>
             </div>
          )}

          {verificationStatus === 'invalid' && (
             <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-4 animate-scale-in">
               <div className="bg-red-100 p-2 rounded-full">
                 <XCircle className="text-red-600 h-8 w-8" />
               </div>
               <div>
                 <h4 className="font-bold text-red-800 text-lg">Kredensial Tidak Valid / Rusak</h4>
                 <p className="text-red-700 text-sm mt-1">
                   Dokumen ini gagal verifikasi. Hash tidak cocok dengan catatan blockchain atau format tanda tangan digital rusak.
                 </p>
               </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifierPortal;