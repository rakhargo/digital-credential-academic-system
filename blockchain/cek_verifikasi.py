from web3 import Web3
import json

# 1. SETUP
w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))

# ALAMAT KONTRAK (Sesuai Log Anda)
CONTRACT_ADDR = "0x700b6A60ce7EaaEA56F065753d8dcB9653dbAD35" 

# ALAMAT ISSUER (Account 0 - Yang mau dicek)
ISSUER_ADDR = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

# Load ABI
with open('./out/SimpleDIDRegistry.sol/SimpleDIDRegistry.json') as f:
    abi = json.load(f)['abi']

contract = w3.eth.contract(address=CONTRACT_ADDR, abi=abi)

print(f"🔍 Memeriksa status Blockchain untuk: {ISSUER_ADDR}")

try:
    # Panggil fungsi resolveDID
    # Returns: (isActive, isVerified, name, didURI)
    data = contract.functions.resolveDID(ISSUER_ADDR).call()
    
    print(data)
    
    is_active = data[0]
    is_verified = data[1]
    
    print("\n--- DATA ON-CHAIN ---")
    print(f"1. Registered (Active)? : {is_active}")
    print(f"2. Verified (Centang)?  : {is_verified}")
    
    if is_verified:
        print("\n✅ STATUS: SUDAH TERVERIFIKASI.")
        print("Masalah ada di Frontend React (useBlockchain.ts tidak membaca update).")
    else:
        print("\n❌ STATUS: BELUM TERVERIFIKASI.")
        print("Perintah 'cast send' Anda mungkin gagal atau salah alamat.")
        
except Exception as e:
    print(f"Error: {e}")