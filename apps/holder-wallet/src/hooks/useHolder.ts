import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
// Pastikan file JSON ABI ada di folder utils holder juga
import RegistryArtifact from '../utils/SimpleDIDRegistry.json'; 

// ALAMAT KONTRAK (Harus sama dengan Issuer)
const CONTRACT_ADDRESS = "0x700b6A60ce7EaaEA56F065753d8dcB9653dbAD35"; 

export const useHolder = () => {
  const [account, setAccount] = useState<string>("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredData, setRegisteredData] = useState<any>(null);

  // --- CEK STATUS ---
  const checkRegistration = useCallback(async (userAddr: string) => {
    if (!window.ethereum) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, RegistryArtifact.abi, provider);

    try {
      const data = await contract.resolveDID(userAddr);
      // data[0] = isActive
      setIsRegistered(data[0]);
      
      if (data[0]) {
        setRegisteredData({
          name: data[2],
          endpoint: data[4]
        });
      }
    } catch (e) {
      console.log("Belum terdaftar di blockchain");
    }
  }, []);

  // --- CONNECT ---
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);
        checkRegistration(accounts[0]);
      } catch (e) {
        alert("Gagal connect");
      }
    } else {
      alert("Install MetaMask!");
    }
  };

  // --- REGISTER FUNCTION ---
  const registerHolderDID = async (name: string, endpoint: string) => {
    if (!account) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, RegistryArtifact.abi, signer);

      console.log(`Mendaftarkan: ${name} ke ${endpoint}`);
      
      const tx = await contract.registerDID(`did:ethr:${account}`, name, endpoint);
      await tx.wait();
      
      alert("✅ Identitas Berhasil Didaftarkan!");
      window.location.reload();
    } catch (e: any) {
      console.error(e);
      alert("Gagal Register: " + e.message);
    }
  };

  // --- CREATE VP (Tetap Sama) ---
  const createVerifiablePresentation = async (vcData: any) => {
    if (!account) return alert("Connect wallet dulu!");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const vpPayload = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        "type": ["VerifiablePresentation"],
        "verifiableCredential": [vcData],
        "holder": `did:ethr:${account}`
      };

      const message = JSON.stringify(vpPayload);
      const signature = await signer.signMessage(message);

      const finalVP = {
        presentation: vpPayload,
        proof: {
          type: "EthereumPersonalSignature2019",
          created: new Date().toISOString(),
          verificationMethod: `did:ethr:${account}#controller`,
          jws: signature
        }
      };
      return JSON.stringify(finalVP, null, 2);
    } catch (e: any) {
      alert("Gagal sign VP: " + e.message);
      return null;
    }
  };

  return { 
    account, 
    connectWallet, 
    isRegistered,     // Status terdaftar?
    registeredData,   // Data nama & endpoint
    registerHolderDID, // Fungsi daftar
    createVerifiablePresentation 
  };
};