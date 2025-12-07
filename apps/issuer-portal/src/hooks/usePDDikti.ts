import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import RegistryArtifact from '../utils/SimpleDIDRegistry.json'; 

const CONTRACT_ADDRESS = "0x1834da25E4525807c63FB80b7088f835c824c9cD"; 

export const usePDDikti = () => {
  const [account, setAccount] = useState<string>("");
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [pendingReports, setPendingReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- CONNECT WALLET ---
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const addr = await signer.getAddress();
        
        setAccount(addr);
        const _contract = new ethers.Contract(CONTRACT_ADDRESS, RegistryArtifact.abi, signer);
        setContract(_contract);
      } catch (e) {
        alert("Koneksi ditolak.");
      }
    } else {
      alert("Install MetaMask!");
    }
  };

  // --- FUNGSI FETCH LAPORAN DARI SERVER & CEK BLOCKCHAIN ---
  const fetchReports = useCallback(async () => {
    if (!contract && !window.ethereum) return;
    
    setIsLoading(true);
    try {
      // 1. Ambil Laporan dari Database PDDikti (Server Agent)
      // Pastikan node server.js sudah jalan di port 4000
      const response = await fetch('http://localhost:4000/api/pddikti/reports');
      const reports = await response.json(); // Array laporan

      console.log("📥 Laporan masuk:", reports);

      // 2. Cek Status Real-time di Blockchain
      // Kita butuh provider untuk baca data (Read-Only)
      const provider = new ethers.BrowserProvider(window.ethereum);
      const readContract = new ethers.Contract(CONTRACT_ADDRESS, RegistryArtifact.abi, provider);

      const processedData = await Promise.all(reports.map(async (item: any) => {
        try {
          // verifyCredentialStatus returns: [exists, isRevoked, isValidated, issuer]
          const status = await readContract.verifyCredentialStatus(item.vcHash);
          
          return {
            ...item,
            onChainExists: status[0],   // Apakah sudah di-anchor kampus?
            isRevoked: status[1],       // Apakah dicabut?
            isValidated: status[2],     // Apakah SUDAH divalidasi PDDikti?
            // details: item.credential.credentialSubject.data
          };
        } catch (err) {
          console.error("Gagal cek hash:", item.vcHash);
          return null;
        }
      }));

      // 3. Filter: Hanya tampilkan yang valid (ada di chain) TAPI belum divalidasi PDDikti
      // (Kita buang yang null atau yang sudah divalidasi agar list bersih)
      const pendingOnly = processedData.filter(r => r !== null && r.onChainExists && !r.isValidated);
      
      setPendingReports(pendingOnly.reverse()); // Tampilkan terbaru diatas

    } catch (e) {
      console.error("Gagal fetch laporan:", e);
      alert("Gagal mengambil data laporan. Pastikan Server Agent (Port 4000) menyala.");
    }
    setIsLoading(false);
  }, [contract]);

  // Auto-fetch saat akun terkoneksi
  useEffect(() => {
    if (account) {
      fetchReports();
    }
  }, [account, fetchReports]);

  // --- FUNGSI VALIDASI (TRANSAKSI BLOCKCHAIN) ---
  const validateCredential = async (vcHash: string) => {
    if (!contract) return;
    try {
      const tx = await contract.validateCredential(vcHash);
      await tx.wait();
      
      alert("✅ Ijazah Berhasil Dilegalisir!");
      fetchReports(); // Refresh list agar item hilang
      
    } catch (e: any) {
      console.error(e);
      if (e.message.includes("Hanya PDDikti")) {
        alert("⛔ GAGAL: Wallet ini bukan PDDikti. Gunakan Akun Admin/Validator.");
      } else {
        alert("Gagal Validasi: " + e.reason || e.message);
      }
    }
  };

  return { 
    account, 
    connectWallet, 
    pendingReports, 
    fetchReports, 
    validateCredential, 
    isLoading 
  };
};