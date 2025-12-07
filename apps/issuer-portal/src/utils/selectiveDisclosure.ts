import { ethers } from 'ethers';

// --- INTERFACES ---
export interface SDData {
  rawValues: Record<string, string>;
  salts: Record<string, string>;
  hashes: Record<string, string>; // Key -> Hash mapping
  signature: string;
}

export interface SDPresentation {
  revealed: { key: string; value: string; salt: string; hash: string }[];
  hiddenHashes: string[];
  signature: string;
  issuerDID: string;
}

// --- 1. ISSUER: Membuat Payload ---
export const createSDPayload = async (data: Record<string, any>, signer: ethers.JsonRpcSigner) => {
  const salts: Record<string, string> = {};
  const rawValues: Record<string, string> = {};
  const hashMap: Record<string, string> = {};
  const hashList: string[] = [];

  // 1. Generate Salt & Hash untuk setiap field
  const keys = Object.keys(data);

  for (const key of keys) {
    const value = String(data[key]); // Paksa string agar konsisten
    
    // Generate Salt Random 16 bytes
    const salt = ethers.hexlify(ethers.randomBytes(16));
    
    // Format Hashing: "key:value|salt"
    const contentToHash = `${key}:${value}|${salt}`;
    const hash = ethers.keccak256(ethers.toUtf8Bytes(contentToHash));
    
    salts[key] = salt;
    rawValues[key] = value;
    hashMap[key] = hash;
    
    hashList.push(hash);
  }

  // 2. SORTING HASH (KUNCI UTAMA)
  // Kita urutkan hash-nya secara abjad agar deterministik
  hashList.sort();

  // 3. Sign Daftar Hash yang sudah diurutkan
  const payloadToSign = JSON.stringify(hashList);
  const signature = await signer.signMessage(payloadToSign);

  return {
    rawValues,
    salts,
    hashes: hashMap, // Simpan mapping Key->Hash agar Holder gampang cari
    signature
  };
};

// --- 2. HOLDER: Membuat Presentasi ---
export const createSDPresentation = (
  fullVC: any, 
  keysToReveal: string[], 
  holderDID: string
): SDPresentation => {
  
  // Deteksi struktur data (antisipasi beda struktur)
  const sdData = fullVC.credentialSubject.sdData || fullVC.credentialSubject;
  
  const presentation: SDPresentation = {
    revealed: [],
    hiddenHashes: [],
    signature: sdData.signature,
    issuerDID: fullVC.issuer
  };

  const allKeys = Object.keys(sdData.rawValues);

  allKeys.forEach((key) => {
    // Ambil hash dari mapping
    const originalHash = sdData.hashes[key];

    if (keysToReveal.includes(key)) {
      // JIKA DIPILIH: Buka Data (Value + Salt + Hash)
      presentation.revealed.push({
        key: key,
        value: sdData.rawValues[key],
        salt: sdData.salts[key],
        hash: originalHash
      });
    } else {
      // JIKA TIDAK DIPILIH: Masukkan Hash ke daftar hidden
      presentation.hiddenHashes.push(originalHash);
    }
  });

  return presentation;
};

// --- 3. VERIFIER: Verifikasi ---
export const verifySDPresentation = (vp: SDPresentation, issuerAddress: string): boolean => {
  try {
      const reconstructedHashes: string[] = [];

      // A. Validasi Integritas Data yang Dibuka (Revealed)
      for (const item of vp.revealed) {
           // Re-calculate hash: "key:value|salt"
           const content = `${item.key}:${String(item.value)}|${item.salt}`;
           const calcHash = ethers.keccak256(ethers.toUtf8Bytes(content));
           
           // Safety Check 1: Hash Calculation Match
           if (calcHash !== item.hash) {
               console.error(`❌ Hash Mismatch [${item.key}]`);
               console.error(`   Calc: ${calcHash}`);
               console.error(`   Exp : ${item.hash}`);
               return false; 
           }
           reconstructedHashes.push(calcHash);
      }

      // B. Masukkan Hash yang Tersembunyi (Hidden)
      reconstructedHashes.push(...vp.hiddenHashes);

      // C. SORT ULANG (AGAR URUTAN SAMA DENGAN ISSUER)
      reconstructedHashes.sort(); 

      // D. Verifikasi Signature
      const payloadToCheck = JSON.stringify(reconstructedHashes);
      const recoveredAddr = ethers.verifyMessage(payloadToCheck, vp.signature);
      
      console.log(`🔹 Recovered: ${recoveredAddr}`);
      console.log(`🔹 Expected : ${issuerAddress}`);

      return recoveredAddr.toLowerCase() === issuerAddress.toLowerCase();
      
  } catch (e) {
      console.error("Verification Logic Error:", e);
      return false;
  }
};