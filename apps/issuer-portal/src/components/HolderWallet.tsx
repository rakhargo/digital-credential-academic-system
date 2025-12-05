import React, { useState } from 'react';
import { Wallet, School, QrCode, Copy, User } from 'lucide-react';
import { Credential } from '../utils/constants';

interface HolderWalletProps {
  credentials: Credential[];
}

const HolderWallet: React.FC<HolderWalletProps> = ({ credentials }) => {
  const [selectedVc, setSelectedVc] = useState<Credential | null>(null);

  const copyToClipboard = (text: string) => {
    alert("Credential Data copied to clipboard! Paste this in the Verifier tab.");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
      {/* Identity Card */}
      <div className="md:col-span-1 space-y-4">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <User size={100} />
          </div>
          <div className="relative z-10">
            <h3 className="text-lg font-semibold opacity-90">Digital Identity Wallet</h3>
            <div className="mt-8">
              <p className="text-xs opacity-70 uppercase tracking-wider">DID Holder</p>
              <p className="font-mono text-sm truncate">did:ethr:0xAB7...391</p>
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
          <div className="flex justify-between items-center text-sm mt-2">
            <span className="text-slate-500">Blockchain Network</span>
            <span className="font-bold text-blue-600">EduChain Mainnet</span>
          </div>
        </div>
      </div>

      {/* Credentials List */}
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
          credentials.map((vc) => (
            <div key={vc.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                   <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <School size={24} />
                   </div>
                   <div>
                     <h4 className="font-bold text-slate-800 text-lg">{vc.degree}</h4>
                     <p className="text-slate-600">{vc.issuer}</p>
                     <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                       <span>Issued: {vc.issuanceDate}</span>
                       <span>•</span>
                       <span className="font-mono bg-slate-100 px-1 rounded">Hash: {vc.hash.substring(0,10)}...</span>
                     </div>
                   </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                    VERIFIED
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex justify-end gap-3">
                 <button 
                  onClick={() => setSelectedVc(vc)}
                  className="text-sm text-slate-600 hover:text-blue-600 flex items-center gap-1"
                 >
                   <QrCode size={16} />
                   View QR
                 </button>
                 <button 
                  onClick={() => copyToClipboard(JSON.stringify(vc))}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                 >
                   <Copy size={16} />
                   Copy VP Data
                 </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Mockup for QR */}
      {selectedVc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-center mb-4">Verifiable Presentation</h3>
            <div className="bg-white p-4 border-2 border-slate-100 rounded-xl flex justify-center mb-4">
               {/* Just a placeholder icon for QR */}
               <QrCode size={150} className="text-slate-800" />
            </div>
            <p className="text-xs text-center text-slate-500 mb-4 break-all">
              {JSON.stringify(selectedVc).substring(0, 50)}...
            </p>
            <button 
              onClick={() => setSelectedVc(null)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium py-2 rounded-lg"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HolderWallet;