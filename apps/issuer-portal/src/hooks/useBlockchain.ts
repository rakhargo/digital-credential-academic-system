import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import RegistryArtifact from '../utils/SimpleDIDRegistry.json'; 

// GANTI SESUAI ALAMAT SEPOLIA/ANVIL TERBARU
const CONTRACT_ADDRESS = "0xdd8fbecc649b86c6228bdce59f1fa4b51f2f4942"; 

export const useBlockchain = () => {
  const [account, setAccount] = useState<string>("");
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  
  const [isActive, setIsActive] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [issuerName, setIssuerName] = useState("");
  const [isLoading, setIsLoading] = useState(true); // Biar gak kedip saat refresh

  // --- FUNGSI RESET / LOGOUT ---
  const disconnectWallet = useCallback(() => {
    localStorage.removeItem('isIssuerConnected'); // Hapus sesi
    setAccount("");
    setContract(null);
    setIsActive(false);
    setIsVerified(false);
    window.location.reload(); // Refresh biar bersih total
  }, []);

  // --- FUNGSI UTAMA: SETUP KONEKSI & CONTRACT ---
  const setupConnection = useCallback(async (signer: ethers.JsonRpcSigner) => {
    try {
      const userAddr = await signer.getAddress();
      const _contract = new ethers.Contract(CONTRACT_ADDRESS, RegistryArtifact.abi, signer);
      
      setAccount(userAddr);
      setContract(_contract);

      // Cek Status di Blockchain
      try {
        const status = await _contract.resolveDID(userAddr);
        setIsActive(status[0]);
        setIsVerified(status[1]); 
        setIssuerName(status[2]);
      } catch (e) {
        console.log("Issuer belum terdaftar di smart contract");
      }
    } catch (e) {
      console.error("Error setup connection:", e);
    }
    setIsLoading(false);
  }, []);

  // --- 1. AUTO CONNECT (SAAT REFRESH) ---
  useEffect(() => {
    const checkAuth = async () => {
      // Cek apakah user sebelumnya sudah login?
      const shouldConnect = localStorage.getItem('isIssuerConnected') === 'true';
      
      if (shouldConnect && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          // 'eth_accounts' itu SILENT (gak muncul popup)
          const accounts = await provider.send("eth_accounts", []);
          
          if (accounts.length > 0) {
            const signer = await provider.getSigner();
            await setupConnection(signer);
          } else {
            // Kalau di metamask user manual disconnect
            setIsLoading(false); 
            localStorage.removeItem('isIssuerConnected');
          }
        } catch (e) {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [setupConnection]);

  // --- 2. MANUAL CONNECT (TOMBOL KLIK) ---
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        // 'eth_requestAccounts' itu POPUP
        await provider.send("eth_requestAccounts", []);
        
        // Simpan sesi
        localStorage.setItem('isIssuerConnected', 'true');
        
        const signer = await provider.getSigner();
        await setupConnection(signer);
      } catch (error) {
        alert("User menolak koneksi");
      }
    } else {
      alert("Install MetaMask!");
    }
  };

  // --- 3. LISTENER GANTI AKUN ---
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          // Re-setup dengan akun baru
          window.location.reload(); 
        } else {
          // User disconnect dari wallet
          disconnectWallet();
        }
      });
    }
  }, [disconnectWallet]);

  // --- TRANSAKSI ---
  const registerCampus = async (name: string, endpoint: string) => {
    if (!contract) return;
    try {
      const tx = await contract.registerDID(`did:ethr:${account}`, name, endpoint);
      await tx.wait();
      alert("✅ Registrasi Berhasil! Refresh halaman.");
      window.location.reload();
    } catch (e: any) {
      alert("Gagal: " + e.message);
    }
  };

  const issueCredentialOnChain = async (vcHash: string) => {
    if (!contract) return null;
    try {
      const tx = await contract.issueCredential(vcHash);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (e: any) {
      alert("Gagal Anchoring: " + e.reason);
      return null;
    }
  };

  // Helper Resolve
  const resolveHolder = async (holderAddress: string) => {
    if (!contract) return null;
    try {
      const data = await contract.resolveDID(holderAddress);
      return {
        isActive: data[0],
        name: data[2],
        endpoint: data[4]
      };
    } catch (e) {
      return null;
    }
  };

  return { 
    account, 
    isLoading, // State loading biar UI gak loncat
    connectWallet, 
    disconnectWallet, // Export fungsi logout
    isActive, 
    isVerified,
    issuerName,
    registerCampus, 
    issueCredentialOnChain, 
    resolveHolder 
  };
};