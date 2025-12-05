import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HolderWallet from '../components/HolderWallet';
import BlockExplorer from '../components/BlockExplorer';
import { INITIAL_BLOCKCHAIN, BlockData, Credential } from '../utils/constants';

const HolderPage: React.FC = () => {
  const [activeRole] = useState('holder');
  const navigate = useNavigate();
  const [blockchain] = useState<BlockData[]>(INITIAL_BLOCKCHAIN);
  const [credentials, setCredentials] = useState<Credential[]>([]);

  useEffect(() => {
    // Load credentials from localStorage or API
    const saved = localStorage.getItem('eduChainCredentials');
    if (saved) {
      setCredentials(JSON.parse(saved));
    }
  }, []);

  const setActiveRole = (role: string) => {
    navigate(`/${role}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <main className="max-w-6xl mx-auto p-6 ">
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-10 rounded-xl shadow-xl mb-8">
            <h1 className="text-4xl font-extrabold mb-2">
              Holder (Mahasiswa/Alumni)
            </h1>
            <p className="text-lg">
              Menyimpan ijazah dalam Wallet Digital dan membuat Verifiable Presentation (VP) untuk diberikan ke perusahaan.
            </p>
          </div>
          <HolderWallet credentials={credentials} />
        </div>

        <BlockExplorer data={blockchain} />
      </main>
    </div>
  );
};

export default HolderPage;