import json
from web3 import Web3
from eth_hash.auto import keccak

# --- KONFIGURASI ---
RPC_URL = "http://127.0.0.1:8545" # Alamat Anvil
# GANTI INI dengan alamat contract yang muncul di log forge script Anda!
CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3" 

def get_contract_abi():
    # Mengambil ABI yang digenerate oleh Foundry
    with open('./out/AcademicCredential.sol/AcademicCredential.json') as f:
        data = json.load(f)
        return data['abi']

def generate_credential_hash(data_string):
    # Fungsi ini meniru cara Solidity melakukan keccak256(abi.encodePacked(...))
    # Kita encode string jadi bytes, lalu di-hash
    return Web3.keccak(text=data_string)

def main():
    # 1. Koneksi ke Blockchain
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    if not w3.is_connected():
        print("❌ Gagal konek ke Anvil. Pastikan 'anvil' jalan di terminal lain.")
        return

    print(f"✅ Terhubung ke Blockchain Lokal (Anvil)")
    
    # 2. Load Contract
    abi = get_contract_abi()
    contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=abi)
    
    # --- SKENARIO DEMO ---
    
    print("\n--- 1. SIMULASI DATA MAHASISWA (OFF-CHAIN) ---")
    # Data ini sama persis dengan yang kita input di Script Foundry tadi
    data_asli = "Rakha Dhifiargo | 2209489 | S1 Ilmu Komputer"
    print(f"Data di Ijazah: {data_asli}")
    
    # Hashing Data
    hash_asli = generate_credential_hash(data_asli)
    print(f"Hash Data     : {hash_asli.hex()}")
    
    
    print("\n--- 2. PROSES VERIFIKASI (ON-CHAIN) ---")
    # Kita panggil ID Ijazah yang tadi didaftarkan lewat Script Foundry
    # (Pastikan string ID ini SAMA PERSIS dengan yang di script Solidity)
    id_ijazah = Web3.keccak(text="IJAZAH-UPI-2025-001") 
    
    try:
        # Panggil fungsi read-only dari smart contract
        # Return: (contentHash, issuer, timestamp, isValid)
        result = contract.functions.credentials(id_ijazah).call()
        
        stored_hash = result[0]
        issuer = result[1]
        is_valid = result[3]
        
        print(f"🔍 Data di Blockchain:")
        print(f"   - Issuer : {issuer}")
        print(f"   - Valid  : {is_valid}")
        print(f"   - Hash   : {stored_hash.hex()}")
        
        print("\n--- 3. HASIL VERIFIKASI AKHIR ---")
        
        if stored_hash == hash_asli:
            print("✅ IJAZAH VALID & ASLI!")
            print("   (Hash di tangan mahasiswa COCOK dengan Hash di Blockchain)")
        else:
            print("❌ IJAZAH PALSU / TIDAK COCOK!")
            
    except Exception as e:
        print(f"Error memanggil contract: {e}")

    
    print("\n--- 4. SKENARIO PEMALSUAN (TAMPERING) ---")
    # Mari kita coba ubah satu karakter saja pada data mahasiswa
    data_palsu = "Rakha Dhifiargo | 2209489 | S1 Ilmu Komputer (Cumlaude)" # Ditambah kata Cumlaude sendiri
    print(f"Data Dimanipulasi: {data_palsu}")
    
    hash_palsu = generate_credential_hash(data_palsu)
    print(f"Hash Baru        : {hash_palsu.hex()}")
    
    if hash_palsu == stored_hash:
        print("⚠️ BAHAYA: Data palsu lolos verifikasi!")
    else:
        print("🛡️  AMAN: Sistem mendeteksi perubahan data!")
        print("   (Hash data baru TIDAK SAMA dengan Hash di Blockchain)")

if __name__ == "__main__":
    main()