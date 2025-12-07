import React, { useState } from 'react';
import { Building2, ChevronRight, CheckCircle, XCircle, Shield, AlertTriangle } from 'lucide-react';
import { useVerifier, VerificationResult } from '../hooks/useVerifier';

const VerifierPortal: React.FC = () => {
  const [inputJson, setInputJson] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  
  const { verifyCredential, isVerifying } = useVerifier();

  const handleVerifyClick = async () => {
    if (!inputJson) return;
    setResult(null); // Reset hasil lama
    
    // Panggil fungsi verifikasi asli
    const res = await verifyCredential(inputJson);
    setResult(res);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-20">
      
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Header Card */}
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
              Presentasi yang Dapat Diverifikasi (VP JSON)
            </label>
            <textarea 
                className="w-full h-40 font-mono text-xs bg-slate-900 text-green-400 p-4 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder='Paste JSON Selective Disclosure VP disini...'
                value={inputJson}
                onChange={(e) => setInputJson(e.target.value)}
            />
          </div>

          <button 
            onClick={handleVerifyClick}
            disabled={isVerifying || !inputJson}
            className={`w-full py-3 rounded-lg font-bold text-lg transition-all flex justify-center items-center gap-2 ${
              isVerifying 
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 text-white shadow-md'
            }`}
          >
              {isVerifying ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-500"></div>
                  Memverifikasi Blockchain & Kriptografi...
                </>
              ) : (
                <>Verifikasi Kredensial Sekarang <ChevronRight/></>
              )}
          </button>

          {/* --- HASIL VERIFIKASI --- */}
          {result && (
            <div className={`mt-8 p-6 rounded-xl border-2 animate-scale-in ${result.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              
              {/* Header Hasil */}
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${result.isValid ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {result.isValid ? <Shield size={32} /> : <XCircle size={32} />}
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${result.isValid ? 'text-green-800' : 'text-red-800'}`}>
                    {result.isValid ? "Kredensial Valid & Terverifikasi" : "Verifikasi Gagal"}
                  </h3>
                  <p className={`text-sm mt-1 ${result.isValid ? 'text-green-700' : 'text-red-700'}`}>
                    {result.message}
                  </p>
                </div>
              </div>

              {/* Detail Data (Hanya jika Valid) */}
              {result.isValid && (
                <div className="mt-6 space-y-4">
                  
                  {/* Status PDDikti */}
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border ${result.pddiktiStatus ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                    {result.pddiktiStatus ? (
                      <><CheckCircle size={16}/> LEGALISIR PDDIKTI: SUDAH</>
                    ) : (
                      <><AlertTriangle size={16}/> LEGALISIR PDDIKTI: BELUM (Pending)</>
                    )}
                  </div>

                  <div className="border-t border-green-200 my-4"></div>

                  <h4 className="font-bold text-green-800 text-sm uppercase tracking-wider mb-3">
                    Data yang Diungkapkan (Selective Disclosure):
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.revealedData?.map((item: any, idx: number) => (
                      <div key={idx} className="bg-white p-3 rounded border border-green-100 shadow-sm flex flex-col">
                        <span className="text-xs text-slate-400 uppercase font-bold">{item.key}</span>
                        <span className="text-slate-800 font-medium font-mono text-sm break-all">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 text-xs text-slate-500 italic">
                    *Data lain yang tidak ditampilkan di atas tetap terjaga privasinya namun telah diverifikasi integritasnya melalui hash.
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default VerifierPortal;