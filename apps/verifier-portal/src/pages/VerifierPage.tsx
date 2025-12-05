import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VerifierPortal from '../components/VerifierPortal';
import BlockExplorer from '../components/BlockExplorer';
import { INITIAL_BLOCKCHAIN, BlockData } from '../utils/constants';

const VerifierPage: React.FC = () => {
  const [activeRole] = useState('verifier');
  const navigate = useNavigate();
  const [blockchain] = useState<BlockData[]>(INITIAL_BLOCKCHAIN);

  const setActiveRole = (role: string) => {
    navigate(`/${role}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">

      <main className="max-w-6xl mx-auto p-6">
        <div className="space-y-4">
             
          <div className="bg-gradient-to-r from-teal-600 to-lime-600 text-white p-10 rounded-xl shadow-2xl">
            <h1 className="text-4xl font-extrabold mb-2">
              Verifier (Perusahaan/HRD)
            </h1>
            <p className="text-lg">
               Memverifikasi keaslian ijazah dengan mencocokkan hash pada dokumen JSON dengan data yang ada di Blockchain.
            </p>
          </div>
          <VerifierPortal blockchain={blockchain} />
        </div>

        <BlockExplorer data={blockchain} />
      </main>
    </div>
  );
};

export default VerifierPage;