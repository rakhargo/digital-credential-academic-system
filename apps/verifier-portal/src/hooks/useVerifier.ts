import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import RegistryArtifact from '../utils/SimpleDIDRegistry.json'; 
import { verifySDPresentation } from '../utils/selectiveDisclosure.ts';

const CONTRACT_ADDRESS = "0x1834da25E4525807c63FB80b7088f835c824c9cD"; 

export interface VerificationResult {
  isValid: boolean;
  message: string;
  issuerName?: string;
  revealedData?: any[];
  pddiktiStatus?: boolean;
}

export const useVerifier = () => {
  const [account, setAccount] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState(false);

  // --- 1. CONNECT WALLET ---
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        setAccount(await signer.getAddress());
        // Simpan sesi
        localStorage.setItem('isVerifierConnected', 'true');
      } catch (error) {
        alert("Koneksi gagal");
      }
    } else {
      alert("Install MetaMask!");
    }
  };

  // --- 2. DISCONNECT ---
  const disconnectWallet = () => {
    setAccount("");
    localStorage.removeItem('isVerifierConnected');
    window.location.reload();
  };

  // --- 3. AUTO CONNECT ---
  useEffect(() => {
    const checkAuth = async () => {
      const shouldConnect = localStorage.getItem('isVerifierConnected') === 'true';
      if (shouldConnect && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.send("eth_accounts", []);
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        } catch (e) { console.error(e); }
      }
    };
    checkAuth();
  }, []);

  // --- 4. CORE VERIFICATION LOGIC (Sama seperti sebelumnya) ---
  const verifyCredential = async (jsonInput: string): Promise<VerificationResult> => {
    setIsVerifying(true);
    try {
      const vpData = JSON.parse(jsonInput);
      const issuerDID = vpData.issuerDID || vpData.issuer || ""; 
      const issuerAddress = issuerDID.split(":")[2]; 

      if (!issuerAddress) throw new Error("Format DID Issuer tidak valid.");

      // Gunakan Browser Provider (karena user sudah connect) atau Fallback ke Public RPC
      let provider;
      if (window.ethereum) {
          provider = new ethers.BrowserProvider(window.ethereum);
      } else {
          // Fallback jika user belum connect wallet tapi mau verify (Read-Only)
          // Ganti dengan RPC Sepolia Anda jika perlu, atau biarkan error
          throw new Error("Wajib connect wallet untuk akses blockchain.");
      }
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, RegistryArtifact.abi, provider);

      // A. Cek Issuer
      const issuerStatus = await contract.resolveDID(issuerAddress);
      if (!issuerStatus[0]) return { isValid: false, message: "Issuer tidak terdaftar." };
      if (!issuerStatus[1]) return { isValid: false, message: `Issuer '${issuerStatus[2]}' BELUM terverifikasi Kemendikbud.` };

      // B. Cek Kriptografi (SD)
      const isMathValid = verifySDPresentation(vpData, issuerAddress);
      if (!isMathValid) return { isValid: false, message: "Signature Kriptografi TIDAK VALID." };

      // C. Cek Status Ijazah & PDDikti
      console.log("📥 Memeriksa status ijazah di blockchain...");
      const vcHash = ethers.keccak256(ethers.toUtf8Bytes(vpData.signature));
      const credStatus = await contract.verifyCredentialStatus(vcHash);
      if (credStatus[1]) return { isValid: false, message: "Kredensial DICABUT (Revoked)." };

      return {
        isValid: true,
        message: "Verifikasi Berhasil.",
        issuerName: issuerStatus[2],
        revealedData: vpData.revealed,
        pddiktiStatus: credStatus[2] // Status Validasi PDDikti
      };

    } catch (e: any) {
      return { isValid: false, message: "Error: " + e.message };
    } finally {
      setIsVerifying(false);
    }
  };

  return { account, connectWallet, disconnectWallet, verifyCredential, isVerifying };
};