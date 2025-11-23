import json
import os
from web3 import Web3
from eth_account.messages import encode_defunct

# --- KONFIGURASI BLOCKCHAIN ---
RPC_URL = "http://127.0.0.1:8545"
w3 = Web3(Web3.HTTPProvider(RPC_URL))

# (Alamat ini biasanya SAMA TERUS selama pakai Anvil & Key yang sama)
REGISTRY_CONTRACT_ADDRESS = "0x700b6A60ce7EaaEA56F065753d8dcB9653dbAD35"

# Path ke file JSON hasil compile Foundry
ARTIFACT_PATH = './out/SimpleDIDRegistry.sol/SimpleDIDRegistry.json'

def get_contract():
    """
    Langsung mengembalikan instance contract yang sudah dideploy.
    Tidak perlu input address lagi karena sudah di-hardcode di atas.
    """
    if not os.path.exists(ARTIFACT_PATH):
        print("❌ Error: File artifact tidak ditemukan. Jalankan 'forge build'!")
        return None

    with open(ARTIFACT_PATH) as f:
        artifact = json.load(f)
        abi = artifact['abi']
    
    return w3.eth.contract(address=REGISTRY_CONTRACT_ADDRESS, abi=abi)

# --- FUNGSI KRIPTOGRAFI OFF-CHAIN (Tetap Sama) ---
def sign_data(data_dict, private_key):
    json_str = json.dumps(data_dict, sort_keys=True)
    message = encode_defunct(text=json_str)
    signed_message = w3.eth.account.sign_message(message, private_key=private_key)
    return signed_message.signature.hex()

def verify_signature(data_dict, signature):
    json_str = json.dumps(data_dict, sort_keys=True)
    message = encode_defunct(text=json_str)
    return w3.eth.account.recover_message(message, signature=signature)

def hash_json(data_dict):
    """Menghitung Keccak256 Hash dari data JSON (Untuk Anchoring)"""
    json_bytes = json.dumps(data_dict, sort_keys=True).encode('utf-8')
    return Web3.keccak(json_bytes)

# --- FUNGSI DB (Tetap Sama untuk Simpan Wallet Mahasiswa) ---
def load_db(filename):
    path = f"data/{filename}"
    if not os.path.exists(path):
        return {}
    with open(path, 'r') as f:
        return json.load(f)

def save_db(filename, data):
    if not os.path.exists("data"):
        os.makedirs("data")
    path = f"data/{filename}"
    with open(path, 'w') as f:
        json.dump(data, f, indent=4)