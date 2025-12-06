import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import RegistryArtifact from '../utils/SimpleDIDRegistry.json';

// ALAMAT SMART CONTRACT
const CONTRACT_ADDRESS = "0x700b6A60ce7EaaEA56F065753d8dcB9653dbAD35"; 

export const useBlockchain = () => {
  const [account, setAccount] = useState<string>("");
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // STATE DEBUG (Untuk melihat apa yang sebenarnya dibaca)
  const [debugData, setDebugData] = useState<any>(null);

  // --- FUNGSI RESET STATE (LOGOUT) ---
  const disconnectWallet = useCallback(() => {
    setAccount("");
    setContract(null);
    setIsVerified(false);
    // Hapus Session Flag agar tidak auto-connect saat refresh
    localStorage.removeItem('isWalletConnected');
  }, []);

  const refreshStatus = useCallback(async () => {
    if (!window.ethereum) return;
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const userAddr = await signer.getAddress();
    
    // Bikin instance baru on-the-fly untuk menghindari stale state
    const _contract = new ethers.Contract(CONTRACT_ADDRESS, RegistryArtifact.abi, signer);
    
    try {
      console.log("🔄 REFRESHING DATA FROM CHAIN...");
      console.log("🎯 Target Contract:", CONTRACT_ADDRESS);
      console.log("👤 Target User:", userAddr);

      // Panggil Blockchain
      const status = await _contract.resolveDID(userAddr);
      
      console.log("📦 RAW RESPONSE:", status);
      
      // Update State
      setIsActive(status[0]);
      setIsVerified(status[1]);
      
      // Simpan data mentah untuk ditampilkan di UI
      setDebugData({
        targetContract: CONTRACT_ADDRESS,
        currentUser: userAddr,
        rawResult: status.toString(), // Convert BigInt/Array to string
        isActive: status[0],
        isVerified: status[1]
      });

    } catch (e: any) {
      console.error("❌ ERROR REFRESH:", e);
      setDebugData({ error: e.message || e });
    }
  }, []);

  // --- FUNGSI SETUP CONTRACT ---
  const setupConnection = async (signer: ethers.JsonRpcSigner) => {
    console.log("CONTRACT:", CONTRACT_ADDRESS);
    const userAddr = await signer.getAddress();
    const _contract = new ethers.Contract(CONTRACT_ADDRESS, RegistryArtifact.abi, signer);
    
    setAccount(userAddr);
    setContract(_contract);

    // Cek Status di Blockchain
    try {
      // resolveDID returns (bool isActive, bool isVerified, string name, string didURI)
      const status = await _contract.resolveDID(userAddr);
      console.log("Status Awal User:", status);
      
      // Jika status[0] (isActive) true, berarti sudah register
      // Jika status[1] (isVerified) true, berarti sudah centang biru
      setIsActive(status[0]);
      setIsVerified(status[1]); 
      
      // Opsional: Anda bisa tambah state baru 'isRegistered'
      // setIsRegistered(status[0]); 

    } catch (e) {
      console.log("Gagal baca status:", e);
    }
  };

  const resolveHolder = async (holderAddress: string) => {
    if (!contract) return null;
    try {
      console.log("🔍 Looking up Holder:", holderAddress);
      const data = await contract.resolveDID(holderAddress);
      
      // Data dari Smart Contract baru:
      // [0]: active, [1]: verified, [2]: name, [3]: didURI, [4]: serviceEndpoint
      return {
        isActive: data[0],
        name: data[2],
        endpoint: data[4]
      };
    } catch (e) {
      console.error("Gagal resolve holder:", e);
      return null;
    }
  };

  // --- 1. FUNGSI CONNECT (Manual Trigger) ---
  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const userAddr = await signer.getAddress();
      
      setAccount(userAddr);
      const _contract = new ethers.Contract(CONTRACT_ADDRESS, RegistryArtifact.abi, signer);
      setContract(_contract);
      
      // Panggil refresh status segera setelah connect
      refreshStatus(); 
    }
  };

  // --- 2. AUTO-CHECK (Saat Refresh Halaman) ---
  useEffect(() => {
    const checkConnection = async () => {
      // Cek apakah user sebelumnya sudah login?
      const shouldConnect = localStorage.getItem('isWalletConnected') === 'true';
      
      if (shouldConnect && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          // Cek apakah MetaMask masih punya izin akun
          const accounts = await provider.send("eth_accounts", []);
          
          if (accounts.length > 0) {
            // Jika ya, langsung setup tanpa popup
            const signer = await provider.getSigner();
            await setupConnection(signer);
          } else {
            // Jika MetaMask terkunci/dicabut izinnya, anggap logout
            disconnectWallet();
          }
        } catch (err) {
          console.error("Auto-connect failed", err);
          disconnectWallet();
        }
      }
    };

    checkConnection();
  }, [disconnectWallet]);

  // --- 3. LISTENER: ACCOUNT CHANGED (Dari MetaMask) ---
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          // User ganti akun di MetaMask -> Update App
          window.location.reload(); 
        } else {
          // User klik "Disconnect" di dalam MetaMask -> Logout App
          disconnectWallet();
        }
      });
    }
  }, [disconnectWallet]);

  // --- CONTRACT FUNCTIONS (Tidak Berubah) ---
  const registerCampus = async (name: string) => {
    if (!contract) return;
    
    try {
      // CEK STATUS DULU SEBELUM TRANSAKSI
      console.log("Mengecek status pendaftaran...", account);
      const status = await contract.resolveDID(account);
      console.log("Status dari Blockchain:", status);

      // status[0] = isActive
      if (status[0] === true) {
        alert("⚠️ Akun ini SUDAH terdaftar sebelumnya!");
        window.location.reload(); // Refresh biar UI update status verified/unverified
        return;
      }

      // KALAU BELUM, BARU DAFTAR
      console.log("Mengirim transaksi registerDID...");
      const tx = await contract.registerDID(`did:ethr:${account}`, name, "");
      console.log("Tx Hash:", tx.hash);
      
      await tx.wait();
      console.log("Transaksi Sukses!");
      
      alert("✅ Registrasi Berhasil! Minta Admin untuk Verifikasi.");
      window.location.reload();

    } catch (e: any) {
      console.error("ERROR DETECTED:", e);
      
      // Deteksi Revert Reason dari error string
      if (e.message.includes("Sudah terdaftar")) {
        alert("Gagal: Akun sudah terdaftar.");
      } else {
        alert("Gagal Register: " + (e.reason || e.message));
      }
    }
  };

  const issueCredentialOnChain = async (vcHash: string) => {
    if (!contract) return null;
    try {
      const tx = await contract.issueCredential(vcHash);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (e: any) {
      console.error(e);
      alert("Gagal Anchoring: " + e.message);
      return null;
    }
  };

  return { 
    account, 
    connectWallet, 
    disconnectWallet, 
    isVerified, 
    isActive,
    refreshStatus,
    debugData,
    registerCampus,
    resolveHolder, 
    issueCredentialOnChain 
  };
};