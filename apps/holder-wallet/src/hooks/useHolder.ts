import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import RegistryArtifact from '../utils/SimpleDIDRegistry.json'; 

const CONTRACT_ADDRESS = "0xDd8fbECC649B86c6228BDCe59F1FA4B51F2F4942"; 

export const useHolder = () => {
  const [account, setAccount] = useState<string>("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredData, setRegisteredData] = useState<any>(null);

  // --- FUNGSI RESET / DISCONNECT ---
  const disconnect = useCallback(() => {
    setAccount("");
    setIsRegistered(false);
    localStorage.removeItem('isHolderConnected');
  }, []);

  // --- CEK REGISTRASI (BLOCKCHAIN) ---
  const checkRegistration = useCallback(async (userAddr: string) => {
    if (!window.ethereum) return;
    // Gunakan Provider (Read-Only) cukup untuk cek status
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, RegistryArtifact.abi, provider);

    try {
      const data = await contract.resolveDID(userAddr);
      setIsRegistered(data[0]); // data[0] is active
      
      if (data[0]) {
        setRegisteredData({
          name: data[2],
          endpoint: data[4]
        });
      }
    } catch (e) {
      console.log("Status: Belum terdaftar di blockchain");
    }
  }, []);

  // --- CONNECT WALLET (Manual Trigger) ---
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);

        try {
            await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }], // Chain ID Sepolia (11155111) dalam Hex
            });
        } catch (switchError: any) {
            // Jika Sepolia belum ada di MetaMask user (Jarang terjadi, tapi jaga-jaga)
            if (switchError.code === 4902) {
            alert("Tolong tambahkan network Sepolia ke MetaMask Anda!");
            }
        }
        
        const accounts = await provider.send("eth_requestAccounts", []);
        
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          // SIMPAN FLAG LOGIN
          localStorage.setItem('isHolderConnected', 'true');
          checkRegistration(accounts[0]);
        }
      } catch (e) {
        alert("Gagal connect wallet");
      }
    } else {
      alert("Install MetaMask!");
    }
  };

  // --- AUTO CONNECT (Saat Refresh) ---
  useEffect(() => {
    const autoConnect = async () => {
      // Cek apakah user sebelumnya sudah login?
      const shouldConnect = localStorage.getItem('isHolderConnected') === 'true';
      
      if (shouldConnect && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          // Cek permission saja tanpa popup
          const accounts = await provider.send("eth_accounts", []);
          
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            checkRegistration(accounts[0]);
          } else {
            disconnect(); // Izin dicabut di metamask
          }
        } catch (e) {
          disconnect();
        }
      }
    };
    autoConnect();
  }, [checkRegistration, disconnect]);

  // --- LISTENER PERUBAHAN AKUN ---
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          checkRegistration(accounts[0]);
        } else {
          disconnect();
        }
      });
    }
  }, [checkRegistration, disconnect]);

  // --- FUNGSI LAINNYA (Register & VP) TETAP SAMA ---
  const registerHolderDID = async (name: string, endpoint: string) => {
    if (!account) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, RegistryArtifact.abi, signer);
      
      const tx = await contract.registerDID(`did:ethr:${account}`, name, endpoint);
      await tx.wait();
      
      alert("✅ Identitas Berhasil Didaftarkan!");
      window.location.reload();
    } catch (e: any) {
      alert("Gagal Register: " + e.message);
    }
  };

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
      console.error(e);
      return null;
    }
  };

  return { 
    account, connectWallet, isRegistered, registeredData, 
    registerHolderDID, createVerifiablePresentation 
  };
};