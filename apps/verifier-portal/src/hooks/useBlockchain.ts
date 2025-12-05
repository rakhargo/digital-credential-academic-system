import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
// Import ABI yang tadi dicopy
import RegistryABI from '../utils/SimpleDIDRegistry.json';

// GANTI DENGAN ALAMAT KONTRAK ANVIL ANDA!
const CONTRACT_ADDRESS = "0x700b6A60ce7EaaEA56F065753d8dcB9653dbAD35"; 

export const useBlockchain = () => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string>("");
  const [logs, setLogs] = useState<any[]>([]); // Untuk Explorer

  // 1. Koneksi ke MetaMask saat aplikasi dimuat
  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const _provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(_provider);

        // Request akses akun
        const accounts = await _provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);

        // Setup Contract Instance
        const _signer = await _provider.getSigner();
        const _contract = new ethers.Contract(CONTRACT_ADDRESS, RegistryABI.abi, _signer);
        setContract(_contract);
        
        console.log("Blockchain Connected:", accounts[0]);
      } else {
        alert("Install MetaMask dulu!");
      }
    };
    init();
  }, []);

  // 2. Fungsi Verifikasi (Read Only)
  const verifyIssuerOnChain = async (issuerAddress: string) => {
    if (!contract) return null;
    try {
      // Panggil fungsi resolveDID di Smart Contract
      const result = await contract.resolveDID(issuerAddress);
      
      // Update Log untuk Explorer
      const newLog = {
        hash: "Read Operation",
        method: "resolveDID",
        from: account,
        to: CONTRACT_ADDRESS,
        timestamp: new Date().toLocaleTimeString(),
        status: "Success"
      };
      setLogs(prev => [newLog, ...prev]);

      return {
        isActive: result[0],
        isVerified: result[1],
        name: result[2],
        didURI: result[3]
      };
    } catch (error) {
      console.error("Blockchain Error:", error);
      return null;
    }
  };

  return { account, verifyIssuerOnChain, logs };
};