import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import IssuerPanel from '../components/IssuerPanel';
import BlockExplorer from '../components/BlockExplorer';
import { 
  INITIAL_BLOCKCHAIN, 
  generateHash, 
  BlockData, 
  Credential,
  FormData 
} from '../utils/constants';

const IssuerPage: React.FC = () => {
  const [activeRole] = useState('issuer');
  const navigate = useNavigate();
  const [blockchain, setBlockchain] = useState<BlockData[]>(INITIAL_BLOCKCHAIN);
  const [issuedCredentials, setIssuedCredentials] = useState<Credential[]>([]);

  const handleIssueCredential = (formData: FormData) => {
    const newHash = generateHash(formData);
    
    const newCredential: Credential = {
      id: `vc:${Date.now()}`,
      degree: `S1 - ${formData.program}`,
      issuer: "Universitas Indonesia",
      issuanceDate: new Date().toISOString().split('T')[0],
      credentialSubject: { ...formData },
      hash: newHash,
      proof: {
        signature: "0xSignedByIssuerPrivateKey..."
      }
    };

    const newBlock: BlockData = {
      blockId: blockchain.length > 0 ? blockchain[0].blockId + 1 : 1000,
      txHash: "0x" + Math.random().toString(36).substring(2),
      vcHash: newHash,
      did: "did:ethr:issuer:univ_indonesia",
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: "Active"
    };

    setIssuedCredentials([newCredential, ...issuedCredentials]);
    setBlockchain([newBlock, ...blockchain]);
    
    setTimeout(() => {
        alert("Credential berhasil diterbitkan ke Blockchain! Berpindah ke tampilan Holder...");
        navigate('/holder');
    }, 500);
  };

  const setActiveRole = (role: string) => {
    navigate(`/${role}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">

      <main className="max-w-6xl mx-auto p-6 mt-6">
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-600 to-violet-600 text-white p-10 rounded-xl shadow-2xl">
            <h1 className="text-4xl font-extrabold mb-2">
              Issuer (Universitas)
            </h1>
            <p className="text-lg">
              Mengakses Private Key institusi untuk menandatangani (Sign) ijazah dan mencatat hash ke Blockchain.
            </p>
          </div>
          <IssuerPanel onIssue={handleIssueCredential} />
        </div>

        <BlockExplorer data={blockchain} />
      </main>
    </div>
  );
};

export default IssuerPage;